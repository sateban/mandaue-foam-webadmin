/* categories.js */
window.Categories = (() => {
  let unsub = null;
  let currentImgPreview = null; // Holds the File object when selecting a new image
  let currentPreviewObjectUrl = null;

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

  async function renderList(val) {
    const grid = document.getElementById('cat-grid');
    if (!grid) return;

    try {
      if (!val || (Array.isArray(val) && val.filter(c => c !== null).length === 0) || Object.keys(val).length === 0) {
        grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          <h4>No categories</h4>
          <p>Create a category to get started organizing products.</p>
        </div>`;
        return;
      }

      let items = [];
      if (Array.isArray(val)) {
        items = val.filter(c => c !== null);
      } else {
        items = Object.entries(val).map(([k, data]) => ({ id: data.id || k, ...data }));
      }

      const htmlPromises = items.map(async c => {
        const safeName = (c.name || '').replace(/'/g, "\\'");
        const safeDesc = (c.description || '').replace(/'/g, "\\'");
        const safeImg  = (c.imageUrl || '').replace(/'/g, "\\'");
        const safeId = (c.id || '').replace(/'/g, "\\'");

        let imgHtml = `
          <div class="cat-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </div>
        `;

        if (c.imageUrl) {
          try {
            const url = await FilebaseService.getPresignedUrl(c.imageUrl);
            imgHtml = `
              <div style="width: 48px; height: 48px; margin: 0 auto 10px; border-radius: var(--r); overflow: hidden; background: var(--bg);">
                <img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=''; this.onerror=null; this.parentElement.innerHTML='<svg style=\\'margin-top:12px;color:var(--muted)\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\' ry=\\'2\\'></rect><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'></circle><polyline points=\\'21 15 16 10 5 21\\'></polyline></svg>';" />
              </div>
            `;
          } catch (_) {
            // Keep rendering with fallback icon if image URL resolution fails.
          }
        }

        return `
          <div class="cat-card" onclick="window.Categories.editCategory('${safeId}', '${safeName}', '${safeDesc}', '${safeImg}')">
            ${imgHtml}
            <h4>${c.name}</h4>
            ${c.description ? `<span>${c.description}</span>` : ''}
            <button class="cat-card-view-products" onclick="event.stopPropagation(); window.location.hash = '#/products-list?category=${safeId}'" title="View products in this category">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6h6m-6 4h6m-6 4h6M5 20h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path></svg>
            </button>
          </div>
        `;
      });

      const renderedHTML = await Promise.allSettled(htmlPromises);
      const cards = renderedHTML
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      grid.innerHTML = cards.length
        ? cards.join('')
        : `<div class="empty-state" style="grid-column: 1/-1">
            <h4>Unable to render categories</h4>
            <p>Please try refreshing the page.</p>
          </div>`;
    } catch (err) {
      console.error('Categories render failed:', err);
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1">
        <h4>Unable to load categories</h4>
        <p>Check your connection and try again.</p>
      </div>`;
    }
  }

  function getFormHtml(id, name, desc, imgUrl, presignedUrl) {
    let previewHtml = `
      <div class="product-img-add w-full" style="height:120px" id="cat-img-drop" onclick="document.getElementById('cat-img-upload').click()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        <span>Upload Category Icon</span>
      </div>
    `;

    if (presignedUrl) {
      previewHtml = `
        <div class="product-img-add w-full" style="height:120px; padding:0; overflow:hidden;" id="cat-img-drop" onclick="document.getElementById('cat-img-upload').click()">
          <img src="${presignedUrl}" style="width:100%; height:100%; object-fit:cover;" />
        </div>
      `;
    }

    return `
      <input type="hidden" id="cat-id-input" value="${id || ''}" />
      <input type="hidden" id="cat-oldimg-input" value="${imgUrl || ''}" />
      
      <div class="form-group mb-4">
        <label class="form-label">Category Icon (Image)</label>
        ${previewHtml}
        <input type="file" id="cat-img-upload" accept="image/*" class="hidden" />
      </div>

      <div class="form-group mb-4">
        <label class="form-label">Category Name</label>
        <input type="text" id="cat-name-input" class="input" value="${name || ''}" placeholder="e.g. Sofa, Bed, Table..." />
      </div>
      
      <div class="form-group mb-4">
        <label class="form-label">Description</label>
        <textarea id="cat-desc-input" class="textarea" placeholder="Brief description...">${desc || ''}</textarea>
      </div>
    `;
  }

  function attachUploadListener() {
    const input = document.getElementById('cat-img-upload');
    const drop  = document.getElementById('cat-img-drop');
    if (!input || !drop) return;

    const showPreview = file => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        Toast.error('Please select a valid image file.');
        return;
      }
      currentImgPreview = file;
      if (currentPreviewObjectUrl) URL.revokeObjectURL(currentPreviewObjectUrl);
      currentPreviewObjectUrl = URL.createObjectURL(file);
      drop.style.padding = '0';
      drop.style.overflow = 'hidden';
      drop.style.borderColor = '';
      drop.style.background = '';
      drop.innerHTML = `<img src="${currentPreviewObjectUrl}" style="width:100%; height:100%; object-fit:cover;" />`;
    };

    input.addEventListener('change', e => {
      showPreview(e.target.files[0]);
    });

    const preventDefault = e => {
      e.preventDefault();
      e.stopPropagation();
    };

    drop.addEventListener('dragenter', e => {
      preventDefault(e);
      drop.style.borderColor = 'var(--primary)';
      drop.style.background = 'var(--primary-light)';
    });
    drop.addEventListener('dragover', e => {
      preventDefault(e);
      drop.style.borderColor = 'var(--primary)';
      drop.style.background = 'var(--primary-light)';
    });
    drop.addEventListener('dragleave', e => {
      preventDefault(e);
      drop.style.borderColor = '';
      drop.style.background = '';
    });
    drop.addEventListener('drop', e => {
      preventDefault(e);
      drop.style.borderColor = '';
      drop.style.background = '';
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      showPreview(file);
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      } catch (_) {
        // Not critical for save flow because we already track currentImgPreview.
      }
    });
  }

  function addCategory() {
    currentImgPreview = null;
    Modal.open({
      title: 'Add Category',
      body: getFormHtml('', '', '', '', ''),
      footer: `
        <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" id="cat-save-btn" onclick="window.Categories.saveCategory()">Save Category</button>
      `,
      onOpen: attachUploadListener
    });
  }

  async function editCategory(id, name, desc, imgUrl) {
    currentImgPreview = null;
    let presigned = '';
    if (imgUrl) {
      presigned = await FilebaseService.getPresignedUrl(imgUrl);
    }

    Modal.open({
      title: 'Edit Category',
      body: `
        ${getFormHtml(id, name, desc, imgUrl, presigned)}
        <div style="text-align:right">
           <button class="btn btn-ghost text-danger" onclick="window.Categories.deleteCategory('${id}')">Delete Category</button>
        </div>
      `,
      footer: `
        <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" id="cat-save-btn" onclick="window.Categories.saveCategory()">Save Changes</button>
      `,
      onOpen: attachUploadListener
    });
  }

  async function saveCategory() {
    const nameInput = document.getElementById('cat-name-input');
    const descInput = document.getElementById('cat-desc-input');
    const idEl = document.getElementById('cat-id-input');
    const oldImgEl = document.getElementById('cat-oldimg-input');
    const btn = document.getElementById('cat-save-btn');

    const name = nameInput.value.trim();
    const description = descInput.value.trim();
    if (!name) { nameInput.focus(); return; }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';

    try {
      // Use existing ID or generate one
      const id = (idEl && idEl.value) ? idEl.value : FirebaseService.newKey('categories');
      
      let imageUrl = oldImgEl ? oldImgEl.value : '';

      // Upload new image if selected
      if (currentImgPreview) {
        btn.textContent = 'Uploading Icon...';
        const uploadRes = await FilebaseService.uploadFile(currentImgPreview, 'image-assets/categories');
        imageUrl = uploadRes.key;
      }

      const payload = { id, name, description };
      if (imageUrl) payload.imageUrl = imageUrl;

      btn.textContent = 'Updating Database...';
      
      // Because the user data struct shown was an Array ("categories": [...]), we could use update on index if it's an array, 
      // but Firebase update handles dictionary structure perfectly under /categories/{id}.
      // To strictly support the array format shown if that's what's used, we rely on Firebase's logic mapping.
      await FirebaseService.update(`categories/${id}`, payload);
      
      Toast.success('Category saved successfully');
      Modal.close();
    } catch(err) {
      Toast.error(err.message);
      btn.disabled = false;
      btn.textContent = originalText;
    }
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
    if (currentPreviewObjectUrl) {
      URL.revokeObjectURL(currentPreviewObjectUrl);
      currentPreviewObjectUrl = null;
    }
  }

  return { mount, unmount, addCategory, editCategory, saveCategory, deleteCategory };
})();
