/* topbar.js */
const Topbar = (() => {
  const LS_LAST_SEEN_KEY = 'ar-notifications-last-seen-ts';
  const LS_NOTIF_TS_PREFIX = 'ar-notif-ts:v1:';
  let _allNotifications = [];
  let _docClickHandler = null;

  function getLastSeen() {
    return Number(localStorage.getItem(LS_LAST_SEEN_KEY) || 0);
  }

  function setLastSeen(ts) {
    localStorage.setItem(LS_LAST_SEEN_KEY, String(ts || Date.now()));
  }

  function setBadge(unseen) {
    const badge = document.getElementById('topbar-notif-badge');
    if (!badge) return;
    badge.classList.toggle('hidden', unseen === 0);
    badge.textContent = unseen > 99 ? '99+' : String(unseen);
  }

  function getStableNotifTs(key, fallbackTs = Date.now()) {
    const k = `${LS_NOTIF_TS_PREFIX}${key}`;
    const existing = Number(localStorage.getItem(k) || 0);
    if (existing > 0) return existing;
    const ts = Number(fallbackTs || Date.now());
    localStorage.setItem(k, String(ts));
    return ts;
  }

  function fmtAgo(ts) {
    const diff = Math.max(0, Date.now() - Number(ts || 0));
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function buildNotificationHtml() {
    const listEl = document.getElementById('topbar-notif-list');
    if (!listEl) return;
    if (!_allNotifications.length) {
      listEl.innerHTML = `<div class="notif-empty">No notifications.</div>`;
      return;
    }

    listEl.innerHTML = _allNotifications.map(n => `
      <button class="notif-item" onclick="window.location.hash='${n.route || '#/dashboard'}'; Topbar.closeNotifications();">
        <div class="notif-item-title">${n.title}</div>
        <div class="notif-item-msg">${n.message}</div>
        <div class="notif-item-time">${fmtAgo(n.timestamp)}</div>
      </button>
    `).join('');
  }

  async function loadNotifications(referenceNow = Date.now()) {
    try {
      const [users, products] = await Promise.all([
        FirebaseService.read('users'),
        FirebaseService.read('products')
      ]);

      const notifs = [];
      const now = Number(referenceNow || Date.now());

      // Pending orders
      if (users) {
        Object.values(users).forEach(u => {
          const orders = u?.orders || {};
          Object.entries(orders).forEach(([oid, order]) => {
            const status = String(order?.status || 'Pending').toLowerCase();
            const isPending = status.includes('pending');
            if (!isPending) return;
            const tsRaw = Number(order?.timestamp || 0);
            const ts = tsRaw > 0 ? tsRaw : getStableNotifTs(`pending:${oid}`, now);
            notifs.push({
              title: 'Pending Order',
              message: `Order needs processing (${(order?.orderId || '').toString().slice(0, 8) || 'new order'})`,
              timestamp: ts,
              route: '#/orders'
            });
          });
        });
      }

      // Low stock products
      if (products) {
        Object.entries(products).forEach(([pid, p]) => {
          const qty = Number(p?.quantity || 0);
          const inStock = !!p?.inStock;
          if (!inStock || qty > 5) return;
          const ts = getStableNotifTs(`lowstock:${pid}`, now);
          notifs.push({
            title: 'Low Stock',
            message: `${p?.name || 'Unnamed product'} has ${qty} item(s) left`,
            timestamp: ts,
            route: '#/products-list'
          });
        });
      }

      _allNotifications = notifs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

      const unseen = _allNotifications.filter(n => n.timestamp > getLastSeen()).length;
      setBadge(unseen);
      buildNotificationHtml();
    } catch (e) {
      const listEl = document.getElementById('topbar-notif-list');
      if (listEl) listEl.innerHTML = `<div class="notif-empty">Failed to load notifications.</div>`;
    }
  }

  function toggleNotifications() {
    const panel = document.getElementById('topbar-notif-panel');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      closeNotifications();
      return;
    }
    const now = Date.now();
    panel.classList.add('open');
    // Mark current notifications as seen immediately.
    setLastSeen(now);
    setBadge(0);
    loadNotifications(now);
  }

  function closeNotifications() {
    const panel = document.getElementById('topbar-notif-panel');
    if (panel) panel.classList.remove('open');
  }

  function render(containerId, title) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    el.innerHTML = `
      <div class="topbar-title">${title}</div>
      <div class="topbar-search">
        <svg class="topbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" placeholder="Search..." />
      </div>
      <div class="topbar-actions">
        <button class="topbar-icon-btn" id="topbar-notif-btn" aria-label="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <div class="notif-badge hidden" id="topbar-notif-badge">0</div>
        </button>
        <div class="notif-panel" id="topbar-notif-panel">
          <div class="notif-panel-head">
            <strong>Notifications</strong>
            <button class="btn btn-ghost btn-sm" id="topbar-mark-read">Mark all as read</button>
          </div>
          <div class="notif-panel-list" id="topbar-notif-list">
            <div class="notif-empty">Loading...</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('topbar-notif-btn')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      toggleNotifications();
    });

    document.getElementById('topbar-mark-read')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const now = Date.now();
      setLastSeen(now);
      setBadge(0);
      loadNotifications(now);
    });

    // Close when clicking outside the panel/button.
    if (_docClickHandler) document.removeEventListener('click', _docClickHandler);
    _docClickHandler = (ev) => {
      const panel = document.getElementById('topbar-notif-panel');
      const btn = document.getElementById('topbar-notif-btn');
      if (!panel || !btn) return;
      if (panel.contains(ev.target) || btn.contains(ev.target)) return;
      closeNotifications();
    };
    document.addEventListener('click', _docClickHandler);

    loadNotifications(Date.now());
  }
  return { render, closeNotifications };
})();
