/* app.js — Router and App Shell Init */

const App = (() => {
  const ROUTES = {
    '/login':        { title: 'Login',        module: 'Login' },
    '/dashboard':    { title: 'Dashboard',    module: 'Dashboard' },
    '/products-add': { title: 'Add Product',  module: 'ProductsAdd' },
    '/products-list':{ title: 'Product List', module: 'ProductsList' },
    '/products-media':{title: 'Product Media',module: 'ProductsMedia' },
    '/categories':   { title: 'Categories',   module: 'Categories' },
    '/customers':    { title: 'Customers',    module: 'Customers' },
    '/orders':       { title: 'Orders',       module: 'Orders' },
    '/transactions': { title: 'Transactions', module: 'Transactions' },
    '/admin-role':   { title: 'Admin Role',   module: 'AdminRole' }
  };

  let currentPage = null;
  let initialized = false;

  async function handleRoute() {
    let path = window.location.hash.slice(1) || '/dashboard';
    
    // Auth check
    const user = FirebaseService.currentUser();
    if (!user && path !== '/login') {
      window.location.hash = '#/login';
      return;
    }
    if (user && path === '/login') {
      window.location.hash = '#/dashboard';
      return;
    }

    const route = ROUTES[path];
    if (!route) {
      window.location.hash = '#/dashboard';
      return;
    }

    // UI toggle
    if (path === '/login') {
      document.getElementById('app-shell').classList.add('hidden');
      document.getElementById('login-view').classList.remove('hidden');
    } else {
      document.getElementById('login-view').classList.add('hidden');
      document.getElementById('app-shell').classList.remove('hidden');
      
      // Render shell parts
      Sidebar.render('sidebar', path.replace('/', ''));
      Topbar.render('topbar', route.title);
    }

    // Unmount previous
    if (currentPage && window[currentPage]?.unmount) {
      window[currentPage].unmount();
    }

    // Mount next
    currentPage = route.module;
    const container = path === '/login' ? document.getElementById('login-view') : document.getElementById('page-content');
    
    if (window[route.module] && window[route.module].mount) {
      setTimeout(() => window[route.module].mount(container), 0);
    } else {
      container.innerHTML = `<div class="empty-state">
        <h4>${route.title} Module Not Found</h4>
        <p>This page is currently under construction.</p>
      </div>`;
    }
  }

  async function ensureConfigLoaded() {
    const runtimeCfg = window.CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : null);
    if (runtimeCfg?.firebase) {
      if (!window.CONFIG) window.CONFIG = runtimeCfg;
      return;
    }
    try {
      const res = await fetch('config.json', { cache: 'no-store' });
      if (!res.ok) return;
      const cfg = await res.json();
      if (cfg && cfg.firebase) window.CONFIG = cfg;
    } catch (_) {}
  }

  function showInitError(message) {
    const loginView = document.getElementById('login-view');
    const appShell = document.getElementById('app-shell');
    if (appShell) appShell.classList.add('hidden');
    if (!loginView) return;
    loginView.classList.remove('hidden');
    loginView.innerHTML = `
      <div class="login-card">
        <h1>Configuration Error</h1>
        <p class="sub">${message}</p>
        <p class="sub">Expected either <code>config.js</code> or deployed <code>config.json</code>.</p>
      </div>
    `;
  }

  async function init() {
    if (initialized) return;
    try {
      await ensureConfigLoaded();
      FirebaseService.init();
      FirebaseService.onAuthChange(() => {
        handleRoute();
      });
      window.addEventListener('hashchange', handleRoute);
      initialized = true;
    } catch (err) {
      console.error('App init failed:', err);
      showInitError(err?.message || 'Failed to initialize app.');
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
