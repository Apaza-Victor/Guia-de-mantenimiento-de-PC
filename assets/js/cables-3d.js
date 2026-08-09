/* ============================================================
   TECHGUIDE - cables-3d.js
   Visualizadores 3D de cables y conectores (Three.js)
   Uso:
     <div class="three-canvas" data-model="atx24" data-title="ATX 24-pin">
       <div class="three-stage"></div>
       <div class="three-bar"><span class="three-title">...</span></div>
     </div>
   Modelos disponibles: atx24, atx20, eps8, eps4, eps_pcie, pcie62,
   12vhpwr, sata-power, sata-data, molex, berg, ide, m2, hdmi, dp,
   dvi, vga, usb-a, usb-b, usb-c, usb20-int, usb30-int, jack35,
   toslink, fan4, fan3, casefan, rgb4, argb3, fpanel, pwsw, resetsw,
   hddled, pwled, hdaudio, speaker4, ps2, com, rj45 (T568A/B),
   paperclip, io-panel, gpu-ports, ac-cable, dc-jack, atx-colors.
   Redes: utp, coaxial, coax-fconn, fiber-sc, fiber-lc, fiber-st,
   rj11, keystone, patch-panel, nic-port, router-back, switch-sfp,
   rj45_directo (T568B-T568B), rj45_cruzado (T568A-T568B).
    Herramientas: crimper (crimpadora), punchdown (ponchadora de
    impacto), tester_net (tester de red), stripper (pelacables).
    Kit del Tecnico: screwdriver (destornillador Phillips), esd_strap
    (pulsera anti-estatica), air_duster (aire comprimido),
    thermal_paste (pasta termica), isopropyl (alcohol isopropilico),
    multimeter (multimetro digital), flashlight (linterna LED),
    ventoy_usb (USB Ventoy), spudger (palanca plastica).
   ============================================================ */

