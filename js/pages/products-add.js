/* products-add.js */
window.ProductsAdd = (() => {
  let viewer = null;
  let file3dPreview = null; // currently selected 3D file for upload
  let imgPreview = null;    // currently selected IMG file for upload
  let editId = null;        // if editing
  let currentImgObjectUrl = null;
  const PRODUCT_MODEL_FOLDER = 'model-assets/products';
  const PRODUCT_IMAGE_FOLDER = 'image-assets/products';

  function initMap(product = null) {
    const isEdit = !!product;
    editId = isEdit ? product.id : null;
    
    document.getElementById('pa-name').value = product?.name || '';
    document.getElementById('pa-desc').value = product?.description || '';
    document.getElementById('pa-price').value = product?.price || '';
    document.getElementById('pa-discount').value = parseFloat(product?.discount || 0);
    document.getElementById('pa-qty').value = product?.quantity || '0';
    document.getElementById('pa-stock').checked = product?.inStock ?? true;
    document.getElementById('pa-feat').checked = product?.isFavorite ?? false;

    // Load categories
    FirebaseService.readList('categories').then(cats => {
      const sel = document.getElementById('pa-cat');
      if(sel) {
        sel.innerHTML = '<option value="">Select a category</option>' +
          cats.map(c => `<option value="${c.id}" ${product?.category === c.id ? 'selected':''}>${c.name}</option>`).join('');
      }
    });

    if (isEdit) {
      document.getElementById('pa-title').textContent = 'Edit Product';
      if (product.imageUrl) {
        const u = FilebaseService.publicUrl(product.imageUrl);
        imgPreview = null; // Don't re-upload unless changed
        document.getElementById('img-drop-area').innerHTML = `<img src="${u}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-sm)" />`;
      }
      if (product.modelUrl) {
        const u = FilebaseService.publicUrl(product.modelUrl);
        if (viewer) viewer.loadUrl(u).catch(e => console.error('Model load err:', e));
      }
    }
  }

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1 id="pa-title">Add New Product</h1>
        <div class="flex gap-2">
          <button class="btn btn-outline" onclick="window.location.hash='#/products-list'">Cancel</button>
          <button class="btn btn-ghost" onclick="window.ProductsAdd.saveProduct('draft')">Save to draft</button>
          <button class="btn btn-primary" onclick="window.ProductsAdd.saveProduct('published')">Publish Product</button>
        </div>
      </div>

      <div class="add-product-layout">
        
        <!-- Left Column: Details -->
        <div class="product-form-section">
          <div class="card">
            <div class="card-header"><h3>General Information</h3></div>
            <div class="card-body form-group gap-4">
              <div>
                <label class="form-label">Product Name</label>
                <input type="text" id="pa-name" class="input mt-1" placeholder="Type product name here..." />
              </div>
              <div>
                <label class="form-label">Description</label>
                <textarea id="pa-desc" class="textarea mt-1" placeholder="Type product description here..."></textarea>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>3D Model Asset (.glb / .obj)</h3></div>
            <div class="card-body">
              <div class="dropzone" id="model-dropzone" onclick="document.getElementById('model-upload').click()">
                <svg class="dropzone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                <p>Drag and drop 3D model, or <strong>browse</strong></p>
                <small>Format: GLB, GLTF, OBJ</small>
              </div>
              <input type="file" id="model-upload" accept=".glb,.gltf,.obj" class="hidden" />

              <div class="model-preview-box" id="model-preview-container">
                <!-- Viewer Canvas -->
                <div class="model-preview-controls">
                  <button class="model-ctrl-btn" onclick="window.ProductsAdd.toggleWireframe()">Wireframe</button>
                  <button class="model-ctrl-btn" onclick="window.ProductsAdd.resetCam()">Reset Cam</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Pricing & Inventory</h3></div>
            <div class="card-body grid-2">
              <div class="form-group">
                <label class="form-label">Base Price</label>
                <div class="input-group">
                  <span class="input-group-icon fw-600 text-text">₱</span>
                  <input type="number" id="pa-price" class="input" style="padding-left:30px" placeholder="0.00" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Discount (%)</label>
                <input type="number" id="pa-discount" class="input" placeholder="e.g. 10" />
              </div>
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input type="number" id="pa-qty" class="input" placeholder="0" />
              </div>
              <div class="form-group" style="justify-content:center;padding-top:20px">
                <label class="form-toggle">
                  <input type="checkbox" id="pa-stock" checked />
                  <div class="form-toggle-track"></div>
                  <span class="form-toggle-label">In Stock</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Media & Setup -->
        <div class="product-form-section">
          <div class="card">
            <div class="card-header"><h3>Product Image</h3></div>
            <div class="card-body">
              <div class="product-img-add w-full" style="height:200px" id="img-drop-area" onclick="document.getElementById('img-upload').click()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <span>Upload Primary Image</span>
              </div>
              <input type="file" id="img-upload" accept="image/*" class="hidden" />
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Category</h3></div>
            <div class="card-body form-group gap-4">
              <div>
                <label class="form-label">Product Category</label>
                <select id="pa-cat" class="select mt-1">
                  <option value="">Loading categories...</option>
                </select>
              </div>
              <div>
                <label class="form-toggle">
                  <input type="checkbox" id="pa-feat" />
                  <div class="form-toggle-track"></div>
                  <span class="form-toggle-label">Feature this product</span>
                </label>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;

    // Init Three.js
    const vC = document.getElementById('model-preview-container');
    viewer = ModelViewer.create(vC, { height: 260 });
    
    // Wire up events
    setupUploadHandlers();

    // Load data if edit
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    if (hashParams.has('id')) {
      FirebaseService.read(`products/${hashParams.get('id')}`).then(p => {
        if(p) initMap({ id: hashParams.get('id'), ...p });
      }).catch(e => Toast.error(e.message));
    } else {
      initMap(null); // Create new
    }
  }

  function setupUploadHandlers() {
    const minput = document.getElementById('model-upload');
    const mdrop  = document.getElementById('model-dropzone');
    const iinput = document.getElementById('img-upload');
    const idrop  = document.getElementById('img-drop-area');

    if (!minput || !mdrop || !iinput || !idrop) return;

    const showModelPreview = (f) => {
      if (!f) return;
      if (!f.name.match(/\.(glb|gltf|obj)$/i)) {
        Toast.error('Please select a valid 3D model (.glb, .gltf, .obj).');
        return;
      }
      file3dPreview = f;
      mdrop.innerHTML = `<p class="text-primary fw-600">${f.name}</p><small>${(f.size/1024).toFixed(1)} KB</small>`;
      
      Toast.info('Loading 3D Preview...');
      if(viewer) {
        viewer.clear();
        viewer.loadFile(f).then(()=>Toast.success('Model loaded')).catch(err=>Toast.error('Load failed: '+err.message));
      }
    };

    const showImagePreview = (f) => {
      if (!f) return;
      if (!f.type || !f.type.startsWith('image/')) {
        Toast.error('Please select a valid image file.');
        return;
      }
      imgPreview = f;
      if (currentImgObjectUrl) URL.revokeObjectURL(currentImgObjectUrl);
      currentImgObjectUrl = URL.createObjectURL(f);
      idrop.innerHTML = `<img src="${currentImgObjectUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-sm)" />`;
    };

    minput.addEventListener('change', e => {
      showModelPreview(e.target.files[0]);
    });

    iinput.addEventListener('change', e => {
      showImagePreview(e.target.files[0]);
    });

    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    ['dragenter', 'dragover'].forEach(ev => {
      mdrop.addEventListener(ev, e => {
        preventDefault(e);
        mdrop.classList.add('drag-over');
      });
      idrop.addEventListener(ev, e => {
        preventDefault(e);
        idrop.style.borderColor = 'var(--primary)';
        idrop.style.background = 'var(--primary-light)';
      });
    });

    ['dragleave', 'drop'].forEach(ev => {
      mdrop.addEventListener(ev, e => {
        preventDefault(e);
        mdrop.classList.remove('drag-over');
      });
      idrop.addEventListener(ev, e => {
        preventDefault(e);
        idrop.style.borderColor = '';
        idrop.style.background = '';
      });
    });

    mdrop.addEventListener('drop', e => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      showModelPreview(file);
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        minput.files = dt.files;
      } catch (_) {}
    });

    idrop.addEventListener('drop', e => {
      const file = e.dataTransfer?.files?.[0];
      if (!file) return;
      showImagePreview(file);
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        iinput.files = dt.files;
      } catch (_) {}
    });
  }

  let wireframeOn = false;
  function toggleWireframe() { wireframeOn = !wireframeOn; if(viewer) viewer.setWireframe(wireframeOn); }
  function resetCam() { if(viewer) viewer.resetCamera(); }

  async function saveProduct(status) {
    const btn = event.currentTarget;
    const origTxt = btn.textContent;
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
      // Validate
      const name = document.getElementById('pa-name').value.trim();
      const price = parseFloat(document.getElementById('pa-price').value) || 0;
      if(!name) throw new Error('Product Name is required');
      if(price <= 0) throw new Error('Valid base price is required');

      let modelUrlRes = undefined;
      let imageUrlRes = undefined;

      // Uploads
      if (file3dPreview) {
        btn.textContent = 'Uploading 3D...';
        const u = await FilebaseService.uploadFile(file3dPreview, PRODUCT_MODEL_FOLDER);
        modelUrlRes = u.key;
      }
      if (imgPreview) {
        btn.textContent = 'Uploading Img...';
        const u = await FilebaseService.uploadFile(imgPreview, PRODUCT_IMAGE_FOLDER);
        imageUrlRes = u.key;
      }

      btn.textContent = 'Writing Database...';
      const id = editId || FirebaseService.newKey('products');

      const disc = parseFloat(document.getElementById('pa-discount').value) || 0;
      const discStr = disc > 0 ? disc + '%' : '0';

      const updatePayload = {
        name,
        price,
        description: document.getElementById('pa-desc').value.trim(),
        category: document.getElementById('pa-cat').value,
        quantity: parseInt(document.getElementById('pa-qty').value) || 0,
        inStock: document.getElementById('pa-stock').checked,
        discount: discStr,
        isFavorite: document.getElementById('pa-feat').checked,
        status: status
      };

      if (modelUrlRes) updatePayload.modelUrl = modelUrlRes;
      if (imageUrlRes) updatePayload.imageUrl = imageUrlRes;

      if (!editId) {
        // Safe defaults for new products per Flutter app contract
        updatePayload.rating = 0.0;
        updatePayload.reviews = 0;
      }

      await FirebaseService.update(`products/${id}`, updatePayload);
      
      Toast.success('Product saved successfully!');
      window.location.hash = '#/products-list';
      
    } catch(e) {
      Toast.error(e.message);
      btn.disabled = false;
      btn.textContent = origTxt;
    }
  }

  function unmount() {
    if(viewer) { viewer.destroy(); viewer = null; }
    if (currentImgObjectUrl) {
      URL.revokeObjectURL(currentImgObjectUrl);
      currentImgObjectUrl = null;
    }
    file3dPreview = null;
    imgPreview = null;
    editId = null;
  }

  return { mount, unmount, toggleWireframe, resetCam, saveProduct };
})();
