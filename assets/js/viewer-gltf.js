/* ============================================================
   TECHGUIDE - viewer-gltf.js (modulo ES)
   Explorador 3D interactivo de ejemplo:
   - GLTFLoader: carga assets/models/cpu-realista.glb
   - OrbitControls: arrastrar para girar, rueda para zoom
   - Raycaster: hover resalta la pieza y un clic muestra su info
   ============================================================ */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/loaders/GLTFLoader.js';

const stage = document.getElementById('viewerGltfStage');
if (stage && typeof THREE !== 'undefined') {
  const modelUrl = new URL('../models/cpu-realista.glb', import.meta.url);
  const loadingEl = document.getElementById('viewerGltfLoading');
  const infoTitle = document.getElementById('viewerGltfInfoTitle');
  const infoDesc = document.getElementById('viewerGltfInfoDesc');

  const INFO = {
    ihs: ['IHS (tapa metalica)', 'Cubierta metalica superior del CPU. Transfiere el calor del die hacia el disipador y lleva el grabado laser con el modelo del procesador.'],
    silicio: ['Die de silicio', 'El corazon del procesador: miles de millones de transistores grabados en silicio. Es la zona mas fragil y valiosa del chip.'],
    cobre: ['Marco de cobre', 'Anillo de cobre que rodea el die. Forma parte del sistema de disipacion interna del encapsulado.'],
    marca: ['Marca del fabricante', 'Serigrafia dorada sobre el die con el modelo del procesador y detalles del lote de fabricacion.'],
    sustrato: ['Sustrato PCB', 'Placa base verde del CPU. Contiene las pistas internas que conectan el die con los contactos del socket.'],
    contactos: ['Contactos dorados (LGA)', 'Rejilla de pads dorados en la base. Se conectan con los pines del socket LGA de la placa madre (ej. LGA1700 / AM5).']
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const d1 = new THREE.DirectionalLight(0xffffff, 1.2);
  d1.position.set(8, 12, 10);
  scene.add(d1);
  const d2 = new THREE.DirectionalLight(0x8899ff, 0.4);
  d2.position.set(-8, -4, -6);
  scene.add(d2);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6;
  controls.minDistance = 9;
  controls.maxDistance = 42;
  controls.maxPolarAngle = Math.PI * 0.92;

  /* outline del hover */
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
    new THREE.LineBasicMaterial({ color: 0x39d0d8, transparent: true, opacity: 0.95 })
  );
  outline.visible = false;
  scene.add(outline);
  const _c = new THREE.Vector3();
  const _s = new THREE.Vector3();

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2(-2, -2);
  let hoverMesh = null;
  let dragging = false;
  let downX = 0, downY = 0;

  const pickables = [];

  function setHover(mesh) {
    hoverMesh = mesh;
    if (mesh) {
      const bb = new THREE.Box3().setFromObject(mesh);
      bb.getSize(_s);
      bb.getCenter(_c);
      outline.position.copy(_c);
      outline.scale.copy(_s);
      outline.visible = true;
    } else {
      outline.visible = false;
    }
  }

  function showInfo(name) {
    const data = INFO[name] || INFO.sustrato;
    infoTitle.textContent = data[0];
    infoDesc.textContent = data[1];
  }

  function resize() {
    const w = stage.clientWidth || 300;
    const h = stage.clientHeight || 300;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  new GLTFLoader().load(
    modelUrl.href,
    (gltf) => {
      const root = gltf.scene;
      const bb = new THREE.Box3().setFromObject(root);
      const center = bb.getCenter(new THREE.Vector3());
      root.position.sub(center);
      scene.add(root);
      root.traverse(o => { if (o.isMesh) pickables.push(o); });

      const size = bb.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 10;
      const dist = (maxDim / 2) / Math.tan((42 * Math.PI) / 360) * 1.5;
      camera.position.set(dist * 0.7, dist * 0.5, dist);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();

      if (loadingEl) loadingEl.style.display = 'none';
    },
    undefined,
    (err) => {
      if (loadingEl) loadingEl.innerHTML = '<i class="bi bi-exclamation-triangle"></i> No se pudo cargar el modelo 3D.';
      console.error('GLTFLoader error:', err);
    }
  );

  const el = renderer.domElement;
  el.addEventListener('pointermove', (e) => {
    if (dragging) return;
    const r = el.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    el.style.cursor = 'grab';
  });
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    downX = e.clientX;
    downY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', () => {});
  el.addEventListener('pointerup', (e) => {
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    dragging = false;
    if (moved < 5) {
      /* clic: seleccionar pieza */
      const r = el.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(pickables, true);
      if (hits.length) {
        let o = hits[0].object;
        while (o && !INFO[o.name]) o = o.parent;
        if (o && INFO[o.name]) showInfo(o.name);
      } else {
        showInfo('sustrato');
        setHover(null);
      }
      controls.autoRotate = false;
    }
  });
  el.addEventListener('pointerleave', () => { ndc.set(-2, -2); });

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    controls.update();

    raycaster.setFromCamera(ndc, camera);
    let hover = null;
    const hits = raycaster.intersectObjects(pickables, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !INFO[o.name]) o = o.parent;
      if (o && INFO[o.name]) { hover = o; break; }
    }
    if (hover !== hoverMesh) setHover(hover);

    renderer.render(scene, camera);
  }
  animate();
}
