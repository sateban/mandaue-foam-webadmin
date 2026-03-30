/* categories.js */
window.Categories = (() => {
  let unsub = null;

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Categories</h1>
        <button class="btn btn-primary" onclick="window.Categories.addCategory()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> Add Category
        </button>
      </div>
      <div class="cat-grid" id="cat-grid">
        <div class="skeleton" style="height:120px;"></div>
        <div class="skeleton" style="height:120px;"></div>
        <div class="skeleton" style="height:120px;"></div>
      </div>
    `;

    unsub = FirebaseService.stream('categories', renderList);
  }

  function renderList(val) {
    const grid = document.getElementById('cat-grid');
    if (!grid) return;
    
    if (!val) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
        <h4>No categories</h4>
        <p>Create a category to get started organizing products.</p>
      </div>`;
      return;
    }

    const items = Object.entries(val).map(([id, data]) => ({ id, ...data }));
    grid.innerHTML = items.map(c => `
      <div class="cat-card" onclick="window.Categories.editCategory('${c.id}', '${c.name.replace(/'/g,"\\'")}')">
        <div class="cat-icon">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
        </div>
        <h4>${c.name}</h4>
      </div>
    `).join('');
  }

  function addCategory() {
    Modal.open({
      title: 'Add Category',
      body: `
        <div class="form-group mb-4">
          <label class="form-label">Category Name</label>
          <input type="text" id="cat-name-input" class="input" placeholder="e.g. Sofa, Bed, Table..." />
        </div>
      `,
      footer: `
        <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="window.Categories.saveCategory()">Save Category</button>
      `
    });
  }

  function editCategory(id, name) {
    Modal.open({
      title: 'Edit Category',
      body: `
        <input type="hidden" id="cat-id-input" value="${id}" />
        <div class="form-group mb-4">
          <label class="form-label">Category Name</label>
          <input type="text" id="cat-name-input" class="input" value="${name}" />
        </div>
        <div style="text-align:right">
           <button class="btn btn-ghost text-danger" onclick="window.Categories.deleteCategory('${id}')">Delete Category</button>
        </div>
      `,
      footer: `
        <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="window.Categories.saveCategory()">Save Changes</button>
      `
    });
  }

  function saveCategory() {
    const input = document.getElementById('cat-name-input');
    const idEl = document.getElementById('cat-id-input');
    const name = input.value.trim();
    if (!name) { input.focus(); return; }

    const id = idEl ? idEl.value : FirebaseService.newKey('categories');
    
    FirebaseService.update(`categories/${id}`, { name })
      .then(() => {
        Toast.success('Category saved');
        Modal.close();
      })
      .catch(e => Toast.error(e.message));
  }

  function deleteCategory(id) {
    Modal.confirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Products assigned to it might lose association.',
      danger: true,
      confirmText: 'Delete',
      onConfirm: () => {
        FirebaseService.remove(`categories/${id}`)
          .then(() => Toast.success('Category deleted'))
          .catch(e => Toast.error(e.message));
      }
    });
  }

  function unmount() {
    if (unsub) unsub();
  }

  return { mount, unmount, addCategory, editCategory, saveCategory, deleteCategory };
})();
