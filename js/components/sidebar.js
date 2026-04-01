/* sidebar.js */
const Sidebar = (() => {
  const MENU = [
    { section: 'Main Menu' },
    { id: 'dashboard', label: 'Dashboard', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>' },
    { id: 'customers', label: 'Customers', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
    { id: 'categories', label: 'Categories', icon: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>' },
    { section: 'Product' },
    { id: 'products-add', label: 'Add Products', icon: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>' },
    { id: 'products-media', label: 'Product Media', icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>' },
    { id: 'products-list', label: 'Product List', icon: '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>' },
    { section: 'Orders & Transactions' },
    { id: 'orders', label: 'Orders Management', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' },
    { id: 'transactions', label: 'Transaction', icon: '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>' },
    { section: 'Admin' },
    { id: 'admin-role', label: 'Admin Role', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>' }
  ];

  function render(containerId, activePath = '') {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    let html = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon"><img src="assets/logo.png" alt="Mandaue Foam logo" /></div>
        <div class="sidebar-logo-text">
          <strong>AR Admin</strong>
          <span>Mandaue Foam</span>
        </div>
      </div>
      <div class="sidebar-nav">
    `;

    MENU.forEach(item => {
      if (item.section) {
        html += `<div class="sidebar-section-label">${item.section}</div>`;
      } else {
        const isActive = activePath === item.id ? 'active' : '';
        html += `
          <a href="#/${item.id}" class="nav-item ${isActive}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${item.icon}</svg>
            ${item.label}
          </a>
        `;
      }
    });

    html += `
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user-btn">
          <div class="sidebar-user-avatar">A</div>
          <div class="sidebar-user-info">
            <strong id="sidebar-username">Admin</strong>
            <span id="sidebar-useremail">Loading...</span>
          </div>
          <button class="sidebar-logout" id="sidebar-logout-btn" title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    `;
    el.innerHTML = html;

    const user = window.FirebaseService?.currentUser();
    if(user) {
      document.getElementById('sidebar-useremail').textContent = user.email;
      document.getElementById('sidebar-username').textContent = user.displayName || 'Admin';
      const initial = (user.displayName || user.email || 'A').charAt(0).toUpperCase();
      document.querySelector('.sidebar-user-avatar').textContent = initial;
    }

    document.getElementById('sidebar-logout-btn')?.addEventListener('click', () => {
      window.FirebaseService.signOut().then(() => window.location.hash = '#/login');
    });
  }

  return { render };
})();
