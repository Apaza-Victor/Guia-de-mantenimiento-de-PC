/* ============================================================
   TECHGUIDE - home3d.js (solo index.html)
   Fondo 3D tematizado + interactivo (Three.js):
   - constelacion interactiva de nodos (reacciona al cursor)
   - placa base 3D (modelo OBJ con texturas) en rotacion 360
   - Raycaster: el cursor resalta piezas y muestra etiquetas
   - parallax, adaptacion al tema y reduced-motion
   ============================================================ */

(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('hero3d');
  if (!canvas) return;
  const host = canvas.parentElement;

  const isDark = () => (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GSAP = window.gsap && !reduceMotion ? window.gsap : null;

  const C = {
    line: '#39d0d8', glow: '#00d4aa', accent: '#6c63ff',
    dark: '#14161c', chip: '#2a2d36', gold: '#c9a45c',
    pcb: '#0f7a4d', metal: '#8b93a1'
  };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 500);
  camera.position.set(0, 0, 32);

  const group = new THREE.Group();
  scene.add(group);

  /* === LUCES (para el modelo OBJ con materiales Phong) === */
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(12, 18, 20);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x88ccff, 0.35);
  fillLight.position.set(-10, 4, -14);
  scene.add(fillLight);

  function box(w, h, d, color, o) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial(Object.assign({ color }, o))); }

  /* === SPRITES DE GLOW === */
  function makeGlowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  const glowMap = makeGlowTexture();
  const glowMats = [];
  function trackGlow(mat, darkColor, lightColor) { glowMats.push({ mat, darkColor, lightColor }); }
  function sprite(color, size, opacity) {
    const mat = new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.scale.set(size, size, 1);
    return s;
  }

  /* === CONSTELACION INTERACTIVA (nodos + lineas) === */
  const MAX_NODES = 110;
  const LINK_D2 = 26;
  const cGeo = new THREE.BufferGeometry();
  const cPos = new Float32Array(MAX_NODES * MAX_NODES * 3);
  cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
  cGeo.setDrawRange(0, 0);
  const cMat = new THREE.LineBasicMaterial({ color: C.line, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending });
  const cLines = new THREE.LineSegments(cGeo, cMat);
  group.add(cLines);
  trackGlow(cMat, C.line, '#0e7490');
  const nodes = [];
  (function buildConstellation() {
    const aspect = (window.innerWidth / window.innerHeight) || 1.5;
    const halfFov = (70 * Math.PI) / 360;
    for (let i = 0; i < MAX_NODES; i++) {
      const z = -20 - Math.random() * 28;
      const halfH = Math.tan(halfFov) * (32 - z) * 1.2;
      const halfW = halfH * aspect;
      const sp = sprite(C.accent, 0.5 + Math.random() * 0.9, 0.9);
      const n = {
        sp,
        x: (Math.random() - 0.5) * 2 * halfW,
        y: (Math.random() - 0.5) * 2 * halfH,
        z,
        x0: 0, y0: 0, z0: 0,
        vx: 0, vy: 0, vz: 0,
        ph: Math.random() * Math.PI * 2,
        sz: 0.5 + Math.random() * 0.9
      };
      n.x0 = n.x; n.y0 = n.y; n.z0 = n.z;
      group.add(sp);
      trackGlow(sp.material, C.accent, '#5b52e0');
      nodes.push(n);
    }
  })();

  /* === HOVER (RAYCASTER) === */
  const hoverMeshes = [];
  function tagHover(obj, name, owner) {
    obj.userData.hoverName = name;
    obj.userData.hoverOwner = owner || obj;
    hoverMeshes.push(obj);
  }
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-2, -2);
  const _c = new THREE.Vector3();
  const _s = new THREE.Vector3();
  const outline = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: C.line }));
  outline.visible = false;
  scene.add(outline);
  const label = document.createElement('div');
  label.className = 'hero3d-label';
  label.style.display = 'none';
  document.body.appendChild(label);

  /* === PLACA BASE 3D (lado derecho) === */
  const board = new THREE.Group();
  scene.add(board);
  let boardReady = false;
  let boardBaseY = -0.5;

  function centerModel(obj) {
    const b = new THREE.Box3().setFromObject(obj);
    const c = b.getCenter(new THREE.Vector3());
    obj.position.x -= c.x;
    obj.position.y -= c.y;
    obj.position.z -= c.z;
  }

  function applyTextures(obj, path) {
    const texLoader = new THREE.TextureLoader();
    texLoader.setPath(path);
    const mainTex = texLoader.load('Textures/p4sba-mb.jpg');
    mainTex.colorSpace = THREE.SRGBColorSpace;
    const ps2Tex = texLoader.load('Textures/mb-ps-2.png');
    ps2Tex.colorSpace = THREE.SRGBColorSpace;
    const mats = [];
    obj.traverse((child) => {
      if (child.isMesh) {
        (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => { if (m) mats.push(m); });
      }
    });
    mats.forEach((m) => {
      if (m.name === 'Material__148') {
        m.map = mainTex;
        m.color.set(0xffffff);
      } else if (m.name === 'Material__147') {
        m.map = ps2Tex;
        m.color.set(0xffffff);
      }
      if (m.needsUpdate !== undefined) m.needsUpdate = true;
    });
  }

  function onModelLoad(obj) {
    obj.traverse((child) => {
      if (child.isMesh) {
        tagHover(child, 'Placa base (Motherboard)', board);
      }
    });
    applyTextures(obj, 'assets/models/placa-base/');
    centerModel(obj);
    const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    const scale = 12 / size.x;
    obj.scale.setScalar(scale);
    obj.rotation.x = -0.5;
    obj.rotation.z = 0.2;
    board.add(obj);
    boardReady = true;
  }

  function onModelError(err) {
    console.error('No se pudo cargar la placa base:', err);
  }

  if (typeof THREE.MTLLoader === 'function' && typeof THREE.OBJLoader === 'function') {
    const path = 'assets/models/placa-base/';
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath(path);
    mtlLoader.load('Motherboard.mtl', (materials) => {
      materials.preload();
      const objLoader = new THREE.OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load(path + 'Motherboard.obj', onModelLoad, undefined, onModelError);
    }, undefined, onModelError);
  }

  /* === TEMA (claro / oscuro) === */
  function applyTheme() {
    const dark = isDark();
    glowMats.forEach(t => {
      t.mat.color.set(dark ? t.darkColor : t.lightColor);
      t.mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    });
    outline.material.color.set(dark ? C.line : '#0e7490');
  }
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* === RESIZE === */
  let viewW = 0, viewH = 0;
  function resize() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    viewW = w; viewH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const aspect = w / h;
    board.visible = aspect >= 1.15;
    board.position.set(Math.min(16, aspect * 5.2 + 5), -0.5, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  /* === PARALLAX + PUNTERO (raycaster) === */
  const target = { x: 0, y: 0 };
  if (!reduceMotion) {
    host.addEventListener('mousemove', (e) => {
      const r = host.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 5;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 3;
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    });
    host.addEventListener('pointerleave', () => { ndc.set(-2, -2); });
  }

  /* === LOOP DE ANIMACION === */
  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();
    group.rotation.y += 0.0008;
    group.rotation.x = Math.sin(t * 0.0004) * 0.06;
    camera.position.x += (target.x - camera.position.x) * 0.04;
    camera.position.y += (target.y - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    /* Constelacion: nodos orbitan su base y se alejan del cursor */
    const posArr = cGeo.attributes.position.array;
    let lineCount = 0;
    const rayActive = ndc.x > -2;
    for (let i = 0; i < MAX_NODES; i++) {
      const n = nodes[i];
      n.vx += (n.x0 + Math.sin(t * 0.18 + n.ph) * 1.6 - n.x) * 0.0012;
      n.vy += (n.y0 + Math.cos(t * 0.14 + n.ph) * 1.3 - n.y) * 0.0012;
      if (rayActive) {
        const tM = (n.z - raycaster.ray.origin.z) / raycaster.ray.direction.z;
        const mx = raycaster.ray.origin.x + raycaster.ray.direction.x * tM;
        const my = raycaster.ray.origin.y + raycaster.ray.direction.y * tM;
        const dxm = n.x - mx, dym = n.y - my;
        const d2m = dxm * dxm + dym * dym;
        if (d2m < 64 && d2m > 0.01) {
          const d = Math.sqrt(d2m);
          const f = ((8 - d) / d) * 0.02;
          n.vx += dxm * f; n.vy += dym * f;
        }
      }
      n.x += n.vx; n.y += n.vy;
      n.vx *= 0.95; n.vy *= 0.95;
      const pulse = 1 + Math.sin(t * 2.2 + n.ph) * 0.12;
      n.sp.position.set(n.x, n.y, n.z);
      n.sp.scale.set(n.sz * pulse, n.sz * pulse, 1);
      n.sp.material.opacity = 0.7 + Math.sin(t * 1.6 + n.ph) * 0.25;
    }
    for (let i = 0; i < MAX_NODES && lineCount < MAX_NODES * 6; i++) {
      for (let j = i + 1; j < MAX_NODES; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
        if (dx * dx + dy * dy + dz * dz < LINK_D2) {
          const o = lineCount * 6;
          posArr[o] = a.x; posArr[o + 1] = a.y; posArr[o + 2] = a.z;
          posArr[o + 3] = b.x; posArr[o + 4] = b.y; posArr[o + 5] = b.z;
          lineCount++;
        }
      }
    }
    cGeo.setDrawRange(0, lineCount * 2);
    cGeo.attributes.position.needsUpdate = true;
    cGeo.computeBoundingSphere();
    cMat.opacity = 0.4 + Math.sin(t * 0.9) * 0.15;

    if (boardReady) {
      board.rotation.y += 0.006;
      board.position.y = boardBaseY + Math.sin(t * 0.8) * 0.8;
    }

    /* Raycaster hover */
    raycaster.setFromCamera(ndc, camera);
    let hover = null;
    const hits = raycaster.intersectObjects(hoverMeshes, true);
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.hoverOwner) { hover = o; break; }
        o = o.parent;
      }
      if (hover) break;
    }
    if (hover) {
      const owner = hover.userData.hoverOwner;
      const bb = new THREE.Box3().setFromObject(owner);
      bb.getSize(_s);
      bb.getCenter(_c);
      outline.position.copy(_c);
      outline.scale.copy(_s);
      outline.visible = true;
      const p = _c.project(camera);
      if (p.z < 1) {
        label.style.display = 'block';
        label.textContent = hover.userData.hoverName;
        label.style.left = ((p.x * 0.5 + 0.5) * viewW) + 'px';
        label.style.top = ((-p.y * 0.5 + 0.5) * viewH) + 'px';
      }
    } else {
      outline.visible = false;
      label.style.display = 'none';
    }

    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(animate);
  }
  animate();
})();
