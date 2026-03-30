/* customers.js */
window.Customers = (() => {
  let unsub = null;
  let allUsers = [];

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Customers</h1>
        <button class="btn btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export CSV</button>
      </div>

      <div class="customers-layout">
        <div class="card flex-col" style="flex:1">
          <div class="table-toolbar">
            <div class="tabs">
              <button class="tab-btn active">All Customers <span class="tab-count" id="c-all-cnt">0</span></button>
              <button class="tab-btn">Active</button>
            </div>
            <div class="search-input-wrap">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
            <table>
              <thead>
                <tr>
                  <th width="40"><input type="checkbox" /></th>
                  <th>Customer Name</th>
                  <th>Phone No.</th>
                  <th>Orders</th>
                  <th>Spent</th>
                </tr>
              </thead>
              <tbody id="c-table">
                <tr><td colspan="5" class="empty-state">Loading users...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card customer-detail-card">
          <div class="cust-profile-header">
            <div class="cust-avatar" id="cd-avatar">C</div>
            <div style="flex:1">
              <div class="fw-700" id="cd-name">Select Customer</div>
              <div class="text-xs text-muted" id="cd-email">---</div>
            </div>
          </div>
          <div class="cust-order-summary">
            <div class="cust-order-cell">
              <div class="val" id="cd-total">0</div>
              <div class="lbl">Total Orders</div>
            </div>
            <div class="cust-order-cell">
              <div class="val text-success" id="cd-done">0</div>
              <div class="lbl">Completed</div>
            </div>
            <div class="cust-order-cell">
              <div class="val text-danger" id="cd-cancel">0</div>
              <div class="lbl">Canceled</div>
            </div>
          </div>
          <div class="card-body" style="padding-top:0">
            <div class="divider mb-4 mt-2"></div>
            <div class="text-sm fw-600 mb-2">Contact Info</div>
            <div class="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span class="text-xs" id="cd-phone">---</span>
            </div>
            <div class="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span class="text-xs text-muted" id="cd-address">No address recorded</span>
            </div>
          </div>
        </div>
      </div>
    `;

    load();
  }

  function load() {
    unsub = FirebaseService.stream('users', data => {
      allUsers = data ? Object.entries(data).map(([uid, u]) => ({ uid, ...u })) : [];
      renderTable();
    });
  }

  function renderTable() {
    const tb = document.getElementById('c-table');
    if (!tb) return;
    document.getElementById('c-all-cnt').textContent = allUsers.length;

    if (allUsers.length === 0) {
      tb.innerHTML = `<tr><td colspan="5" class="empty-state">No customers recorded.</td></tr>`;
      return;
    }

    tb.innerHTML = allUsers.map(u => {
      const n = u.name || u.displayName || 'No Name';
      const oCount = u.orders ? Object.keys(u.orders).length : 0;
      
      let tot = 0;
      if (u.orders) {
        Object.values(u.orders).forEach(o => { tot += parseFloat(o.totalPrice||o.totalAmount||0); });
      }

      return `
        <tr style="cursor:pointer" onclick="window.Customers.select('${u.uid}')">
          <td onclick="event.stopPropagation()"><input type="checkbox" /></td>
          <td class="fw-600 text-text">${n}</td>
          <td>${u.phoneNumber || u.phone || '--'}</td>
          <td>${oCount}</td>
          <td class="fw-600">₱ ${tot.toFixed(2)}</td>
        </tr>
      `;
    }).join('');
    
    // Auto select first
    if(allUsers.length > 0) selectRow(allUsers[0].uid);
  }

  function selectRow(uid) {
    const u = allUsers.find(x => x.uid === uid);
    if(!u) return;

    const n = u.name || u.displayName || 'Unknown';
    document.getElementById('cd-avatar').textContent = n.charAt(0).toUpperCase();
    document.getElementById('cd-name').textContent = n;
    document.getElementById('cd-email').textContent = u.email || 'No email';
    document.getElementById('cd-phone').textContent = u.phoneNumber || u.phone || 'No phone';
    
    // Count orders
    let total = 0, done = 0, cancel = 0;
    if (u.orders) {
      const arr = Object.values(u.orders);
      total = arr.length;
      arr.forEach(o => {
        const s = (o.status || '').toLowerCase();
        if (s.includes('deliver') || s.includes('complet')) done++;
        if (s.includes('cancel')) cancel++;
      });
    }
    
    document.getElementById('cd-total').textContent = total;
    document.getElementById('cd-done').textContent = done;
    document.getElementById('cd-cancel').textContent = cancel;

    // First address
    let adrStr = 'No address recorded';
    if(u.addresses && Object.keys(u.addresses).length > 0) {
      const a = Object.values(u.addresses)[0];
      adrStr = [a.street, a.city, a.province, a.zipcode].filter(Boolean).join(', ');
    }
    document.getElementById('cd-address').textContent = adrStr;
  }

  function unmount() { if(unsub) unsub(); }

  return { mount, unmount, select: selectRow };
})();
