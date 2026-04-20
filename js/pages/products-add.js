/* products-add.js */
window.ProductsAdd = (() => {
  // Offline Color Name Database (Hex to Name Mapping)
  const COLOR_NAMES_DB = {
    // Reds
    '#FF0000': 'Red', '#FF1493': 'Deep Pink', '#FF69B4': 'Hot Pink', '#FFB6C1': 'Light Pink', '#FFC0CB': 'Pink',
    '#DC143C': 'Crimson', '#C71585': 'Medium Violet Red', '#8B0000': 'Dark Red', '#B22222': 'Firebrick',
    '#CD5C5C': 'Indian Red', '#F08080': 'Light Coral', '#FA8072': 'Salmon', '#E9967A': 'Dark Salmon',
    '#FF7F50': 'Coral', '#FF6347': 'Tomato', '#FF4500': 'Orange Red',
    // Oranges
    '#FFA500': 'Orange', '#FF8C00': 'Dark Orange', '#FFD700': 'Gold', '#FFCC00': 'Golden',
    '#DAA520': 'Goldenrod', '#FFD700': 'Gold', '#FFA500': 'Orange',
    // Yellows
    '#FFFF00': 'Yellow', '#FFFFE0': 'Light Yellow', '#FFFACD': 'Lemon Chiffon', '#FAFAD2': 'Light Goldenrod',
    '#EEEE00': 'Bright Yellow', '#CCCC00': 'Olive Yellow',
    // Greens
    '#008000': 'Green', '#00FF00': 'Lime', '#00FF7F': 'Spring Green', '#3CB371': 'Medium Sea Green',
    '#90EE90': 'Light Green', '#A9D08E': 'Light Moss Green', '#98FB98': 'Pale Green', '#00FA9A': 'Medium Spring Green',
    '#2E8B57': 'Sea Green', '#228B22': 'Forest Green', '#006400': 'Dark Green', '#556B2F': 'Dark Olive Green',
    '#6B8E23': 'Olive Drab', '#8FBC8F': 'Dark Sea Green', '#20B2AA': 'Light Sea Green', '#008B8B': 'Dark Cyan',
    '#5F9EA0': 'Cadet Blue', '#7CB342': 'Leaf Green', '#559933': 'Moss Green', '#79B81C': 'Apple Green',
    // Blues
    '#0000FF': 'Blue', '#4169E1': 'Royal Blue', '#1E90FF': 'Dodger Blue', '#00BFFF': 'Deep Sky Blue',
    '#87CEEB': 'Sky Blue', '#ADD8E6': 'Light Blue', '#B0E0E6': 'Powder Blue', '#00CED1': 'Dark Turquoise',
    '#20B2AA': 'Light Sea Green', '#48D1CC': 'Medium Turquoise', '#40E0D0': 'Turquoise', '#00FFFF': 'Cyan',
    '#E0FFFF': 'Light Cyan', '#00FFFF': 'Aqua', '#0099CC': 'Steel Blue', '#4A90E2': 'Periwinkle',
    '#003366': 'Navy Blue', '#000080': 'Navy', '#191970': 'Midnight Blue', '#6495ED': 'Cornflower Blue',
    '#6A5ACD': 'Slate Blue', '#9370DB': 'Medium Purple', '#8A2BE2': 'Blue Violet', '#9932CC': 'Dark Orchid',
    // Purples
    '#800080': 'Purple', '#EE82EE': 'Violet', '#DDA0DD': 'Plum', '#DA70D6': 'Orchid', '#BA55D3': 'Medium Orchid',
    '#9932CC': 'Dark Orchid', '#9400D3': 'Dark Violet', '#8B00FF': 'Electric Violet',
    // Pinks
    '#FF1493': 'Deep Pink', '#FF69B4': 'Hot Pink', '#FFB6C1': 'Light Pink', '#FFC0CB': 'Pink',
    '#DB7093': 'Pale Violet Red', '#FF00FF': 'Magenta', '#FF00FF': 'Fuchsia',
    // Neutrals
    '#FFFFFF': 'White', '#F5F5F5': 'White Smoke', '#F0F0F0': 'Gainsboro', '#DCDCDC': 'Gainsboro Light',
    '#D3D3D3': 'Light Gray', '#A9A9A9': 'Dark Gray', '#808080': 'Gray', '#696969': 'Dim Gray',
    '#505050': 'Dark Gray 2', '#2F4F4F': 'Dark Slate Gray', '#000000': 'Black',
    // Browns
    '#8B4513': 'Saddle Brown', '#A0522D': 'Sienna', '#D2691E': 'Chocolate', '#CD853F': 'Peru',
    '#DEB887': 'Burlywood', '#D2A679': 'Tan Brown', '#BC8F8F': 'Rosy Brown', '#8B7355': 'Burlywood Dark',
    '#704214': 'Sepia', '#654321': 'Dark Brown'
  };

  // Helper: Sanitize string for Firebase keys (avoid . $ [ ] # /)
  function sanitizeFirebaseKey(str) {
    return str.replace(/[.\[\]#$/]/g, '_').trim();
  }

  // Helper: Calculate hex distance for color matching
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function colorDistance(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return Infinity;
    return Math.sqrt(
      Math.pow(rgb1.r - rgb2.r, 2) +
      Math.pow(rgb1.g - rgb2.g, 2) +
      Math.pow(rgb1.b - rgb2.b, 2)
    );
  }

  // Find closest color name from database
  function getColorNameFromHex(hex) {
    const normalizedHex = hex.toUpperCase();
    if (COLOR_NAMES_DB[normalizedHex]) {
      return COLOR_NAMES_DB[normalizedHex];
    }
    // Find closest match
    let closest = Object.keys(COLOR_NAMES_DB)[0];
    let minDistance = Infinity;
    for (const dbHex of Object.keys(COLOR_NAMES_DB)) {
      const dist = colorDistance(normalizedHex, dbHex);
      if (dist < minDistance) {
        minDistance = dist;
        closest = dbHex;
      }
    }
    return COLOR_NAMES_DB[closest] || 'Custom Color';
  }

  let viewer = null;
  let file3dPreview = null; // currently selected 3D file for upload
  let imgPreview = null;    // currently selected IMG file for upload
  let editId = null;        // if editing
  let currentImgObjectUrl = null;
  let selectedColor = null; // color being selected/edited
  let selectedColorHex = null; // hex code for custom colors
  let customColorName = null; // custom name for the selected color
  let isCustomColor = false; // flag for custom color vs preset
  let colorVariations = {}; // color variations: { colorName: { imageUrl, modelUrl } }
  let availableColors = {}; // all available colors from database
  let variationUploadBindingsReady = false;
  // Main asset color assignment
  let mainColorName = null; // color assigned to main image/3D model
  let mainColorHex = null; // hex code for main color
  let mainIsCustomColor = false; // whether main color is custom
  const PRODUCT_MODEL_FOLDER = 'model-assets/products';
  const PRODUCT_IMAGE_FOLDER = 'image-assets/products';

  async function initMap(product = null) {
    const isEdit = !!product;
    editId = isEdit ? product.id : null;
    
    // Safely set form values with existence checks
    const el = (id) => document.getElementById(id);
    if(el('pa-name')) el('pa-name').value = product?.name || '';
    if(el('pa-desc')) el('pa-desc').value = product?.description || '';
    if(el('pa-price')) el('pa-price').value = product?.price || '';
    if(el('pa-discount')) el('pa-discount').value = parseFloat(product?.discount || 0);
    if(el('pa-qty')) el('pa-qty').value = product?.quantity || '0';
    if(el('pa-stock')) el('pa-stock').checked = product?.inStock ?? true;
    if(el('pa-feat')) el('pa-feat').checked = product?.isFavorite ?? false;

    // Load colors
    try {
      const colorsData = await FirebaseService.read('colors');
      availableColors = colorsData || {};
      const colorSel = document.getElementById('pa-color');
      if(colorSel) {
        colorSel.innerHTML = '<option value="">Select a color</option>' +
          Object.keys(availableColors).map(c => `<option value="${c}" ${product?.color === c ? 'selected':''}>${c}</option>`).join('');

      if (product?.color) {
        // Check if color is a preset (either from availableColors or COLOR_NAMES_DB)
        const isPresetFromDb = product.color in availableColors;
        const isKnownPreset = Object.values(COLOR_NAMES_DB).includes(product.color);
        
        if (isPresetFromDb || isKnownPreset) {
          // It's a preset color
          mainColorName = product.color;
          mainIsCustomColor = false;
          mainColorHex = null;
          // Also set selectedColor for color picker population
          selectedColor = product.color;
          selectedColorHex = null;
          isCustomColor = false;
          customColorName = product.color;
        } else {
          // Custom color - should have colorHex stored
          mainColorName = product.color;
          mainColorHex = product?.colorHex || '#808080';
          mainIsCustomColor = true;
          // Also set selectedColor for color picker population
          selectedColor = mainColorHex;
          selectedColorHex = mainColorHex;
          isCustomColor = true;
          customColorName = product.color;
        }
        
        // Load variations only if they exist
        colorVariations = product?.variations || product?.variation || {};
        
        // Ensure backward compatibility: convert old hex properties to _hex (for display only)
        Object.keys(colorVariations).forEach(key => {
          if (colorVariations[key].hex && !colorVariations[key]._hex) {
            colorVariations[key]._hex = colorVariations[key].hex;
            delete colorVariations[key].hex;
          }
          if (!colorVariations[key]._hex) {
            colorVariations[key]._hex = '#808080';
          }
          if (colorVariations[key].imageUrl === null) colorVariations[key].imageUrl = "";
          if (colorVariations[key].modelUrl === null) colorVariations[key].modelUrl = "";
        });
        
        // Update UI to show the restored color
        setTimeout(() => { 
          updateMainColorUI(); 
          updateColorVariationsUI(); 
          // Update color picker UI to reflect loaded color
          const colorNameInput = document.getElementById('pa-color-name');
          const colorPicker = document.getElementById('pa-custom-color-picker');
          if(colorNameInput) colorNameInput.value = customColorName;
          if(colorPicker && selectedColorHex) colorPicker.value = selectedColorHex;
        }, 100);  // Delay to ensure DOM is ready
      } else {
        // New product - initialize main color UI
        setTimeout(() => { updateMainColorUI(); }, 100);
      }
      }
    } catch (err) {
      console.error('Failed to load colors:', err);
      Toast.warn('Failed to load colors');
    }

    // Load categories
    FirebaseService.readList('categories').then(cats => {
      const sel = document.getElementById('pa-cat');
      if(sel) {
        if (cats && cats.length > 0) {
          sel.innerHTML = '<option value="">Select a category</option>' +
            cats.map(c => `<option value="${c.name}" ${product?.category === c.id ? 'selected':''}>${c.name}</option>`).join('');
        } else {
          sel.innerHTML = '<option value="">No categories available</option>';
        }
      }
    }).catch(err => {
      console.error('Failed to load categories:', err);
      const sel = document.getElementById('pa-cat');
      if(sel) {
        sel.innerHTML = '<option value="">Error loading categories</option>';
      }
      Toast.error('Failed to load categories');
    });

    if (isEdit) {
      const titleEl = document.getElementById('pa-title');
      if(titleEl) titleEl.textContent = 'Edit Product';
      
      if (product.imageUrl) {
        try {
          const u = await FilebaseService.resolvePublicReadUrl(product.imageUrl);
          imgPreview = null; // Don't re-upload unless changed
          const imgArea = document.getElementById('img-drop-area');
          if(imgArea) imgArea.innerHTML = `<img src="${u}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--r-sm)" />`;
        } catch (e) {
          console.error('Failed to load image:', e);
        }
      }
      if (product.modelUrl) {
        try {
          const u = await FilebaseService.resolvePublicReadUrl(product.modelUrl);
          if (viewer) {
            viewer.clear();
            viewer.loadUrl(u).catch(e => console.error('Model load err:', e));
          }
        } catch (e) {
          console.error('Failed to load model URL:', e);
        }
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
                <input type="number" id="pa-qty" class="input" min="0" placeholder="0" />
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
              <div id="pa-main-color-indicator" style="margin-top:12px;padding:10px;border-radius:var(--r-sm);background:var(--bg-light);border:1px solid var(--border);display:none">
                <small style="color:var(--text-muted)">Assigned to: <span id="pa-main-color-name" style="font-weight:600"></span></small>
              </div>
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

          <div class="card">
            <div class="card-header"><h3>Color Options</h3></div>
            <div class="card-body form-group gap-4">
              <!-- Primary Color Selection -->
              <div style="background:var(--bg-light);padding:12px;border-radius:var(--r-md);border:1px solid var(--border)">
                <label class="form-label fw-600" style="margin-bottom:12px;display:block">Primary Color</label>
                
                <!-- Tab selection -->
                <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:8px">
                  <button type="button" class="pa-color-tab" data-tab="preset" onclick="window.ProductsAdd.switchColorTab('preset')" style="padding:6px 12px;border:none;background:var(--primary);color:white;border-radius:var(--r-sm);cursor:pointer;font-size:0.85rem">Presets</button>
                  <button type="button" class="pa-color-tab" data-tab="custom" onclick="window.ProductsAdd.switchColorTab('custom')" style="padding:6px 12px;border:none;background:transparent;color:var(--text);border-radius:var(--r-sm);cursor:pointer;font-size:0.85rem">Custom</button>
                </div>

                <!-- Preset Colors Tab -->
                <div id="pa-color-preset-tab" style="display:block">
                  <select id="pa-color" class="select" onchange="window.ProductsAdd.setColor(this.value)" style="width:100%">
                    <option value="">Select a preset color...</option>
                  </select>
                  <small style="color:var(--text-muted);display:block;margin-top:6px">Choose from existing colors</small>
                </div>

                <!-- Custom Color Tab -->
                <div id="pa-color-custom-tab" style="display:none">
                  <div style="display:flex;gap:12px;align-items:flex-end">
                    <div style="flex:1">
                      <label class="form-label" style="font-size:0.9rem;margin-bottom:6px;display:block">Pick Color</label>
                      <input type="color" id="pa-custom-color-picker" class="input" style="height:44px;cursor:pointer;width:100%" onchange="window.ProductsAdd.setCustomColor(this.value)" title="Pick any color" />
                    </div>
                    <div style="width:50px;height:50px;border-radius:var(--r-md);border:3px solid var(--primary);background:#808080;flex-shrink:0" id="pa-custom-color-preview"></div>
                  </div>
                  <small style="color:var(--text-muted);display:block;margin-top:6px">Pick any color to create a unique product color</small>
                </div>
              </div>

              <!-- Color Name -->
              <div>
                <label class="form-label fw-600">Display Name</label>
                <input type="text" id="pa-color-name" class="input mt-1" placeholder="e.g., Olive Green, Deep Blue" oninput="window.ProductsAdd.setColorName(this.value)" disabled />
                <small style="color:var(--text-muted);display:block;margin-top:4px">Auto-generated and customizable</small>
              </div>

              <!-- Main Color Assignment -->
              <div style="background:var(--success-light);padding:12px;border-radius:var(--r-md);border:1px solid var(--success);margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <label class="form-label fw-600" style="margin:0;color:var(--success)">Assign to Main Assets</label>
                  <button type="button" id="pa-assign-main-btn" class="btn btn-sm" style="padding:4px 12px;font-size:0.85rem;opacity:1" onclick="window.ProductsAdd.assignColorToMain()" disabled>+ Assign Selected Color</button>
                </div>
                <div id="pa-main-color-assignment" style="font-size:0.9rem;color:var(--text-muted)">
                  <p style="margin:0">No color assigned to main image and 3D model yet</p>
                </div>
              </div>
              
              <!-- Color Variations -->
              <div style="background:var(--bg-light);padding:12px;border-radius:var(--r-md);border:1px solid #283041">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                  <label class="form-label fw-600" style="margin:0">Assign to Color Variations</label>
                  <button type="button" id="pa-add-variation-btn" class="btn btn-sm" style="padding:4px 12px;font-size:0.85rem" onclick="window.ProductsAdd.addColorVariation()">+ Add Another Color</button>
                </div>
                <div id="pa-color-variations" style="min-height:60px;display:flex;flex-direction:column;gap:8px">
                  <p style="margin:0;color:var(--text-muted);font-size:0.9rem">Assign a main color first, or add variations directly</p>
                </div>
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
      FirebaseService.read(`products/${hashParams.get('id')}`).then(async p => {
        if(p) await initMap({ id: hashParams.get('id'), ...p });
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

  function setColor(color) {
    const colorNameInput = document.getElementById('pa-color-name');
    const colorPicker = document.getElementById('pa-custom-color-picker');
    const colorPreview = document.getElementById('pa-custom-color-preview');
    const assignBtn = document.getElementById('pa-assign-main-btn');
    
    if (!color) {
      selectedColor = null;
      isCustomColor = false;
      selectedColorHex = null;
      customColorName = null;
      if(colorNameInput) {
        colorNameInput.value = '';
        colorNameInput.disabled = true;
      }
      if(colorPicker) colorPicker.value = '#808080';
      if(colorPreview) colorPreview.style.background = '#808080';
      if(assignBtn) assignBtn.disabled = true;
    } else {
      selectedColor = color;
      isCustomColor = false;
      selectedColorHex = null;
      customColorName = color; // Auto-populate with preset color name
      if(colorNameInput) {
        colorNameInput.value = customColorName;
        colorNameInput.disabled = false;
      }
      if(colorPicker) colorPicker.value = '#808080';
      if(colorPreview) colorPreview.style.background = '#808080';
      if(assignBtn) assignBtn.disabled = false;
    }
    updateColorVariationsUI();
  }

  function setCustomColor(hex) {
    const colorNameInput = document.getElementById('pa-color-name');
    const colorPreview = document.getElementById('pa-custom-color-preview');
    const colorSelect = document.getElementById('pa-color');
    const assignBtn = document.getElementById('pa-assign-main-btn');
    
    selectedColor = hex;
    selectedColorHex = hex;
    isCustomColor = true;
    customColorName = getColorNameFromHex(hex); // Auto-generate name from color
    
    if(colorNameInput) {
      colorNameInput.value = customColorName;
      colorNameInput.disabled = false;
    }
    if(colorPreview) {
      colorPreview.style.background = hex;
    }
    if(colorSelect) {
      colorSelect.value = ''; // Clear preset selection
    }
    if(assignBtn) assignBtn.disabled = false;
    updateColorVariationsUI();
  }

  function setColorName(name) {
    customColorName = name.trim();
  }

  function updateMainColorUI() {
    const indicator = document.getElementById('pa-main-color-indicator');
    const colorNameSpan = document.getElementById('pa-main-color-name');
    const assignmentDiv = document.getElementById('pa-main-color-assignment');
    
    if (!mainColorName) {
      if(indicator) indicator.style.display = 'none';
      if(assignmentDiv) assignmentDiv.innerHTML = '<p style="margin:0">No color assigned to main image and 3D model yet</p>';
      return;
    }
    
    if(indicator) indicator.style.display = 'block';
    if(colorNameSpan) colorNameSpan.textContent = mainColorName;
    
    const hexDisplay = mainColorHex || '#808080';
    let assignmentHTML = `<div style="display:flex;align-items:center;gap:8px">`;
    assignmentHTML += `<div style="width:20px;height:20px;border-radius:50%;border:2px solid var(--success);background:${hexDisplay}"></div>`;
    assignmentHTML += `<span>${mainColorName}</span>`;
    assignmentHTML += `<button type="button" onclick="window.ProductsAdd.clearMainColorAssignment()" style="margin-left:auto;background:none;border:none;color:var(--danger);cursor:pointer;padding:4px 8px;font-size:0.9rem">Clear</button>`;
    assignmentHTML += '</div>';
    if(assignmentDiv) assignmentDiv.innerHTML = assignmentHTML;
  }

  function assignColorToMain() {
    if (!selectedColor || !customColorName) {
      Toast.warn('Please select a color first');
      return;
    }
    
    mainColorName = customColorName;
    mainColorHex = selectedColorHex;
    mainIsCustomColor = isCustomColor;
    
    Toast.success(`Assigned "${customColorName}" to main image and 3D model`);
    updateMainColorUI();
  }

  function clearMainColorAssignment() {
    mainColorName = null;
    mainColorHex = null;
    mainIsCustomColor = false;
    Toast.info('Cleared main color assignment');
    updateMainColorUI();
  }

  function switchColorTab(tab) {
    const presetTab = document.getElementById('pa-color-preset-tab');
    const customTab = document.getElementById('pa-color-custom-tab');
    const tabs = document.querySelectorAll('.pa-color-tab');
    
    tabs.forEach(t => {
      if (t.dataset.tab === tab) {
        t.style.background = 'var(--primary)';
        t.style.color = 'white';
      } else {
        t.style.background = 'transparent';
        t.style.color = 'var(--text)';
      }
    });
    
    presetTab.style.display = tab === 'preset' ? 'block' : 'none';
    customTab.style.display = tab === 'custom' ? 'block' : 'none';
  }

  function getSafeDomId(value) {
    return encodeURIComponent(value).replace(/%/g, '_');
  }

  function bindVariationUploadHandlers() {
    if (variationUploadBindingsReady) return;
    const container = document.getElementById('pa-color-variations');
    if (!container) return;

    container.addEventListener('change', (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLInputElement)) return;
      const variationKey = target.dataset.variation ? decodeURIComponent(target.dataset.variation) : '';
      if (!variationKey || !colorVariations[variationKey]) return;

      const file = target.files?.[0];
      if (!file) return;

      if (target.dataset.type === 'image') {
        if (!file.type || !file.type.startsWith('image/')) {
          Toast.error('Please select a valid image file for the variation.');
          target.value = '';
          return;
        }
        colorVariations[variationKey]._imageFile = file;
        colorVariations[variationKey].imageUrl = '';
        Toast.success(`Image selected for ${variationKey}`);
      } else if (target.dataset.type === 'model') {
        if (!file.name.match(/\.(glb|gltf|obj)$/i)) {
          Toast.error('Please select a valid 3D model (.glb, .gltf, .obj) for the variation.');
          target.value = '';
          return;
        }
        colorVariations[variationKey]._modelFile = file;
        colorVariations[variationKey].modelUrl = '';
        Toast.success(`3D model selected for ${variationKey}`);
      }
      updateColorVariationsUI();
    });

    variationUploadBindingsReady = true;
  }

  function pickVariationFile(variationName, type) {
    const safeId = getSafeDomId(variationName);
    const input = document.getElementById(`pa-variation-${type}-${safeId}`);
    if (input) input.click();
  }

  function variationAssetStatus(variationData) {
    const hasImage = !!(variationData.imageUrl || variationData._imageFile);
    const hasModel = !!(variationData.modelUrl || variationData._modelFile);
    return {
      hasImage,
      hasModel,
      label: `Image: ${hasImage ? 'Ready' : 'Missing'} | 3D: ${hasModel ? 'Ready' : 'Missing'}`
    };
  }

  function updateColorVariationsUI() {
    const container = document.getElementById('pa-color-variations');
    if (!container) return;
    bindVariationUploadHandlers();

    if (!selectedColor) {
      container.innerHTML = '<p style="margin:0;color:var(--text-muted);font-size:0.9rem">Select primary color first</p>';
      return;
    }

    const variations = Object.entries(colorVariations);
    
    if (variations.length === 0) {
      container.innerHTML = '<p style="margin:0;color:var(--text-muted);font-size:0.9rem;font-style:italic">No variations added yet. Click "+ Add" to add color variations.</p>';
      return;
    }

    let html = '<div style="display:flex;flex-direction:column;gap:8px">';
    variations.forEach(([colorName, colorData]) => {
      const colorHex = colorData._hex || '#808080'; // Use internal _hex for display only
      const safeColorId = getSafeDomId(colorName);
      const variationKey = encodeURIComponent(colorName);
      const status = variationAssetStatus(colorData);
      
      html += `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:10px;border-radius:var(--r-sm);background:var(--primary-light);border:1px solid var(--primary)">
          <div style="width:24px;height:24px;border-radius:50%;border:2px solid var(--border);background:${colorHex};flex-shrink:0;margin-top:2px"></div>
          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
            <div style="font-size:0.9rem;font-weight:600">${colorName}</div>
            <div style="font-size:0.8rem;color:var(--text-muted)">${colorHex}</div>
            <div style="font-size:0.78rem;color:${status.hasImage && status.hasModel ? 'var(--success)' : 'var(--warning)'}">${status.label}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button type="button" class="btn btn-sm" style="padding:4px 8px;font-size:0.75rem" onclick="window.ProductsAdd.pickVariationFile('${colorName.replace(/'/g, "\\'")}', 'image')">${colorData._imageFile ? 'Replace' : 'Upload'} Image</button>
              <button type="button" class="btn btn-sm" style="padding:4px 8px;font-size:0.75rem" onclick="window.ProductsAdd.pickVariationFile('${colorName.replace(/'/g, "\\'")}', 'model')">${colorData._modelFile ? 'Replace' : 'Upload'} 3D</button>
            </div>
            <input type="file" id="pa-variation-image-${safeColorId}" data-variation="${variationKey}" data-type="image" accept="image/*" class="hidden" />
            <input type="file" id="pa-variation-model-${safeColorId}" data-variation="${variationKey}" data-type="model" accept=".glb,.gltf,.obj" class="hidden" />
          </div>
          <button type="button" onclick="window.ProductsAdd.removeColorVariation('${colorName.replace(/'/g, "\\'")}')" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px 8px;font-size:1.2rem" title="Remove">×</button>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function addColorVariation() {
    if (!selectedColor) {
      Toast.warn('Please select a color first');
      return;
    }

    // Ensure we always have a usable display name for the variation.
    const baseVariationName = (customColorName || selectedColor || '').trim();
    if (!baseVariationName) {
      Toast.warn('Please select a valid color first');
      return;
    }

    const selectedVariationHex = (selectedColorHex || availableColors[selectedColor] || '#808080').toUpperCase();
    
    // Check if this color is already assigned to main
    if (mainColorName === baseVariationName) {
      Toast.info('This color is already assigned to the main image and 3D model');
      return;
    }
    
    const hasSameHexVariation = Object.values(colorVariations).some(variation => {
      const variationHex = (variation?._hex || '#808080').toUpperCase();
      return variationHex === selectedVariationHex;
    });
    if (hasSameHexVariation) {
      Toast.info('A variation with the same color hex already exists');
      return;
    }

    // Generate unique variation name
    let variationName = baseVariationName;
    let counter = 1;
    while (colorVariations[variationName]) {
      variationName = `${baseVariationName} Variant ${counter}`;
      counter++;
    }

    // Store variation - keep hex for display only, not for Firebase
    colorVariations[variationName] = {
      _hex: selectedVariationHex, // Internal use only for UI display
      imageUrl: "",
      modelUrl: ""
    };

    Toast.success(`Added ${variationName}`);
    updateColorVariationsUI();
  }

  function removeColorVariation(colorKey) {
    if (colorVariations[colorKey]) {
      delete colorVariations[colorKey];
      Toast.info(`Removed ${colorKey}`);
      updateColorVariationsUI();
    }
  }

  async function saveProduct(status) {
    const btn = event.currentTarget;
    const origTxt = btn.textContent;
    btn.disabled = true; btn.textContent = 'Saving...';

    try {
      // Validate - with null checks
      const nameEl = document.getElementById('pa-name');
      const priceEl = document.getElementById('pa-price');
      const descEl = document.getElementById('pa-desc');
      const catEl = document.getElementById('pa-cat');
      const qtyEl = document.getElementById('pa-qty');
      const stockEl = document.getElementById('pa-stock');
      const featEl = document.getElementById('pa-feat');
      
      if (!nameEl || !priceEl) throw new Error('Form elements not found');
      
      const name = nameEl.value.trim();
      const price = parseFloat(priceEl.value) || 0;
      if(!name) throw new Error('Product Name is required');
      if(price <= 0) throw new Error('Valid base price is required');
      
      // Require either main color or variations
      const hasMainColor = !!mainColorName;
      const hasVariations = Object.keys(colorVariations).length > 0;
      if (!hasMainColor && !hasVariations) {
        throw new Error('Please assign a main color or add color variations');
      }

      let modelUrlRes = undefined;
      let imageUrlRes = undefined;

      // Uploads - main image and model
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

      // For published products with main color, enforce main assets
      if (status === 'published' && hasMainColor) {
        if (!imageUrlRes && !editId) {
          throw new Error(`Main color "${mainColorName}" requires a primary image before publishing`);
        }
        if (!modelUrlRes && !editId) {
          throw new Error(`Main color "${mainColorName}" requires a 3D model before publishing`);
        }
      }

      btn.textContent = 'Writing Database...';
      const id = editId || FirebaseService.newKey('products');

      const disc = parseFloat(document.getElementById('pa-discount')?.value || '0') || 0;
      const discStr = disc > 0 ? disc + '%' : '0';

      // Add main color to presets if it doesn't exist
      if (hasMainColor && mainIsCustomColor && mainColorHex && !(mainColorName in availableColors)) {
        btn.textContent = 'Adding Color to Presets...';
        const sanitizedMainColorName = sanitizeFirebaseKey(mainColorName);
        availableColors[sanitizedMainColorName] = mainColorHex;
        await FirebaseService.update('colors', { [sanitizedMainColorName]: mainColorHex });
      }

      // Build clean variation payload without _hex and with sanitized keys
      let cleanVariations = {};
      let missingVariationColors = {};
      if (hasVariations) {
        Object.entries(colorVariations).forEach(([colorName, colorData]) => {
          const sanitizedKey = sanitizeFirebaseKey(colorName);
          cleanVariations[sanitizedKey] = {
            imageUrl: colorData.imageUrl || "",
            modelUrl: colorData.modelUrl || ""
          };

          // Auto-register variation colors to shared color presets
          const variationHex = (colorData?._hex || '').toUpperCase();
          if (variationHex && !(sanitizedKey in availableColors)) {
            missingVariationColors[sanitizedKey] = variationHex;
            availableColors[sanitizedKey] = variationHex;
          }
        });
      }

      if (Object.keys(missingVariationColors).length > 0) {
        btn.textContent = 'Updating Color Presets...';
        await FirebaseService.update('colors', missingVariationColors);
      }

      // Upload variation assets and enforce publish validation
      if (hasVariations) {
        btn.textContent = 'Uploading Variation Assets...';
        for (const [colorName, colorData] of Object.entries(colorVariations)) {
          const sanitizedKey = sanitizeFirebaseKey(colorName);
          const cleanVariation = cleanVariations[sanitizedKey];
          if (!cleanVariation) continue;

          if (colorData._imageFile) {
            const variationImageUpload = await FilebaseService.uploadFile(colorData._imageFile, PRODUCT_IMAGE_FOLDER);
            cleanVariation.imageUrl = variationImageUpload.key;
            colorData.imageUrl = variationImageUpload.key;
            delete colorData._imageFile;
          }
          if (colorData._modelFile) {
            const variationModelUpload = await FilebaseService.uploadFile(colorData._modelFile, PRODUCT_MODEL_FOLDER);
            cleanVariation.modelUrl = variationModelUpload.key;
            colorData.modelUrl = variationModelUpload.key;
            delete colorData._modelFile;
          }

          if (status === 'published' && (!cleanVariation.imageUrl || !cleanVariation.modelUrl)) {
            throw new Error(`Variation "${colorName}" must have both image and 3D model before publishing`);
          }
        }
      }

      const updatePayload = {
        name,
        price,
        description: descEl?.value.trim() || '',
        category: catEl?.value || '',
        quantity: parseInt(qtyEl?.value || '0') || 0,
        inStock: !!stockEl?.checked,
        discount: discStr,
        isFavorite: !!featEl?.checked,
        status: status
      };

      // Store main color info
      if (hasMainColor) {
        updatePayload.color = mainColorName;
        updatePayload.isCustomColor = mainIsCustomColor;
        if (mainIsCustomColor && mainColorHex) {
          updatePayload.colorHex = mainColorHex;
        }
      }

      // Store variations
      if (hasVariations) {
        updatePayload.variation = cleanVariations;
      }

      // Store main image and model
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
    selectedColor = null;
    selectedColorHex = null;
    customColorName = null;
    isCustomColor = false;
    colorVariations = {};
    variationUploadBindingsReady = false;
    mainColorName = null;
    mainColorHex = null;
    mainIsCustomColor = false;
  }

  return { mount, unmount, toggleWireframe, resetCam, saveProduct, setColor, setCustomColor, setColorName, switchColorTab, updateMainColorUI, assignColorToMain, clearMainColorAssignment, addColorVariation, removeColorVariation, pickVariationFile };
})();