(function () {
  if (typeof THREE === 'undefined') {
    document.querySelectorAll('.three-canvas').forEach(el => {
      const stage = el.querySelector('.three-stage');
      if (stage) stage.innerHTML = '<div class="three-fallback">No se pudo cargar la libreria 3D (Three.js).</div>';
    });
    return;
  }

  /* === COLORES === */
  const C = {
    black: 0x17181c, dark: 0x2a2d36, pcb: 0x1c3a2f, pcbDark: 0x162b22,
    gray: 0x9aa0ab, metal: 0xbfc6cf, white: 0xe9ebee,
    yellow: 0xf6c344, red: 0xd8433d, orange: 0xe27d2b, blue: 0x3b82c4,
    lightblue: 0x6bb7e8, green: 0x4cb057, gold: 0xd7a94a, brown: 0x7a4e26,
    teal: 0x3bc2c9, purple: 0x8a5cf5, plastic: 0x3a3e49, plasticLt: 0x5a5f6e
  };

  /* === MATERIALES === */
  function M(color, o) {
    o = o || {};
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: o.roughness !== undefined ? o.roughness : 0.55,
      metalness: o.metalness !== undefined ? o.metalness : 0.05,
      transparent: !!o.transparent,
      opacity: o.opacity !== undefined ? o.opacity : 1,
      depthWrite: o.depthWrite !== undefined ? o.depthWrite : true
    });
  }

  /* === GEOMETRIA BASICA === */
  function cyl(r, h, color, o) { return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, o && o.seg || 18), M(color, o)); }
  function box(w, h, d, color, o) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(color, o)); }
  function seg(r, len, color, o) { const m = cyl(r, len, color, o); m.rotation.x = Math.PI / 2; return m; } /* a lo largo de Z */
  function tube(points, radius, color, segs) {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, segs || 28, radius, 10), M(color));
  }
  function stripeSeg(r, len, stripeColor) {
    const g = new THREE.Group();
    const body = seg(r, len, C.white);
    const stripe = seg(r * 0.22, len, stripeColor);
    stripe.position.x = r * 0.6;
    g.add(body, stripe);
    return g;
  }
  function sphere(r, color, o) { return new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), M(color, o)); }
  function torus(radius, tube, color, o) { return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 14, 32), M(color, o)); }

  /* === PINES (rejilla en cara +Z de un bloque centrado) === */
  function pins(rows, cols, gapX, gapY, o) {
    o = o || {};
    const r = o.r !== undefined ? o.r : 0.48;
    const len = o.len !== undefined ? o.len : 1.4;
    const color = o.color || C.gold;
    const z = o.z !== undefined ? o.z : 0;
    const w = (cols - 1) * gapX, h = (rows - 1) * gapY;
    const g = new THREE.Group();
    for (let r2 = 0; r2 < rows; r2++) {
      for (let c = 0; c < cols; c++) {
        const p = seg(r, len, color);
        p.position.set(-w / 2 + c * gapX, h / 2 - r2 * gapY, z);
        g.add(p);
      }
    }
    return g;
  }
  function exits(rows, cols, gapX, gapY, depth) {
    const w = (cols - 1) * gapX, h = (rows - 1) * gapY;
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push(new THREE.Vector3(-w / 2 + c * gapX, h / 2 - r * gapY, -depth / 2));
      }
    }
    return out;
  }
  function wireBundle(points, colors, o) {
    o = o || {};
    const g = new THREE.Group();
    const radius = o.radius !== undefined ? o.radius : 0.42;
    const back = o.back !== undefined ? o.back : 7;
    const down = o.down !== undefined ? o.down : 12;
    const spread = o.spread !== undefined ? o.spread : 2.4;
    const up = o.up ? -1 : 1;
    points.forEach((p, i) => {
      const col = colors[i % colors.length];
      const jx = ((i % 3) - 1) * spread;
      const jy = (i % 2) * 1.4;
      const jz = (i % 4) * 0.7;
      const out = new THREE.Vector3(p.x + jx * 0.5, p.y + jy * up, p.z - back - jz);
      const end = new THREE.Vector3(p.x * 0.55 + jx, up * (-down - jy), p.z - back - 8 - jz);
      const mid = new THREE.Vector3(p.x * 0.5 + jx * 0.3, (p.y + end.y) / 2 + 1.5 * up, (p.z + end.z) / 2 + 2);
      g.add(tube([p.clone(), out, mid, end], radius, col));
    });
    return g;
  }

  /* === MODELOS === */
  const MODELS = {};

  /* ATX 24-pin (20+4) */
  MODELS.atx24 = function () {
    const g = new THREE.Group();
    const mainBlock = box(33, 11, 25, C.black);
    g.add(mainBlock);
    g.add(pins(2, 10, 3.2, 4.6, { z: 25 / 2 + 0.1 }));
    const ext = new THREE.Group();
    ext.add(box(9.5, 11, 17, C.black));
    ext.add(pins(2, 2, 3.2, 4.6, { z: 17 / 2 + 0.1 }));
    ext.position.set(20, 0, -4);
    g.add(ext);
    const clip = box(10, 2.6, 2.4, C.plasticLt);
    clip.position.set(0, -7, 5);
    g.add(clip);
    const exPts = exits(2, 10, 3.2, 4.6, 25).concat(
      exits(2, 2, 3.2, 4.6, 17).map(v => v.add(new THREE.Vector3(20, 0, -4)))
    );
    const wireColors = [
      0xe27d2b, 0xe27d2b, 0x17181c, 0xd8433d, 0x17181c, 0xd8433d, 0x17181c, 0x9aa0ab, 0x8a5cf5, 0xf6c344,
      0xf6c344, 0xe27d2b, 0xe27d2b, 0x3b82c4, 0x17181c, 0x4cb057, 0x17181c, 0x17181c, 0x17181c, 0xd8433d,
      0xd8433d, 0xd8433d, 0x17181c, 0x17181c
    ];
    g.add(wireBundle(exPts, wireColors, { down: 13, back: 8 }));
    return g;
  };

  /* Colores de cables ATX (leyenda 3D) */
  MODELS['atx-colors'] = function () {
    const g = new THREE.Group();
    const list = [
      ['+12V', 0xf6c344], ['+5V', 0xd8433d], ['+3.3V', 0xe27d2b], ['GND', 0x17181c],
      ['PS_ON', 0x4cb057], ['+5VSB', 0x8a5cf5], ['Power Good', 0x9aa0ab], ['GND', 0x17181c]
    ];
    list.forEach((c, i) => {
      const wire = seg(0.6, 20, c[1]);
      wire.position.set((i - (list.length - 1) / 2) * 3.4, 0, 0);
      g.add(wire);
    });
    return g;
  };

  /* EPS 12V 8-pin (CPU) */
  MODELS.eps8 = function () {
    const g = new THREE.Group();
    g.add(box(16, 9.5, 20, C.black));
    g.add(pins(2, 4, 3.4, 4.4, { z: 10.1 }));
    const clip = box(4.5, 2.4, 2.4, C.plasticLt);
    clip.position.set(-8.2, 0, 6);
    g.add(clip);
    const cols = [];
    for (let i = 0; i < 4; i++) cols.push(0xf6c344, 0x17181c);
    g.add(wireBundle(exits(2, 4, 3.4, 4.4, 20), cols, { down: 12, back: 7 }));
    return g;
  };

  /* PCIe 6+2 pin (GPU) */
  MODELS.pcie62 = function () {
    const g = new THREE.Group();
    g.add(box(15, 9.5, 19, C.black));
    g.add(pins(2, 3, 3.6, 4.4, { z: 9.6 }));
    const plus = new THREE.Group();
    plus.add(box(5.2, 9.5, 19, C.black));
    plus.add(pins(2, 1, 3.6, 4.4, { z: 9.6 }));
    plus.position.set(10.6, 0, 0);
    g.add(plus);
    const clip = box(6, 2.4, 2.4, C.plasticLt);
    clip.position.set(-7.8, 0, 5.5);
    g.add(clip);
    const exPts = exits(2, 3, 3.6, 4.4, 19).concat(
      exits(2, 1, 3.6, 4.4, 19).map(v => v.add(new THREE.Vector3(10.6, 0, 0)))
    );
    const cols = [0x17181c, 0x17181c, 0xd8433d, 0x17181c, 0xf6c344, 0x17181c, 0x17181c, 0xd8433d];
    g.add(wireBundle(exPts, cols, { down: 12, back: 7 }));
    return g;
  };

  /* SATA Power 15-pin */
  MODELS['sata-power'] = function () {
    const g = new THREE.Group();
    g.add(box(23, 4.2, 8, C.black));
    const lip = box(23, 3, 1.6, C.plasticLt);
    lip.position.set(0, 3.6, 0);
    g.add(lip);
    g.add(pins(1, 15, 1.42, 0, { r: 0.34, len: 1.2, z: 4.1, color: C.gold }));
    const cols = [0xe27d2b, 0xd8433d, 0xf6c344, 0x17181c];
    const pts = exits(1, 15, 1.42, 0, 8).filter((_, i) => i % 4 === 0);
    g.add(wireBundle(pts, cols, { down: 10, back: 6, radius: 0.5, spread: 2 }));
    return g;
  };

  /* Molex 4-pin */
  MODELS.molex = function () {
    const g = new THREE.Group();
    const body = box(13, 9.5, 16, 0xe4e6e9);
    g.add(body);
    const ridge = box(13, 3.2, 2.4, 0xccd0d6);
    ridge.position.set(0, 4.9, 0);
    g.add(ridge);
    g.add(pins(1, 4, 3.6, 0, { r: 0.7, len: 1.6, z: 8.1, color: C.gold }));
    g.add(wireBundle(exits(1, 4, 3.6, 0, 16), [0xf6c344, 0x17181c, 0x17181c, 0xd8433d], { down: 11, back: 7, radius: 0.55 }));
    return g;
  };

  /* Berg (disquetera) */
  MODELS.berg = function () {
    const g = new THREE.Group();
    g.add(box(6.5, 5.5, 9, 0xe4e6e9));
    g.add(pins(1, 4, 1.4, 0, { r: 0.32, len: 1.2, z: 4.6 }));
    g.add(wireBundle(exits(1, 4, 1.4, 0, 9), [0xf6c344, 0x17181c, 0x17181c, 0xd8433d], { down: 9, back: 5, radius: 0.3, spread: 1.2 }));
    return g;
  };

  /* Cable IDE / PATA (cinta) */
  MODELS.ide = function () {
    const g = new THREE.Group();
    const ribbon = box(26, 0.5, 46, 0x9aa0ab);
    g.add(ribbon);
    const stripe = box(1, 0.55, 46, 0xd8433d);
    stripe.position.set(-12.5, 0, 0);
    g.add(stripe);
    const conA = box(4.4, 1.8, 7.5, 0x3b82c4);
    conA.position.set(0, 0, 22);
    g.add(conA);
    const conB = box(4.4, 1.8, 7.5, 0x9aa0ab);
    conB.position.set(0, 0, 5);
    g.add(conB);
    const conC = box(4.4, 1.8, 7.5, 0x2a2d36);
    conC.position.set(0, 0, -20);
    g.add(conC);
    return g;
  };

  /* SATA Data (7 pines) */
  MODELS['sata-data'] = function () {
    const g = new THREE.Group();
    g.add(box(12, 4.2, 5.6, 0x2a2d36));
    const notch = box(12, 2.4, 1.6, 0x1a1c22);
    notch.position.set(0, 3.3, 0);
    g.add(notch);
    g.add(pins(1, 7, 1.4, 0, { r: 0.3, len: 1.1, z: 2.9, color: C.gold }));
    const cable = box(2.4, 0.5, 26, 0x3a3e49);
    cable.position.set(0, 0, -15);
    g.add(cable);
    return g;
  };

  /* SSD M.2 / NVMe en slot */
  MODELS.m2 = function () {
    const g = new THREE.Group();
    const mobo = box(72, 3, 54, C.pcb);
    g.add(mobo);
    const slot = box(25, 4, 8.5, C.black);
    slot.position.set(-6, 1.5, -16);
    g.add(slot);
    const ssd = new THREE.Group();
    const card = box(22, 1.6, 66, C.pcbDark);
    card.position.set(0, 1, -14);
    ssd.add(card);
    const edge = box(22, 1.9, 4.5, C.gold);
    edge.position.set(0, 0.2, -44);
    ssd.add(edge);
    const chip = box(15, 1.6, 13, C.black);
    chip.position.set(0, 1.7, -18);
    ssd.add(chip);
    ssd.rotation.x = 0.42;
    ssd.position.set(0, 4, 0);
    g.add(ssd);
    const post = cyl(1.2, 3, C.metal);
    post.position.set(0, 1.5, 15);
    g.add(post);
    return g;
  };

  /* HDMI (19 pines) */
  MODELS.hdmi = function () {
    const g = new THREE.Group();
    const sleeve = box(14, 5, 5.2, C.metal, { metalness: 0.85, roughness: 0.3 });
    g.add(sleeve);
    const inner = box(12.4, 3.6, 4.6, 0x17181c);
    inner.position.z = 0.4;
    g.add(inner);
    const pins = new THREE.Group();
    const rows = [10, 9];
    rows.forEach((n, r) => {
      const w = (n - 1) * 1.1;
      for (let c = 0; c < n; c++) {
        const p = seg(0.16, 1.4, C.gold);
        p.position.set(-w / 2 + c * 1.1, r === 0 ? 1.1 : -1.1, 3.3);
        pins.add(p);
      }
    });
    g.add(pins);
    g.add(wireBundle([new THREE.Vector3(0, 0, -2.6)], [0x17181c], { down: 10, back: 5, radius: 0.8, spread: 0 }));
    return g;
  };

  /* DisplayPort (20 pines) */
  MODELS.dp = function () {
    const g = new THREE.Group();
    const sleeve = box(12.4, 4.6, 5.4, C.metal, { metalness: 0.85, roughness: 0.3 });
    g.add(sleeve);
    const inner = box(10.8, 3.4, 4.8, 0x17181c);
    inner.position.z = 0.4;
    g.add(inner);
    const w = 19 * 0.5;
    for (let c = 0; c < 20; c++) {
      const p = seg(0.14, 1.4, C.gold);
      p.position.set(-w / 2 + c * 0.5, 0, 3.4);
      g.add(p);
    }
    const bevel = box(4, 1.2, 1.2, 0x8a5cf5);
    bevel.position.set(-5, 2, 3);
    g.add(bevel);
    g.add(wireBundle([new THREE.Vector3(0, 0, -2.7)], [0x17181c], { down: 10, back: 5, radius: 0.8, spread: 0 }));
    return g;
  };

  /* VGA (D-Sub 15, azul) */
  MODELS.vga = function () {
    const g = new THREE.Group();
    const shell = box(16, 12, 6, 0x2b5bb0, { roughness: 0.45 });
    g.add(shell);
    const trap = box(16, 3.4, 1.4, 0x1d3f7a);
    trap.position.set(0, 6.8, 3);
    g.add(trap);
    const rows = [5, 5, 5];
    rows.forEach((n, r) => {
      const w = (n - 1) * 2.4;
      const y = 4.6 - r * 2.2;
      for (let c = 0; c < n; c++) {
        const p = seg(0.42, 1.6, C.gold);
        p.position.set(-w / 2 + c * 2.4, y, 3.3);
        g.add(p);
      }
    });
    const thumb = cyl(1.6, 4, C.metal, { seg: 14 });
    thumb.rotation.x = Math.PI / 2;
    thumb.position.set(9, -5.4, 0);
    g.add(thumb);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0x2b5bb0], { down: 9, back: 4, radius: 0.7, spread: 0 }));
    return g;
  };

  /* USB-A */
  MODELS['usb-a'] = function () {
    const g = new THREE.Group();
    const sleeve = box(12.2, 4.8, 5.8, C.metal, { metalness: 0.85, roughness: 0.28 });
    g.add(sleeve);
    const inner = box(10.6, 3.4, 5.2, 0x17181c);
    g.add(inner);
    const gold = box(10.6, 0.9, 0.7, C.gold, { metalness: 0.7 });
    gold.position.set(0, -1.2, 3);
    g.add(gold);
    const data = [0.9, -0.3].map(x => {
      const p = seg(0.16, 1.2, C.gold);
      p.position.set(x, 0.7, 3.2);
      return p;
    });
    g.add(...data);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0x2a2d36, 0x9aa0ab, 0x17181c, 0xd8433d], { down: 9, back: 4, radius: 0.5, spread: 1.6 }));
    return g;
  };

  /* USB-B */
  MODELS['usb-b'] = function () {
    const g = new THREE.Group();
    const sleeve = box(8.4, 7.8, 5.6, C.metal, { metalness: 0.85, roughness: 0.28 });
    g.add(sleeve);
    const inner = box(7, 6, 4.8, 0x17181c);
    inner.position.z = 0.5;
    g.add(inner);
    const pin = seg(0.22, 1.4, C.gold);
    pin.position.set(-1.6, 1.6, 3.4);
    g.add(pin);
    const pin2 = seg(0.22, 1.4, C.gold);
    pin2.position.set(1.6, -1.6, 3.4);
    g.add(pin2);
    g.add(wireBundle([new THREE.Vector3(0, 0, -2.8)], [0x2a2d36, 0x9aa0ab, 0x17181c, 0xd8433d], { down: 9, back: 4, radius: 0.5, spread: 1.6 }));
    return g;
  };

  /* USB-C */
  MODELS['usb-c'] = function () {
    const g = new THREE.Group();
    const plug = cyl(3.4, 9, C.metal, { seg: 26 });
    plug.rotation.x = Math.PI / 2;
    plug.scale.y = 0.42;
    g.add(plug);
    const tab = box(6, 1.3, 4.6, 0x17181c);
    tab.position.set(0, 0, 2);
    g.add(tab);
    [-1.5, 1.5].forEach(y => {
      const w = 11 * 0.42;
      for (let c = 0; c < 12; c++) {
        const p = seg(0.12, 1.1, C.gold);
        p.position.set(-w / 2 + c * 0.42, y, 4.3);
        g.add(p);
      }
    });
    g.add(wireBundle([new THREE.Vector3(0, 0, -4.5)], [0x2a2d36], { down: 9, back: 4, radius: 0.55, spread: 0 }));
    return g;
  };

  /* Jack 3.5 mm */
  MODELS.jack35 = function () {
    const g = new THREE.Group();
    const plug = seg(1.75, 15, C.metal, { metalness: 0.85, roughness: 0.25, seg: 22 });
    g.add(plug);
    const tip = sphere(1.75, C.metal, { metalness: 0.85, roughness: 0.25 });
    tip.position.set(0, 0, 7.6);
    g.add(tip);
    [-4.5, 0.5].forEach(z => {
      const ring = cyl(1.95, 0.8, C.black, { seg: 22 });
      ring.rotation.x = Math.PI / 2;
      ring.position.z = z;
      g.add(ring);
    });
    const barrel = box(7, 7, 7, C.black);
    barrel.position.set(0, 0, -6);
    g.add(barrel);
    g.add(wireBundle([new THREE.Vector3(0, 0, -9.5)], [0x4cb057], { down: 7, back: 3, radius: 0.6, spread: 0 }));
    return g;
  };

  /* Ventilador 3/4 pines */
  MODELS.fan4 = function () {
    const g = new THREE.Group();
    const body = box(5.4, 5.4, 10, C.black);
    g.add(body);
    const clip = box(3, 1.6, 2.2, C.plasticLt);
    clip.position.set(0, 3.4, -3);
    g.add(clip);
    g.add(pins(1, 4, 1.3, 0, { r: 0.3, len: 1.2, z: 5.1 }));
    const cols = [0x17181c, 0xf6c344, 0x4cb057, 0x3b82c4];
    g.add(wireBundle(exits(1, 4, 1.3, 0, 10), cols, { down: 10, back: 5, radius: 0.35, spread: 1.4 }));
    return g;
  };

  /* Conector RJ-45 (cuerpo + pines) — base para el visor interactivo y los cables */
  function rj45Plug() {
    const g = new THREE.Group();
    const shell = box(12, 9, 17, C.white, { transparent: true, opacity: 0.22, roughness: 0.2 });
    g.add(shell);
    const core = box(10, 7, 15, 0x0d0e12);
    core.position.set(0, 0.4, 0);
    g.add(core);
    const latch = box(12, 2.6, 3, 0x3a3e49);
    latch.position.set(0, -4, 6);
    g.add(latch);
    const tab = box(4, 3.2, 2, C.white, { transparent: true, opacity: 0.3 });
    tab.position.set(0, 5.6, 7);
    g.add(tab);
    for (let c = 0; c < 8; c++) {
      const p = box(0.85, 0.35, 2.6, C.gold, { metalness: 0.7, roughness: 0.3 });
      p.position.set(-7 * 0.5 + c * 1.05, 1.9, 7.4);
      p.rotation.z = -0.06;
      g.add(p);
    }
    return g;
  }

  MODELS.rj45 = function () {
    const g = rj45Plug();
    const order = {
      T568B: ['wo', 'o', 'wg', 'bl', 'wb', 'g', 'wbr', 'br'],
      T568A: ['wg', 'g', 'wo', 'bl', 'wb', 'o', 'wbr', 'br']
    };
    const pair = {
      wo: 0xe27d2b, o: 0xd8433d, wg: 0x4cb057, g: 0x2f7d3a,
      bl: 0x3b82c4, wb: 0x6bb7e8, wbr: 0x7a4e26, br: 0x4a2f16
    };
    let wireGroup = new THREE.Group();
    g.add(wireGroup);
    function build(orderName) {
      wireGroup.clear();
      const seq = order[orderName] || order.T568B;
      const w = 7 * 1.05;
      seq.forEach((key, c) => {
        const x = -w / 2 + c * 1.05;
        const wire = key.charAt(0) === 'w'
          ? stripeSeg(0.45, 6, pair[key])
          : seg(0.45, 6, pair[key]);
        wire.position.set(x, -1.6, -11.5);
        wireGroup.add(wire);
      });
    }
    build('T568B');
    g.userData.setOrder = build;
    return g;
  };

  /* Cable con un RJ-45 en cada extremo y los 8 hilos visibles en su orden.
     leftOrder / rightOrder muestran la norma de cada extremo; la banda central
     de color distingue directo (verde) de cruzado (rojo). */
  function rj45CableBuild(g, leftOrder, rightOrder, bandColor) {
    const pair = {
      wo: 0xe27d2b, o: 0xd8433d, wg: 0x4cb057, g: 0x2f7d3a,
      bl: 0x3b82c4, wb: 0x6bb7e8, wbr: 0x7a4e26, br: 0x4a2f16
    };
    const plugW = 7 * 1.05, stubLen = 17;
    function addStubs(order, plugX, dir) {
      order.forEach((key, c) => {
        const xs = -plugW / 2 + c * 1.05;
        const zs = dir === 1 ? xs : -xs;
        const wire = key.charAt(0) === 'w'
          ? stripeSeg(0.5, stubLen, pair[key])
          : seg(0.5, stubLen, pair[key]);
        wire.rotation.y = Math.PI / 2;
        wire.position.set(plugX + dir * 11.5 + dir * stubLen / 2, -1.6, zs);
        g.add(wire);
      });
    }
    const lp = rj45Plug();
    lp.position.set(-52, 0, 0);
    lp.rotation.y = -Math.PI / 2;
    g.add(lp);
    addStubs(leftOrder, -52, 1);
    const rp = rj45Plug();
    rp.position.set(52, 0, 0);
    rp.rotation.y = Math.PI / 2;
    g.add(rp);
    addStubs(rightOrder, 52, -1);
    /* funda semitransparente con los pares trenzados visibles */
    const jacket = cyl(2.6, 40, 0x0d0e12, { transparent: true, opacity: 0.35, depthWrite: false });
    jacket.rotation.z = Math.PI / 2;
    g.add(jacket);
    const pairDefs = [
      [0xe27d2b, 0xd8433d], [0x4cb057, 0x2f7d3a],
      [0x6bb7e8, 0x3b82c4], [0x7a4e26, 0x4a2f16]
    ];
    const centers = [[0.9, 0.9], [-0.9, 0.9], [0.9, -0.9], [-0.9, -0.9]];
    centers.forEach((cyz, i) => {
      const tp = twistedPair(30, pairDefs[i][0], pairDefs[i][1], 0.6, { twist: 5 });
      tp.rotation.y = Math.PI / 2;
      tp.rotation.z = 0.6 * i;
      tp.position.set(0, cyz[0], cyz[1]);
      g.add(tp);
    });
    /* banda central de color distintivo */
    const band = cyl(2.75, 3.5, bandColor, { transparent: true, opacity: 0.55 });
    band.rotation.z = Math.PI / 2;
    g.add(band);
  }

  /* Cable directo: mismo orden (T568B) en ambos extremos */
  MODELS.rj45_directo = function () {
    const g = new THREE.Group();
    rj45CableBuild(g,
      ['wo', 'o', 'wg', 'bl', 'wb', 'g', 'wbr', 'br'],
      ['wo', 'o', 'wg', 'bl', 'wb', 'g', 'wbr', 'br'],
      0x4cb057);
    return g;
  };

  /* Cable cruzado: T568A en un extremo y T568B en el otro */
  MODELS.rj45_cruzado = function () {
    const g = new THREE.Group();
    rj45CableBuild(g,
      ['wg', 'g', 'wo', 'bl', 'wb', 'o', 'wbr', 'br'],
      ['wo', 'o', 'wg', 'bl', 'wb', 'g', 'wbr', 'br'],
      0xd8433d);
    return g;
  };

  /* === HERRAMIENTAS DE CABLEADO === */

  /* Crimpadora RJ-45 (ponchadora manual) */
  MODELS.crimper = function () {
    const g = new THREE.Group();
    const head = box(15, 11, 7, C.metal, { metalness: 0.65, roughness: 0.35 });
    head.position.set(13, 0, 0);
    g.add(head);
    const jawTop = box(8, 3.4, 6, 0x2a2d36);
    jawTop.position.set(22, 3.4, 0);
    g.add(jawTop);
    const jawBot = box(8, 3.4, 6, 0x2a2d36);
    jawBot.position.set(22, -3.4, 0);
    g.add(jawBot);
    const slot = box(11, 1.1, 1, 0x0d0e12);
    slot.position.set(21.5, 0, 0);
    g.add(slot);
    for (let c = 0; c < 6; c++) {
      const tooth = box(0.7, 1.4, 3, C.gold, { metalness: 0.7, roughness: 0.3 });
      tooth.position.set(18.4 + c * 1.15, 0.1, 0);
      g.add(tooth);
    }
    const pivot = cyl(3.4, 6, 0x3a3e49);
    pivot.rotation.z = Math.PI / 2;
    pivot.position.set(3, 0, 0);
    g.add(pivot);
    const h1 = box(3.6, 5, 30, 0xd8433d, { roughness: 0.45 });
    h1.position.set(-13, -6.5, 0);
    h1.rotation.z = 0.13;
    g.add(h1);
    const h2 = box(3.6, 5, 30, 0xd8433d, { roughness: 0.45 });
    h2.position.set(-13, 6.5, 0);
    h2.rotation.z = -0.13;
    g.add(h2);
    const grip1 = box(4, 5.6, 13, 0x17181c);
    grip1.position.set(-26, -8.2, 0);
    grip1.rotation.z = 0.13;
    g.add(grip1);
    const grip2 = box(4, 5.6, 13, 0x17181c);
    grip2.position.set(-26, 8.2, 0);
    grip2.rotation.z = -0.13;
    g.add(grip2);
    const wheel = cyl(3.6, 2.4, 0x9aa0ab, { metalness: 0.6, roughness: 0.4 });
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(-5, 0, 5);
    g.add(wheel);
    const hub = cyl(1.1, 2.6, 0x2a2d36);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(-5, 0, 5);
    g.add(hub);
    return g;
  };

  /* Ponchadora de impacto (punch down) */
  MODELS.punchdown = function () {
    const g = new THREE.Group();
    const body = cyl(2.6, 15, 0x2f7d3a, { roughness: 0.45 });
    g.add(body);
    const cap = cyl(2.9, 2.6, 0x17181c);
    cap.position.y = 8.8;
    g.add(cap);
    const collar = cyl(3.1, 2.4, 0x4cb057);
    collar.position.y = 2.4;
    g.add(collar);
    const tip = box(3.6, 6.5, 3.6, 0x3a3e49, { metalness: 0.4, roughness: 0.4 });
    tip.position.y = -9.5;
    g.add(tip);
    const blade = box(2.5, 2.4, 0.8, 0x0d0e12);
    blade.position.y = -12.4;
    g.add(blade);
    const bladeTip = box(1.6, 1.7, 0.5, C.gold, { metalness: 0.7, roughness: 0.3 });
    bladeTip.position.y = -13.4;
    g.add(bladeTip);
    for (let i = 0; i < 3; i++) {
      const ring = cyl(2.8, 0.6, 0x1d1f26);
      ring.position.y = 4.6 + i * 2.3;
      g.add(ring);
    }
    const hook = box(2.6, 3, 2.6, 0x9aa0ab, { metalness: 0.5, roughness: 0.4 });
    hook.position.set(4.4, 0, 0);
    g.add(hook);
    return g;
  };

  /* Tester de red RJ-45 */
  MODELS.tester_net = function () {
    const g = new THREE.Group();
    const body = box(12, 18, 6, 0x2a2d36, { roughness: 0.5 });
    g.add(body);
    const front = box(10.4, 16.4, 0.6, 0x17181c);
    front.position.z = 3.1;
    g.add(front);
    const lcd = box(8.4, 5.4, 0.5, 0x0d0e12);
    lcd.position.set(0, 4.4, 3.6);
    g.add(lcd);
    const lcdGlow = box(6.6, 3, 0.3, 0x39d0d8, { transparent: true, opacity: 0.85 });
    lcdGlow.position.set(0, 4.4, 3.85);
    g.add(lcdGlow);
    const ledColors = [0x4cb057, 0x4cb057, 0xd8433d, 0xd8433d, 0x6bb7e8, 0x6bb7e8, 0xd8a13a, 0xd8a13a];
    ledColors.forEach((c, i) => {
      const led = sphere(0.55, c, { transparent: true, opacity: 0.95 });
      led.position.set(-3.3 + i * 0.94, -1.8, 3.5);
      g.add(led);
    });
    const port = box(7.5, 4, 3, 0x0d0e12);
    port.position.set(0, 8.4, 2.6);
    g.add(port);
    for (let c = 0; c < 8; c++) {
      const pin = box(0.35, 2.2, 0.5, C.gold, { metalness: 0.7, roughness: 0.3 });
      pin.position.set(-3.5 + c * 1.0, 8.4, 4.2);
      g.add(pin);
    }
    const btn = cyl(1.5, 1, 0x9aa0ab);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(-4, -6.4, 3.6);
    g.add(btn);
    const cord = tube([
      new THREE.Vector3(6, 3, 1),
      new THREE.Vector3(9, 4.5, 2),
      new THREE.Vector3(11, 3, 1)
    ], 0.45, 0x1f2229, 20);
    g.add(cord);
    return g;
  };

  /* Pelacables ajustable con un cable pelado en las mordazas */
  MODELS.stripper = function () {
    const g = new THREE.Group();
    const plateTop = box(13, 7.5, 3, C.metal, { metalness: 0.6, roughness: 0.4 });
    plateTop.position.set(0, 5.8, 0);
    g.add(plateTop);
    const plateBot = box(13, 7.5, 3, C.metal, { metalness: 0.6, roughness: 0.4 });
    plateBot.position.set(0, -5.8, 0);
    g.add(plateBot);
    const notchT = cyl(2, 0.9, 0x0d0e12);
    notchT.rotation.x = Math.PI / 2;
    notchT.position.set(0, 5.8, 0);
    g.add(notchT);
    const notchB = cyl(2, 0.9, 0x0d0e12);
    notchB.rotation.x = Math.PI / 2;
    notchB.position.set(0, -5.8, 0);
    g.add(notchB);
    const screw = cyl(1.2, 2.2, 0x9aa0ab, { metalness: 0.5, roughness: 0.4 });
    screw.rotation.z = Math.PI / 2;
    screw.position.set(6.5, 0, 0);
    g.add(screw);
    const h1 = box(3.2, 4.4, 24, 0x6bb7e8, { roughness: 0.5 });
    h1.position.set(0, -10.5, -9);
    h1.rotation.x = 0.22;
    g.add(h1);
    const h2 = box(3.2, 4.4, 24, 0x6bb7e8, { roughness: 0.5 });
    h2.position.set(0, 10.5, -9);
    h2.rotation.x = -0.22;
    g.add(h2);
    const grip1 = box(3.6, 4.8, 10, 0x17181c);
    grip1.position.set(0, -13.5, -18);
    grip1.rotation.x = 0.22;
    g.add(grip1);
    const grip2 = box(3.6, 4.8, 10, 0x17181c);
    grip2.position.set(0, 13.5, -18);
    grip2.rotation.x = -0.22;
    g.add(grip2);
    const jacketA = cyl(1.15, 9, 0x1f2229);
    jacketA.rotation.x = Math.PI / 2;
    jacketA.position.set(0, 0, -4);
    g.add(jacketA);
    const jacketB = cyl(1.15, 6, 0x1f2229);
    jacketB.rotation.x = Math.PI / 2;
    jacketB.position.set(0, 0, 6.5);
    g.add(jacketB);
    for (let i = 0; i < 4; i++) {
      const wire = seg(0.26, 8, 0xd8a13a, { metalness: 0.6, roughness: 0.35 });
      wire.position.set(-1.6 + i * 1.05, 0, 2.2);
      g.add(wire);
    }
    return g;
  };

  /* === KIT DEL TECNICO === */

  /* Destornillador Phillips (PH1/PH0) */
  MODELS.screwdriver = function () {
    const g = new THREE.Group();
    const handle = cyl(3, 14, 0xd8433d, { roughness: 0.45 });
    g.add(handle);
    const grip1 = cyl(3.15, 0.8, 0x17181c);
    grip1.position.y = 2.2;
    g.add(grip1);
    const grip2 = cyl(3.15, 0.8, 0x17181c);
    grip2.position.y = 4.6;
    g.add(grip2);
    const shaft = cyl(1.1, 12, C.metal, { metalness: 0.7, roughness: 0.3 });
    shaft.position.y = -13;
    g.add(shaft);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 14), M(C.metal, { metalness: 0.7, roughness: 0.3 }));
    cone.position.y = -20.3;
    cone.rotation.x = Math.PI;
    g.add(cone);
    const crossA = box(0.5, 2.4, 1.7, 0x0d0e12);
    crossA.position.y = -19.2;
    g.add(crossA);
    const crossB = box(1.7, 2.4, 0.5, 0x0d0e12);
    crossB.position.y = -19.2;
    g.add(crossB);
    return g;
  };

  /* Pulsera ESD anti-estatica con cordon espiral y clip */
  MODELS.esd_strap = function () {
    const g = new THREE.Group();
    const band = torus(4.6, 1.3, 0x17181c, { roughness: 0.5 });
    band.rotation.y = Math.PI / 2;
    g.add(band);
    const snap = box(2.6, 1, 2.6, C.metal, { metalness: 0.7, roughness: 0.3 });
    snap.position.set(4.6, 1.4, 0);
    g.add(snap);
    const pts = [];
    for (let i = 0; i <= 70; i++) {
      const t = i / 70;
      pts.push(new THREE.Vector3(
        5 + t * 26,
        Math.sin(t * Math.PI * 6) * 2,
        Math.cos(t * Math.PI * 6) * 2 - 7
      ));
    }
    g.add(tube(pts, 0.32, 0x1f2229, 40));
    const clipA = box(2.2, 3.4, 1, C.metal, { metalness: 0.6, roughness: 0.4 });
    clipA.position.set(32, -1.5, -7);
    g.add(clipA);
    const clipB = box(2.2, 1.4, 1, C.metal, { metalness: 0.6, roughness: 0.4 });
    clipB.position.set(32, -4.4, -7);
    g.add(clipB);
    return g;
  };

  /* Aire comprimido (limpiador de polvo) */
  MODELS.air_duster = function () {
    const g = new THREE.Group();
    const can = cyl(3.4, 20, 0x9aa0ab, { metalness: 0.6, roughness: 0.35 });
    g.add(can);
    const label = cyl(3.45, 8, 0xd8433d, { roughness: 0.4 });
    label.position.y = -3;
    g.add(label);
    const shoulder = cyl(2.6, 2.5, 0x2a2d36);
    shoulder.position.y = 11;
    g.add(shoulder);
    const nozzle = cyl(0.7, 4, 0x17181c);
    nozzle.position.set(1.8, 13.6, 0);
    nozzle.rotation.z = Math.PI / 2;
    g.add(nozzle);
    const trigger = box(1.3, 2, 2.6, 0x17181c);
    trigger.position.set(0.6, 10.6, 0);
    g.add(trigger);
    const base = cyl(3.55, 1.6, 0x1d1f26);
    base.position.y = -10.8;
    g.add(base);
    return g;
  };

  /* Pasta termica (jeringa + gota) */
  MODELS.thermal_paste = function () {
    const g = new THREE.Group();
    const body = cyl(2.2, 14, 0xd8e0e6, { roughness: 0.35, transparent: true, opacity: 0.55 });
    g.add(body);
    const label = cyl(2.3, 4, 0x3b82c4);
    label.position.y = 2;
    g.add(label);
    const cap = cyl(2.5, 3, 0x2a2d36);
    cap.position.y = 8.5;
    g.add(cap);
    const nozzle = cyl(0.7, 3, 0x17181c);
    nozzle.position.y = 9.7;
    g.add(nozzle);
    const plunger = cyl(1.8, 3.5, 0x9aa0ab);
    plunger.position.y = -8.5;
    g.add(plunger);
    const rod = cyl(0.8, 4, 0x6b7280);
    rod.position.y = -11;
    g.add(rod);
    const blob = sphere(1.5, 0xd8d8d8, { roughness: 0.6 });
    blob.position.set(4.2, 1.5, 0);
    blob.scale.set(1, 0.55, 1);
    g.add(blob);
    return g;
  };

  /* Alcohol isopropilico (frasco con etiqueta) */
  MODELS.isopropyl = function () {
    const g = new THREE.Group();
    const body = box(7, 14, 4.5, 0xeef2f7, { transparent: true, opacity: 0.7, roughness: 0.3 });
    g.add(body);
    const label = box(6.4, 6, 4.6, 0x3b82c4);
    label.position.y = 1;
    g.add(label);
    const cap = box(3.2, 3.5, 3.2, 0x2a2d36);
    cap.position.y = 9;
    g.add(cap);
    const spout = box(1.6, 1.8, 1.6, 0x17181c);
    spout.position.y = 11.6;
    g.add(spout);
    return g;
  };

  /* Multimetro digital con puntas */
  MODELS.multimeter = function () {
    const g = new THREE.Group();
    const body = box(11, 15, 4.5, 0x1d1f26, { roughness: 0.5 });
    g.add(body);
    const lcd = box(8, 4.5, 0.4, 0x0d0e12);
    lcd.position.set(0, 4.5, 2.4);
    g.add(lcd);
    const lcdGlow = box(6.5, 2.5, 0.25, 0x39d0d8, { transparent: true, opacity: 0.85 });
    lcdGlow.position.set(0, 4.5, 2.7);
    g.add(lcdGlow);
    const dial = cyl(2.6, 1.2, 0x9aa0ab, { metalness: 0.4, roughness: 0.4 });
    dial.rotation.x = Math.PI / 2;
    dial.position.set(0, -1.5, 2.4);
    g.add(dial);
    const knob = cyl(1.2, 1.6, 0x17181c);
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, -1.5, 3.1);
    g.add(knob);
    for (let i = 0; i < 3; i++) {
      const jack = cyl(0.9, 1, 0x0d0e12);
      jack.rotation.x = Math.PI / 2;
      jack.position.set(-2.5 + i * 2.5, -6.5, 2.5);
      g.add(jack);
    }
    g.add(tube([
      new THREE.Vector3(-2.5, -6.5, 3),
      new THREE.Vector3(-7, -9, 3.5),
      new THREE.Vector3(-9, -6, 2)
    ], 0.3, 0xd8433d, 20));
    g.add(tube([
      new THREE.Vector3(-9, -6, 2),
      new THREE.Vector3(-13, -4, 0)
    ], 0.35, 0xd8433d, 12));
    g.add(tube([
      new THREE.Vector3(0, -6.5, 3),
      new THREE.Vector3(7, -9, 3.5),
      new THREE.Vector3(9, -6, 2)
    ], 0.3, 0x0d0e12, 20));
    g.add(tube([
      new THREE.Vector3(9, -6, 2),
      new THREE.Vector3(13, -4, 0)
    ], 0.35, 0x0d0e12, 12));
    return g;
  };

  /* Linterna LED / lampara de trabajo */
  MODELS.flashlight = function () {
    const g = new THREE.Group();
    const body = cyl(2.4, 12, 0x3a3e49, { metalness: 0.5, roughness: 0.4 });
    g.add(body);
    const grip = cyl(2.6, 4, 0x17181c);
    grip.position.y = -2;
    g.add(grip);
    const head = cyl(3.4, 3.5, 0x2a2d36, { metalness: 0.5, roughness: 0.4 });
    head.position.y = 7.5;
    g.add(head);
    const lens = cyl(2.9, 0.6, 0xcfe0ea, { roughness: 0.15, transparent: true, opacity: 0.9 });
    lens.position.y = 9.4;
    g.add(lens);
    const tail = cyl(2.6, 1.5, 0x17181c);
    tail.position.y = -6.7;
    g.add(tail);
    const btn = box(1.4, 1.1, 2.2, 0xd8433d);
    btn.position.set(0, -3.6, 2.4);
    g.add(btn);
    return g;
  };

  /* USB Ventoy (multi-ISO) */
  MODELS.ventoy_usb = function () {
    const g = new THREE.Group();
    const tip = box(4.5, 2, 11, C.metal, { metalness: 0.8, roughness: 0.3 });
    tip.position.z = 7;
    g.add(tip);
    const tipHole = box(2.8, 1.1, 3, 0x0d0e12);
    tipHole.position.set(0, 0, 4.2);
    g.add(tipHole);
    const body = box(6, 3, 9, 0x3b82c4, { roughness: 0.45 });
    body.position.z = -3;
    g.add(body);
    const label = box(5.2, 2, 4, 0x17181c);
    label.position.z = -3;
    g.add(label);
    const ring = torus(1.6, 0.4, 0x9aa0ab, { metalness: 0.6, roughness: 0.4 });
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -8.6;
    g.add(ring);
    return g;
  };

  /* Spudger / palanca plastica */
  MODELS.spudger = function () {
    const g = new THREE.Group();
    const handle = box(2.6, 1.3, 12, 0x3b82c4, { roughness: 0.5 });
    g.add(handle);
    const tip = box(1.9, 1.1, 6, 0x4cb057, { roughness: 0.5 });
    tip.position.set(0, 0.1, 9);
    tip.rotation.x = -0.25;
    g.add(tip);
    const fork = box(1.3, 0.9, 3, 0x4cb057, { roughness: 0.5 });
    fork.position.set(0, 0.1, 13);
    g.add(fork);
    const loop = torus(1.05, 0.35, 0x3b82c4, { roughness: 0.5 });
    loop.rotation.y = Math.PI / 2;
    loop.position.set(0, 0, -8.7);
    g.add(loop);
    return g;
  };

  /* Comparativa EPS vs PCIe 8-pin */
  MODELS.eps_pcie = function () {
    const g = new THREE.Group();
    const eps = MODELS.eps8();
    eps.position.set(-16, 0, 0);
    g.add(eps);
    const pcie = MODELS.pcie62();
    pcie.position.set(17, 0, 0);
    g.add(pcie);
    return g;
  };

  /* Paperclip test: puente verde-negro en el 24-pin */
  MODELS.paperclip = function () {
    const g = new THREE.Group();
    g.add(box(33, 11, 25, C.black));
    g.add(pins(2, 10, 3.2, 4.6, { z: 12.6 }));
    const exPts = exits(2, 10, 3.2, 4.6, 25);
    g.add(wireBundle(exPts, Array(20).fill(0x17181c), { down: 10, back: 6, radius: 0.4, spread: 2 }));
    const bridge = tube([
      new THREE.Vector3(8, 2.3, 12.6),
      new THREE.Vector3(9.6, 1.4, 13.4),
      new THREE.Vector3(11.2, -2.3, 12.6)
    ], 0.45, C.metal, 24);
    g.add(bridge);
    return g;
  };

  /* === HELPERS ADICIONALES === */
  function jumper(shellColor, wireColors, o) {
    o = o || {};
    const g = new THREE.Group();
    const shell = box(o.sw !== undefined ? o.sw : 6, o.sh !== undefined ? o.sh : 5, 4, shellColor, { roughness: 0.35 });
    g.add(shell);
    const px = o.px !== undefined ? o.px : 1.3;
    const p0 = seg(0.3, 1.4, C.gold); p0.position.set(-px, 0, 2.1);
    const p1 = seg(0.3, 1.4, C.gold); p1.position.set(px, 0, 2.1);
    g.add(p0, p1);
    g.add(wireBundle([new THREE.Vector3(0, 0, -2)], wireColors, { up: o.up, down: 9, back: 4, radius: 0.3, spread: 1.2 }));
    return g;
  }

  function usbAFemale(interiorColor) {
    const g = new THREE.Group();
    const shell = box(4.2, 2.1, 3, C.metal, { metalness: 0.8, roughness: 0.3 });
    g.add(shell);
    const inner = box(3.4, 1.4, 2.6, interiorColor || 0x17181c);
    inner.position.z = 0.3;
    g.add(inner);
    return g;
  }

  function jackFemale(color) {
    const g = new THREE.Group();
    const base = box(2.8, 2.8, 1.6, 0x9aa0ab, { roughness: 0.4 });
    g.add(base);
    const ring = cyl(1.1, 1.6, color, { seg: 20 });
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 1.2;
    g.add(ring);
    const hole = cyl(0.55, 1.1, 0x17181c, { seg: 16 });
    hole.rotation.x = Math.PI / 2;
    hole.position.z = 1.6;
    g.add(hole);
    return g;
  }

  /* F_Panel: bloque del header con jumpers conectados */
  MODELS.fpanel = function () {
    const g = new THREE.Group();
    g.add(box(66, 4, 24, C.pcb));
    const hdr = box(17, 8, 6, C.black);
    hdr.position.set(0, 2, 0);
    g.add(hdr);
    const gapX = 2.7, gapY = 2.7, w = 4 * gapX;
    for (let c = 0; c < 5; c++) {
      const p = seg(0.35, 1.6, C.gold); p.position.set(-w / 2 + c * gapX, 1.4, 3.1); g.add(p);
    }
    for (let c = 0; c < 4; c++) {
      const p = seg(0.35, 1.6, C.gold); p.position.set(-w / 2 + c * gapX, -1.3, 3.1); g.add(p);
    }
    const jumpers = [
      { x: -6.5, shell: 0x4cb057, cols: [0x4cb057, 0x17181c] },
      { x: -1.4, shell: 0xcfd3d8, cols: [0x9aa0ab, 0x17181c] },
      { x: 3.7, shell: 0xd8433d, cols: [0xd8433d, 0x9aa0ab] },
      { x: 8.8, shell: 0x3b82c4, cols: [0x3b82c4, 0x9aa0ab] }
    ];
    jumpers.forEach(j => {
      const shell = box(2.1, 2.2, 2.4, j.shell, { roughness: 0.35 });
      shell.position.set(j.x, 0.05, 2.2);
      g.add(shell);
      const p0 = seg(0.28, 1.1, C.gold); p0.position.set(j.x - 0.65, 1.4, 3); g.add(p0);
      const p1 = seg(0.28, 1.1, C.gold); p1.position.set(j.x + 0.65, -1.3, 3); g.add(p1);
      g.add(wireBundle([new THREE.Vector3(j.x, 0, 2)], j.cols, { up: true, down: 8, back: 5, radius: 0.26, spread: 0.9 }));
    });
    return g;
  };

  /* Jumpers individuales del F_Panel */
  const JUMPERS = {
    pwsw: [0x4cb057, [0x4cb057, 0x17181c], false],
    resetsw: [0xcfd3d8, [0x9aa0ab, 0x17181c], false],
    hddled: [0xd8433d, [0xd8433d, 0x9aa0ab], false],
    pwled: [0x3b82c4, [0x3b82c4, 0x9aa0ab], false]
  };
  ['pwsw', 'resetsw', 'hddled', 'pwled'].forEach(k => {
    MODELS[k] = function () {
      const d = JUMPERS[k];
      return jumper(d[0], d[1], { up: d[2] });
    };
  });

  /* USB 2.0 interno (header 9-pin) */
  MODELS['usb20-int'] = function () {
    const g = new THREE.Group();
    g.add(box(30, 3, 14, C.pcb));
    const hdr = box(12, 6, 6, C.black);
    hdr.position.set(0, 1.5, 0);
    g.add(hdr);
    const gapX = 2.2, w = 4 * gapX;
    for (let c = 0; c < 5; c++) { const p = seg(0.3, 1.4, C.gold); p.position.set(-w / 2 + c * gapX, 1.3, 3.1); g.add(p); }
    for (let c = 0; c < 4; c++) { const p = seg(0.3, 1.4, C.gold); p.position.set(-w / 2 + c * gapX, -1.2, 3.1); g.add(p); }
    const plug = box(12, 6, 5, C.black);
    plug.position.set(0, 1.5, -2.5);
    g.add(plug);
    const cable = box(6, 0.5, 22, 0x17181c);
    cable.position.set(0, 1.5, -16);
    g.add(cable);
    const a1 = usbAFemale(0x2b5bb0); a1.position.set(-6, 1.5, -26); a1.rotation.y = Math.PI / 2; g.add(a1);
    const a2 = usbAFemale(0x2b5bb0); a2.position.set(6, 1.5, -26); a2.rotation.y = Math.PI / 2; g.add(a2);
    return g;
  };

  /* USB 3.0 interno (header 19-pin) */
  MODELS['usb30-int'] = function () {
    const g = new THREE.Group();
    g.add(box(40, 3, 18, C.pcb));
    const hdr = box(18, 7, 6, C.black);
    hdr.position.set(0, 1.5, 0);
    g.add(hdr);
    const gapX = 1.7, w = 9 * gapX;
    for (let c = 0; c < 10; c++) { const p = seg(0.24, 1.4, C.gold); p.position.set(-w / 2 + c * gapX, 1.3, 3.1); g.add(p); }
    for (let c = 0; c < 9; c++) { const p = seg(0.24, 1.4, C.gold); p.position.set(-w / 2 + c * gapX, -1.2, 3.1); g.add(p); }
    const plug = box(18, 7, 5, C.black);
    plug.position.set(0, 1.5, -2.5);
    g.add(plug);
    const cable = box(8, 0.6, 24, 0x17181c);
    cable.position.set(0, 1.5, -17);
    g.add(cable);
    const a1 = usbAFemale(0x2b5bb0); a1.position.set(-7, 1.5, -28); a1.rotation.y = Math.PI / 2; g.add(a1);
    const a2 = usbAFemale(0x2b5bb0); a2.position.set(7, 1.5, -28); a2.rotation.y = Math.PI / 2; g.add(a2);
    return g;
  };

  /* HD Audio interno (header 9-pin) */
  MODELS.hdaudio = function () {
    const g = new THREE.Group();
    g.add(box(30, 3, 14, C.pcb));
    const hdr = box(12, 6, 6, C.black);
    hdr.position.set(0, 1.5, 0);
    g.add(hdr);
    const gapX = 2.2, w = 4 * gapX;
    for (let c = 0; c < 5; c++) { const p = seg(0.3, 1.4, C.gold); p.position.set(-w / 2 + c * gapX, 1.3, 3.1); g.add(p); }
    for (let c = 0; c < 4; c++) { const p = seg(0.3, 1.4, C.gold); p.position.set(-w / 2 + c * gapX, -1.2, 3.1); g.add(p); }
    const plug = box(12, 6, 5, C.black);
    plug.position.set(0, 1.5, -2.5);
    g.add(plug);
    g.add(wireBundle([new THREE.Vector3(0, 1.5, -5)], [0x2a2d36], { down: 6, back: 4, radius: 0.6, spread: 0 }));
    const jg = jackFemale(0x4cb057); jg.position.set(-4, -6, -4); g.add(jg);
    const jp = jackFemale(0xd8433d); jp.position.set(0, -6, -4); g.add(jp);
    const jb = jackFemale(0x3b82c4); jb.position.set(4, -6, -4); g.add(jb);
    return g;
  };

  /* Conector de ventilador 3-pin */
  MODELS.fan3 = function () {
    const g = new THREE.Group();
    g.add(box(5.4, 5.4, 10, C.black));
    const clip = box(3, 1.6, 2.2, C.plasticLt);
    clip.position.set(0, 3.4, -3);
    g.add(clip);
    g.add(pins(1, 3, 1.3, 0, { r: 0.3, len: 1.2, z: 5.1 }));
    g.add(wireBundle(exits(1, 3, 1.3, 0, 10), [0x17181c, 0xd8433d, 0xf6c344], { down: 10, back: 5, radius: 0.35, spread: 1.4 }));
    return g;
  };

  /* Ventilador de caja completo con cable PWM 4-pin */
  MODELS.casefan = function () {
    const g = new THREE.Group();
    const frame = new THREE.Group();
    const mk = (w, h, x, y) => { const b = box(w, h, 2.4, C.black); b.position.set(x, y, 0); return b; };
    frame.add(mk(12, 1.4, 0, 5.3));
    frame.add(mk(12, 1.4, 0, -5.3));
    frame.add(mk(1.4, 12, 5.3, 0));
    frame.add(mk(1.4, 12, -5.3, 0));
    frame.add(mk(1.4, 5.4, 5.3, 3.3));
    frame.add(mk(1.4, 5.4, 5.3, -3.3));
    frame.add(mk(1.4, 5.4, -5.3, 3.3));
    frame.add(mk(1.4, 5.4, -5.3, -3.3));
    const hub = cyl(1.7, 2.6, C.dark, { seg: 24 });
    hub.rotation.x = Math.PI / 2;
    frame.add(hub);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const blade = box(4.6, 0.26, 1.5, 0x41454f);
      blade.position.set(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0);
      blade.rotation.z = a;
      frame.add(blade);
    }
    g.add(frame);
    g.add(wireBundle([new THREE.Vector3(6.4, 3, 1)], [0x17181c, 0xf6c344, 0x4cb057, 0x3b82c4], { down: 11, back: 0, radius: 0.3, spread: 0.5 }));
    const conn = box(2.8, 2.8, 5, C.black);
    conn.position.set(6.4, -10, 1);
    g.add(conn);
    const cp = pins(1, 4, 1.1, 0, { r: 0.24, len: 1.2, z: 2.6 });
    cp.position.set(6.4, -10, 1);
    g.add(cp);
    return g;
  };

  /* Header RGB 4-pin (12V) */
  MODELS.rgb4 = function () {
    const g = new THREE.Group();
    g.add(box(7, 7, 9, C.black));
    g.add(pins(1, 4, 1.5, 0, { r: 0.32, len: 1.3, z: 4.6 }));
    g.add(wireBundle(exits(1, 4, 1.5, 0, 9), [0xf6c344, 0x4cb057, 0xd8433d, 0x3b82c4], { down: 10, back: 5, radius: 0.4, spread: 1.6 }));
    return g;
  };

  /* Header ARGB 3-pin (5V) */
  MODELS.argb3 = function () {
    const g = new THREE.Group();
    g.add(box(6, 6, 9, C.black));
    g.add(pins(1, 3, 1.5, 0, { r: 0.32, len: 1.3, z: 4.6 }));
    g.add(wireBundle(exits(1, 3, 1.5, 0, 9), [0x4cb057, 0x17181c, 0x9aa0ab], { down: 10, back: 5, radius: 0.4, spread: 1.6 }));
    return g;
  };

  /* 12VHPWR 16-pin (PCIe 5.0 / RTX 40xx) */
  MODELS['12vhpwr'] = function () {
    const g = new THREE.Group();
    g.add(box(17, 12, 12, C.black));
    g.add(pins(2, 6, 2.6, 5.2, { r: 0.55, len: 1.6, z: 6.1 }));
    const sense = new THREE.Group();
    sense.add(box(5, 5, 8, C.black));
    sense.add(pins(2, 2, 2, 2, { r: 0.3, len: 1.2, z: 4.1 }));
    sense.position.set(10.8, 3.5, 0);
    g.add(sense);
    const cols = [];
    for (let i = 0; i < 12; i++) cols.push(0x17181c, 0x17181c, 0xf6c344, 0x17181c);
    g.add(wireBundle(exits(2, 6, 2.6, 5.2, 12), cols, { down: 12, back: 6, radius: 0.45, spread: 1.8 }));
    return g;
  };

  /* ATX 20-pin legado */
  MODELS.atx20 = function () {
    const g = new THREE.Group();
    g.add(box(33, 11, 22, C.black));
    g.add(pins(2, 10, 3.2, 4.6, { z: 11.1 }));
    const clip = box(10, 2.6, 2.4, C.plasticLt);
    clip.position.set(0, -7, 5);
    g.add(clip);
    const cols = [
      0xe27d2b, 0xe27d2b, 0x17181c, 0xd8433d, 0x17181c, 0xd8433d, 0x17181c, 0x9aa0ab, 0x8a5cf5, 0xf6c344,
      0xf6c344, 0xe27d2b, 0xe27d2b, 0x3b82c4, 0x17181c, 0x4cb057, 0x17181c, 0x17181c, 0x17181c, 0xd8433d
    ];
    g.add(wireBundle(exits(2, 10, 3.2, 4.6, 22), cols, { down: 13, back: 8 }));
    return g;
  };

  /* EPS 4-pin (ATX12V auxiliar) */
  MODELS.eps4 = function () {
    const g = new THREE.Group();
    g.add(box(10, 9.5, 16, C.black));
    g.add(pins(2, 2, 3.4, 4.4, { z: 8.1 }));
    g.add(wireBundle(exits(2, 2, 3.4, 4.4, 16), [0xf6c344, 0x17181c, 0xf6c344, 0x17181c], { down: 11, back: 6 }));
    return g;
  };

  /* Cordón de corriente AC (C13/C14) */
  MODELS['ac-cable'] = function () {
    const g = new THREE.Group();
    const plug = box(8, 6, 8, 0x17181c);
    g.add(plug);
    const slot = box(3.4, 3, 1.4, 0x0d0e12);
    slot.position.set(0, 0, 4.1);
    g.add(slot);
    const pin1 = seg(0.3, 1.2, C.gold); pin1.position.set(-1.4, 1.2, 4.6); g.add(pin1);
    const pin2 = seg(0.3, 1.2, C.gold); pin2.position.set(1.4, -1.2, 4.6); g.add(pin2);
    g.add(tube([
      new THREE.Vector3(0, 0, -4),
      new THREE.Vector3(0, -2, -12),
      new THREE.Vector3(0, -8, -18)
    ], 1.2, 0x17181c, 30));
    const wp = box(8, 8, 6, 0xe4e6e9);
    wp.position.set(0, -8, -20);
    g.add(wp);
    const pr1 = box(1.6, 0.9, 2, C.metal); pr1.position.set(-2, -8, -23.5); g.add(pr1);
    const pr2 = box(1.6, 0.9, 2, C.metal); pr2.position.set(2, -8, -23.5); g.add(pr2);
    const pr3 = box(0.9, 1.6, 2, C.metal); pr3.position.set(0, -8, -23.5); g.add(pr3);
    return g;
  };

  /* Conector DC de portátil (barril) */
  MODELS['dc-jack'] = function () {
    const g = new THREE.Group();
    const barrel = cyl(1.5, 8, C.metal, { metalness: 0.8, roughness: 0.3, seg: 20 });
    barrel.rotation.x = Math.PI / 2;
    g.add(barrel);
    const tip = cyl(0.7, 2, C.metal, { metalness: 0.8, roughness: 0.3, seg: 14 });
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 5;
    g.add(tip);
    const collar = box(7, 7, 5, C.black);
    collar.position.set(0, 0, -3);
    g.add(collar);
    g.add(wireBundle([new THREE.Vector3(0, 0, -5.5)], [0x17181c], { down: 6, back: 4, radius: 0.6, spread: 0 }));
    const brick = box(12, 5, 18, C.dark, { roughness: 0.5 });
    brick.position.set(0, -9, -8);
    g.add(brick);
    const led = sphere(0.5, 0x4cb057, { transparent: true, opacity: 0.9 });
    led.position.set(5, -11.5, 8);
    g.add(led);
    g.add(tube([
      new THREE.Vector3(0, -6, -3),
      new THREE.Vector3(0, -7, 2),
      new THREE.Vector3(0, -8, 8)
    ], 0.7, 0x17181c, 20));
    return g;
  };

  /* DVI (24+1) */
  MODELS.dvi = function () {
    const g = new THREE.Group();
    const shell = box(17, 5.6, 6, 0xe9ebee, { roughness: 0.45 });
    g.add(shell);
    const inner = box(15.4, 4.2, 5, 0xb9bec7);
    inner.position.z = 0.4;
    g.add(inner);
    const rows = [8, 8, 8];
    rows.forEach((n, r) => {
      const w = (n - 1) * 1.6;
      const y = 2 - r * 1.6;
      for (let c = 0; c < n; c++) {
        const p = seg(0.26, 1.4, C.gold);
        p.position.set(-w / 2 + c * 1.6, y, 3.3);
        g.add(p);
      }
    });
    const blade = box(3, 0.8, 2, C.gold, { metalness: 0.7 });
    blade.position.set(7.2, 0, 3.3);
    g.add(blade);
    const screw = cyl(0.7, 2, C.metal, { seg: 12 });
    screw.rotation.x = Math.PI / 2;
    screw.position.set(8.6, 0, 0);
    g.add(screw);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0x9aa0ab], { down: 9, back: 4, radius: 0.75, spread: 0 }));
    return g;
  };

  /* S/PDIF Óptico (TOSLINK) */
  MODELS.toslink = function () {
    const g = new THREE.Group();
    const body = box(6.5, 6.5, 9, 0x17181c);
    g.add(body);
    const door = box(4, 4, 1, 0x0d0e12);
    door.position.set(0, 0, 4.6);
    g.add(door);
    const lens = sphere(1.3, 0xd8433d, { transparent: true, opacity: 0.85 });
    lens.position.set(0, 0, 5.1);
    g.add(lens);
    const tab = box(1.6, 3, 1.2, 0x3a3e49);
    tab.position.set(3.4, 0, 0);
    g.add(tab);
    g.add(wireBundle([new THREE.Vector3(0, 0, -4.5)], [0x17181c], { down: 8, back: 4, radius: 0.6, spread: 0 }));
    return g;
  };

  /* Bocina interna del gabinete (PC Speaker, 4-pin) */
  MODELS.speaker4 = function () {
    const g = new THREE.Group();
    const buzzer = cyl(3.2, 1.6, 0x2a2d36, { seg: 26 });
    buzzer.rotation.x = Math.PI / 2;
    g.add(buzzer);
    const hole = cyl(0.8, 1.7, 0x0d0e12, { seg: 16 });
    hole.rotation.x = Math.PI / 2;
    hole.position.z = 0.85;
    g.add(hole);
    const conn = box(5, 5, 6, C.black);
    conn.position.set(0, 0, -4);
    g.add(conn);
    g.add(pins(1, 4, 1.2, 0, { r: 0.28, len: 1.1, z: -6.9 }));
    g.add(wireBundle([new THREE.Vector3(0, 0, -1)], [0xd8433d, 0x17181c, 0x17181c, 0x9aa0ab], { down: 8, back: 2, radius: 0.3, spread: 0.8 }));
    return g;
  };

  /* Puerto PS/2 (ratón / teclado) */
  MODELS.ps2 = function () {
    const g = new THREE.Group();
    const ring = cyl(2.4, 3, 0x8a5cf5, { seg: 24, roughness: 0.4 });
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const face = cyl(1.8, 0.6, 0x6d3fb8, { seg: 20 });
    face.rotation.x = Math.PI / 2;
    face.position.z = 1.6;
    g.add(face);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = seg(0.16, 0.8, C.gold);
      p.position.set(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 2);
      g.add(p);
    }
    g.add(wireBundle([new THREE.Vector3(0, 0, -1.5)], [0x8a5cf5], { down: 7, back: 3, radius: 0.5, spread: 0 }));
    return g;
  };

  /* Puerto COM serial (DB-9) */
  MODELS.com = function () {
    const g = new THREE.Group();
    const shell = box(13, 8, 5, 0xb9bec7, { roughness: 0.4 });
    g.add(shell);
    const rows = [5, 4];
    rows.forEach((n, r) => {
      const w = (n - 1) * 2.2;
      const y = 1.5 - r * 2.2;
      for (let c = 0; c < n; c++) {
        const p = seg(0.3, 1.3, C.gold);
        p.position.set(-w / 2 + c * 2.2, y, 2.6);
        g.add(p);
      }
    });
    const screw = cyl(0.6, 1.6, C.metal, { seg: 12 });
    screw.rotation.x = Math.PI / 2;
    screw.position.set(6.5, 0, 0);
    g.add(screw);
    g.add(wireBundle([new THREE.Vector3(0, 0, -2.5)], [0x9aa0ab], { down: 7, back: 3, radius: 0.5, spread: 0 }));
    return g;
  };

  /* Panel I/O trasero de la placa (puertos) */
  MODELS['io-panel'] = function () {
    const g = new THREE.Group();
    g.add(box(36, 9, 0.9, 0xb7bcc4, { metalness: 0.65, roughness: 0.4 }));
    const c = (x, y, w, h, d, color) => {
      const p = box(w, h, d, color, { roughness: 0.3 });
      p.position.set(x, y, 0.7);
      g.add(p);
    };
    c(-12.5, 3.6, 2.4, 2.4, 1.6, 0x8a5cf5);
    c(-12.5, 0.8, 2.4, 2.4, 1.6, 0x4cb057);
    c(-12.5, -2.3, 3.4, 1.6, 1.8, 0x2b5bb0);
    c(-12.5, -4.2, 3.4, 1.6, 1.8, 0x2b5bb0);
    c(-4.5, 3.6, 4.6, 3.2, 2.4, 0x2a2d36);
    const led1 = box(0.5, 0.5, 0.6, 0xf6c344); led1.position.set(-4.5, 2.6, 2.6); g.add(led1);
    const led2 = box(0.5, 0.5, 0.6, 0x4cb057); led2.position.set(-4.5, 1.9, 2.6); g.add(led2);
    c(-4.5, 0.6, 2.8, 2.8, 1.8, 0x4cb057);
    c(-4.5, -2.0, 2.8, 2.8, 1.8, 0xd8433d);
    c(-4.5, -4.2, 2.8, 2.8, 1.8, 0x3b82c4);
    c(3.5, 3.6, 5, 1.8, 2, 0x2a2d36);
    c(3.5, 0.8, 4.8, 1.8, 2, 0x2a2d36);
    c(3.5, -1.8, 2, 1, 2, 0x9aa0ab);
    c(3.5, -4.2, 5, 3.4, 2, 0x2b5bb0);
    return g;
  };

  /* Bracket de GPU con sus puertos */
  MODELS['gpu-ports'] = function () {
    const g = new THREE.Group();
    g.add(box(26, 2, 13, 0x1c1d24));
    const bracket = box(14, 7, 1.2, C.metal, { metalness: 0.7, roughness: 0.35 });
    bracket.position.set(-8.5, 4.5, 0);
    g.add(bracket);
    const add = (y, w, h, color) => {
      const p = box(w, h, 1.4, color, { roughness: 0.3 });
      p.position.set(-8.5, y, 1.1);
      g.add(p);
    };
    add(5.4, 5, 1.8, 0x2a2d36);
    add(3.4, 4.8, 1.6, 0x2a2d36);
    add(1.4, 4.8, 1.6, 0x2a2d36);
    add(-0.6, 4.8, 1.6, 0x2a2d36);
    add(-2.8, 4.4, 1.4, 0x9aa0ab);
    return g;
  };

  /* === MODELOS DE REDES === */

  /* Par trenzado (2 hilos que se enrollan entre si) */
  function twistedPair(len, colorA, colorB, radius, o) {
    o = o || {};
    const g = new THREE.Group();
    const pts = 60;
    const aPts = [], bPts = [];
    const twist = o.twist !== undefined ? o.twist : 3;
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      const x = Math.sin(t * Math.PI * 2 * twist) * radius;
      const y = Math.cos(t * Math.PI * 2 * twist) * radius;
      const z = t * len - len / 2;
      aPts.push(new THREE.Vector3(x, y, z));
      bPts.push(new THREE.Vector3(-x, -y, z));
    }
    g.add(tube(aPts, 0.11, colorA, 40));
    g.add(tube(bPts, 0.11, colorB, 40));
    return g;
  }

  /* Cable UTP con los 4 pares trenzados visibles */
  MODELS.utp = function () {
    const g = new THREE.Group();
    const len = 26;
    const pairs = [
      [0xe27d2b, 0xe9ebee], [0x4cb057, 0xe9ebee],
      [0x3b82c4, 0xe9ebee], [0x7a4e26, 0xe9ebee]
    ];
    pairs.forEach((p, i) => {
      const ang = (i / 4) * Math.PI * 2;
      const holder = new THREE.Group();
      holder.add(twistedPair(len, p[0], p[1], 0.3, { twist: 4 }));
      holder.position.set(Math.cos(ang) * 0.85, Math.sin(ang) * 0.85, 0);
      g.add(holder);
    });
    const jacket = tube([
      new THREE.Vector3(0, 0, -len / 2 - 1),
      new THREE.Vector3(0, 0, len / 2 + 1)
    ], 1.6, 0x3a3e49, 14);
    jacket.material.transparent = true;
    jacket.material.opacity = 0.45;
    g.add(jacket);
    return g;
  };

  /* Cable coaxial (corte con capas) */
  MODELS.coaxial = function () {
    const g = new THREE.Group();
    const len = 26;
    const core = cyl(0.35, len, 0xc98a3d, { metalness: 0.6, seg: 20 });
    core.rotation.x = Math.PI / 2;
    g.add(core);
    const dielectric = cyl(1.0, len, 0xe8e2d0, { transparent: true, opacity: 0.55, seg: 22 });
    dielectric.rotation.x = Math.PI / 2;
    g.add(dielectric);
    const shield = cyl(1.25, len, 0x9aa0ab, { metalness: 0.8, roughness: 0.4, transparent: true, opacity: 0.6, seg: 22 });
    shield.rotation.x = Math.PI / 2;
    g.add(shield);
    const jacket = cyl(1.7, len, 0x17181c, { transparent: true, opacity: 0.5, seg: 24 });
    jacket.rotation.x = Math.PI / 2;
    g.add(jacket);
    return g;
  };

  /* Conector F (coaxial) */
  MODELS['coax-fconn'] = function () {
    const g = new THREE.Group();
    const core = cyl(0.35, 14, 0xc98a3d, { metalness: 0.6, seg: 16 });
    core.rotation.x = Math.PI / 2;
    g.add(core);
    const dielectric = cyl(1.0, 14, 0xe8e2d0, { transparent: true, opacity: 0.5, seg: 18 });
    dielectric.rotation.x = Math.PI / 2;
    g.add(dielectric);
    const shield = cyl(1.25, 14, 0x9aa0ab, { metalness: 0.8, roughness: 0.4, seg: 18 });
    shield.rotation.x = Math.PI / 2;
    g.add(shield);
    const jacket = cyl(1.7, 14, 0x17181c, { seg: 20 });
    jacket.rotation.x = Math.PI / 2;
    g.add(jacket);
    const body = cyl(1.5, 5, C.metal, { metalness: 0.85, roughness: 0.3, seg: 20 });
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0, 9);
    g.add(body);
    const nut = cyl(1.9, 2.5, 0x8a8f98, { metalness: 0.85, roughness: 0.4, seg: 6 });
    nut.rotation.x = Math.PI / 2;
    nut.position.set(0, 0, 11.5);
    g.add(nut);
    const pin = cyl(0.28, 2, 0xc98a3d, { metalness: 0.7, seg: 14 });
    pin.rotation.x = Math.PI / 2;
    pin.position.set(0, 0, 12.5);
    g.add(pin);
    return g;
  };

  /* Fibra optica con conector SC (multimodo = verde) */
  MODELS['fiber-sc'] = function () {
    const g = new THREE.Group();
    const cable = cyl(1.1, 22, 0xe27d2b, { roughness: 0.4, seg: 20 });
    cable.rotation.x = Math.PI / 2;
    g.add(cable);
    const boot = cyl(1.0, 2.5, 0x17181c, { seg: 16 });
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, 0, 11);
    g.add(boot);
    const body = box(2.2, 2.2, 5, 0x2a2d36);
    body.position.set(0, 0, 14);
    g.add(body);
    const tip = box(1.5, 1.5, 1.6, 0x4cb057, { roughness: 0.35 });
    tip.position.set(0, 0, 17);
    g.add(tip);
    const ferrule = cyl(0.3, 1.4, 0xe9ebee, { metalness: 0.4, seg: 12 });
    ferrule.rotation.x = Math.PI / 2;
    ferrule.position.set(0, 0, 18);
    g.add(ferrule);
    return g;
  };

  /* Fibra duplex LC (azul = monomodo) */
  MODELS['fiber-lc'] = function () {
    const g = new THREE.Group();
    [-2.2, 2.2].forEach(x => {
      const body = box(1.8, 2, 4.5, 0x17181c);
      body.position.set(x, 0, 0);
      g.add(body);
      const tip = box(1.1, 1.1, 1.4, 0x2b5bb0, { roughness: 0.3 });
      tip.position.set(x, 0, 2.8);
      g.add(tip);
      const ferrule = cyl(0.28, 1.2, 0xe9ebee, { metalness: 0.4, seg: 12 });
      ferrule.rotation.x = Math.PI / 2;
      ferrule.position.set(x, 0, 3.8);
      g.add(ferrule);
      const clip = box(1.9, 0.7, 1.2, 0x9aa0ab);
      clip.position.set(x, 1.2, -0.5);
      g.add(clip);
    });
    const holder = box(2.2, 1, 3, 0x2a2d36);
    holder.position.set(0, 0, -1.5);
    g.add(holder);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0xe27d2b], { down: 6, back: 2, radius: 0.5, spread: 0 }));
    return g;
  };

  /* Fibra ST (bayoneta, legacy) */
  MODELS['fiber-st'] = function () {
    const g = new THREE.Group();
    const cable = cyl(1, 14, 0x17181c, { seg: 18 });
    cable.rotation.x = Math.PI / 2;
    g.add(cable);
    const body = cyl(1.6, 4, 0x2a2d36, { seg: 18 });
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0, 8);
    g.add(body);
    const collar = cyl(2.2, 1.6, C.metal, { metalness: 0.85, roughness: 0.3, seg: 12 });
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, 10);
    g.add(collar);
    const ferrule = cyl(0.3, 2, 0xe9ebee, { metalness: 0.4, seg: 12 });
    ferrule.rotation.x = Math.PI / 2;
    ferrule.position.set(0, 0, 11.5);
    g.add(ferrule);
    return g;
  };

  /* RJ-11 (telefono, 6P4C) */
  MODELS.rj11 = function () {
    const g = new THREE.Group();
    const shell = box(10, 6.5, 13, 0x17181c, { transparent: true, opacity: 0.55 });
    g.add(shell);
    const core = box(8, 5, 11, 0x0d0e12);
    core.position.set(0, 0.3, 0);
    g.add(core);
    for (let c = 0; c < 4; c++) {
      const p = box(0.7, 0.3, 2.2, C.gold, { metalness: 0.7, roughness: 0.3 });
      p.position.set(-3 * 0.5 + c * 0.9, 1.6, 6);
      p.rotation.z = -0.05;
      g.add(p);
    }
    const latch = box(10, 2, 2.4, 0x3a3e49);
    latch.position.set(0, -3.4, 4);
    g.add(latch);
    const cols = [0xd8433d, 0x4cb057, 0x17181c, 0xf6c344];
    const w = 3 * 0.9;
    for (let c = 0; c < 4; c++) {
      const wire = seg(0.3, 6, cols[c]);
      wire.position.set(-w / 2 + c * 0.9, -1.2, -8.5);
      g.add(wire);
    }
    return g;
  };

  /* Jack keystone RJ-45 hembra (placa de pared) */
  MODELS.keystone = function () {
    const g = new THREE.Group();
    const plate = box(18, 12, 1.6, 0xe9ebee, { roughness: 0.45 });
    g.add(plate);
    const insert = box(7, 6, 3, 0x2a2d36);
    insert.position.set(0, 0, 1);
    g.add(insert);
    const cavity = box(5.2, 3.8, 2.2, 0x0d0e12);
    cavity.position.set(0, 0, 2.2);
    g.add(cavity);
    for (let c = 0; c < 8; c++) {
      const p = box(0.45, 0.28, 1.4, C.gold, { metalness: 0.7, roughness: 0.3 });
      p.position.set(-3.5 * 0.5 + c * 0.5, 0, 2.9);
      p.rotation.x = -0.5;
      g.add(p);
    }
    const screw = cyl(0.5, 0.8, C.metal, { seg: 12 });
    screw.rotation.x = Math.PI / 2;
    screw.position.set(-7.5, 0, 0.5);
    g.add(screw);
    return g;
  };

  /* Panel de parcheo (patch panel) con puertos RJ-45 */
  MODELS['patch-panel'] = function () {
    const g = new THREE.Group();
    const panel = box(36, 10, 2, 0x2a2d36);
    g.add(panel);
    const cols = 8;
    for (let i = 0; i < cols; i++) {
      const x = -15 + (i + 0.5) * (30 / cols);
      const port = box(3, 2.6, 1.4, 0x0d0e12);
      port.position.set(x, 2, 1.5);
      g.add(port);
      for (let c = 0; c < 8; c++) {
        const p = box(0.28, 0.2, 0.6, C.gold, { metalness: 0.7 });
        p.position.set(x - 1.4 + c * 0.4, 2, 2.2);
        g.add(p);
      }
    }
    [-15, 15].forEach(x => {
      const led = box(0.4, 0.4, 0.4, 0x4cb057);
      led.position.set(x, -3.5, 1.6);
      g.add(led);
    });
    return g;
  };

  /* Tarjeta de red (NIC) con puerto RJ-45 y LEDs */
  MODELS['nic-port'] = function () {
    const g = new THREE.Group();
    g.add(box(18, 12, 1.8, C.pcb));
    const bracket = box(8, 10, 1, C.metal, { metalness: 0.7, roughness: 0.35 });
    bracket.position.set(10, 2, 0);
    g.add(bracket);
    const port = box(5, 4, 3, 0x2a2d36);
    port.position.set(10, 2, 2);
    g.add(port);
    const cavity = box(4.2, 3, 2.4, 0x0d0e12);
    cavity.position.set(10, 2, 3);
    g.add(cavity);
    for (let c = 0; c < 8; c++) {
      const p = box(0.34, 0.22, 0.9, C.gold, { metalness: 0.7 });
      p.position.set(10 - 1.6 + c * 0.45, 2, 3.9);
      g.add(p);
    }
    const led1 = box(0.5, 0.5, 0.5, 0xf6c344);
    led1.position.set(10, 0.6, 2);
    g.add(led1);
    const led2 = box(0.5, 0.5, 0.5, 0x4cb057);
    led2.position.set(10, -0.6, 2);
    g.add(led2);
    const edge = box(4, 0.6, 12, C.gold, { metalness: 0.6 });
    edge.position.set(-2, -6.2, 0);
    g.add(edge);
    const chip = box(5, 1.6, 5, C.black);
    chip.position.set(-3, 1, 0);
    g.add(chip);
    return g;
  };

  /* Router: puertos WAN/LAN + antenas + LEDs */
  MODELS['router-back'] = function () {
    const g = new THREE.Group();
    g.add(box(24, 5, 12, 0x2a2d36));
    [-10, 10].forEach(x => {
      const ant = box(1, 5, 1, 0x3a3e49);
      ant.position.set(x, 4, 0);
      ant.rotation.x = 0.5;
      g.add(ant);
      const base = cyl(0.9, 1, 0x3a3e49, { seg: 12 });
      base.position.set(x, 0.5, 0);
      g.add(base);
    });
    const z = -6.2;
    const wan = box(4, 3, 1.2, 0x17181c);
    wan.position.set(-8, 0, z);
    g.add(wan);
    for (let i = 0; i < 4; i++) {
      const port = box(3.4, 2.6, 1.2, 0x17181c);
      port.position.set(-1 + i * 4, 0, z);
      g.add(port);
    }
    const usb = box(2.4, 1.6, 1.2, 0x2b5bb0);
    usb.position.set(15, -0.5, z);
    g.add(usb);
    [8, 9, 10, 11, 12].forEach(x => {
      const led = box(0.5, 0.3, 0.4, 0x4cb057);
      led.position.set(x, 1, 6.1);
      g.add(led);
    });
    return g;
  };

  /* Switch con puertos RJ-45 y puertos SFP */
  MODELS['switch-sfp'] = function () {
    const g = new THREE.Group();
    g.add(box(40, 6, 20, 0x2a2d36));
    const z = -10.5;
    for (let i = 0; i < 8; i++) {
      const port = box(4.6, 3, 1.4, 0x17181c);
      port.position.set(-26 + i * 7.4, 0, z);
      g.add(port);
    }
    [-26, -22, -18].forEach(x => {
      const sfp = box(2.6, 3, 4, 0x0d0e12);
      sfp.position.set(x, 0, z - 2);
      g.add(sfp);
    });
    const mod = box(2.2, 2.4, 5, 0x8a5cf5);
    mod.position.set(-22, 0, z - 5);
    g.add(mod);
    const lc1 = box(1.1, 1.1, 1.2, 0x2b5bb0);
    lc1.position.set(-22.6, 0, z - 7.4);
    g.add(lc1);
    const lc2 = box(1.1, 1.1, 1.2, 0x2b5bb0);
    lc2.position.set(-21.4, 0, z - 7.4);
    g.add(lc2);
    return g;
  };

  /* === CONSTRUCCION DE CADA VISOR === */
  function buildModel(name, group) {
    const fn = MODELS[name];
    if (!fn) {
      group.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), M(C.gray)));
      return false;
    }
    const obj = fn();
    obj.traverse(o => { if (o.isMesh) o.castShadow = true; });
    group.add(obj);
    return true;
  }

  /* === CONTROLES ORBITALES MINIMOS === */
  function attachControls(stage, camera) {
    const target = new THREE.Vector3();
    let sph = new THREE.Spherical().setFromVector3(camera.position.clone());
    const pointers = new Map();
    let pinchStart = null;
    let interacted = false;

    function apply() {
      camera.position.setFromSpherical(sph).add(target);
      camera.lookAt(target);
    }

    stage.addEventListener('pointerdown', (e) => {
      interacted = true;
      stage.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, dist: 0 });
      if (pointers.size === 2) {
        const a = [...pointers.values()];
        pinchStart = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      }
    });
    stage.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        sph.theta -= dx * 0.008;
        sph.phi = Math.max(0.15, Math.min(Math.PI - 0.15, sph.phi - dy * 0.008));
        apply();
      } else if (pointers.size === 2 && pinchStart) {
        const a = [...pointers.values()];
        const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
        sph.radius *= pinchStart / Math.max(1, d);
        pinchStart = d;
        apply();
      }
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = null;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('wheel', (e) => {
      interacted = true;
      e.preventDefault();
      sph.radius *= 1 + Math.sign(e.deltaY) * 0.08;
      sph.radius = Math.max(4, Math.min(80, sph.radius));
      apply();
    }, { passive: false });

    return {
      get interacted() { return interacted; },
      setInteracted() { interacted = true; },
      update() { apply(); }
    };
  }

  /* === INICIALIZACION CON POOL DE CONTEXTOS === */
  const POOL_MAX = 6;
  const pool = new Set();
  const waiting = [];

  function initViewer(el) {
    const stage = el.querySelector('.three-stage');
    if (!stage) return;
    const name = el.dataset.model;
    const title = el.dataset.title || name;
    const modelName = (name || '').trim();

    let built = false, disposed = false, renderer = null, raf = 0;
    let camera, scene, controls, autoRotate = true;

    function dispose() {
      if (!built) return;
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      pool.delete(el);
      built = false;
      pump();
    }

    function build() {
      if (built || disposed) return;
      let rendererLocal;
      try {
        rendererLocal = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch (err) {
        stage.innerHTML = '<div class="three-fallback">Tu navegador no soporta WebGL.</div>';
        return;
      }
      renderer = rendererLocal;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(stage.clientWidth || 240, stage.clientHeight || 220);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      stage.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.1);
      d1.position.set(8, 12, 10);
      scene.add(d1);
      const d2 = new THREE.DirectionalLight(0x8899ff, 0.35);
      d2.position.set(-8, -4, -6);
      scene.add(d2);

      const root = new THREE.Group();
      const ok = buildModel(modelName, root);
      if (!ok) {
        stage.innerHTML = '<div class="three-fallback">Modelo no encontrado.</div>';
        renderer.dispose();
        return;
      }
      if (modelName === 'rj45' && root.children[0] && root.children[0].userData.setOrder) {
        const mode = el.dataset.mode === 'a' ? 'T568A' : 'T568B';
        root.children[0].userData.setOrder(mode);
      }
      const bb = new THREE.Box3().setFromObject(root);
      const center = bb.getCenter(new THREE.Vector3());
      root.position.sub(center);
      scene.add(root);

      const size = bb.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 10;
      camera = new THREE.PerspectiveCamera(42, (stage.clientWidth || 240) / (stage.clientHeight || 220), 0.1, 500);
      const dist = (maxDim / 2) / Math.tan((42 * Math.PI) / 360) * 1.35;
      camera.position.set(dist * 0.7, dist * 0.55, dist);
      camera.lookAt(0, 0, 0);

      controls = attachControls(stage, camera);
      built = true;

      /* botones interactivos: [data-wire-order] (cambio de orden) y [data-norm] (T568A/B) */
      el.querySelectorAll('[data-wire-order]').forEach(btn => {
        btn.addEventListener('click', () => {
          controls.setInteracted();
          el.querySelectorAll('[data-wire-order]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const target = root.children.find(c => c.userData && c.userData.setOrder);
          if (target) target.userData.setOrder(btn.dataset.wireOrder);
        });
      });
      el.querySelectorAll('[data-norm]').forEach(btn => {
        btn.addEventListener('click', () => {
          controls.setInteracted();
          el.dataset.mode = btn.dataset.norm;
          el.querySelectorAll('[data-norm]').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const target = root.children.find(c => c.userData && c.userData.setOrder);
          if (target) target.userData.setOrder(btn.dataset.norm === 'a' ? 'T568A' : 'T568B');
        });
      });

      function animate() {
        if (!built) return;
        if (autoRotate && !controls.interacted) {
          root.rotation.y += 0.004;
        }
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      }
      animate();

      const ro = new ResizeObserver(() => {
        if (!built) return;
        const w = stage.clientWidth, h = stage.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(stage);
      el._ro = ro;
    }

    function pump() {
      while (pool.size < POOL_MAX && waiting.length) {
        const item = waiting.shift();
        item.build();
        pool.add(item.el);
      }
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (pool.size >= POOL_MAX) {
            if (!waiting.includes(el)) waiting.push({ el, build });
          } else {
            build();
            pool.add(el);
          }
        } else {
          dispose();
        }
      });
    }, { rootMargin: '80px' });
    io.observe(stage);

    window.addEventListener('pagehide', dispose);
  }

  function init() {
    document.querySelectorAll('.three-canvas').forEach(initViewer);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
