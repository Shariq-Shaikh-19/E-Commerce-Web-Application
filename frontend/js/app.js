// Product catalog page logic: fetch, render, search, filter, paginate.
let currentPage = 1;
let currentKeyword = '';
let currentCategory = '';

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p class="empty-state">Loading products...</p>';

  const params = new URLSearchParams();
  params.set('page', currentPage);
  params.set('limit', 12);
  if (currentKeyword) params.set('keyword', currentKeyword);
  if (currentCategory) params.set('category', currentCategory);

  try {
    const res = await api.getProducts(`?${params.toString()}`);
    renderProducts(res.data);
    renderPagination(res.page, res.pages);
    populateCategories(res.data);
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Failed to load products: ${err.message}<br/>Make sure the backend API is running at ${API_BASE_URL}.</p>`;
  }
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');
  if (!products || products.length === 0) {
    grid.innerHTML = '<p class="empty-state">No products found.</p>';
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}" />
      <div class="product-info">
        <span class="category">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
        <div class="price-row">
          <span class="price">$${p.price.toFixed(2)}</span>
          <span class="stock ${p.stock === 0 ? 'out' : ''}">${p.stock === 0 ? 'Out of stock' : p.stock + ' in stock'}</span>
        </div>
        <button class="btn-primary full-width" data-add="${p._id}" ${p.stock === 0 ? 'disabled' : ''}>
          ${p.stock === 0 ? 'Unavailable' : 'Add to Cart'}
        </button>
      </div>
    </div>`
    )
    .join('');

  grid.querySelectorAll('button[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const product = products.find((p) => p._id === btn.dataset.add);
      Cart.add(product, 1);
      showToast(`${product.name} added to cart`);
    });
  });
}

function renderPagination(page, pages) {
  const el = document.getElementById('pagination');
  if (pages <= 1) {
    el.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  el.querySelectorAll('button[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page, 10);
      loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function populateCategories(products) {
  const select = document.getElementById('categoryFilter');
  const existing = new Set(Array.from(select.options).map((o) => o.value));
  products.forEach((p) => {
    if (!existing.has(p.category)) {
      const opt = document.createElement('option');
      opt.value = p.category;
      opt.textContent = p.category;
      select.appendChild(opt);
      existing.add(p.category);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const categoryFilter = document.getElementById('categoryFilter');

  const doSearch = () => {
    currentKeyword = searchInput.value.trim();
    currentPage = 1;
    loadProducts();
  };

  searchBtn.addEventListener('click', doSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
  categoryFilter.addEventListener('change', () => {
    currentCategory = categoryFilter.value;
    currentPage = 1;
    loadProducts();
  });
});
