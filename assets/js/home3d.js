/* ============================================================
   TECHGUIDE - home3d.js (solo index.html)
   Fondo 3D tematizado + interactivo (Three.js):
   - constelacion interactiva de nodos (reacciona al cursor)
   - anillos orbitales + particulas de energia
   - parallax, adaptacion al tema y reduced-motion
   ============================================================ */

(function () {
  if (typeof THREE === 'undefined') return;

  const canvas = document.getElementById('hero3d');
  if (!canvas) return;
  const host = canvas.parentElement;

  const isDark = () => (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  /* === LUCES === */
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(12, 18, 20);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x88ccff, 0.35);
  fillLight.position.set(-10, 4, -14);
  scene.add(fillLight);

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

  /* === ANILLOS ORBITALES + NUCLEO === */
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);
  const ringObjs = [];
  function buildRings() {
    const orbitCount = 3;
    const geom = new THREE.RingGeometry(2.6, 2.72, 90);
    for (let i = 0; i < orbitCount; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: C.accent,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ring = new THREE.Mesh(geom, mat);
      ring.scale.set(1 + i * 0.7, 1 + i * 0.7, 1);
      ring.rotation.x = 1.35 + i * 0.35;
      ring.rotation.z = i * 0.9;
      ringGroup.add(ring);
      ringObjs.push(ring);
      trackGlow(mat, C.accent, '#5b52e0');
    }
    const coreMat = new THREE.MeshBasicMaterial({
      color: C.glow,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 1), coreMat);
    ringGroup.add(core);
    ringObjs.push(core);
    trackGlow(coreMat, C.glow, '#0e7490');
    const orbitDots = [];
    for (let i = 0; i < orbitCount; i++) {
      const dot = sprite(C.glow, 0.7, 0.9);
      ringGroup.add(dot);
      orbitDots.push({ sp: dot, radius: 1 + i * 0.7, ph: i * 1.1 });
    }
    ringGroup.userData.orbitDots = orbitDots;
    ringGroup.position.set(0, 0, 4);
  }
  buildRings();

  /* === TEMA (claro / oscuro) === */
  function applyTheme() {
    const dark = isDark();
    glowMats.forEach(t => {
      t.mat.color.set(dark ? t.darkColor : t.lightColor);
      t.mat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    });
  }
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* === RESIZE === */
  function resize() {
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    ringGroup.visible = w >= 900;
  }
  window.addEventListener('resize', resize);
  resize();

  /* === PARALLAX === */
  const target = { x: 0, y: 0 };
  if (!reduceMotion) {
    host.addEventListener('mousemove', (e) => {
      const r = host.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 5;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 3;
    });
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
    for (let i = 0; i < MAX_NODES; i++) {
      const n = nodes[i];
      n.vx += (n.x0 + Math.sin(t * 0.18 + n.ph) * 1.6 - n.x) * 0.0012;
      n.vy += (n.y0 + Math.cos(t * 0.14 + n.ph) * 1.3 - n.y) * 0.0012;
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

    /* Nucleo + anillos orbitales */
    ringGroup.rotation.z += 0.0022;
    ringGroup.rotation.x = Math.sin(t * 0.35) * 0.22;
    const core = ringObjs[ringObjs.length - 1];
    if (core) core.rotation.y += 0.01;
    const dots = ringGroup.userData.orbitDots || [];
    dots.forEach(d => {
      const a = t * 0.9 + d.ph;
      d.sp.position.set(Math.cos(a) * d.radius, Math.sin(a) * d.radius * 0.45, 0);
      d.sp.material.opacity = 0.5 + Math.sin(t * 2.5 + d.ph) * 0.35;
    });

    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(animate);
  }
  animate();
})();
