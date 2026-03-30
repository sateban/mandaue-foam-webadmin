/* transactions.js */
window.Transactions = (() => {
  let unsub = null;

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Transactions</h1>
      </div>

      <div class="tx-stat-grid">
        <div class="card stat-card">
          <div class="stat-card-header"><h4>Total Revenue</h4></div>
          <div class="stat-card-value text-primary" id="tx-rev">₱ 0.00</div>
          <div class="stat-card-footer"><span class="stat-card-trend trend-up">+12%</span><span class="stat-card-period">vs last month</span></div>
        </div>
        <div class="card stat-card">
          <div class="stat-card-header"><h4>Completed Sales</h4></div>
          <div class="stat-card-value" id="tx-cnt">0</div>
          <div class="stat-card-footer"><span class="badge badge-success">Success Rate 98%</span></div>
        </div>
        <div class="payment-card">
          <div class="flex justify-between items-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            <div class="fw-700 text-sm">Mandaue Foam AR Platform</div>
          </div>
          <div class="payment-card-number">•••• •••• •••• 5678</div>
          <div class="payment-card-footer">
            <span>Primary Revenue Account</span>
            <span class="fw-600">Active</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-toolbar">
          <h3>Transaction History</h3>
        </div>
        <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>UID</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Ext. Reference</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody id="tx-table"><tr><td colspan="6" class="empty-state">Loading...</td></tr></tbody>
          </table>
        </div>
      </div>
    `;
    load();
  }

  function load() {
    unsub = FirebaseService.stream('users', data => {
      let orders = [];
      if (data) Object.entries(data).forEach(([u,ud]) => {
        if (ud.orders) Object.entries(ud.orders).forEach(([o,od]) => orders.push({uid:u,oid:o,...od}));
      });
      orders.sort((a,b) => (b.timestamp||0)-(a.timestamp||0));

      const tb = document.getElementById('tx-table');
      if (orders.length === 0) {
        tb.innerHTML = `<tr><td colspan="6" class="empty-state">No transactions</td></tr>`;
        return;
      }

      let rev = 0;
      tb.innerHTML = orders.map(o => {
        const amt = parseFloat(o.totalPrice||o.totalAmount||0);
        const st = (o.status||'').toLowerCase();
        const isDone = st.includes('deliver')||st.includes('don');
        if (isDone) rev += amt;
        
        const resCls = isDone ? 'text-success' : 'text-warning';
        const resTxt = isDone ? 'Settled' : 'Pending/Auth';

        return `
          <tr>
            <td class="fw-600">#${o.oid.substring(0,8).toUpperCase()}</td>
            <td class="text-xs text-muted" title="${o.uid}">${o.uid.substring(0,8)}...</td>
            <td><div class="flex items-center gap-1"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> ${o.paymentMethod||'Online'}</div></td>
            <td class="fw-700">₱ ${amt.toFixed(2)}</td>
            <td class="text-xs text-muted font-mono">${o.paymentId||'N/A'}</td>
            <td class="fw-600 ${resCls}">${resTxt}</td>
          </tr>
        `;
      }).join('');

      document.getElementById('tx-cnt').textContent = orders.filter(o=>((o.status||'').toLowerCase().includes('deliver')||(o.status||'').toLowerCase().includes('don'))).length;
      document.getElementById('tx-rev').textContent = `₱ ${rev.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    });
  }

  return { mount, unmount: () => { if(unsub) unsub(); } };
})();
