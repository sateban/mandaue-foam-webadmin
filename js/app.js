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

  function init() {
    try {
      FirebaseService.init();
      FirebaseService.onAuthChange(() => {
        handleRoute();
      });
      window.addEventListener('hashchange', handleRoute);
    } catch (err) {
      console.error('App init failed:', err);
      // Wait for scripts if needed
      setTimeout(init, 500);
    }
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
