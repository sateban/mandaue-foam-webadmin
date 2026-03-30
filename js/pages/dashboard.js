/* dashboard.js */
window.Dashboard = (() => {
  let unsubProducts = null;
  let chartInstance = null;

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Overview</h1>
      </div>
      
      <div class="dashboard-grid">
        <div class="dash-stat-row">
          <div class="card stat-card">
            <div class="stat-card-header">
              <h4>Total Revenues</h4>
              <div class="stat-card-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
            </div>
            <div class="stat-card-value">₱ 0.00</div>
            <div class="stat-card-footer">
              <span class="stat-card-trend trend-up"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> 0%</span>
              <span class="stat-card-period">vs last week</span>
            </div>
          </div>
          <div class="card stat-card">
            <div class="stat-card-header">
              <h4>Total Orders</h4>
              <div class="stat-card-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
            </div>
            <div class="stat-card-value">0</div>
            <div class="stat-card-footer">
              <span class="stat-card-trend trend-down"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg> 0%</span>
              <span class="stat-card-period">vs last week</span>
            </div>
          </div>
          <div class="card stat-card">
            <div class="stat-card-header">
              <h4>Pending & Canceled</h4>
              <div class="stat-card-menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg></div>
            </div>
            <div class="stat-card-value">0</div>
            <div class="stat-card-footer">
              <span class="badge badge-warning"><div class="badge-dot"></div>0 Pending</span>
              <span class="badge badge-danger"><div class="badge-dot"></div>0 Canceled</span>
            </div>
          </div>
        </div>

        <div class="card dash-chart-card">
          <div class="card-header">
            <h3>Weekly Report</h3>
            <div class="tabs">
              <button class="tab-btn active">This week</button>
              <button class="tab-btn">Last week</button>
            </div>
          </div>
          <div class="card-body chart-container">
            <!-- Chart.js canvas -->
            <canvas id="weekly-chart"></canvas>
          </div>
        </div>

        <div class="card dash-table-card">
          <div class="table-toolbar"><h3>Recent Transactions</h3></div>
          <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Customer ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody id="dash-tx-table">
                <tr><td colspan="5" class="empty-state">No transactions yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="dash-right-panel flex-col gap-4">
          <div class="card">
            <div class="card-header">
              <h3>Active Users</h3>
            </div>
            <div class="card-body">
              <div class="stat-card-value mb-1">0</div>
              <div class="text-xs text-muted">Page views per minute</div>
            </div>
          </div>
          
          <div class="card flex" style="flex:1;">
            <div class="card-header" style="border:none;padding-bottom:0;">
              <h3>Products in System</h3>
            </div>
            <div class="card-body flex-col items-center justify-center" style="gap:10px;">
              <div class="stat-card-value" style="font-size:48px;" id="dash-product-count">0</div>
              <a href="#/products-add" class="btn btn-primary w-full" style="justify-content:center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add New Product
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Load data
    unsubProducts = FirebaseService.stream('products', data => {
      const count = data ? Object.keys(data).length : 0;
      document.getElementById('dash-product-count').textContent = count;
    });

    initChart();
  }

  function initChart() {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx || !window.Chart) return;

    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
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

  function unmount() {
    if (unsubProducts) unsubProducts();
    if (chartInstance) chartInstance.destroy();
  }

  return { mount, unmount };
})();
