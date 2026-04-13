/* dashboard.js — Overview aligned with admin dashboard design */
window.Dashboard = (() => {
  let unsubUsers = null;
  let unsubProducts = null;
  let chartWeek = null;
  let chartUsers = null;
  let usersData = null;
  let productsList = [];

  const MS_DAY = 24 * 60 * 60 * 1000;
  const MS_WEEK = 7 * MS_DAY;

  function collectOrders(users) {
    const orders = [];
    if (!users) return orders;
    Object.entries(users).forEach(([uid, u]) => {
      if (!u.orders) return;
      Object.entries(u.orders).forEach(([oid, o]) => {
        orders.push({ uid, oid, ...o });
      });
    });
    return orders;
  }

  function fmtMoney(n) {
    const x = Number(n) || 0;
    if (x >= 100000) return `₱ ${(x / 1000).toFixed(1)}K`;
    return `₱ ${x.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function pctChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  function statusBucket(status) {
    const s = (status || 'Pending').toLowerCase();
    if (s.includes('cancel')) return 'canceled';
    if (s.includes('pending')) return 'pending';
    return 'other';
  }

  function sumOrderAmount(o) {
    return Number(o.totalPrice || o.totalAmount || 0);
  }

  function updateFromData() {
    const orders = collectOrders(usersData);
    const now = Date.now();
    const start7 = now - MS_WEEK;
    const start14 = now - 2 * MS_WEEK;

    const in7 = orders.filter(o => (o.timestamp || 0) >= start7);
    const inPrev7 = orders.filter(o => (o.timestamp || 0) >= start14 && (o.timestamp || 0) < start7);

    const rev7 = in7.reduce((s, o) => s + sumOrderAmount(o), 0);
    const revPrev = inPrev7.reduce((s, o) => s + sumOrderAmount(o), 0);
    const ord7 = in7.length;
    const ordPrev = inPrev7.length;

    const pr = pctChange(rev7, revPrev);
    const po = pctChange(ord7, ordPrev);

    let pend = 0;
    let canc = 0;
    in7.forEach(o => {
      const b = statusBucket(o.status);
      if (b === 'pending') pend++;
      else if (b === 'canceled') canc++;
    });

    const el = (id, v) => {
      const n = document.getElementById(id);
      if (n) n.textContent = v;
    };
    el('dash-rev', fmtMoney(rev7));
    el('dash-ord', ord7.toLocaleString());
    el('dash-pend', String(pend));
    el('dash-canc', String(canc));

    const trendRev = document.getElementById('dash-trend-rev');
    const trendOrd = document.getElementById('dash-trend-ord');
    if (trendRev) {
      trendRev.className = `stat-card-trend ${pr >= 0 ? 'trend-up' : 'trend-down'}`;
      trendRev.innerHTML = `${pr >= 0 ? '↑' : '↓'} ${Math.abs(pr).toFixed(1)}%`;
    }
    if (trendOrd) {
      trendOrd.className = `stat-card-trend ${po >= 0 ? 'trend-up' : 'trend-down'}`;
      trendOrd.innerHTML = `${po >= 0 ? '↑' : '↓'} ${Math.abs(po).toFixed(1)}%`;
    }

    const customers = usersData ? Object.keys(usersData).length : 0;
    const prodCount = productsList.length;
    let stockQty = 0;
    let outStock = 0;
    productsList.forEach(p => {
      const q = Number(p.quantity) || 0;
      stockQty += q;
      const oos = p.inStock === false || q <= 0;
      if (oos) outStock++;
    });

    el('dash-chip-customers', customers >= 1000 ? `${(customers / 1000).toFixed(1)}k` : String(customers));
    el('dash-chip-products', prodCount >= 1000 ? `${(prodCount / 1000).toFixed(1)}k` : String(prodCount));
    el('dash-chip-stock', stockQty >= 1000 ? `${(stockQty / 1000).toFixed(1)}k` : String(stockQty));
    el('dash-chip-oos', String(outStock));
    el('dash-chip-rev', fmtMoney(rev7));

    const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    in7.forEach(o => {
      const d = new Date(o.timestamp || 0);
      const idx = d.getDay();
      buckets[idx] += sumOrderAmount(o);
    });

    if (chartWeek) {
      chartWeek.data.datasets[0].data = buckets;
      chartWeek.update();
    }

    const cutoff30 = now - 30 * 60 * 1000;
    const recent30 = orders.filter(o => (o.timestamp || 0) >= cutoff30);
    const barBuckets = [0, 0, 0, 0, 0, 0];
    const step = 5 * 60 * 1000;
    recent30.forEach(o => {
      const slot = Math.min(5, Math.floor((now - (o.timestamp || 0)) / step));
      if (slot >= 0 && slot < 6) barBuckets[5 - slot]++;
    });
    const maxB = Math.max(1, ...barBuckets, 1);
    const scaled = barBuckets.map(b => Math.round((b / maxB) * 100));
    el('dash-users-val', recent30.length >= 1000 ? `${(recent30.length / 1000).toFixed(1)}K` : String(recent30.length));

    if (chartUsers) {
      chartUsers.data.datasets[0].data = scaled;
      chartUsers.update();
    }

    const tb = document.getElementById('dash-tx-table');
    if (tb) {
      const top = [...orders].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 5);
      if (top.length === 0) {
        tb.innerHTML = `<tr><td colspan="5" class="empty-state">No transactions yet</td></tr>`;
      } else {
        tb.innerHTML = top.map((o, i) => {
          const s = (o.status || 'Pending').toLowerCase();
          let cls = 'badge-warning';
          let txt = 'Pending';
          if (s.includes('deliver') || s.includes('paid')) { cls = 'badge-success'; txt = 'Paid'; }
          else if (s.includes('ship')) { cls = 'badge-info'; txt = 'Shipped'; }
          else if (s.includes('cancel')) { cls = 'badge-danger'; txt = 'Canceled'; }
          const amt = sumOrderAmount(o).toFixed(2);
          const uidShort = (o.uid || '').substring(0, 8) + '…';
          const date = o.timestamp ? new Date(o.timestamp).toLocaleDateString() : '—';
          return `<tr>
            <td>${i + 1}</td>
            <td class="text-xs text-muted" title="${o.uid}">${uidShort}</td>
            <td>${date}</td>
            <td><span class="badge ${cls}">${txt}</span></td>
            <td class="fw-600">₱ ${amt}</td>
          </tr>`;
        }).join('');
      }
    }

    const agg = {};
    in7.forEach(o => {
      (o.items || []).forEach(it => {
        const name = it.name || it.productName || it.title || 'Item';
        const key = it.productId || name;
        if (!agg[key]) agg[key] = { name, qty: 0, price: Number(it.price) || 0 };
        agg[key].qty += Number(it.quantity) || 1;
      });
    });
    const best = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const bestTb = document.getElementById('dash-best-table');
    if (bestTb) {
      if (best.length === 0) {
        const fallback = productsList.slice(0, 4).map(p => ({
          name: p.name || 'Product',
          qty: Number(p.quantity) || 0,
          price: Number(p.price) || 0
        }));
        if (fallback.length === 0) {
          bestTb.innerHTML = `<tr><td colspan="4" class="empty-state">No sales data yet</td></tr>`;
        } else {
          bestTb.innerHTML = fallback.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.qty}</td>
              <td><span class="badge ${p.qty > 0 ? 'badge-success' : 'badge-danger'}">${p.qty > 0 ? 'Stock' : 'Out'}</span></td>
              <td>₱ ${Number(p.price).toFixed(2)}</td>
            </tr>`).join('');
        }
      } else {
        bestTb.innerHTML = best.map(p => `
          <tr>
            <td>${p.name}</td>
            <td>${p.qty}</td>
            <td><span class="badge badge-success">Sold</span></td>
            <td>₱ ${p.price.toFixed(2)}</td>
          </tr>`).join('');
      }
    }

    hydrateTopProducts();
  }

  function productImageRef(p) {
    if (p.imageUrl) return p.imageUrl;
    if (p.image) return p.image;
    if (Array.isArray(p.images) && p.images.length) return p.images[0];
    return '';
  }

  async function hydrateTopProducts() {
    const wrap = document.getElementById('dash-top-products');
    if (!wrap) return;
    const slice = productsList.slice(0, 5);
    if (slice.length === 0) {
      wrap.innerHTML = `<div class="text-xs text-muted">No products yet.</div>`;
      return;
    }
    const rows = await Promise.all(slice.map(async (p) => {
      let src = '';
      const ref = productImageRef(p);
      if (ref) {
        try {
          src = await FilebaseService.resolvePublicReadUrl(ref);
        } catch (_) {
          src = FilebaseService.publicUrl(ref);
        }
      }
      const price = Number(p.price) || 0;
      const id = (p.id || '').substring(0, 8).toUpperCase();
      return `<div class="dash-top-item">
        ${src ? `<img src="${src}" alt="" />` : `<div style="width:40px;height:40px;flex-shrink:0;background:var(--bg);border-radius:6px;border:1px solid var(--border-light);"></div>`}
        <div class="dash-top-meta">
          <strong class="truncate">${p.name || 'Product'}</strong>
          <span>#${id || '—'}</span>
        </div>
        <span class="fw-600">₱ ${price.toFixed(2)}</span>
      </div>`;
    }));
    wrap.innerHTML = rows.join('');
  }

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Dashboard</h1>
      </div>

      <div class="dashboard-grid">
        <div class="dash-right-stack">
          <div class="card">
            <div class="card-header">
              <h3>AR Sessions in the last 30 minutes</h3>
            </div>
            <div class="card-body">
              <div class="stat-card-value mb-1" id="dash-users-val">0</div>
              <div class="text-xs text-muted">Orders placed in the last 30 minutes (activity proxy)</div>
              <div class="dash-mini-chart-wrap">
                <canvas id="dash-users-chart"></canvas>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <h3>Top products</h3>
            </div>
            <div class="card-body">
              <div class="dash-top-list" id="dash-top-products"></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <h3>Add new product</h3>
            </div>
            <div class="card-body">
              <div class="dash-cat-chips">
                <span class="chip">Electronic</span>
                <span class="chip">Fashion</span>
                <span class="chip">Home</span>
              </div>
              <div class="dash-quick-list" id="dash-quick-list"></div>
              <a href="#/products-add" class="btn btn-primary w-full mt-2" style="justify-content:center;">Add product</a>
            </div>
          </div>
        </div>

        <div class="card dash-best-card">
          <div class="table-toolbar">
            <h3>Most viewed items in AR</h3>
          </div>
          <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Total order</th>
                  <th>Status</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody id="dash-best-table">
                <tr><td colspan="4" class="empty-state">Loading…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    unsubUsers = FirebaseService.stream('users', (data) => {
      usersData = data;
      updateFromData();
    });

    unsubProducts = FirebaseService.stream('products', (data) => {
      productsList = data ? Object.entries(data).map(([id, d]) => ({ id, ...d })) : [];
      const quick = document.getElementById('dash-quick-list');
      if (quick) {
        const q = productsList.slice(0, 4);
        quick.innerHTML = q.length
          ? q.map(p => `
            <div class="dash-quick-row">
              <span class="truncate">${p.name || 'Product'}</span>
              <span class="fw-600">₱ ${(Number(p.price) || 0).toFixed(2)}</span>
            </div>`).join('')
          : `<div class="text-xs text-muted">No items yet.</div>`;
      }
      updateFromData();
    });

    setTimeout(() => {
      initCharts();
      updateFromData();
    }, 0);
  }

  function initCharts() {
    const ctx = document.getElementById('weekly-chart');
    if (ctx && window.Chart) {
      chartWeek = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
          datasets: [{
            label: 'Sales',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#1765D8',
            backgroundColor: 'rgba(23, 101, 216, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#1765D8',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false } },
            y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.04)' } }
          }
        }
      });
    }

    const uctx = document.getElementById('dash-users-chart');
    if (uctx && window.Chart) {
      chartUsers = new Chart(uctx, {
        type: 'bar',
        data: {
          labels: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
          datasets: [{
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(23, 101, 216, 0.55)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });
    }
  }

  function unmount() {
    if (unsubUsers) unsubUsers();
    if (unsubProducts) unsubProducts();
    unsubUsers = null;
    unsubProducts = null;
    if (chartWeek) { chartWeek.destroy(); chartWeek = null; }
    if (chartUsers) { chartUsers.destroy(); chartUsers = null; }
    usersData = null;
    productsList = [];
  }

  return { mount, unmount };
})();
