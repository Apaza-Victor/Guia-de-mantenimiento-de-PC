/* ============================================================
   TECHGUIDE - home-babylon.js (solo index.html)
   Hero 3D interactivo con Babylon.js:
   - "nucleo tecnologico": chip flotante con partículas
   - reacciona al cursor (rotación suave) y al scroll ligero
   - adaptación al tema claro/oscuro y reduced-motion
   ============================================================ */

(function () {
  if (typeof BABYLON === 'undefined') return;

  const canvas = document.getElementById('heroBabylon');
  if (!canvas) return;

  const isDark = () => (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: false });
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

  /* === CAMARA === */
  const camera = new BABYLON.ArcRotateCamera('cam', -1.2, 1.15, 9, BABYLON.Vector3.Zero(), scene);
  camera.panningSensibility = 0;
  camera.upperBetaLimit = 1.5;
  camera.lowerBetaLimit = 0.7;
  camera.minZ = 0.1;

  /* === LUCES === */
  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0.5, 1, -0.5), scene);
  light.intensity = 0.9;
  const rim = new BABYLON.DirectionalLight('rim', new BABYLON.Vector3(-0.6, -0.2, -1), scene);
  rim.intensity = 0.8;

  const root = new BABYLON.TransformNode('root');

  /* === CHIP / PLACA PROCESADOR (procedural) === */
  const pcbMat = new BABYLON.StandardMaterial('pcb', scene);
  pcbMat.diffuseColor = new BABYLON.Color3(0.04, 0.16, 0.14);
  pcbMat.specularColor = new BABYLON.Color3(0.1, 0.4, 0.3);
  pcbMat.emissiveColor = new BABYLON.Color3(0, 0.08, 0.06);

  const board = BABYLON.MeshBuilder.CreateBox('board', { width: 2.5, height: 0.12, depth: 2 }, scene);
  board.material = pcbMat;
  board.parent = root;

  const chipMat = new BABYLON.StandardMaterial('chip', scene);
  chipMat.diffuseColor = new BABYLON.Color3(0.13, 0.15, 0.2);
  chipMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.5);
  chipMat.emissiveColor = new BABYLON.Color3(0.03, 0.03, 0.08);

  const chip = BABYLON.MeshBuilder.CreateBox('chip', { width: 0.95, height: 0.14, depth: 0.95 }, scene);
  chip.material = chipMat;
  chip.position.y = 0.13;
  chip.parent = root;

  const dieMat = new BABYLON.StandardMaterial('die', scene);
  dieMat.diffuseColor = new BABYLON.Color3(0.1, 0.45, 0.9);
  dieMat.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.4);
  dieMat.specularColor = new BABYLON.Color3(0.8, 0.8, 0.9);

  const die = BABYLON.MeshBuilder.CreateBox('die', { width: 0.55, height: 0.02, depth: 0.55 }, scene);
  die.material = dieMat;
  die.position.y = 0.21;
  die.parent = root;

  /* === COOLER / DISIPADOR flotante === */
  const finMat = new BABYLON.StandardMaterial('fin', scene);
  finMat.diffuseColor = new BABYLON.Color3(0.55, 0.58, 0.65);
  finMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
  finMat.emissiveColor = new BABYLON.Color3(0.04, 0.04, 0.05);

  const cooler = new BABYLON.TransformNode('cooler');
  cooler.position.y = 0.62;
  cooler.parent = root;
  for (let i = 0; i < 4; i++) {
    const fin = BABYLON.MeshBuilder.CreateBox('fin' + i, { width: 0.7, height: 0.06, depth: 0.7 }, scene);
    fin.material = finMat;
    fin.position.y = i * 0.1;
    fin.parent = cooler;
  }
  const fanBladeMat = new BABYLON.StandardMaterial('fan', scene);
  fanBladeMat.diffuseColor = new BABYLON.Color3(0.12, 0.5, 0.55);
  fanBladeMat.emissiveColor = new BABYLON.Color3(0.02, 0.12, 0.14);
  const fan = BABYLON.MeshBuilder.CreateDisc('fan', { radius: 0.34, tessellation: 32 }, scene);
  fan.material = fanBladeMat;
  fan.rotation.x = Math.PI / 2;
  fan.position.y = 0.46;
  fan.parent = root;

  /* === PISTAS / circuitos alrededor del chip === */
  const traceMat = new BABYLON.StandardMaterial('trace', scene);
  traceMat.diffuseColor = new BABYLON.Color3(0.8, 0.75, 0.3);
  traceMat.emissiveColor = new BABYLON.Color3(0.45, 0.4, 0.1);
  traceMat.specularColor = new BABYLON.Color3(1, 1, 1);

  const traces = [];
  const tracePoints = [
    [-0.9, -0.55], [-0.35, 0.3], [0.6, -0.7], [1.1, 0.2], [-1.1, 0.6], [0.4, 0.9]
  ];
  tracePoints.forEach((p, i) => {
    const box = BABYLON.MeshBuilder.CreateBox('trace' + i, { width: 0.05, height: 0.01, depth: Math.abs(p[1]) + 0.4 }, scene);
    box.material = traceMat;
    box.position.set(p[0], 0.07, p[1] / 2);
    box.parent = root;
    traces.push(box);
  });

  /* === CONDENSADORES / caps === */
  const capMat = new BABYLON.StandardMaterial('cap', scene);
  capMat.diffuseColor = new BABYLON.Color3(0.9, 0.85, 0.8);
  capMat.specularColor = new BABYLON.Color3(0.9, 0.9, 0.9);
  capMat.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.05);

  const capPositions = [[-1.1, 0.9], [1.15, 0.95], [-1.2, -0.85], [1.05, -0.9], [0.9, 1.05]];
  capPositions.forEach((p, i) => {
    const cap = BABYLON.MeshBuilder.CreateCylinder('cap' + i, { height: 0.2, diameter: 0.16, tessellation: 20 }, scene);
    cap.material = capMat;
    cap.position.set(p[0], 0.16, p[1]);
    cap.parent = root;
  });

  /* === PARTICULAS === */
  const particleCount = 600;

  const ptCanvas = document.createElement('canvas');
  ptCanvas.width = ptCanvas.height = 64;
  const ptCtx = ptCanvas.getContext('2d');
  const ptGrad = ptCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
  ptGrad.addColorStop(0, 'rgba(255,255,255,1)');
  ptGrad.addColorStop(0.4, 'rgba(255,255,255,.7)');
  ptGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ptCtx.fillStyle = ptGrad;
  ptCtx.fillRect(0, 0, 64, 64);
  const particleTexture = new BABYLON.Texture('data:image/png;base64,' + ptCanvas.toDataURL(), scene);
  particleTexture.hasAlpha = true;

  let particleSystem;
  try {
    particleSystem = new BABYLON.GPUParticleSystem('particles', { capacity: particleCount, randomTextureSize: 64 }, scene);
  } catch (e) {
    particleSystem = new BABYLON.ParticleSystem('particles', particleCount, scene);
  }
  particleSystem.particleTexture = particleTexture;
  particleSystem.minLifeTime = 4;
  particleSystem.maxLifeTime = 6;
  particleSystem.emitRate = 80;
  particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
  particleSystem.direction1 = new BABYLON.Vector3(-0.5, -0.5, -0.5);
  particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
  particleSystem.minEmitBox = new BABYLON.Vector3(-3, -2, -3);
  particleSystem.maxEmitBox = new BABYLON.Vector3(3, 2, 3);
  particleSystem.color1 = new BABYLON.Color4(0.3, 0.9, 0.9, 1);
  particleSystem.color2 = new BABYLON.Color4(0.6, 0.5, 1, 1);
  particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
  particleSystem.minSize = 0.02;
  particleSystem.maxSize = 0.07;
  particleSystem.updateSpeed = 0.02;
  particleSystem.minEmitPower = 1;
  particleSystem.maxEmitPower = 2;
  particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
  particleSystem.start();

  /* === REACTIVIDAD AL CURSOR === */
  let tx = 0, ty = 0;
  let scrollY = 0;
  if (!reduceMotion) {
    const hero = canvas.parentElement;
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 0.4;
    });
    hero.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    window.addEventListener('scroll', () => {
      scrollY = window.scrollY || 0;
    }, { passive: true });
  }

  /* === TEMA === */
  function applyTheme() {
    const dark = isDark();
    const pcb = dark ? new BABYLON.Color3(0.04, 0.16, 0.14) : new BABYLON.Color3(0.75, 0.82, 0.8);
    const chipC = dark ? new BABYLON.Color3(0.13, 0.15, 0.2) : new BABYLON.Color3(0.35, 0.37, 0.42);
    const fin = dark ? new BABYLON.Color3(0.55, 0.58, 0.65) : new BABYLON.Color3(0.5, 0.52, 0.58);
    pcbMat.diffuseColor = pcb;
    chipMat.diffuseColor = chipC;
    finMat.diffuseColor = fin;
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* === RESIZE === */
  let w = 0, h = 0;
  function resize() {
    const parent = canvas.parentElement;
    w = parent.clientWidth || 400;
    h = parent.clientHeight || 400;
    engine.resize();
  }
  window.addEventListener('resize', resize);
  resize();

  /* === LOOP === */
  const startTime = performance.now();
  let running = false;
  const renderStep = () => scene.render();
  function startLoop() {
    if (running || engine.isDisposed) return;
    running = true;
    engine.runRenderLoop(renderStep);
  }
  function stopLoop() {
    engine.stopRenderLoop();
    running = false;
  }
  scene.registerBeforeRender(() => {
    if (reduceMotion) return;
    const t = performance.now() * 0.001;
    const elapsed = performance.now() - startTime;
    root.rotation.y += 0.004;
    root.rotation.x += (ty - root.rotation.x) * 0.05;
    root.rotation.z += (tx - root.rotation.z) * 0.05;
    fan.rotation.z = t * 8;
    cooler.position.y = 0.62 + Math.sin(t * 1.4) * 0.05;
    camera.alpha = -1.2 + tx * 0.5 + scrollY * 0.0006;
    camera.beta = 1.15 + ty * 0.4;
    const scrollFade = Math.max(0, 1 - (scrollY - 200) / 400);
    const fadeIn = Math.min(1, elapsed / 900);
    canvas.style.opacity = (scrollFade * fadeIn).toFixed(3);
  });

  if (reduceMotion) {
    canvas.style.opacity = 1;
  }

  startLoop();

  /* pausar fuera de pantalla para ahorrar recursos */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) startLoop();
      else stopLoop();
    });
  });
  io.observe(canvas);

  window.addEventListener('beforeunload', () => engine.dispose());
})();
