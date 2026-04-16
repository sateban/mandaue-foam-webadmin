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
  let sidebarNavBound = false;

  async function handleRoute() {
    let fullPath = window.location.hash.slice(1) || '/dashboard';
    let path = fullPath.split('?')[0]; // Extract route path without query params
    
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
      
      // Setup sidebar overlay for mobile (only once)
      if (!document.querySelector('.sidebar-overlay')) {
        setupSidebarOverlay();
      }
      
      // Close sidebar on mobile when nav item is clicked
      setupSidebarNavigation();
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
      const candidates = ['config.json', 'app-config.json'];
      for (const file of candidates) {
        const res = await fetch(file, { cache: 'no-store' });
        if (!res.ok) continue;
        const cfg = await res.json();
        if (cfg && cfg.firebase) {
          window.CONFIG = cfg;
          return;
        }
      }
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

  function setupSidebarOverlay() {
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }
    
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      }
    });
  }

  function setupSidebarNavigation() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!sidebar || sidebarNavBound) return;

    const navigateFromSidebar = (e) => {
      const navItem = e.target.closest('.nav-item');
      if (!navItem || !sidebar.contains(navItem)) return;

      const navTarget = navItem.getAttribute('data-nav');
      if (!navTarget) return;

      const nextHash = `#/${String(navTarget).replace(/^#?\/?/, '')}`;
      const currentHash = window.location.hash || '#/dashboard';

      e.preventDefault();
      e.stopPropagation();

      // Ensure route update fires even when tapping current route.
      if (currentHash === nextHash) {
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      } else {
        window.location.hash = nextHash;
      }

      if (window.innerWidth < 768) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
      }
    };

    sidebar.addEventListener('click', navigateFromSidebar);
    sidebar.addEventListener('touchend', navigateFromSidebar, { passive: false });
    sidebarNavBound = true;
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
