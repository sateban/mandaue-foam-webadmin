/* products-media.js */
window.ProductsMedia = (() => {
  let files = [];

  function mount(container) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Product Media</h1>
        <div class="flex items-center gap-3">
          <span class="text-sm text-muted" id="media-count">Loading...</span>
          <button class="btn btn-primary" onclick="window.ProductsMedia.uploadModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg> 
            Upload File
          </button>
        </div>
      </div>

      <div class="media-grid" id="media-grid">
        <div class="skeleton" style="height:160px;"></div>
        <div class="skeleton" style="height:160px;"></div>
        <div class="skeleton" style="height:160px;"></div>
        <div class="skeleton" style="height:160px;"></div>
      </div>
    `;

    loadFiles();
  }

  async function loadFiles() {
    try {
      files = await FilebaseService.listFiles('assets/');
      renderList();
    } catch(e) {
      Toast.error('Failed to load media: ' + e.message);
      document.getElementById('media-grid').innerHTML = `<div class="empty-state" style="grid-column: 1/-1"><p class="text-danger">${e.message}</p></div>`;
    }
  }

  function renderList() {
    const grid = document.getElementById('media-grid');
    if (!grid) return;

    // Filter out trailing slash dirs
    const valid = files.filter(f => f.key && !f.key.endsWith('/') && f.size > 0);
    valid.sort((a,b) => new Date(b.lastModified) - new Date(a.lastModified)); // newest first

    document.getElementById('media-count').textContent = `${valid.length} files`;

    if (valid.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1">
        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        <h4>No media files found</h4>
        <p>Upload images or 3D models to the Filebase bucket.</p>
      </div>`;
      return;
    }

    grid.innerHTML = valid.map(f => {
      const ext = f.key.split('.').pop().toLowerCase();
      const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext);
      const is3D = ['glb','gltf','obj'].includes(ext);
      
      const parts = f.key.split('/');
      const name = parts[parts.length-1];
      const kb = (f.size / 1024).toFixed(1);

      let thumb = `<svg class="media-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
      if (isImg) thumb = `<img src="${f.url}" loading="lazy" />`;
      if (is3D) thumb = `<svg class="media-thumb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg><div class="media-3d-badge">3D</div>`;

      return `
        <div class="media-item" onclick="window.ProductsMedia.viewFile('${f.url}', '${name}', '${ext}')">
          <div class="media-thumb">${thumb}</div>
          <div class="media-info">
            <div class="media-info-name truncate" title="${name}">${name}</div>
            <div class="media-info-meta">${kb} KB • ${ext.toUpperCase()}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function viewFile(url, name, ext) {
    const is3D = ['glb','gltf','obj'].includes(ext);
    const isImg = ['jpg','jpeg','png','gif','webp'].includes(ext);

    let body = `<div style="text-align:center;padding:20px;color:var(--muted)">Preview not available for .${ext} files</div>`;
    if (isImg) {
      body = `<div style="display:flex;justify-content:center;background:var(--bg);border-radius:var(--r-sm);padding:20px;">
                <img src="${url}" style="max-height:60vh;border-radius:var(--r-sm);box-shadow:var(--shadow);" />
              </div>`;
    } else if (is3D) {
      body = `<div id="media-viewer-container" style="height:60vh;border-radius:var(--r-sm);overflow:hidden;background:#1a1a2e;position:relative;"></div>`;
    }

    Modal.open({
      title: name,
      size: 'modal-lg',
      body,
      footer: `
        <input type="text" class="input" value="${url}" readonly onclick="this.select();Toast.success('URL Copied');document.execCommand('copy')" style="flex:1" />
        <button class="btn btn-outline" onclick="window.open('${url}','_blank')">Download</button>
        <button class="btn btn-danger" onclick="window.ProductsMedia.deleteFile('${url}')">Delete</button>
      `,
      onOpen: (box) => {
        if (is3D) {
          const c = document.getElementById('media-viewer-container');
          const viewer = ModelViewer.create(c, { height: c.clientHeight });
          if(viewer) {
            viewer.loadUrl(url).catch(e => {
              c.innerHTML = `<p style="color:#ef4444;padding:20px;text-align:center">Failed to load model:<br/>${e.message}</p>`;
            });
            // Cleanup on close wrapper
            const closeBtn = document.getElementById('modal-close-btn');
            const orig = closeBtn.onclick;
            closeBtn.onclick = (e) => { viewer.destroy(); if(orig) orig(e); };
          }
        }
      }
    });
  }

  function deleteFile(url) {
    // Extract key from URL
    const { bucketName } = CONFIG.filebase;
    const prefix = `https://${bucketName}.s3.filebase.com/`;
    if (!url.startsWith(prefix)) return Toast.error('Invalid URL');
    const key = decodeURIComponent(url.replace(prefix, ''));

    Modal.confirm({
      title: 'Delete Media',
      message: 'Are you sure you want to permanently delete this file? Any associated products may lose their images/models.',
      danger: true,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await FilebaseService.deleteFile(key);
          Toast.success('File deleted');
          Modal.close();
          loadFiles();
        } catch(e) {
          Toast.error(e.message);
        }
      }
    });
  }

  function uploadModal() {
    Modal.open({
      title: 'Upload Media',
      body: `
        <div class="dropzone" id="media-dropzone" onclick="document.getElementById('media-upload-input').click()">
          <svg class="dropzone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          <p>Drag and drop a file, or <strong>browse</strong></p>
          <small>Supports JPG, PNG, WEBP, GLB, OBJ (Max 50MB)</small>
        </div>
        <input type="file" id="media-upload-input" class="hidden" accept=".jpg,.jpeg,.png,.webp,.glb,.gltf,.obj" />
        <div id="media-upload-prog" class="hidden mt-3 text-center text-sm text-primary fw-600">Uploading...</div>
      `
    });

    const dropzone = document.getElementById('media-dropzone');
    const input = document.getElementById('media-upload-input');
    
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('media-upload-prog').classList.remove('hidden');
      dropzone.style.display = 'none';
      try {
        const folder = file.name.match(/\.(glb|gltf|obj)$/i) ? 'assets/models' : 'assets/images';
        await FilebaseService.uploadFile(file, folder);
        Toast.success('File uploaded');
        Modal.close();
        loadFiles();
      } catch(err) {
        Toast.error(err.message);
        dropzone.style.display = 'block';
        document.getElementById('media-upload-prog').classList.add('hidden');
      }
    });

    // drag-drop
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
    dropzone.addEventListener('dragleave', e => { e.preventDefault(); dropzone.classList.remove('drag-over'); });
    dropzone.addEventListener('drop', e => {
      e.preventDefault(); dropzone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) {
        input.files = e.dataTransfer.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  }

  return { mount, unmount: () => {}, viewFile, deleteFile, uploadModal };
})();
