/* model-viewer.js — Three.js 3D preview using window.THREE globals */
const ModelViewer = (() => {
  function create(container, options = {}) {
    if (!window.THREE) { container.innerHTML = '<p style="color:#fff;padding:20px;text-align:center">Three.js not loaded</p>'; return null; }
    const T = window.THREE;
    const w = container.clientWidth  || 400;
    const h = options.height || 240;

    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const scene  = new T.Scene();
    scene.background = new T.Color(0x1a1a2e);
    const camera = new T.PerspectiveCamera(45, w / h, 0.01, 1000);
    camera.position.set(0, 1.2, 3);

    const ambient = new T.AmbientLight(0xffffff, 0.6);
    const dir1    = new T.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 10, 5);
    const dir2    = new T.DirectionalLight(0x4488ff, 0.3);
    dir2.position.set(-5, 5, -5);
    scene.add(ambient, dir1, dir2);

    const grid = new T.GridHelper(10, 20, 0x334466, 0x222244);
    scene.add(grid);

    let controls = null;
    if (T.OrbitControls) {
      controls = new T.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; controls.dampingFactor = 0.08;
      controls.minDistance = 0.3; controls.maxDistance = 50;
    }

    let animId = null;
    function animate() {
      animId = requestAnimationFrame(animate);
      if (controls) controls.update();
      renderer.render(scene, camera);
    }
    animate();

    function fitCamera(object) {
      const box = new T.Box3().setFromObject(object);
      const size   = box.getSize(new T.Vector3());
      const center = box.getCenter(new T.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov    = camera.fov * (Math.PI / 180);
      let dist = Math.abs(maxDim / Math.sin(fov / 2)) * 0.6;
      dist = Math.max(dist, 0.5);
      camera.position.set(center.x, center.y + size.y * 0.3, center.z + dist);
      camera.lookAt(center);
      if (controls) { controls.target.copy(center); controls.update(); }
    }

    function loadGLTF(url) {
      return new Promise((resolve, reject) => {
        if (!T.GLTFLoader) { reject(new Error('GLTFLoader not available')); return; }
        const loader = new T.GLTFLoader();
        loader.load(url, gltf => {
          scene.add(gltf.scene);
          fitCamera(gltf.scene);
          resolve(gltf.scene);
        }, undefined, reject);
      });
    }

    function loadOBJ(url) {
      return new Promise((resolve, reject) => {
        if (!T.OBJLoader) { reject(new Error('OBJLoader not available')); return; }
        const loader = new T.OBJLoader();
        loader.load(url, obj => {
          scene.add(obj);
          fitCamera(obj);
          resolve(obj);
        }, undefined, reject);
      });
    }

    function loadFile(file) {
      const url = URL.createObjectURL(file);
      const ext = file.name.split('.').pop().toLowerCase();
      const p   = ext === 'obj' ? loadOBJ(url) : loadGLTF(url);
      return p.finally(() => URL.revokeObjectURL(url));
    }

    function loadUrl(url) {
      const ext = url.split('.').pop().split('?')[0].toLowerCase();
      return ext === 'obj' ? loadOBJ(url) : loadGLTF(url);
    }

    function setWireframe(on) {
      scene.traverse(c => {
        if (c.isMesh && c.material) {
          if (Array.isArray(c.material)) c.material.forEach(m => m.wireframe = on);
          else c.material.wireframe = on;
        }
      });
    }

    function resetCamera() {
      camera.position.set(0, 1.2, 3);
      camera.lookAt(0, 0, 0);
      if (controls) { controls.target.set(0,0,0); controls.update(); }
    }

    function clear() {
      scene.children.slice().forEach(c => {
        if (c !== ambient && c !== dir1 && c !== dir2 && c !== grid) scene.remove(c);
      });
    }

    function destroy() {
      cancelAnimationFrame(animId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    }

    function resize() {
      const nw = container.clientWidth;
      renderer.setSize(nw, h);
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
    }

    return { loadFile, loadUrl, setWireframe, resetCamera, clear, destroy, resize, scene, camera, renderer };
  }

  return { create };
})();
