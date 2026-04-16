/* products-list.js */
window.ProductsList = (() => {
  let unsub = null;
  let products = [];
  let categories = {};
  let imageUrlsByProductId = {};

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Product List</h1>
        <a href="#/products-add" class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 
          Add New Product
        </a>
      </div>

      <div class="card">
        <div class="table-toolbar">
          <div class="tabs">
            <button class="tab-btn active">All Product <span class="tab-count" id="count-all">0</span></button>
            <button class="tab-btn">Published</button>
            <button class="tab-btn">Draft</button>
          </div>
          <div class="table-toolbar-right">
            <div class="search-input-wrap">
              <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="pl-search" placeholder="Search product..." />
            </div>
            <button class="btn btn-outline btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg></button>
          </div>
        </div>
        <div class="table-wrap" style="border:none;box-shadow:none;border-radius:0;">
          <table>
            <thead>
              <tr>
                <th width="40"><input type="checkbox" /></th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th width="80">Action</th>
              </tr>
            </thead>
            <tbody id="pl-table-body">
              <tr><td colspan="7" class="empty-state">Loading products...</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span class="text-muted text-sm" id="pl-showing">Showing 0 entries</span>
          <div class="pagination-pages">
            <button class="pg-btn active">1</button>
          </div>
        </div>
      </div>
    `;

    loadMap();
  }

  async function loadMap() {
    try {
      const catRes = await FirebaseService.readList('categories');
      catRes.forEach(c => categories[c.id] = c.name);
      
      unsub = FirebaseService.stream('products', data => {
        products = data ? Object.entries(data).map(([id, d]) => ({ ...d, id, _dbKey: id })) : [];
        renderTable();
        hydrateThumbnailUrls();
      });
    } catch(e) {
      Toast.error(e.message);
    }
  }

  function renderTable() {
    const tbody = document.getElementById('pl-table-body');
    if (!tbody) return;

    document.getElementById('count-all').textContent = products.length;
    document.getElementById('pl-showing').textContent = `Showing ${products.length} entries`;

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-state">No products found.</td></tr>`;
      return;
    }

    tbody.innerHTML = products.map(p => {
      const catStr = categories[p.category] || p.category || 'Uncategorized';
      const img = imageUrlsByProductId[p.id] || (p.imageUrl ? FilebaseService.publicUrl(p.imageUrl) : '');
      const statCls = p.status === 'draft' ? 'badge-neutral' : 'badge-success';
      const statTxt = p.status === 'draft' ? 'Draft' : 'Published';

      return `
        <tr>
          <td><input type="checkbox" /></td>
          <td>
            <div class="td-product">
              <div class="td-product-img">${img ? `<img src="${img}" />` : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'}</div>
              <div>
                <strong class="text-text">${p.name || 'Unnamed'}</strong>
                ${p.rating ? `<div class="text-xs text-muted mt-1">⭐ ${Number(p.rating).toFixed(1)} (${p.reviews || 0} reviews)</div>` : ''}
              </div>
            </div>
          </td>
          <td>${catStr}</td>
          <td class="fw-600">₱ ${(Number(p.price)||0).toFixed(2)}</td>
          <td>${p.inStock ? p.quantity : '<span class="text-danger">Out</span>'}</td>
          <td><span class="badge ${statCls}">${statTxt}</span></td>
          <td>
            <div class="td-actions">
              <button title="Edit" onclick="window.location.hash='#/products-add?id=${p._dbKey || p.id}'"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></button>
              <button class="del" title="Delete" onclick="window.ProductsList.deleteProduct('${p._dbKey || p.id}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function hydrateThumbnailUrls() {
    const withImage = products.filter(p => p.imageUrl);
    if (!withImage.length) {
      imageUrlsByProductId = {};
      return;
    }

    const pairs = await Promise.all(withImage.map(async p => {
      const url = await FilebaseService.resolvePublicReadUrl(p.imageUrl);
      return [p.id, url];
    }));
    imageUrlsByProductId = Object.fromEntries(pairs);
    renderTable();
  }

  function deleteProduct(id) {
    Modal.confirm({
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      danger: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          const product = await FirebaseService.read(`products/${id}`);
          const mediaKeys = [product?.imageUrl, product?.modelUrl]
            .map(v => FilebaseService.resolveObjectKey(v))
            .filter(Boolean);

          await FirebaseService.remove(`products/${id}`);

          if (mediaKeys.length) {
            await Promise.allSettled(mediaKeys.map(k => FilebaseService.deleteFile(k)));
          }

          Toast.success('Product deleted');
        } catch (e) {
          Toast.error(e.message);
        }
      }
    });
  }

  function unmount() {
    if (unsub) unsub();
  }

  return { mount, unmount, deleteProduct };
})();
