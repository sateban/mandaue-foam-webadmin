/* customers.js */
window.Customers = (() => {
  let unsub = null;
  let chartInstance = null;
  let allUsers = [];
  let selectedUid = null;
  let activeRange = 'this-week';
  let activeTab = 'all';
  let searchTerm = '';
  let selectedUids = new Set();

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Customers</h1>
        <button class="btn btn-outline" id="c-export-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Export CSV</button>
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
      </div>

      <div class="customers-layout">
        <div class="card flex-col" style="flex:1">
          <div class="table-toolbar">
            <div class="tabs">
              <button class="tab-btn active" data-tab="all">All Customers <span class="tab-count" id="c-all-cnt">0</span></button>
              <button class="tab-btn" data-tab="active">Active <span class="tab-count" id="c-active-cnt">0</span></button>
            </div>
            <div class="search-input-wrap">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search..." id="c-search-input" />
            </div>
          </div>
          <div id="c-bulk-actions" class="flex items-center justify-between px-4 py-2 text-sm" style="display:none;border-bottom:1px solid rgba(0,0,0,0.06);">
            <span id="c-selected-count">0 selected</span>
            <button class="btn btn-outline" id="c-export-selected">Export Selected CSV</button>
          </div>
          <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
            <table>
              <thead>
                <tr>
                  <th width="40"><input type="checkbox" id="c-select-all" /></th>
                  <th>Customer Name</th>
                  <th>Phone No.</th>
                  <th>Address</th>
                  <th>Auth Provider</th>
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
    bindTableEvents(container);
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
      selectedUids = new Set([...selectedUids].filter(uid => allUsers.some(u => u.uid === uid)));
      renderTable();
    });
  }

  function bindTableEvents(container) {
    const tabs = container.querySelectorAll('.tab-btn[data-tab]');
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab || 'all';
        tabs.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        renderTable();
      });
    });

    const searchInput = container.querySelector('#c-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = (e.target.value || '').trim().toLowerCase();
        renderTable();
      });
    }

    const exportAllBtn = container.querySelector('#c-export-all');
    if (exportAllBtn) exportAllBtn.addEventListener('click', () => exportCsv(getFilteredUsers()));

    const exportSelectedBtn = container.querySelector('#c-export-selected');
    if (exportSelectedBtn) {
      exportSelectedBtn.addEventListener('click', () => {
        const selectedUsers = getFilteredUsers().filter(u => selectedUids.has(u.uid));
        exportCsv(selectedUsers);
      });
    }

    const selectAll = container.querySelector('#c-select-all');
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const users = getFilteredUsers();
        if (e.target.checked) users.forEach(u => selectedUids.add(u.uid));
        else users.forEach(u => selectedUids.delete(u.uid));
        renderTable();
      });
    }
  }

  function renderTable() {
    const tb = document.getElementById('c-table');
    if (!tb) return;
    const filteredUsers = getFilteredUsers();
    const activeUsers = allUsers.filter(u => isActiveCustomer(u));
    setText('c-all-cnt', allUsers.length);
    setText('c-active-cnt', activeUsers.length);

    if (filteredUsers.length === 0) {
      tb.innerHTML = `<tr><td colspan="6" class="empty-state">${searchTerm ? 'No customers match your search.' : 'No customers recorded.'}</td></tr>`;
      updateBulkActions(filteredUsers);
      return;
    }

    tb.innerHTML = filteredUsers.map(u => {
      const n = u.name || u.displayName || 'No Name';
      const address = getPrimaryAddress(u);
      const provider = resolveAuthProvider(u);
      const isChecked = selectedUids.has(u.uid) ? 'checked' : '';

      return `
        <tr style="cursor:pointer" onclick="window.Customers.select('${u.uid}')">
          <td onclick="event.stopPropagation()"><input type="checkbox" data-uid="${u.uid}" ${isChecked} /></td>
          <td class="fw-600 text-text">${n}</td>
          <td>${u.phoneNumber || u.phone || '--'}</td>
          <td title="${escapeHtml(address)}">${address}</td>
          <td>${provider}</td>
        </tr>
      `;
    }).join('');

    tb.querySelectorAll('input[type="checkbox"][data-uid]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const uid = e.target.dataset.uid;
        if (!uid) return;
        if (e.target.checked) selectedUids.add(uid);
        else selectedUids.delete(uid);
        updateBulkActions(filteredUsers);
      });
    });
    
    // Auto select first or preserve previous selection
    const selectedExists = selectedUid && filteredUsers.some(u => u.uid === selectedUid);
    if (selectedExists) selectRow(selectedUid);
    else if(filteredUsers.length > 0) selectRow(filteredUsers[0].uid);

    updateBulkActions(filteredUsers);
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
    
    setText('cd-total', total);
    setText('cd-done', done);
    setText('cd-cancel', cancel);

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

  function getFilteredUsers() {
    let rows = activeTab === 'active'
      ? allUsers.filter(u => isActiveCustomer(u))
      : [...allUsers];

    if (searchTerm) rows = rows.filter(u => matchesSearch(u, searchTerm));
    return rows;
  }

  function isActiveCustomer(user) {
    if (user.isActive === true) return true;
    if (user.lastLogin || user.lastSeen || user.lastActiveAt) return true;
    return !!(user.orders && Object.keys(user.orders).length > 0);
  }

  function matchesSearch(user, term) {
    const haystack = [
      user.uid,
      user.name,
      user.displayName,
      user.email,
      user.phone,
      user.phoneNumber,
      getPrimaryAddress(user),
      resolveAuthProvider(user)
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  }

  function getPrimaryAddress(user) {
    if (user.address && typeof user.address === 'string') return user.address;
    if (!user.addresses || typeof user.addresses !== 'object') return '--';
    const first = Object.values(user.addresses)[0];
    if (!first || typeof first !== 'object') return '--';
    const out = [first.street, first.barangay, first.city, first.province, first.zipcode].filter(Boolean).join(', ');
    return out || '--';
  }

  function resolveAuthProvider(user) {
    if (user.authProvider) return String(user.authProvider);
    if (user.provider) return String(user.provider);
    if (user.providerId) return String(user.providerId);
    if (Array.isArray(user.providers) && user.providers.length > 0) {
      const first = user.providers[0];
      if (typeof first === 'string') return first;
      if (first && first.providerId) return first.providerId;
    }
    return 'password';
  }

  function updateBulkActions(filteredUsers) {
    const bulkWrap = document.getElementById('c-bulk-actions');
    const count = filteredUsers.filter(u => selectedUids.has(u.uid)).length;
    setText('c-selected-count', `${count} selected`);
    if (bulkWrap) bulkWrap.style.display = count > 0 ? 'flex' : 'none';

    const selectAll = document.getElementById('c-select-all');
    if (selectAll) {
      const allChecked = filteredUsers.length > 0 && filteredUsers.every(u => selectedUids.has(u.uid));
      selectAll.checked = allChecked;
      selectAll.indeterminate = count > 0 && !allChecked;
    }
  }

  function exportCsv(users) {
    if (!users || users.length === 0) return;
    const headers = ['UID', 'Customer Name', 'Email', 'Phone', 'Address', 'Auth Provider', 'Total Orders'];
    const rows = users.map(u => [
      u.uid || '',
      u.name || u.displayName || '',
      u.email || '',
      u.phoneNumber || u.phone || '',
      getPrimaryAddress(u) === '--' ? '' : getPrimaryAddress(u),
      resolveAuthProvider(u),
      u.orders ? Object.keys(u.orders).length : 0
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function unmount() {
    if(unsub) unsub();
    if (chartInstance) chartInstance.destroy();
  }

  return { mount, unmount, select: selectRow };
})();
