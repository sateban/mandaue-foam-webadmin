/* orders.js */
window.Orders = (() => {
  let unsub = null;
  let allOrders = [];

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Orders</h1>
        <div class="flex gap-2">
          <button class="btn btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export</button>
        </div>
      </div>

      <div class="orders-stat-grid">
        <div class="card stat-card"><div class="text-xs text-muted mb-1">Total Orders</div><div class="stat-card-value" id="o-tot">0</div></div>
        <div class="card stat-card"><div class="text-xs text-muted mb-1">Pending</div><div class="stat-card-value text-warning" id="o-pen">0</div></div>
        <div class="card stat-card"><div class="text-xs text-muted mb-1">Shipped/Delivered</div><div class="stat-card-value text-success" id="o-don">0</div></div>
        <div class="card stat-card"><div class="text-xs text-muted mb-1">Canceled</div><div class="stat-card-value text-danger" id="o-can">0</div></div>
      </div>

      <div class="card">
        <div class="table-toolbar">
          <div class="tabs">
            <button class="tab-btn active">All</button>
            <button class="tab-btn">Pending</button>
            <button class="tab-btn">Shipped</button>
            <button class="tab-btn">Delivered</button>
          </div>
          <div class="search-input-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Order ID..." />
          </div>
        </div>
        <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Items</th>
                <th>Total</th>
                <th>Customer UID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="o-table">
              <tr><td colspan="6" class="empty-state">Loading orders...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    load();
  }

  function load() {
    unsub = FirebaseService.stream('users', data => {
      allOrders = [];
      if (data) {
        Object.entries(data).forEach(([uid, u]) => {
          if (u.orders) {
            Object.entries(u.orders).forEach(([oid, o]) => {
              allOrders.push({ uid, oid, ...o });
            });
          }
        });
      }
      // Sort newest first
      allOrders.sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
      render();
    });
  }

  function render() {
    document.getElementById('o-tot').textContent = allOrders.length;
    let pen=0, don=0, can=0;

    const tb = document.getElementById('o-table');
    if(allOrders.length===0){
      tb.innerHTML = `<tr><td colspan="6" class="empty-state">No orders yet.</td></tr>`;
      return;
    }

    tb.innerHTML = allOrders.map(o => {
      const s = (o.status || 'Pending').toLowerCase();
      let sCls = 'badge-warning';
      let statTxt = 'Pending';
      
      if (s.includes('deliver')||s.includes('don')) { sCls='badge-success'; statTxt='Delivered'; don++; }
      else if (s.includes('ship')) { sCls='badge-info'; statTxt='Shipped'; }
      else if (s.includes('cancel')) { sCls='badge-danger'; statTxt='Canceled'; can++; }
      else { pen++; }

      const amt = Number(o.totalPrice||o.totalAmount||0).toFixed(2);
      const items = (o.items && Array.isArray(o.items)) ? o.items.length : 0;
      const cUidTxt = o.uid.substring(0,8)+'...';

      return `
        <tr>
          <td class="fw-600 text-text">#${o.oid.substring(0,8).toUpperCase()}</td>
          <td>${items} items</td>
          <td class="fw-600">₱ ${amt}</td>
          <td class="text-xs text-muted" title="${o.uid}">${cUidTxt}</td>
          <td><span class="badge ${sCls}">${statTxt}</span></td>
          <td>
            <select class="select" style="padding:4px 8px;font-size:11px" onchange="window.Orders.setStatus('${o.uid}', '${o.oid}', this.value)">
              <option value="" disabled selected>Update...</option>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Canceled">Canceled</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('o-pen').textContent = pen;
    document.getElementById('o-don').textContent = don;
    document.getElementById('o-can').textContent = can;
  }

  function setStatus(uid, oid, stat) {
    if(!stat) return;
    FirebaseService.update(`users/${uid}/orders/${oid}`, { status: stat })
      .then(() => Toast.success(`Order status updated to ${stat}`))
      .catch(e => Toast.error(e.message));
  }

  function unmount() { if(unsub) unsub(); }

  return { mount, unmount, setStatus };
})();
