/* topbar.js */
const Topbar = (() => {
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
        <!-- Optional: Dark mode toggle if desired later -->
        <button class="topbar-icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <div class="notif-badge"></div>
        </button>
      </div>
    `;
  }
  return { render };
})();
