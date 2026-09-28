// Handles login/register modal, session storage, and nav UI updates.
const Auth = {
  getUser() {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn() {
    return !!localStorage.getItem('token');
  },
  isAdmin() {
    const user = Auth.getUser();
    return !!user && user.role === 'admin';
  },
  saveSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ _id: data._id, name: data.name, email: data.email, role: data.role }));
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/index.html';
  },
  refreshNav() {
    const user = Auth.getUser();
    const authBtn = document.getElementById('authBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');
    const adminLink = document.getElementById('adminLink');
    const ordersLink = document.getElementById('ordersLink');

    if (!authBtn) return; // page doesn't have nav elements

    if (user) {
      authBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      userGreeting.classList.remove('hidden');
      userGreeting.textContent = `Hi, ${user.name}`;
      if (ordersLink) ordersLink.classList.remove('hidden');
      if (adminLink) adminLink.classList.toggle('hidden', user.role !== 'admin');
    } else {
      authBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      userGreeting.classList.add('hidden');
      if (ordersLink) ordersLink.classList.add('hidden');
      if (adminLink) adminLink.classList.add('hidden');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  Auth.refreshNav();

  const authBtn = document.getElementById('authBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const logoutBtn = document.getElementById('logoutBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (authBtn) {
    authBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
  }
  if (closeAuthModal) {
    closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => Auth.logout());
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      loginForm.classList.toggle('hidden', tab !== 'login');
      registerForm.classList.toggle('hidden', tab !== 'register');
    });
  });

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('loginError');
      errorEl.classList.add('hidden');
      try {
        const res = await api.login({
          email: document.getElementById('loginEmail').value.trim(),
          password: document.getElementById('loginPassword').value,
        });
        Auth.saveSession(res.data);
        window.location.reload();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('registerError');
      errorEl.classList.add('hidden');
      try {
        const res = await api.register({
          name: document.getElementById('registerName').value.trim(),
          email: document.getElementById('registerEmail').value.trim(),
          password: document.getElementById('registerPassword').value,
        });
        Auth.saveSession(res.data);
        window.location.reload();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
  }
});
