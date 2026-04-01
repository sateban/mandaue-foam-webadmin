/* customers.js */
window.Customers = (() => {
  let unsub = null;
  let chartInstance = null;
  let allUsers = [];
  let selectedUid = null;
  let activeRange = 'this-week';

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Customers</h1>
        <button class="btn btn-outline"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export CSV</button>
      </div>

      <div class="customer-insight-grid">
        <div class="customer-stat-stack">
          <div class="card stat-card">
            <div class="stat-card-header">
              <h4>Total Customers</h4>
              <div class="stat-card-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
            </div>
            <div class="stat-card-value" id="c-stat-total">0</div>
            <div class="stat-card-footer">
              <span class="stat-card-period" id="c-stat-total-period">This week</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="stat-card-header">
              <h4>New Customers</h4>
              <div class="stat-card-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
            </div>
            <div class="stat-card-value" id="c-stat-new">0</div>
            <div class="stat-card-footer">
              <span class="stat-card-period" id="c-stat-new-period">This week</span>
            </div>
          </div>

          <div class="card stat-card">
            <div class="stat-card-header">
              <h4>Visitors</h4>
              <div class="stat-card-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
            </div>
            <div class="stat-card-value" id="c-stat-visitor">0</div>
            <div class="stat-card-footer">
              <span class="stat-card-period" id="c-stat-visitor-period">This week</span>
            </div>
          </div>
        </div>

        <div class="card customer-overview-card">
          <div class="card-header">
            <h3>Customer Overview</h3>
            <div class="customer-range-wrap">
              <button class="range-chip active" data-range="this-week">This week</button>
              <button class="range-chip" data-range="last-week">Last week</button>
              <button class="range-chip" data-range="last-30">Last 30 days</button>
              <button class="range-chip" data-range="all">All time</button>
            </div>
          </div>
          <div class="customer-overview-metrics">
            <div class="customer-overview-cell">
              <div class="val" id="c-m-active">0</div>
              <div class="lbl">Active Customers</div>
            </div>
            <div class="customer-overview-cell">
              <div class="val" id="c-m-repeat">0</div>
              <div class="lbl">Repeat Customers</div>
            </div>
            <div class="customer-overview-cell">
              <div class="val" id="c-m-visits">0</div>
              <div class="lbl">Shop Visits</div>
            </div>
            <div class="customer-overview-cell">
              <div class="val" id="c-m-conv">0%</div>
              <div class="lbl">Conversion Rate</div>
            </div>
          </div>
          <div class="card-body chart-container">
            <canvas id="customers-overview-chart"></canvas>
          </div>
        </div>
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

    bindRangeEvents(container);
    load();
  }

  function bindRangeEvents(container) {
    container.querySelectorAll('.range-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        activeRange = btn.dataset.range || 'this-week';
        container.querySelectorAll('.range-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderInsights();
      });
    });
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
    
    // Auto select first or preserve previous selection
    const selectedExists = selectedUid && allUsers.some(u => u.uid === selectedUid);
    if (selectedExists) selectRow(selectedUid);
    else if(allUsers.length > 0) selectRow(allUsers[0].uid);

    renderInsights();
  }

  function selectRow(uid) {
    const u = allUsers.find(x => x.uid === uid);
    if(!u) return;
    selectedUid = uid;

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

  function renderInsights() {
    const now = new Date();
    const period = getRangeBounds(activeRange, now);
    const periodText = getRangeLabel(activeRange);
    const allOrders = flattenAllOrders(allUsers);

    const usersInRange = allUsers.filter(u => {
      const created = parseTimestamp(u.createdAt || u.created_at || u.timestamp || u.dateCreated);
      return created && created >= period.start && created <= period.end;
    });

    const ordersInRange = allOrders.filter(o => o.timestamp && o.timestamp >= period.start && o.timestamp <= period.end);
    const activeCustomers = new Set(ordersInRange.map(o => o.uid)).size;
    const repeatCustomers = countRepeatCustomers(ordersInRange);
    const conversionRate = activeCustomers > 0 ? (repeatCustomers / activeCustomers) * 100 : 0;

    setText('c-stat-total', allUsers.length);
    setText('c-stat-new', usersInRange.length);
    setText('c-stat-visitor', activeCustomers);
    setText('c-stat-total-period', periodText);
    setText('c-stat-new-period', periodText);
    setText('c-stat-visitor-period', periodText);
    setText('c-m-active', activeCustomers);
    setText('c-m-repeat', repeatCustomers);
    setText('c-m-visits', ordersInRange.length);
    setText('c-m-conv', `${conversionRate.toFixed(1)}%`);

    renderOverviewChart(ordersInRange, period, now);
  }

  function renderOverviewChart(ordersInRange, period, now) {
    const canvas = document.getElementById('customers-overview-chart');
    if (!canvas || !window.Chart) return;

    if (chartInstance) chartInstance.destroy();

    const bucket = buildBuckets(period, now);
    const values = bucket.labels.map((_, idx) => {
      const b = bucket.bounds[idx];
      return ordersInRange.filter(o => o.timestamp >= b.start && o.timestamp <= b.end).length;
    });

    chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: bucket.labels,
        datasets: [{
          data: values,
          borderColor: '#1765D8',
          backgroundColor: 'rgba(34, 197, 94, 0.14)',
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#1765D8',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            border: { display: false },
            grid: { color: 'rgba(0,0,0,0.05)' }
          }
        }
      }
    });
  }

  function flattenAllOrders(users) {
    const out = [];
    users.forEach(u => {
      if (!u.orders) return;
      Object.values(u.orders).forEach(o => {
        out.push({
          uid: u.uid,
          timestamp: parseTimestamp(o.timestamp || o.createdAt || o.created_at || o.date)
        });
      });
    });
    return out;
  }

  function parseTimestamp(raw) {
    if (raw === undefined || raw === null || raw === '') return null;
    if (typeof raw === 'number') return raw < 1e12 ? raw * 1000 : raw;
    if (typeof raw === 'string') {
      if (/^\d+$/.test(raw)) {
        const n = Number(raw);
        return n < 1e12 ? n * 1000 : n;
      }
      const t = Date.parse(raw);
      return Number.isNaN(t) ? null : t;
    }
    if (typeof raw === 'object') {
      if (typeof raw.toDate === 'function') {
        const d = raw.toDate();
        return d instanceof Date ? d.getTime() : null;
      }
      if (typeof raw.seconds === 'number') return raw.seconds * 1000;
    }
    return null;
  }

  function getRangeBounds(rangeKey, now) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset, 0, 0, 0, 0).getTime();

    if (rangeKey === 'last-week') {
      return { start: startOfThisWeek - (7 * 24 * 60 * 60 * 1000), end: startOfThisWeek - 1 };
    }
    if (rangeKey === 'last-30') {
      return { start: end - (29 * 24 * 60 * 60 * 1000), end };
    }
    if (rangeKey === 'all') {
      return { start: 0, end };
    }
    return { start: startOfThisWeek, end };
  }

  function getRangeLabel(rangeKey) {
    if (rangeKey === 'last-week') return 'Last week';
    if (rangeKey === 'last-30') return 'Last 30 days';
    if (rangeKey === 'all') return 'All time';
    return 'This week';
  }

  function countRepeatCustomers(ordersInRange) {
    const map = new Map();
    ordersInRange.forEach(o => {
      map.set(o.uid, (map.get(o.uid) || 0) + 1);
    });
    let count = 0;
    map.forEach(v => { if (v > 1) count++; });
    return count;
  }

  function buildBuckets(period, now) {
    if (activeRange === 'last-30' || activeRange === 'all') {
      const days = activeRange === 'all' ? 7 : 6;
      const unitMs = 24 * 60 * 60 * 1000;
      const labels = [];
      const bounds = [];
      const startRef = activeRange === 'all'
        ? now.getTime() - (days * unitMs)
        : period.start;
      for (let i = 0; i <= days; i++) {
        const dt = new Date(startRef + i * unitMs);
        const dayStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0).getTime();
        const dayEnd = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 23, 59, 59, 999).getTime();
        labels.push(dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        bounds.push({ start: dayStart, end: dayEnd });
      }
      return { labels, bounds };
    }

    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const bounds = labels.map((_, i) => {
      const base = new Date(period.start + (i * 24 * 60 * 60 * 1000));
      return {
        start: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0).getTime(),
        end: new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999).getTime()
      };
    });
    return { labels, bounds };
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function unmount() {
    if(unsub) unsub();
    if (chartInstance) chartInstance.destroy();
  }

  return { mount, unmount, select: selectRow };
})();
