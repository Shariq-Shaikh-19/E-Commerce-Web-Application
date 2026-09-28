// LocalStorage-backed shopping cart shared across pages.
const Cart = {
  KEY: 'cart',

  getItems() {
    const raw = localStorage.getItem(Cart.KEY);
    return raw ? JSON.parse(raw) : [];
  },

  saveItems(items) {
    localStorage.setItem(Cart.KEY, JSON.stringify(items));
  },

  add(product, quantity = 1) {
    const items = Cart.getItems();
    const existing = items.find((i) => i.productId === product._id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        maxStock: product.stock,
      });
    }
    Cart.saveItems(items);
    Cart.renderAll();
  },

  updateQuantity(productId, delta) {
    const items = Cart.getItems();
    const item = items.find((i) => i.productId === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
      Cart.remove(productId);
      return;
    }
    Cart.saveItems(items);
    Cart.renderAll();
  },

  remove(productId) {
    const items = Cart.getItems().filter((i) => i.productId !== productId);
    Cart.saveItems(items);
    Cart.renderAll();
  },

  clear() {
    localStorage.removeItem(Cart.KEY);
    Cart.renderAll();
  },

  getTotal() {
    return Cart.getItems().reduce((sum, i) => sum + i.price * i.quantity, 0);
  },

  getCount() {
    return Cart.getItems().reduce((sum, i) => sum + i.quantity, 0);
  },

  renderAll() {
    const countEl = document.getElementById('cartCount');
    if (countEl) countEl.textContent = Cart.getCount();

    const itemsEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!itemsEl) return;

    const items = Cart.getItems();
    if (items.length === 0) {
      itemsEl.innerHTML = '<p class="empty-state">Your cart is empty.</p>';
    } else {
      itemsEl.innerHTML = items
        .map(
          (i) => `
        <div class="cart-item">
          <img src="${i.image}" alt="${i.name}" />
          <div class="cart-item-info">
            <h4>${i.name}</h4>
            <div>$${i.price.toFixed(2)} each</div>
            <div class="qty-controls">
              <button data-action="dec" data-id="${i.productId}">-</button>
              <span>${i.quantity}</span>
              <button data-action="inc" data-id="${i.productId}">+</button>
              <button data-action="remove" data-id="${i.productId}" class="btn-link" style="color:#dc2626;">Remove</button>
            </div>
          </div>
        </div>`
        )
        .join('');
    }
    if (totalEl) totalEl.textContent = Cart.getTotal().toFixed(2);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Cart.renderAll();

  const cartBtn = document.getElementById('cartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const closeCart = document.getElementById('closeCart');

  const openCart = () => {
    cartDrawer.classList.add('open');
    cartOverlay.classList.remove('hidden');
  };
  const closeCartFn = () => {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.add('hidden');
  };

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (closeCart) closeCart.addEventListener('click', closeCartFn);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartFn);

  const itemsEl = document.getElementById('cartItems');
  if (itemsEl) {
    itemsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'inc') Cart.updateQuantity(id, 1);
      if (action === 'dec') Cart.updateQuantity(id, -1);
      if (action === 'remove') Cart.remove(id);
    });
  }

  // Checkout flow
  const checkoutBtn = document.getElementById('checkoutBtn');
  const checkoutModal = document.getElementById('checkoutModal');
  const closeCheckoutModal = document.getElementById('closeCheckoutModal');
  const checkoutForm = document.getElementById('checkoutForm');

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (Cart.getItems().length === 0) {
        showToast('Your cart is empty');
        return;
      }
      if (!Auth.isLoggedIn()) {
        showToast('Please login to checkout');
        document.getElementById('authModal').classList.remove('hidden');
        return;
      }
      document.getElementById('checkoutTotal').textContent = Cart.getTotal().toFixed(2);
      checkoutModal.classList.remove('hidden');
    });
  }
  if (closeCheckoutModal) {
    closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.add('hidden'));
  }
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('checkoutError');
      errorEl.classList.add('hidden');

      const items = Cart.getItems().map((i) => ({ product: i.productId, quantity: i.quantity }));
      const shippingAddress = {
        fullName: document.getElementById('shipFullName').value.trim(),
        address: document.getElementById('shipAddress').value.trim(),
        city: document.getElementById('shipCity').value.trim(),
        postalCode: document.getElementById('shipPostalCode').value.trim(),
        country: document.getElementById('shipCountry').value.trim(),
      };

      try {
        await api.createOrder({ items, shippingAddress });
        Cart.clear();
        checkoutModal.classList.add('hidden');
        checkoutForm.reset();
        showToast('Order placed successfully!');
        setTimeout(() => (window.location.href = 'pages/orders.html'), 800);
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
  }
});

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) {
    alert(message);
    return;
  }
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}
