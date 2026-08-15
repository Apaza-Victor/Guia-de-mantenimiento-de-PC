/* ============================================================
   TECHGUIDE - cables-3d.js
   Visualizadores 3D de cables y conectores (Three.js)
   Uso:
     <div class="three-canvas" data-model="atx24" data-title="ATX 24-pin">
       <div class="three-stage"></div>
       <div class="three-bar"><span class="three-title">...</span></div>
     </div>
   Modelos disponibles: atx24, atx20, eps8, eps4, eps_pcie, pcie62,
    12vhpwr, sata-power, sata-data, molex, berg, ide, m2, hdmi,
    hdmi-mini (Tipo C), hdmi-micro (Tipo D), dp, minidp (Mini DP),
    dvi, vga, svideo, rca-video, ypbpr (componentes), adapter-hdmi-vga,
    usb-a, usb-b, usb-c, usb20-int, usb30-int, jack35,
    toslink, fan4, fan3, casefan, rgb4, argb3, fpanel, pwsw, resetsw,
    hddled, pwled, hdaudio, speaker4, ps2, com, rj45 (T568A/B),
    paperclip, io-panel, gpu-ports, ac-cable, dc-jack, atx-colors.
    Componentes: resistor, capacitor, transistor, diode, led, inductor,
    ic-chip, crystal, fuse, potentiometer, thermistor, varistor, relay,
    transformer, pushbutton, buzzer, photoresistor.
    Chips de placa: bios-chip, audio-chip, lan-chip, wifi-m2.
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
    Redes avanzadas: routing-topo, switch-vlan, vlan-trunk, hub-vs-switch.
    Mantenimiento: ups, backup-321, plan-calendar.
    Refrigeracion: aio-cooler, air-cooler, liquid-loop.
   El visor dibuja SOLO el conector macho / cable. El puerto hembra
   lo dibuja visuals-2d.js (2D, SVG) cuando este flag esta presente:
   window.__CABLES3D__ = true (se define abajo al cargar).
   ============================================================ */

(function () {
  window.__CABLES3D__ = true;
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
  /* Esfera emisiva (luz que viaja por la fibra) */
  function glow(r, color) {
    const m = M(color);
    m.emissive = new THREE.Color(color);
    m.emissiveIntensity = 1;
    return new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), m);
  }

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
    g.add(box(38, 11, 24, C.black, { roughness: 0.4 }));
    g.add(pins(2, 12, 3.1, 4.6, { z: 24 / 2 + 0.1 }));
    const clip = box(11, 2.6, 2.4, C.plasticLt);
    clip.position.set(0, -7, 5);
    g.add(clip);
    const wireColors = [
      0xe27d2b, 0xe27d2b, 0x17181c, 0xd8433d, 0x17181c, 0xd8433d, 0x17181c, 0x9aa0ab, 0x8a5cf5, 0xf6c344, 0xf6c344, 0xe27d2b,
      0xe27d2b, 0x3b82c4, 0x17181c, 0x4cb057, 0x17181c, 0x17181c, 0x17181c, 0xe9ebee, 0xd8433d, 0xd8433d, 0xd8433d, 0x17181c
    ];
    g.add(wireBundle(exits(2, 12, 3.1, 4.6, 24), wireColors, { down: 13, back: 8 }));
    return g;
  };

  /* Bloque ATX de 4 pines (parte desmontable del 20+4) */
  MODELS.atx4 = function () {
    const g = new THREE.Group();
    g.add(box(10, 11, 24, C.black, { roughness: 0.4 }));
    g.add(pins(2, 2, 3.1, 4.6, { z: 24 / 2 + 0.1 }));
    const clip = box(4, 2.6, 2.4, C.plasticLt);
    clip.position.set(0, -7, 5);
    g.add(clip);
    g.add(wireBundle(exits(2, 2, 3.1, 4.6, 24), [0xf6c344, 0x17181c, 0xf6c344, 0x17181c], { down: 13, back: 8 }));
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

  /* Molex 4-pin (plano, horizontal y ancho) */
  MODELS.molex = function () {
    const g = new THREE.Group();
    const body = box(17, 4.4, 21, 0xe4e6e9, { roughness: 0.35 });
    g.add(body);
    const step = box(17, 2, 21, 0xccd0d6, { roughness: 0.4 });
    step.position.set(0, 3.2, 0);
    g.add(step);
    const tab = box(5, 1.2, 2.6, 0xccd0d6);
    tab.position.set(8.4, 0.8, -7);
    g.add(tab);
    const key = box(2.4, 2.2, 1.8, 0xb9bdc4);
    key.position.set(-4.4, 0, 10.6);
    g.add(key);
    g.add(pins(1, 4, 4.4, 0, { r: 0.68, len: 1.5, z: 10.6, color: C.gold }));
    g.add(wireBundle(exits(1, 4, 4.4, 0, 21), [0xf6c344, 0x17181c, 0x17181c, 0xd8433d], { down: 11, back: 8, radius: 0.55, spread: 2.4 }));
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

  /* SATA Data (7 pines) con perfil en forma de L */
  MODELS['sata-data'] = function () {
    const g = new THREE.Group();
    const stem = box(12, 5.2, 5.6, 0x2a2d36);
    stem.position.set(0, 1, 0);
    g.add(stem);
    const foot = box(12, 2, 5.6, 0x2a2d36);
    foot.position.set(0, -2.1, 0);
    g.add(foot);
    const lip = box(12, 1.4, 1.4, 0x1a1c22);
    lip.position.set(0, 3.6, 2.1);
    g.add(lip);
    g.add(pins(1, 7, 1.4, 0, { r: 0.3, len: 1.1, z: 2.9, color: C.gold }));
    const cable = box(2.4, 0.5, 26, 0x3a3e49);
    cable.position.set(0, 0, -15);
    g.add(cable);
    return g;
  };

  /* SSD 2.5" conectado con cable SATA de datos (conector tipo L) y alimentacion */
  MODELS['ssd-sata'] = function () {
    const g = new THREE.Group();
    const ssd = box(22, 13.5, 1.5, C.pcbDark, { roughness: 0.5 });
    ssd.position.set(0, -2, 0);
    g.add(ssd);
    const label = box(14, 9, 0.4, 0x2a2d36);
    label.position.set(0, -2, 1);
    g.add(label);
    const dataPort = box(4, 2.4, 1, C.dark);
    dataPort.position.set(-3, -9.2, 1);
    g.add(dataPort);
    const powerPort = box(6, 2.4, 1, C.dark);
    powerPort.position.set(4, -9.2, 1);
    g.add(powerPort);
    const dataCable = box(3.2, 0.5, 16, 0x3a3e49);
    dataCable.position.set(-3, -8.2, 9);
    g.add(dataCable);
    const stem = box(12, 5.2, 5.6, 0x2a2d36);
    stem.position.set(-3, -5.2, 17);
    g.add(stem);
    const foot = box(12, 2, 5.6, 0x2a2d36);
    foot.position.set(-3, -8.3, 17);
    g.add(foot);
    const lip = box(12, 1.4, 1.4, 0x1a1c22);
    lip.position.set(-3, -2.6, 19.1);
    g.add(lip);
    g.add(pins(1, 7, 1.4, 0, { r: 0.3, len: 1.1, z: 19.9, color: C.gold }));
    const pw = box(23, 0.5, 4.2, 0x3a3e49);
    pw.position.set(4, -8.2, 6);
    g.add(pw);
    const pwLip = box(6, 2.4, 1, C.plasticLt);
    pwLip.position.set(4, -8.6, 8.2);
    g.add(pwLip);
    return g;
  };

  /* Adaptador Molex -> ventilador de 3 pines */
  MODELS['molex-fan'] = function () {
    const g = new THREE.Group();
    const body = box(8, 3.2, 6, C.plastic, { roughness: 0.4 });
    body.position.set(0, 0, 0);
    g.add(body);
    g.add(pins(1, 2, 2.2, 0, { r: 0.5, len: 1.2, z: 3.1, color: C.gold }));
    const red = tube([
      new THREE.Vector3(-2.4, 0, -3),
      new THREE.Vector3(-2.4, 2, -8),
      new THREE.Vector3(-2.4, 2, -12)
    ], 0.4, 0xd8433d);
    g.add(red);
    const yel = tube([
      new THREE.Vector3(0, 0, -3),
      new THREE.Vector3(0, 2, -8),
      new THREE.Vector3(0, 2, -12)
    ], 0.4, 0xf6c344);
    g.add(yel);
    const blk = tube([
      new THREE.Vector3(2.4, 0, -3),
      new THREE.Vector3(2.4, 2, -8),
      new THREE.Vector3(2.4, 2, -12)
    ], 0.4, 0x17181c);
    g.add(blk);
    const fbody = box(5, 5, 3.4, C.black);
    fbody.position.set(0, 2, -14);
    g.add(fbody);
    g.add(pins(1, 3, 1.6, 0, { r: 0.28, len: 1.2, z: -12.2 }));
    const fanbox = box(10, 10, 2, C.black);
    fanbox.position.set(0, 2, -17);
    g.add(fanbox);
    const hub = cyl(1.2, 2.2, C.dark, { seg: 18 });
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, 2, -17);
    g.add(hub);
    return g;
  };

  /* Adaptador Molex -> tira LED / luces frontales (2 pines) */
  MODELS['molex-led'] = function () {
    const g = new THREE.Group();
    const body = box(8, 3.2, 6, C.plastic, { roughness: 0.4 });
    g.add(body);
    g.add(pins(1, 2, 2.2, 0, { r: 0.5, len: 1.2, z: 3.1, color: C.gold }));
    const red = tube([
      new THREE.Vector3(-1.1, 0, -3),
      new THREE.Vector3(-1.1, 0, -10),
      new THREE.Vector3(-1.1, 0, -14)
    ], 0.4, 0xd8433d);
    g.add(red);
    const blk = tube([
      new THREE.Vector3(1.1, 0, -3),
      new THREE.Vector3(1.1, 0, -10),
      new THREE.Vector3(1.1, 0, -14)
    ], 0.4, 0x17181c);
    g.add(blk);
    const head = box(5, 2.4, 2.6, C.black);
    head.position.set(0, 0, -15.5);
    g.add(head);
    const pin1 = seg(0.24, 1.4, C.gold);
    pin1.position.set(-0.7, 0, -16.8);
    g.add(pin1);
    const pin2 = seg(0.24, 1.4, C.gold);
    pin2.position.set(0.7, 0, -16.8);
    g.add(pin2);
    const strip = box(2, 0.8, 8, 0x3a3e49);
    strip.position.set(0, 0, -21);
    g.add(strip);
    for (let i = 0; i < 3; i++) {
      const led = sphere(0.5, 0x4cb057, { transparent: true, opacity: 0.9 });
      led.position.set(0, 0, -18.6 + i * 1.6);
      g.add(led);
    }
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
    /* funda metalica trapezoidal (10 pines arriba, 9 abajo) */
    const sleeveB = box(14, 2.6, 5.2, C.metal, { metalness: 0.85, roughness: 0.3 });
    sleeveB.position.y = -0.9;
    g.add(sleeveB);
    const sleeveT = box(12.6, 1.9, 5.2, C.metal, { metalness: 0.85, roughness: 0.3 });
    sleeveT.position.y = 1.3;
    g.add(sleeveT);
    const inner = box(11.6, 3.4, 4.6, 0x17181c);
    inner.position.z = 0.4;
    g.add(inner);
    const pins = new THREE.Group();
    const rows = [10, 9];
    rows.forEach((n, r) => {
      const w = (n - 1) * 1.1;
      for (let c = 0; c < n; c++) {
        const p = seg(0.16, 1.5, C.gold);
        p.position.set(-w / 2 + c * 1.1, r === 0 ? 1.15 : -1.15, 3.4);
        pins.add(p);
      }
    });
    g.add(pins);
    /* muesca (key) lateral del conector */
    const notch = box(1.5, 1.1, 0.9, 0x0d0f14);
    notch.position.set(-6.3, 0.8, 2.6);
    g.add(notch);
    /* molde del cable */
    const mold = box(8.5, 4.4, 3, 0x17181c, { roughness: 0.6 });
    mold.position.set(0, 0, -3.3);
    g.add(mold);
    g.add(wireBundle([new THREE.Vector3(0, 0, -5)], [0x17181c], { down: 10, back: 5, radius: 0.85, spread: 0 }));
    return g;
  };

  /* DisplayPort (20 pines) */
  MODELS.dp = function () {
    const g = new THREE.Group();
    const sleeve = box(12.4, 4.6, 6.2, C.metal, { metalness: 0.85, roughness: 0.3 });
    g.add(sleeve);
    const inner = box(10.8, 3.4, 5.4, 0x17181c);
    inner.position.z = 0.4;
    g.add(inner);
    const w = 19 * 0.5;
    for (let c = 0; c < 20; c++) {
      const p = seg(0.15, 1.5, C.gold);
      p.position.set(-w / 2 + c * 0.5, 0, 3.6);
      g.add(p);
    }
    /* pestana superior (latch) */
    const latch = box(6, 1.5, 1.6, 0x8a5cf5);
    latch.position.set(0, 3.1, 3);
    g.add(latch);
    /* escalon inferior caracteristico del DP */
    const step = box(11.6, 1.2, 6.2, C.metal, { metalness: 0.8, roughness: 0.35 });
    step.position.set(0, -2.9, 0);
    g.add(step);
    /* molde del cable */
    const mold = box(8, 4.8, 3, 0x17181c, { roughness: 0.6 });
    mold.position.set(0, 0, -3.6);
    g.add(mold);
    g.add(wireBundle([new THREE.Vector3(0, 0, -5.4)], [0x17181c], { down: 10, back: 5, radius: 0.85, spread: 0 }));
    return g;
  };

  /* VGA (D-Sub 15, azul) */
  MODELS.vga = function () {
    const g = new THREE.Group();
    /* concha trapezoidal azul en 3 tramos */
    const b1 = box(16, 3.2, 6, 0x2b5bb0, { roughness: 0.45 });
    b1.position.y = -2.9;
    g.add(b1);
    const b2 = box(15.2, 3.2, 6, 0x2b5bb0, { roughness: 0.45 });
    b2.position.y = -0.2;
    g.add(b2);
    const b3 = box(14.4, 3.2, 6, 0x2b5bb0, { roughness: 0.45 });
    b3.position.y = 2.5;
    g.add(b3);
    const trap = box(14, 1.6, 1.2, 0x1d3f7a);
    trap.position.set(0, 4.9, 3.2);
    g.add(trap);
    const rows = [5, 5, 5];
    rows.forEach((n, r) => {
      const w = (n - 1) * 2.4;
      const y = 3.2 - r * 2.2;
      for (let c = 0; c < n; c++) {
        const p = seg(0.42, 1.8, C.gold);
        p.position.set(-w / 2 + c * 2.4, y, 3.5);
        g.add(p);
      }
    });
    /* tornillos moleteados a ambos lados */
    [-1, 1].forEach(s => {
      const thumb = cyl(1.7, 4, C.metal, { seg: 16 });
      thumb.rotation.x = Math.PI / 2;
      thumb.position.set(s * 9, -4.6, 0);
      g.add(thumb);
      const knurl = cyl(1.95, 1.3, 0x9aa0ab, { seg: 16 });
      knurl.rotation.x = Math.PI / 2;
      knurl.position.set(s * 9, -4.6, 1.9);
      g.add(knurl);
    });
    /* molde del cable */
    const mold = box(10, 7, 3, 0x1d3f7a, { roughness: 0.5 });
    mold.position.set(0, 0.4, -3.3);
    g.add(mold);
    g.add(wireBundle([new THREE.Vector3(0, 0, -5)], [0x2b5bb0], { down: 9, back: 4, radius: 0.8, spread: 0 }));
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

  /* Colores de puertos USB y su velocidad */
  MODELS['usb-colors'] = function () {
    const g = new THREE.Group();
    const specs = [
      ['USB 2.0', 0x17181c],
      ['USB 3.0', 0x3b82c4],
      ['USB 3.1', 0x3bc2c9],
      ['USB 3.2', 0xd8433d]
    ];
    specs.forEach((s, i) => {
      const y = (i - (specs.length - 1) / 2) * 7.5;
      const sleeve = box(18, 5.4, 5.8, s[1], { roughness: 0.3 });
      sleeve.position.set(0, y, 0);
      g.add(sleeve);
      const inner = box(16, 4, 5.2, 0x17181c);
      inner.position.set(0, y, 0.3);
      g.add(inner);
      const gold = box(16, 0.9, 0.7, C.gold, { metalness: 0.7 });
      gold.position.set(0, y - 1.2, 3.3);
      g.add(gold);
      g.add(wireBundle([new THREE.Vector3(0, y, -3)], [s[1]], { down: 7, back: 4, radius: 0.5, spread: 0 }));
    });
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

  /* Crimpadora RJ-45 (ponchadora manual) con un conector siendo ponchado */
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
    /* RJ-45 siendo ponchado: carcasa transparente con contactos dorados visibles */
    const plugShell = box(6, 4.4, 8, 0x0d0e12, { transparent: true, opacity: 0.32, roughness: 0.2 });
    plugShell.position.set(21.5, 0, 0);
    g.add(plugShell);
    const plugCore = box(4.8, 3.2, 6.4, 0x0d0e12);
    plugCore.position.set(21.5, 0, 0);
    g.add(plugCore);
    for (let c = 0; c < 8; c++) {
      const p = box(0.48, 0.2, 1.7, C.gold, { metalness: 0.8, roughness: 0.3 });
      p.position.set(-3.5 * 0.48 + c * 0.48, 1.4, 0);
      p.rotation.x = -0.12;
      g.add(p);
    }
    const wireCols = [0xe27d2b, 0xd8433d, 0x4cb057, 0x2f7d3a, 0x3b82c4, 0x6bb7e8, 0x7a4e26, 0x4a2f16];
    wireCols.forEach((col, i) => {
      const x = -3.5 * 0.48 + i * 0.48;
      const wire = seg(0.22, 5, col);
      wire.position.set(21.5 + x, 0, -5.5);
      g.add(wire);
    });
    const jacket = cyl(1.2, 6, 0x3a3e49, { seg: 16 });
    jacket.rotation.y = Math.PI / 2;
    jacket.position.set(21.5, 0, -8);
    g.add(jacket);
    const pivot = cyl(3.4, 6, 0x3a3e49);
    pivot.rotation.z = Math.PI / 2;
    pivot.position.set(3, 0, 0);
    g.add(pivot);
    /* trinquete (ratchet) dentado sobre el pivote */
    const ratchetArc = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.3, 10, 20, Math.PI), M(0x9aa0ab, { metalness: 0.6, roughness: 0.4 }));
    ratchetArc.position.set(3, 0, 0);
    g.add(ratchetArc);
    for (let t = 0; t < 5; t++) {
      const ang = Math.PI - (t + 0.5) * (Math.PI / 5);
      const tooth = box(0.7, 0.45, 2.6, 0x8a8f98, { metalness: 0.6, roughness: 0.4 });
      tooth.position.set(3 + Math.cos(ang) * 2.6, Math.sin(ang) * 2.6, 0);
      tooth.rotation.z = ang - Math.PI / 2;
      g.add(tooth);
    }
    /* lengueta de liberacion del ratchet */
    const release = box(1.4, 2, 2.4, 0x2a2d36);
    release.position.set(9.5, 9.5, 0);
    release.rotation.z = 0.1;
    g.add(release);
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

  /* Pelacables ajustable con un cable siendo pelado */
  MODELS.stripper = function () {
    const g = new THREE.Group();
    const plateTop = box(13, 7.5, 3, C.metal, { metalness: 0.6, roughness: 0.4 });
    plateTop.position.set(0, 5.8, 0);
    g.add(plateTop);
    const plateBot = box(13, 7.5, 3, C.metal, { metalness: 0.6, roughness: 0.4 });
    plateBot.position.set(0, -5.8, 0);
    g.add(plateBot);
    /* orificio por donde pasa el cable */
    const holeT = cyl(1.35, 0.9, 0x0d0e12);
    holeT.rotation.x = Math.PI / 2;
    holeT.position.set(0, 5.8, 0);
    g.add(holeT);
    const holeB = cyl(1.35, 0.9, 0x0d0e12);
    holeB.rotation.x = Math.PI / 2;
    holeB.position.set(0, -5.8, 0);
    g.add(holeB);
    /* cuchillas curvas de corte (arco dorado) en cada quijada */
    const bladeT = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.22, 10, 20, Math.PI), M(C.gold, { metalness: 0.8, roughness: 0.3 }));
    bladeT.position.set(0, 5.8, 0);
    g.add(bladeT);
    const bladeB = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.22, 10, 20, Math.PI), M(C.gold, { metalness: 0.8, roughness: 0.3 }));
    bladeB.rotation.z = Math.PI;
    bladeB.position.set(0, -5.8, 0);
    g.add(bladeB);
    /* tornillo de ajuste moleteado */
    const screw = cyl(1.2, 2.2, 0x9aa0ab, { metalness: 0.5, roughness: 0.4 });
    screw.rotation.z = Math.PI / 2;
    screw.position.set(6.5, 0, 0);
    g.add(screw);
    for (let i = 0; i < 6; i++) {
      const ridge = box(0.25, 2.5, 0.9, 0x6b7078);
      ridge.position.set(6.5, 0, 0);
      ridge.rotation.x = (i / 6) * Math.PI * 2;
      g.add(ridge);
    }
    /* mangos ergonomicos azules con agarre negro */
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
    /* cable: funda atras, corte en la cuchilla y cobre expuesto adelante */
    const jacketA = cyl(1.15, 9, 0x1f2229);
    jacketA.rotation.x = Math.PI / 2;
    jacketA.position.set(0, 0, -4);
    g.add(jacketA);
    /* anillo de funda ya cortado en el punto de la cuchilla */
    const cutRing = cyl(1.15, 0.7, 0x1f2229);
    cutRing.rotation.x = Math.PI / 2;
    cutRing.position.set(0, 0, 0.3);
    g.add(cutRing);
    const cutLine = torus(1.15, 0.08, 0x0d0e12);
    cutLine.position.set(0, 0, 0.65);
    g.add(cutLine);
    /* hilos de cobre expuestos hacia adelante */
    for (let i = 0; i < 4; i++) {
      const wire = seg(0.26, 8.5, 0xd8a13a, { metalness: 0.6, roughness: 0.35 });
      wire.position.set(-1.6 + i * 1.05, 0, 4.6);
      g.add(wire);
    }
    /* pedazo de funda retirado, recostado adelante de la herramienta */
    const peel = cyl(1.15, 4, 0x1f2229);
    peel.rotation.x = Math.PI / 2;
    peel.rotation.z = 0.35;
    peel.position.set(3.6, -3, 9);
    g.add(peel);
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
    const shell = box(17, 5.8, 6.4, 0xe9ebee, { roughness: 0.45 });
    g.add(shell);
    const inner = box(15.4, 4.6, 5.4, 0xb9bec7);
    inner.position.z = 0.4;
    g.add(inner);
    const rows = [8, 8, 8];
    rows.forEach((n, r) => {
      const w = (n - 1) * 1.55;
      const y = 1.7 - r * 1.55;
      for (let c = 0; c < n; c++) {
        const p = seg(0.28, 1.6, C.gold);
        p.position.set(-w / 2 + c * 1.55, y, 3.5);
        g.add(p);
      }
    });
    /* barra cruzada (blade) con 4 pines analogicos (DVI-I 24+5) */
    const blade = box(3.4, 0.9, 1.6, C.gold, { metalness: 0.75 });
    blade.position.set(7.4, 0, 3.5);
    g.add(blade);
    [[7.4, 1.9], [7.4, -1.9]].forEach(([x, y]) => {
      const p = seg(0.22, 1.3, C.gold);
      p.position.set(x, y, 3.5);
      g.add(p);
    });
    /* tornillos laterales */
    [-1, 1].forEach(s => {
      const screw = cyl(0.8, 2.6, C.metal, { seg: 14 });
      screw.rotation.x = Math.PI / 2;
      screw.position.set(s * 9.4, -2.7, 0);
      g.add(screw);
    });
    /* molde del cable */
    const mold = box(10, 5.2, 3, 0x17181c, { roughness: 0.6 });
    mold.position.set(0, 0, -3.7);
    g.add(mold);
    g.add(wireBundle([new THREE.Vector3(0, 0, -5.4)], [0x9aa0ab], { down: 9, back: 4, radius: 0.8, spread: 0 }));
    return g;
  };

  /* HDMI Tipo C (Mini) — 19 pines, escala reducida */
  MODELS['hdmi-mini'] = function () {
    const g = new THREE.Group();
    const base = MODELS.hdmi();
    base.scale.setScalar(0.72);
    g.add(base);
    return g;
  };

  /* HDMI Tipo D (Micro) — 19 pines, la mas pequena */
  MODELS['hdmi-micro'] = function () {
    const g = new THREE.Group();
    const base = MODELS.hdmi();
    base.scale.setScalar(0.5);
    g.add(base);
    return g;
  };

  /* Mini DisplayPort (20 pines) — portatiles y antiguos Mac */
  MODELS.minidp = function () {
    const g = new THREE.Group();
    const base = MODELS.dp();
    base.scale.setScalar(0.62);
    g.add(base);
    return g;
  };

  /* S-Video (mini-DIN 4 pines, analogico) */
  MODELS.svideo = function () {
    const g = new THREE.Group();
    const body = cyl(3.6, 5, C.metal, { seg: 24, metalness: 0.7, roughness: 0.3 });
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const ring = cyl(4.2, 2.4, 0x2a2d36, { seg: 24 });
    ring.rotation.x = Math.PI / 2;
    ring.position.z = -1.6;
    g.add(ring);
    const key = box(1.1, 0.9, 0.9, 0x17181c);
    key.position.set(3.3, 0, 1.2);
    g.add(key);
    [[-0.9, 1.1], [0.9, -1.1], [-0.9, -1.1], [0.9, 1.1]].forEach(([x, y]) => {
      const p = seg(0.35, 1.5, C.gold);
      p.position.set(x, y, 2.7);
      g.add(p);
    });
    const mold = box(5, 5, 2.6, 0x17181c, { roughness: 0.6 });
    mold.position.set(0, 0, -2.9);
    g.add(mold);
    g.add(wireBundle([new THREE.Vector3(0, 0, -4.2)], [0x17181c], { down: 9, back: 4, radius: 0.6, spread: 0 }));
    return g;
  };

  /* Video compuesto (RCA macho amarillo) */
  MODELS['rca-video'] = function () {
    const g = new THREE.Group();
    const body = cyl(2.2, 6, C.yellow, { seg: 20, roughness: 0.35 });
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const ring = cyl(2.8, 1.6, C.metal, { seg: 20, metalness: 0.75, roughness: 0.3 });
    ring.rotation.x = Math.PI / 2;
    ring.position.z = 2.5;
    g.add(ring);
    const tip = cyl(1.0, 2.6, C.gold, { seg: 18, metalness: 0.7 });
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 3.9;
    g.add(tip);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3.2)], [0xf6c344], { down: 9, back: 4, radius: 0.55, spread: 0 }));
    return g;
  };

  /* Video por componentes (YPbPr): Y verde, Pb azul, Pr rojo */
  MODELS.ypbpr = function () {
    const g = new THREE.Group();
    [C.green, 0x3b82c4, C.red].forEach((col, i) => {
      const x = (i - 1) * 3.4;
      const body = cyl(2.0, 5.4, col, { seg: 18, roughness: 0.35 });
      body.rotation.x = Math.PI / 2;
      body.position.set(x, 0, 0.4);
      g.add(body);
      const ring = cyl(2.6, 1.3, C.metal, { seg: 18, metalness: 0.75, roughness: 0.3 });
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0, 2.8);
      g.add(ring);
      const tip = cyl(0.9, 2.0, C.gold, { seg: 16, metalness: 0.7 });
      tip.rotation.x = Math.PI / 2;
      tip.position.set(x, 0, 4.0);
      g.add(tip);
    });
    g.add(wireBundle(
      [new THREE.Vector3(-3.4, 0, -2.6), new THREE.Vector3(0, 0, -2.6), new THREE.Vector3(3.4, 0, -2.6)],
      [0x4cb057, 0x3b82c4, 0xd8433d],
      { down: 9, back: 3, radius: 0.5, spread: 0 }
    ));
    return g;
  };

  /* Adaptador HDMI macho → VGA hembra */
  MODELS['adapter-hdmi-vga'] = function () {
    const g = new THREE.Group();
    const body = box(14, 10, 9, 0x17181c, { roughness: 0.55 });
    g.add(body);
    /* lado HDMI (macho, sin cable) */
    const hs = box(14, 4.4, 3.4, C.metal, { metalness: 0.85, roughness: 0.3 });
    hs.position.set(0, 0, 6.2);
    g.add(hs);
    const rows = [10, 9];
    rows.forEach((n, r) => {
      const w = (n - 1) * 1.1;
      for (let c = 0; c < n; c++) {
        const p = seg(0.16, 1.3, C.gold);
        p.position.set(-w / 2 + c * 1.1, r === 0 ? 1.1 : -1.1, 8);
        g.add(p);
      }
    });
    /* lado VGA (hembra) */
    const vgaPl = box(15, 11, 1.6, 0x2b5bb0, { roughness: 0.45 });
    vgaPl.position.set(0, 0, -5.8);
    g.add(vgaPl);
    const vgaHole = box(12, 6.4, 1.3, 0x17181c);
    vgaHole.position.set(0, 0, -5.1);
    g.add(vgaHole);
    [-1, 1].forEach(s => {
      const thumb = cyl(1.6, 2.4, C.metal, { seg: 16 });
      thumb.rotation.x = Math.PI / 2;
      thumb.position.set(s * 8, -3.6, -5.8);
      g.add(thumb);
    });
    const led = sphere(0.5, 0x4cb057, { transparent: true, opacity: 0.9 });
    led.position.set(0, 4.6, 0);
    g.add(led);
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
    /* cable coaxial entrando con capas visibles */
    const jacket = cyl(1.7, 9, 0x17181c, { seg: 20 });
    jacket.rotation.x = Math.PI / 2;
    g.add(jacket);
    const shield = cyl(1.25, 8, 0x9aa0ab, { metalness: 0.8, roughness: 0.4, seg: 18 });
    shield.rotation.x = Math.PI / 2;
    g.add(shield);
    const core = cyl(0.35, 17, 0xc98a3d, { metalness: 0.6, seg: 16 });
    core.rotation.x = Math.PI / 2;
    g.add(core);
    /* cuerpo principal hexagonal (llave 8mm) */
    const body = cyl(1.6, 4.5, C.metal, { metalness: 0.85, roughness: 0.3, seg: 6 });
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0, 9.5);
    g.add(body);
    const collar = cyl(1.75, 1, C.metal, { metalness: 0.8, roughness: 0.35, seg: 12 });
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, 11.5);
    g.add(collar);
    /* tuerca roscada hexagonal + anillo moleteado */
    const nut = cyl(2.1, 2.6, 0x8a8f98, { metalness: 0.85, roughness: 0.4, seg: 6 });
    nut.rotation.x = Math.PI / 2;
    nut.position.set(0, 0, 12.8);
    g.add(nut);
    const knurl = cyl(2.25, 0.7, 0x9aa0ab, { metalness: 0.8, roughness: 0.5, seg: 24 });
    knurl.rotation.x = Math.PI / 2;
    knurl.position.set(0, 0, 14.2);
    g.add(knurl);
    /* pin central que sobresale */
    const pin = cyl(0.28, 2.6, 0xc98a3d, { metalness: 0.7, seg: 14 });
    pin.rotation.x = Math.PI / 2;
    pin.position.set(0, 0, 15);
    g.add(pin);
    return g;
  };

  /* Fibra optica con conector SC (multimodo = verde) */
  MODELS['fiber-sc'] = function () {
    const g = new THREE.Group();
    const cable = cyl(1.1, 26, 0xe27d2b, { roughness: 0.4, seg: 20 });
    cable.rotation.x = Math.PI / 2;
    g.add(cable);
    /* protector con resorte (strain relief) */
    const boot = cyl(1.35, 2.2, 0x17181c, { seg: 16 });
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, 0, 12.6);
    g.add(boot);
    const bootRing = cyl(1.5, 0.5, 0x9aa0ab, { metalness: 0.6, roughness: 0.4, seg: 16 });
    bootRing.rotation.x = Math.PI / 2;
    bootRing.position.set(0, 0, 13.7);
    g.add(bootRing);
    /* cuerpo cuadrado SC con clip superior de retencion */
    const body = box(2.4, 2.6, 5.5, 0x2a2d36);
    body.position.set(0, 0, 15.5);
    g.add(body);
    const clip = box(2.6, 0.6, 2.4, 0x1a1c22);
    clip.position.set(0, 1.6, 15.5);
    g.add(clip);
    const tip = box(1.6, 1.6, 1.6, 0x4cb057, { roughness: 0.35 });
    tip.position.set(0, 0, 19.4);
    g.add(tip);
    const ferrule = cyl(0.32, 1.6, 0xe9ebee, { metalness: 0.4, seg: 12 });
    ferrule.rotation.x = Math.PI / 2;
    ferrule.position.set(0, 0, 20.8);
    g.add(ferrule);
    /* nucleo luminoso (la luz que viaja por la fibra) */
    const glowTip = glow(0.22, 0x4cb057);
    glowTip.position.set(0, 0, 21.6);
    g.add(glowTip);
    return g;
  };

  /* Fibra duplex LC (azul = monomodo) */
  MODELS['fiber-lc'] = function () {
    const g = new THREE.Group();
    [-2.2, 2.2].forEach(x => {
      const body = box(1.8, 2.2, 4.8, 0x17181c);
      body.position.set(x, 0, 0);
      g.add(body);
      const tip = box(1.1, 1.1, 1.5, 0x2b5bb0, { roughness: 0.3 });
      tip.position.set(x, 0, 3.1);
      g.add(tip);
      const ferrule = cyl(0.28, 1.3, 0xe9ebee, { metalness: 0.4, seg: 12 });
      ferrule.rotation.x = Math.PI / 2;
      ferrule.position.set(x, 0, 4.1);
      g.add(ferrule);
      const glowTip = glow(0.18, 0x6bb7e8);
      glowTip.position.set(x, 0, 4.8);
      g.add(glowTip);
      /* clip tipo latchet de cada conector */
      const clip = box(1.9, 0.8, 1.2, 0x9aa0ab);
      clip.position.set(x, 1.35, -0.6);
      g.add(clip);
      /* boot individual */
      const boot = cyl(0.5, 1.8, 0x1a1c22, { seg: 12 });
      boot.rotation.x = Math.PI / 2;
      boot.position.set(x, 0, -2.6);
      g.add(boot);
    });
    /* clip que une el par duplex */
    const holder = box(2.2, 1, 3, 0x2a2d36);
    holder.position.set(0, 0, -1.5);
    g.add(holder);
    const latch = box(3.4, 0.5, 1.4, 0x9aa0ab);
    latch.position.set(0, 1.45, -0.6);
    g.add(latch);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0xe27d2b, 0x4cb057], { down: 6, back: 2, radius: 0.45, spread: 0 }));
    return g;
  };

  /* Fibra ST (bayoneta, legacy) */
  MODELS['fiber-st'] = function () {
    const g = new THREE.Group();
    const cable = cyl(1.1, 16, 0x17181c, { seg: 18 });
    cable.rotation.x = Math.PI / 2;
    g.add(cable);
    const boot = cyl(1.3, 1.8, 0x1a1c22, { seg: 16 });
    boot.rotation.x = Math.PI / 2;
    boot.position.set(0, 0, 8.6);
    g.add(boot);
    const body = cyl(1.7, 4.5, 0x2a2d36, { seg: 18 });
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0, 9.5);
    g.add(body);
    /* collar de bayoneta con muescas de llave (key) */
    const collar = cyl(2.3, 2, C.metal, { metalness: 0.85, roughness: 0.3, seg: 14 });
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, 0, 12);
    g.add(collar);
    [-1, 1].forEach(s => {
      const key = box(0.9, 0.9, 1.6, C.metal, { metalness: 0.85, roughness: 0.3 });
      key.position.set(s * 1.7, 0, 12);
      g.add(key);
    });
    const ferrule = cyl(0.3, 2.2, 0xe9ebee, { metalness: 0.4, seg: 12 });
    ferrule.rotation.x = Math.PI / 2;
    ferrule.position.set(0, 0, 13.8);
    g.add(ferrule);
    const glowTip = glow(0.2, 0x4cb057);
    glowTip.position.set(0, 0, 14.8);
    g.add(glowTip);
    return g;
  };

  /* RJ-11 (telefono, 6P4C) — carcasa transparente con contactos visibles */
  MODELS.rj11 = function () {
    const g = new THREE.Group();
    /* carcasa exterior semitransparente */
    const shell = box(11, 6.8, 13, 0x17181c, { transparent: true, opacity: 0.3, roughness: 0.2 });
    g.add(shell);
    const core = box(9, 5.2, 11, 0x0d0e12);
    core.position.set(0, 0.3, 0);
    g.add(core);
    /* 6 posiciones (ranuras) — solo 4 con contacto (6P4C) */
    for (let c = 0; c < 6; c++) {
      const slot = box(0.3, 0.8, 2.6, 0x20242b);
      slot.position.set(-2.5 * 0.95 + c * 0.95, 1.5, 6);
      g.add(slot);
    }
    /* contactos dorados en las posiciones centrales (2-5) */
    [1, 2, 3, 4].forEach(pos => {
      const x = -2.5 * 0.95 + pos * 0.95;
      const p = box(0.5, 0.3, 2.4, C.gold, { metalness: 0.8, roughness: 0.25 });
      p.position.set(x, 1.9, 6);
      p.rotation.z = -0.06;
      g.add(p);
    });
    /* lengueta de retencion inferior */
    const latch = box(11, 2.2, 2.6, 0x3a3e49);
    latch.position.set(0, -3.4, 4.5);
    g.add(latch);
    /* tab superior de guia */
    const tab = box(4, 2.6, 1.6, 0x17181c, { transparent: true, opacity: 0.6 });
    tab.position.set(0, 4.4, 7);
    g.add(tab);
    /* boot de alivio de tension */
    const boot = box(9, 5, 2.2, 0x24272e);
    boot.position.set(0, 0.3, -6.8);
    g.add(boot);
    const cols = [0xd8433d, 0x4cb057, 0x17181c, 0xf6c344];
    const w = 3 * 0.95;
    for (let c = 0; c < 4; c++) {
      const x = -w / 2 + c * 0.95;
      const wire = tube([
        new THREE.Vector3(x, -0.8, -8),
        new THREE.Vector3(x, -2.5, -11),
        new THREE.Vector3(x + (c - 1.5) * 1.2, -3.5, -13.5)
      ], 0.3, cols[c], 14);
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

  /* ============================================================
     MODELOS AVANZADOS: REDES, MANTENIMIENTO Y ENSAMBLADO
     ============================================================ */

  /* --- HELPERS DE TOPOLOGIA --- */
  function routerNode() {
    const g = new THREE.Group();
    g.add(box(5, 2.6, 4.2, 0x3a3e49, { roughness: 0.5 }));
    const face = box(4.4, 1.8, 0.4, 0x17181c);
    face.position.set(0, 0, 2.2);
    g.add(face);
    [0, 1, 2].forEach(i => {
      const led = box(0.35, 0.35, 0.35, i === 0 ? 0x4cb057 : 0x39d0d8);
      led.position.set(-1.2 + i * 1.2, 0, 2.6);
      g.add(led);
    });
    [-1.6, 1.6].forEach(x => {
      const ant = box(0.42, 2.8, 0.42, 0x4a4f5a);
      ant.position.set(x, 2.7, 0);
      ant.rotation.x = 0.45;
      g.add(ant);
    });
    return g;
  }

  function hostNode(color) {
    const g = new THREE.Group();
    g.add(box(4.6, 3.6, 2.6, 0x2a2d36, { roughness: 0.5 }));
    const screen = box(3.9, 2.2, 0.3, color || 0x39d0d8, { transparent: true, opacity: 0.9 });
    screen.position.set(0, 0.4, 1.5);
    g.add(screen);
    g.add(box(4.8, 0.4, 2.8, 0x0d0e12));
    return g;
  }

  function netLink(a, b, color, r) {
    return tube([a.clone(), b.clone()], r || 0.22, color, 20);
  }

  /* Topologia enrutada: 3 routers + 3 subredes + LANs con hosts */
  MODELS['routing-topo'] = function () {
    const g = new THREE.Group();
    const r1 = routerNode(); r1.position.set(-18, 0, -8); g.add(r1);
    const r2 = routerNode(); r2.position.set(0, 0, 16); g.add(r2);
    const r3 = routerNode(); r3.position.set(18, 0, -8); g.add(r3);
    g.add(netLink(new THREE.Vector3(-15, 0, -5), new THREE.Vector3(-4, 0, 12), 0x39d0d8));
    g.add(netLink(new THREE.Vector3(4, 0, 12), new THREE.Vector3(15, 0, -5), 0x4cb057));
    g.add(netLink(new THREE.Vector3(14, 0, -10), new THREE.Vector3(-14, 0, -10), 0xe3b341));
    const lan = (rPos, color, offset, n) => {
      for (let i = 0; i < n; i++) {
        const h = hostNode(color);
        h.position.set(rPos[0] + offset[0] * (i + 1) * 4.5, 0, rPos[2] + offset[2] * (i + 1) * 4.5);
        g.add(h);
        g.add(netLink(h.position.clone(), new THREE.Vector3(rPos[0], 0, rPos[2]), color, 0.2));
      }
    };
    lan([-18, 0, -8], 0x39d0d8, [-1, 0, -1], 2);
    lan([0, 0, 16], 0x4cb057, [1, 0, 1], 2);
    lan([18, 0, -8], 0xe3b341, [1, 0, -1], 2);
    return g;
  };

  /* Switch con 8 puertos separados en 2 VLANs (10 y 20) */
  MODELS['switch-vlan'] = function () {
    const g = new THREE.Group();
    g.add(box(30, 4.5, 16, 0x2a2d36, { roughness: 0.5 }));
    const z = -8.5;
    for (let i = 0; i < 8; i++) {
      const x = -12 + i * 3.4;
      const port = box(3, 2.4, 1.4, 0x17181c);
      port.position.set(x, 0, z);
      g.add(port);
      const ring = box(3.3, 2.7, 0.3, i < 4 ? 0x4cb057 : 0x3b82c4);
      ring.position.set(x, 0, z + 0.9);
      g.add(ring);
    }
    const addHost = (i, vlan) => {
      const x = -12 + i * 3.4;
      const color = vlan === 10 ? 0x4cb057 : 0x3b82c4;
      const h = hostNode(color);
      h.position.set(x, 5, 8);
      g.add(h);
      g.add(tube([
        new THREE.Vector3(x, 2, 7.2),
        new THREE.Vector3(x, 2, 1),
        new THREE.Vector3(x, 0.2, -7.2)
      ], 0.2, color, 16));
    };
    for (let i = 0; i < 4; i++) addHost(i, 10);
    for (let i = 4; i < 8; i++) addHost(i, 20);
    return g;
  };

  /* Dos switches unidos por un enlace trunk con hosts de 2 VLANs */
  MODELS['vlan-trunk'] = function () {
    const g = new THREE.Group();
    const mkSwitch = (x) => {
      const s = new THREE.Group();
      s.add(box(22, 4, 14, 0x2a2d36, { roughness: 0.5 }));
      const z = -7.5;
      for (let i = 0; i < 4; i++) {
        const px = -6 + i * 4;
        const port = box(3, 2.4, 1.4, 0x17181c);
        port.position.set(px, 0, z);
        s.add(port);
        const ring = box(3.3, 2.7, 0.3, i < 2 ? 0x4cb057 : 0x3b82c4);
        ring.position.set(px, 0, z + 0.9);
        s.add(ring);
      }
      s.position.set(x, 0, 0);
      g.add(s);
    };
    mkSwitch(-18);
    mkSwitch(18);
    g.add(tube([
      new THREE.Vector3(-7, 0, -7.5),
      new THREE.Vector3(0, 2.2, -9),
      new THREE.Vector3(7, 0, -7.5)
    ], 0.35, 0x8a5cf5, 20));
    const addHost = (swX, i, color) => {
      const x = swX + (-6 + i * 4);
      const h = hostNode(color);
      h.position.set(x, 5, 9);
      g.add(h);
      g.add(tube([
        new THREE.Vector3(x, 2, 8.2),
        new THREE.Vector3(x, 2, 0),
        new THREE.Vector3(x, 0.2, -6.2)
      ], 0.18, color, 14));
    };
    addHost(-18, 0, 0x4cb057); addHost(-18, 1, 0x3b82c4);
    addHost(18, 0, 0x4cb057); addHost(18, 1, 0x3b82c4);
    return g;
  };

  /* Hub vs Switch: dominio de colision unico vs por puerto */
  MODELS['hub-vs-switch'] = function () {
    const g = new THREE.Group();
    const hub = box(16, 4.5, 10, 0x3a3e49, { roughness: 0.5 });
    hub.position.set(-14, 0, 0);
    g.add(hub);
    const sw = box(16, 4.5, 10, 0x2a2d36, { roughness: 0.5 });
    sw.position.set(14, 0, 0);
    g.add(sw);
    const hostAt = (x, z, color, swX) => {
      const h = hostNode(color);
      h.position.set(swX + x, 5, z);
      g.add(h);
      g.add(tube([
        new THREE.Vector3(swX + x, 2, z - 2.5),
        new THREE.Vector3(swX + x, 2, z - 6)
      ], 0.18, color, 12));
    };
    [-4, 4].forEach(x => [-5, 5].forEach(z => hostAt(x, z, 0xf6c344, -14)));
    const cols = [0x4cb057, 0x3b82c4, 0xd8433d, 0x8a5cf5];
    let k = 0;
    [-4, 4].forEach(x => [-5, 5].forEach(z => hostAt(x, z, cols[k++], 14)));
    return g;
  };

  /* --- MANTENIMIENTO --- */

  /* UPS en torre con display y tomas */
  MODELS.ups = function () {
    const g = new THREE.Group();
    g.add(box(12, 20, 14, 0x17181c, { roughness: 0.5 }));
    const front = box(11, 18, 0.3, 0x2a2d36);
    front.position.set(0, 0, 7.2);
    g.add(front);
    const lcd = box(6, 3.4, 0.4, 0x0d0e12);
    lcd.position.set(0, 6, 7.6);
    g.add(lcd);
    const lcdGlow = box(4.8, 2, 0.3, 0x39d0d8, { transparent: true, opacity: 0.8 });
    lcdGlow.position.set(0, 6, 7.8);
    g.add(lcdGlow);
    const btn = cyl(1, 1, 0x4cb057, { seg: 16 });
    btn.rotation.x = Math.PI / 2;
    btn.position.set(-3.4, 2.2, 7.6);
    g.add(btn);
    [-1.2, 1.2].forEach(x => {
      const out = box(3.4, 4.4, 1, 0x0d0e12);
      out.position.set(x, -3.5, 7.5);
      g.add(out);
      const hole = box(2.4, 1.4, 1.2, 0x17181c);
      hole.position.set(x, -3.5, 8.1);
      g.add(hole);
    });
    g.add(box(11, 1.2, 15, 0x2a2d36));
    return g;
  };

  /* Estrategia 3-2-1: original + backup local + nube */
  MODELS['backup-321'] = function () {
    const g = new THREE.Group();
    const pc = box(9, 12, 8, 0x2a2d36, { roughness: 0.5 });
    pc.position.set(-16, 6, 0);
    g.add(pc);
    const led = box(0.6, 0.6, 0.6, 0x4cb057);
    led.position.set(-16, 10, 4.2);
    g.add(led);
    const hd = box(10, 4.5, 9, 0x3a3e49);
    hd.position.set(0, 2.2, 0);
    g.add(hd);
    const led2 = box(0.5, 0.5, 0.5, 0x4cb057);
    led2.position.set(0, 2.2, 4.6);
    g.add(led2);
    g.add(tube([
      new THREE.Vector3(-11, 6, 0),
      new THREE.Vector3(-6, 5, 0),
      new THREE.Vector3(-4, 3, 0)
    ], 0.4, 0x39d0d8, 20));
    const cloud = new THREE.Group();
    const c1 = sphere(2.4, 0xe9ebee, { roughness: 0.7 }); c1.position.set(2, 2, 0);
    const c2 = sphere(1.8, 0xe9ebee, { roughness: 0.7 }); c2.position.set(-1.6, 2.6, 0);
    const c3 = sphere(1.6, 0xe9ebee, { roughness: 0.7 }); c3.position.set(4.4, 2.4, 0);
    const c4 = sphere(1.3, 0xe9ebee, { roughness: 0.7 }); c4.position.set(0.6, 3.6, 0);
    cloud.add(c1, c2, c3, c4);
    cloud.position.set(16, 6, 0);
    g.add(cloud);
    g.add(tube([
      new THREE.Vector3(5, 3, 0),
      new THREE.Vector3(8, 4, 0),
      new THREE.Vector3(12, 5, 0)
    ], 0.4, 0x4cb057, 20));
    return g;
  };

  /* Calendario de mantenimiento: grid mensual con periodicidades */
  MODELS['plan-calendar'] = function () {
    const g = new THREE.Group();
    g.add(box(35, 25, 0.4, 0x2a2d36));
    g.add(box(34, 24, 1.2, 0x1a1d27));
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = box(4.1, 3.4, 0.3, 0x2a2d36);
        cell.position.set(-14 + c * 4.6, 8 - r * 4.2, 0.8);
        g.add(cell);
      }
    }
    const mark = (r, c, color) => {
      const cell = box(4.1, 3.4, 0.4, color, { transparent: true, opacity: 0.55 });
      cell.position.set(-14 + c * 4.6, 8 - r * 4.2, 1.15);
      g.add(cell);
    };
    mark(0, 0, 0xf6c344); mark(0, 1, 0xf6c344); mark(0, 2, 0xf6c344);
    mark(1, 0, 0x3b82c4); mark(1, 1, 0x3b82c4);
    mark(2, 0, 0x4cb057);
    mark(3, 0, 0x4cb057); mark(3, 1, 0x4cb057);
    mark(4, 0, 0x3b82c4);
    return g;
  };

  /* --- ENSAMBLADO: REFRIGERACION --- */

  function fan(r, w, h, color) {
    const g = new THREE.Group();
    g.add(box(w, h, 2.4, 0x2a2d36));
    g.add(box(w - 2.2, h - 2.2, 2.5, 0x0d0e12));
    const hub = cyl(1.4, 2.6, 0x3a3e49, { seg: 20 });
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const blade = box(3.6, 0.24, 1.2, color || 0x41454f);
      blade.position.set(Math.cos(a) * 2.6, Math.sin(a) * 2.6, 0);
      blade.rotation.z = a;
      g.add(blade);
    }
    return g;
  }

  /* Refrigeracion liquida AIO: bloque en CPU + tubos + radiador + fans */
  MODELS['aio-cooler'] = function () {
    const g = new THREE.Group();
    g.add(box(30, 3, 30, C.pcb));
    g.add(box(18, 1, 18, C.pcbDark));
    const block = new THREE.Group();
    block.add(box(10, 5, 10, 0x17181c, { roughness: 0.4 }));
    block.add(box(10, 2, 10, 0x0d0e12));
    block.position.set(0, 5, 0);
    g.add(block);
    g.add(tube([
      new THREE.Vector3(4, 9, 0),
      new THREE.Vector3(10, 14, 0),
      new THREE.Vector3(14, 9, 0),
      new THREE.Vector3(14, 16, 0)
    ], 0.9, 0x2b2f38, 30));
    g.add(tube([
      new THREE.Vector3(-4, 9, 0),
      new THREE.Vector3(-8, 14, 0),
      new THREE.Vector3(-14, 9, 0),
      new THREE.Vector3(-14, 16, 0)
    ], 0.9, 0x2b2f38, 30));
    const rad = new THREE.Group();
    rad.add(box(16, 4.5, 26, 0x0d0e12));
    for (let x = -6.8; x <= 6.8; x += 0.9) {
      const fin = box(0.3, 4.5, 26, 0x9aa0ab, { metalness: 0.5, roughness: 0.4 });
      fin.position.x = x;
      rad.add(fin);
    }
    rad.position.set(0, 19, 0);
    g.add(rad);
    const f1 = fan(1, 15, 15); f1.position.set(0, 19, -14); g.add(f1);
    const f2 = fan(1, 15, 15); f2.position.set(0, 19, 14); g.add(f2);
    return g;
  };

  /* Disipador de torre por aire: aletas + heatpipes + fan */
  MODELS['air-cooler'] = function () {
    const g = new THREE.Group();
    g.add(box(24, 2.4, 24, C.pcb));
    const stack = new THREE.Group();
    for (let z = -6; z <= 6; z += 0.55) {
      const fin = box(14, 12, 0.2, 0x9aa0ab, { metalness: 0.45, roughness: 0.4 });
      fin.position.z = z;
      stack.add(fin);
    }
    stack.position.set(0, 9, 0);
    g.add(stack);
    [-3, 0, 3].forEach(x => {
      g.add(tube([
        new THREE.Vector3(x, 15, -6.5),
        new THREE.Vector3(x, 15, 6.5)
      ], 0.35, 0xd7a94a, 20));
    });
    const f = fan(1, 14, 14);
    f.position.set(8.5, 9, 0);
    g.add(f);
    return g;
  };

  /* Custom loop: reservorio + bomba + bloques + radiador + tubos */
  MODELS['liquid-loop'] = function () {
    const g = new THREE.Group();
    g.add(box(30, 3, 30, C.pcb));
    const cpu = box(8, 5, 8, 0x17181c);
    cpu.position.set(-6, 5, 6);
    g.add(cpu);
    const gpu = box(16, 4, 6, 0x1c1d24);
    gpu.position.set(8, 6, 4);
    g.add(gpu);
    const res = cyl(2.4, 16, 0x2b5bb0, { transparent: true, opacity: 0.45, roughness: 0.3, seg: 20 });
    res.position.set(12, 12, -8);
    g.add(res);
    const pump = cyl(3.4, 3, 0x17181c, { seg: 20 });
    pump.position.set(12, 3, -8);
    g.add(pump);
    const rad = box(6, 14, 10, 0x0d0e12);
    rad.position.set(-12, 12, -8);
    g.add(rad);
    g.add(tube([
      new THREE.Vector3(-6, 9, 6),
      new THREE.Vector3(-8, 12, 0),
      new THREE.Vector3(-10, 15, -4)
    ], 0.5, 0x39d0d8, 24));
    g.add(tube([
      new THREE.Vector3(-10, 15, -4),
      new THREE.Vector3(-12, 14, -8)
    ], 0.5, 0x39d0d8, 16));
    g.add(tube([
      new THREE.Vector3(12, 18, -8),
      new THREE.Vector3(0, 18, -8),
      new THREE.Vector3(-8, 15, -8)
    ], 0.5, 0x39d0d8, 24));
    g.add(tube([
      new THREE.Vector3(12, 8, -8),
      new THREE.Vector3(12, 6, -2),
      new THREE.Vector3(10, 8, 4)
    ], 0.5, 0x39d0d8, 24));
    return g;
  };

  /* ============================================================
     PLACA BASE: componentes y conectores
     ============================================================ */

  /* Placa base ATX completa (vista superior) */
  MODELS.motherboard = function () {
    const g = new THREE.Group();
    g.add(box(52, 44, 1.4, C.pcb, { roughness: 0.75 }));
    [[-22, -19], [22, -19], [-22, 19], [22, 19]].forEach(p => {
      const screw = cyl(1, 1.6, C.metal, { seg: 16 });
      screw.position.set(p[0], p[1], 0);
      g.add(screw);
    });
    const rear = box(18, 3.2, 2.2, C.metal);
    rear.position.set(-14, 20.4, 0);
    g.add(rear);
    [-18, -14, -10].forEach(x => {
      const p = box(2.6, 1.5, 0.6, C.plastic);
      p.position.set(x, 20.4, 1.2);
      g.add(p);
    });
    const socket = box(12, 12, 1.6, C.dark);
    socket.position.set(-14, -5, 0);
    g.add(socket);
    g.add(pins(7, 7, 1.6, 1.6, { z: 0.9 }));
    pins(7, 7, 1.6, 1.6, { z: 0.9 }).traverse(o => { o.position.x += -14; o.position.y += -5; });
    g.add(box(12.6, 0.5, 1.8, C.gray));
    const dslots = [-9, -6, -3, 0];
    dslots.forEach((y, i) => {
      const slot = box(2.2, 15, 1.4, C.blue);
      slot.position.set(6, y, 0);
      g.add(slot);
      const clip = box(1.2, 0.6, 1.6, C.gray);
      clip.position.set(6, y - 7.8, 0);
      g.add(clip);
    });
    const pcie = box(2.4, 18, 1.4, C.gray);
    pcie.position.set(-14, 9, 0);
    g.add(pcie);
    [-8, 12, 16].forEach(x => {
      const slot = box(2.2, 12, 1.3, C.dark);
      slot.position.set(x, 9, 0);
      g.add(slot);
    });
    const chipset = box(7.5, 7.5, 1.6, C.dark);
    chipset.position.set(14, -14, 0);
    g.add(chipset);
    const chipHs = box(6.5, 6.5, 1, C.metal);
    chipHs.position.set(14, -14, 1.3);
    g.add(chipHs);
    for (let i = 0; i < 8; i++) {
      const vrm = box(2.4, 1.6, 2, C.black);
      vrm.position.set(-22, -5 + i * 2.6, 0);
      g.add(vrm);
    }
    for (let i = 0; i < 6; i++) {
      const hs = box(1.6, 2.4, 2.2, C.metal);
      hs.position.set(-22, -5 + i * 2.6, 0);
      g.add(hs);
    }
    for (let i = 0; i < 6; i++) {
      const sata = box(3, 1.8, 1.4, C.teal);
      sata.position.set(24.8, 12 - i * 2.4, 0);
      g.add(sata);
    }
    const atx = box(2.8, 9.5, 2, C.black);
    atx.position.set(24.8, 0, 0);
    g.add(atx);
    const eps = box(3.8, 2.8, 2, C.black);
    eps.position.set(-14, 16.5, 0);
    g.add(eps);
    const cmos = cyl(3, 0.7, C.metal, { seg: 24, roughness: 0.3 });
    cmos.position.set(20, 14, 0);
    g.add(cmos);
    const m2 = box(1.8, 14, 1.2, C.green);
    m2.position.set(20, 1, 0);
    g.add(m2);
    const m2screw = cyl(0.5, 1, C.gold, { seg: 12 });
    m2screw.position.set(20, 8.2, 0);
    g.add(m2screw);
    [-14, 4, 22].forEach(x => {
      const fh = box(1.6, 2, 1.2, C.white);
      fh.position.set(x, 16, 0);
      g.add(fh);
    });
    return g;
  };

  /* Zocalo de CPU (LGA) */
  MODELS['cpu-socket'] = function () {
    const g = new THREE.Group();
    g.add(box(14, 14, 2, C.dark, { roughness: 0.6 }));
    g.add(pins(8, 8, 1.6, 1.6, { z: 1.1 }));
    const lid = box(10, 10, 0.8, C.metal, { roughness: 0.4 });
    lid.position.set(0, 0, 1.5);
    g.add(lid);
    const arm = box(14, 1, 1.4, C.metal);
    arm.position.set(0, -7.6, 0);
    g.add(arm);
    const handle = box(1.6, 4, 1.2, C.plasticLt);
    handle.position.set(0, -5.2, 0);
    handle.rotation.z = 0.35;
    g.add(handle);
    [-6.4, 6.4].forEach(x => {
      const pin = box(0.8, 1.2, 1.8, C.gold);
      pin.position.set(x, -7.2, 0);
      g.add(pin);
    });
    return g;
  };

  /* Modulo de memoria RAM (DIMM) */
  MODELS['ram-dimm'] = function () {
    const g = new THREE.Group();
    const pcb = box(16, 4.5, 1, C.pcb, { roughness: 0.6 });
    g.add(pcb);
    g.add(pins(1, 14, 1.08, 0, { r: 0.28, len: 1.3, z: 0.6, color: C.gold }));
    for (let i = 0; i < 8; i++) {
      const chip = box(1.6, 2.2, 0.35, C.black);
      chip.position.set(-6.3 + i * 1.8, 0.8, 0.7);
      g.add(chip);
    }
    const hs = box(16, 0.6, 1.6, C.metal, { roughness: 0.4 });
    hs.position.set(0, 2.9, 0);
    g.add(hs);
    const notch = box(1, 1.4, 1.2, C.dark);
    notch.position.set(2, -2.4, 0);
    g.add(notch);
    return g;
  };

  /* Ranura PCIe x16 */
  MODELS['pcie-slot'] = function () {
    const g = new THREE.Group();
    g.add(box(3, 20, 1.4, C.gray, { roughness: 0.5 }));
    g.add(pins(2, 9, 2.05, 1.1, { r: 0.3, len: 1.2, z: 0.8 }));
    const notch = box(1.2, 1.6, 1.6, C.dark);
    notch.position.set(0, 2.4, 0);
    g.add(notch);
    [-8, 8].forEach(x => {
      const clip = box(1.4, 1.2, 1.6, C.plasticLt);
      clip.position.set(0, x, 0);
      g.add(clip);
    });
    return g;
  };

  /* Chipset con disipador */
  MODELS.chipset = function () {
    const g = new THREE.Group();
    g.add(box(8, 8, 1.2, C.dark));
    const hs = box(7, 7, 1.6, C.metal, { roughness: 0.35 });
    hs.position.set(0, 0, 1.4);
    g.add(hs);
    for (let i = -2; i <= 2; i++) {
      const fin = box(6, 0.5, 0.8, C.gray);
      fin.position.set(0, i * 1.3, 2.4);
      g.add(fin);
    }
    const logo = box(1.6, 1.6, 0.4, C.teal);
    logo.position.set(0, 0, 3.1);
    g.add(logo);
    return g;
  };

  /* Fases de alimentacion (VRM) */
  MODELS.vrm = function () {
    const g = new THREE.Group();
    for (let i = 0; i < 10; i++) {
      const coil = box(1.6, 1.6, 2.2, C.black);
      coil.position.set(-4.5 + i * 1.05, 0, 0);
      g.add(coil);
    }
    const hs = box(11, 1.4, 2.4, C.metal, { roughness: 0.4 });
    hs.position.set(0, 2.4, 0);
    g.add(hs);
    for (let i = 0; i < 4; i++) {
      const pwm = box(1.2, 0.8, 0.6, C.dark);
      pwm.position.set(-1.8 + i * 1.2, -3, 0);
      g.add(pwm);
    }
    return g;
  };

  /* Bateria CMOS (CR2032) */
  MODELS['cmos-battery'] = function () {
    const g = new THREE.Group();
    const cell = cyl(3.4, 0.8, C.metal, { seg: 28, roughness: 0.3 });
    cell.rotation.x = Math.PI / 2;
    g.add(cell);
    const ring = torus(3.2, 0.35, C.gold);
    g.add(ring);
    const tab = box(1.2, 0.2, 2.4, C.gray);
    tab.position.set(3, 0.3, 0);
    g.add(tab);
    return g;
  };

  /* Puertos SATA de la placa */
  MODELS['sata-ports'] = function () {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const port = box(2.4, 2.6, 1.4, C.teal);
      port.position.set(0, 6.6 - i * 2.3, 0);
      g.add(port);
      const lip = box(2.4, 0.6, 1.4, C.gray);
      lip.position.set(0, 6.6 - i * 2.3, 0.9);
      g.add(lip);
    }
    return g;
  };

  /* Slot M.2 con SSD */
  MODELS['m2-slot'] = function () {
    const g = new THREE.Group();
    const ssd = box(2.4, 14, 0.9, C.pcbDark);
    ssd.position.set(0, 5.5, 0);
    g.add(ssd);
    const ctrl = box(1.7, 1.9, 0.4, C.black);
    ctrl.position.set(0, 3.4, 0.5);
    g.add(ctrl);
    for (let i = 0; i < 2; i++) {
      const nand = box(1.9, 1.3, 0.4, C.dark);
      nand.position.set(0, 5.8 + i * 1.7, 0.5);
      g.add(nand);
    }
    const slot = box(3, 1.4, 1.6, C.dark);
    slot.position.set(0, -2.6, 0);
    g.add(slot);
    const standoff = cyl(0.5, 1.6, C.metal, { seg: 12 });
    standoff.position.set(0, 13.4, 0);
    g.add(standoff);
    const screw = cyl(0.6, 0.8, C.gold, { seg: 12 });
    screw.position.set(0, 14.6, 0);
    g.add(screw);
    return g;
  };

  /* ============================================================
     ALMACENAMIENTO: particionado de discos MBR vs GPT
     ============================================================ */

  /* Tira lineal de particiones (para los modelos de disco) */
  function partitionStrip(segs) {
    const g = new THREE.Group();
    g.add(box(34, 0.6, 3.4, C.black, { roughness: 0.5 }));
    segs.forEach(s => {
      const b = box(s.w, 1.1, 2.4, s.c, { roughness: 0.4 });
      b.position.set(s.x, 0.9, 0);
      g.add(b);
    });
    return g;
  }

  /* Disco 3.5" con layout MBR: sector MBR + max 4 particiones primarias */
  MODELS['disk-mbr'] = function () {
    const g = new THREE.Group();
    g.add(box(36, 3, 24, 0x2a2d36, { roughness: 0.5, metalness: 0.35 }));
    g.add(box(36.8, 0.5, 24.8, C.metal, { roughness: 0.4, metalness: 0.55 }));
    const platter = cyl(8, 0.9, C.gray, { roughness: 0.35, metalness: 0.6, seg: 36 });
    platter.rotation.x = Math.PI / 2;
    platter.position.set(10, 0.9, -5);
    g.add(platter);
    const hub = cyl(1.5, 1.3, C.gold, { seg: 20 });
    hub.rotation.x = Math.PI / 2;
    hub.position.set(10, 0.9, -5);
    g.add(hub);
    const arm = box(1, 0.5, 8, C.black);
    arm.position.set(10, 1.2, -10);
    g.add(arm);
    const pivot = cyl(1.2, 1.2, C.gold, { seg: 16 });
    pivot.position.set(10, 0.9, -11.5);
    g.add(pivot);
    const strip = partitionStrip([
      { x: -15.4, w: 2.8, c: C.gold },
      { x: -10.5, w: 5.5, c: C.blue },
      { x: -4.2, w: 5.5, c: C.green },
      { x: 2, w: 5.5, c: C.orange },
      { x: 8.5, w: 5.5, c: C.purple },
      { x: 14.3, w: 3.4, c: C.plastic }
    ]);
    strip.position.set(0, 1.5, 8);
    g.add(strip);
    return g;
  };

  /* Disco 3.5" con layout GPT: MBR protector + header GPT + ESP + mas particiones + copia de respaldo */
  MODELS['disk-gpt'] = function () {
    const g = new THREE.Group();
    g.add(box(36, 3, 24, 0x2a2d36, { roughness: 0.5, metalness: 0.35 }));
    g.add(box(36.8, 0.5, 24.8, C.metal, { roughness: 0.4, metalness: 0.55 }));
    const platter = cyl(8, 0.9, C.gray, { roughness: 0.35, metalness: 0.6, seg: 36 });
    platter.rotation.x = Math.PI / 2;
    platter.position.set(10, 0.9, -5);
    g.add(platter);
    const hub = cyl(1.5, 1.3, C.gold, { seg: 20 });
    hub.rotation.x = Math.PI / 2;
    hub.position.set(10, 0.9, -5);
    g.add(hub);
    const arm = box(1, 0.5, 8, C.black);
    arm.position.set(10, 1.2, -10);
    g.add(arm);
    const pivot = cyl(1.2, 1.2, C.gold, { seg: 16 });
    pivot.position.set(10, 0.9, -11.5);
    g.add(pivot);
    const strip = partitionStrip([
      { x: -15.9, w: 1.6, c: C.red },
      { x: -13.7, w: 2.4, c: C.gold },
      { x: -11.1, w: 2.6, c: C.green },
      { x: -7.6, w: 3.8, c: C.blue },
      { x: -3.6, w: 3.8, c: C.orange },
      { x: 0.4, w: 3.8, c: C.teal },
      { x: 4.4, w: 3.8, c: C.purple },
      { x: 8.4, w: 3.8, c: C.yellow },
      { x: 12.4, w: 3, c: C.lightblue },
      { x: 15.4, w: 2.8, c: C.gold }
    ]);
    strip.position.set(0, 1.5, 8);
    g.add(strip);
    return g;
  };

  /* ============================================================
     COMPONENTES: CPU, GPU, PSU y componentes electronicos
     ============================================================ */

  /* Procesador (CPU) con IHS y pads LGA */
  MODELS['cpu-chip'] = function () {
    const g = new THREE.Group();
    g.add(box(12, 12, 1.2, C.pcb, { roughness: 0.6 }));
    g.add(pins(8, 8, 1.45, 1.45, { r: 0.3, len: 0.9, z: 0.7, color: C.gold }));
    const ihs = box(10.2, 10.2, 0.9, C.metal, { roughness: 0.25, metalness: 0.7 });
    ihs.position.set(0, 0, 1.2);
    g.add(ihs);
    g.add(box(7.6, 7.6, 0.25, 0xcfd3d8, { roughness: 0.3, metalness: 0.6 }));
    const label = box(4, 1.1, 0.18, 0x8a5cf5);
    label.position.set(0, 0, 2.7);
    g.add(label);
    return g;
  };

  /* Tarjeta grafica (GPU) con cooler, PCIe y puertos */
  MODELS['gpu-card'] = function () {
    const g = new THREE.Group();
    const pcb = box(4.2, 26, 12, C.pcb, { roughness: 0.55 });
    g.add(pcb);
    const shroud = box(4.6, 25, 11, 0x1c1d24, { roughness: 0.5 });
    shroud.position.set(0, 0, 0.3);
    g.add(shroud);
    const fans = [-7.5, 0, 7.5];
    fans.forEach(x => {
      const fanRing = cyl(3.1, 0.6, C.dark, { seg: 24 });
      fanRing.rotation.x = Math.PI / 2;
      fanRing.position.set(0, x, 1.1);
      g.add(fanRing);
      const hub = cyl(0.9, 0.7, C.gray, { seg: 16 });
      hub.rotation.x = Math.PI / 2;
      hub.position.set(0, x, 1.1);
      g.add(hub);
    });
    const bracket = box(4.4, 1.6, 12, C.metal, { roughness: 0.35, metalness: 0.6 });
    bracket.position.set(0, 13.4, 0);
    g.add(bracket);
    [-4, 0, 4].forEach(z => {
      const port = box(3.4, 0.7, 1.3, C.dark);
      port.position.set(0, 13.4, z);
      g.add(port);
    });
    const pcie = box(2.6, 12, 1.2, C.gold, { roughness: 0.3, metalness: 0.5 });
    pcie.position.set(0, -18, 0);
    g.add(pcie);
    return g;
  };

  /* Fuente de poder ATX (PSU) */
  MODELS['psu-atx'] = function () {
    const g = new THREE.Group();
    g.add(box(16, 9.5, 18, 0x1c1d24, { roughness: 0.5 }));
    g.add(box(16.6, 9.9, 18.4, 0x0d0e12, { roughness: 0.6 }));
    const fan = cyl(6, 1, C.dark, { seg: 28 });
    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, 5, 0);
    g.add(fan);
    const hub = cyl(1.4, 1.1, C.gray, { seg: 18 });
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, 5, 0);
    g.add(hub);
    const grill = [-4.2, 0, 4.2];
    grill.forEach(y => {
      const bar = box(0.5, 0.5, 11, C.metal);
      bar.position.set(0, 5, y);
      g.add(bar);
    });
    const sw = box(3, 1.2, 1, C.black);
    sw.position.set(-5, 0, -9.5);
    g.add(sw);
    const inlet = box(4, 2.4, 0.8, C.gray);
    inlet.position.set(0, -2.8, -9.5);
    g.add(inlet);
    const label = box(8, 3, 0.3, 0x3b82c4);
    label.position.set(0, 0, 9.5);
    g.add(label);
    return g;
  };

  /* Resistencia de carbon (thru-hole) con bandas de color */
  MODELS.resistor = function () {
    const g = new THREE.Group();
    const body = cyl(1.1, 4.4, 0xb8845c, { roughness: 0.5, seg: 20 });
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const bands = [
      { c: 0xd8433d, x: -0.9 }, { c: 0x17181c, x: 0 }, { c: 0x4cb057, x: 0.9 }, { c: 0xf6c344, x: 1.8 }
    ];
    bands.forEach(b => {
      const band = cyl(1.15, 0.35, b.c, { seg: 20 });
      band.rotation.x = Math.PI / 2;
      band.position.z = b.x;
      g.add(band);
    });
    const lead1 = seg(0.16, 3, C.metal, { metalness: 0.6 });
    lead1.position.z = 3.8;
    g.add(lead1);
    const lead2 = seg(0.16, 3, C.metal, { metalness: 0.6 });
    lead2.position.z = -3.8;
    g.add(lead2);
    return g;
  };

  /* Capacitor electrolitico */
  MODELS.capacitor = function () {
    const g = new THREE.Group();
    const body = cyl(2.2, 4.5, 0x2b5bb0, { roughness: 0.4, seg: 24 });
    g.add(body);
    const top = cyl(2.25, 0.3, 0xcfd3d8, { roughness: 0.5, seg: 24 });
    top.position.y = 2.4;
    g.add(top);
    const stripe = box(0.4, 4.6, 3.4, 0xcfd3d8, { roughness: 0.5 });
    stripe.position.z = 1.2;
    g.add(stripe);
    const leg1 = seg(0.14, 3, C.metal, { metalness: 0.6 });
    leg1.position.set(0.6, -3.4, 0);
    g.add(leg1);
    const leg2 = seg(0.14, 3, C.metal, { metalness: 0.6 });
    leg2.position.set(-0.6, -3.4, 0);
    g.add(leg2);
    return g;
  };

  /* Transistor TO-92 con 3 patas */
  MODELS.transistor = function () {
    const g = new THREE.Group();
    g.add(box(2.2, 3, 1, C.black, { roughness: 0.5 }));
    const face = box(2.3, 3, 0.3, C.plastic, { roughness: 0.5 });
    face.position.z = 0.7;
    g.add(face);
    const legX = [-0.75, 0, 0.75];
    legX.forEach((x, i) => {
      const leg = seg(0.12, 4, i === 0 ? C.gold : C.metal, { metalness: 0.6 });
      leg.position.set(x, -3.3, 0);
      g.add(leg);
    });
    return g;
  };

  /* Diodo con banda catodo */
  MODELS.diode = function () {
    const g = new THREE.Group();
    const body = cyl(0.9, 3.2, 0x20232b, { roughness: 0.4, seg: 18 });
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const band = cyl(0.95, 0.8, C.gray, { seg: 18 });
    band.rotation.x = Math.PI / 2;
    band.position.z = 1.7;
    g.add(band);
    const lead1 = seg(0.13, 3.5, C.metal, { metalness: 0.6 });
    lead1.position.z = 3.1;
    g.add(lead1);
    const lead2 = seg(0.13, 3.5, C.metal, { metalness: 0.6 });
    lead2.position.z = -3.1;
    g.add(lead2);
    return g;
  };

  /* LED 5mm con cupula */
  MODELS.led = function () {
    const g = new THREE.Group();
    const dome = sphere(1.6, 0xd8433d, { roughness: 0.25, seg: 24 });
    dome.scale.set(1, 1, 1.4);
    dome.position.z = 0.6;
    g.add(dome);
    const base = cyl(1.5, 0.7, 0x9aa0ab, { seg: 20 });
    base.rotation.x = Math.PI / 2;
    g.add(base);
    const leg1 = seg(0.12, 4, C.metal, { metalness: 0.6 });
    leg1.position.set(0.6, 0, -3.6);
    g.add(leg1);
    const leg2 = seg(0.12, 4, C.metal, { metalness: 0.6 });
    leg2.position.set(-0.6, 0, -3.6);
    g.add(leg2);
    return g;
  };

  /* Inductor / bobina */
  MODELS.inductor = function () {
    const g = new THREE.Group();
    const core = cyl(1.5, 3.4, 0x8a5cf5, { roughness: 0.5, seg: 20 });
    core.rotation.x = Math.PI / 2;
    g.add(core);
    for (let i = 0; i < 5; i++) {
      const coil = torus(1.35, 0.28, 0xd7a94a, { seg: 20 });
      coil.position.z = -1.3 + i * 0.65;
      g.add(coil);
    }
    const lead1 = seg(0.14, 3, C.metal, { metalness: 0.6 });
    lead1.position.z = 3.1;
    g.add(lead1);
    const lead2 = seg(0.14, 3, C.metal, { metalness: 0.6 });
    lead2.position.z = -3.1;
    g.add(lead2);
    return g;
  };

  /* Circuito integrado DIP-14 */
  MODELS['ic-chip'] = function () {
    const g = new THREE.Group();
    g.add(box(3.6, 7.4, 1.2, C.black, { roughness: 0.45 }));
    const notch = box(0.7, 0.7, 0.3, C.plastic);
    notch.position.set(0, 3.4, 0.7);
    g.add(notch);
    for (let i = 0; i < 7; i++) {
      [-3.4, 3.4].forEach(x => {
        const pin = seg(0.16, 1.6, C.metal, { metalness: 0.6 });
        pin.position.set(x, -3.1 + i * 1.05, 0);
        g.add(pin);
      });
    }
    return g;
  };

  /* Oscilador de cristal */
  MODELS.crystal = function () {
    const g = new THREE.Group();
    const can = box(3, 3.6, 1.4, C.metal, { roughness: 0.35, metalness: 0.7 });
    g.add(can);
    const leg1 = seg(0.14, 2.6, C.metal, { metalness: 0.6 });
    leg1.position.set(-1, -2.4, 0);
    g.add(leg1);
    const leg2 = seg(0.14, 2.6, C.metal, { metalness: 0.6 });
    leg2.position.set(1, -2.4, 0);
    g.add(leg2);
    return g;
  };

  /* Fusible de vidrio */
  MODELS.fuse = function () {
    const g = new THREE.Group();
    const glass = cyl(0.8, 3.4, 0xbfc6cf, { roughness: 0.15, transparent: true, opacity: 0.55, seg: 18 });
    glass.rotation.x = Math.PI / 2;
    g.add(glass);
    const fil = cyl(0.16, 3, 0xd7a94a, { seg: 12 });
    fil.rotation.x = Math.PI / 2;
    g.add(fil);
    const cap1 = cyl(0.9, 0.5, C.gray, { seg: 18 });
    cap1.rotation.x = Math.PI / 2;
    cap1.position.z = 1.95;
    g.add(cap1);
    const cap2 = cyl(0.9, 0.5, C.gray, { seg: 18 });
    cap2.rotation.x = Math.PI / 2;
    cap2.position.z = -1.95;
    g.add(cap2);
    return g;
  };

  /* Potenciometro (resistencia variable con eje) */
  MODELS.potentiometer = function () {
    const g = new THREE.Group();
    const body = cyl(2.4, 2.4, C.dark, { seg: 22 });
    g.add(body);
    const shaft = cyl(0.7, 3, C.metal, { seg: 14 });
    shaft.position.y = 2.7;
    g.add(shaft);
    const slot = box(0.8, 0.9, 0.4, C.plastic);
    slot.position.set(0, 4.2, 0);
    g.add(slot);
    [-1.6, 0, 1.6].forEach(x => {
      const leg = cyl(0.16, 2.6, C.gold, { seg: 10 });
      leg.position.set(x, -2.4, 0);
      g.add(leg);
    });
    return g;
  };

  /* Termistor NTC (sensor de temperatura) */
  MODELS.thermistor = function () {
    const g = new THREE.Group();
    const bead = sphere(1.5, C.black, { roughness: 0.3 });
    g.add(bead);
    [-0.9, 0.9].forEach(x => {
      const leg = cyl(0.15, 3, C.gray, { seg: 10 });
      leg.position.set(x, -2.6, 0);
      g.add(leg);
    });
    return g;
  };

  /* Varistor MOV (protege contra picos de voltaje) */
  MODELS.varistor = function () {
    const g = new THREE.Group();
    const disc = cyl(2.2, 1.5, C.orange, { seg: 24 });
    disc.rotation.x = Math.PI / 2;
    g.add(disc);
    const ring = torus(2.2, 0.35, C.green, { seg: 22 });
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    [-1.4, 1.4].forEach(z => {
      const leg = cyl(0.15, 3, C.gray, { seg: 10 });
      leg.position.set(0, -2.4, z);
      g.add(leg);
    });
    return g;
  };

  /* Relay (interruptor electromagnetico) */
  MODELS.relay = function () {
    const g = new THREE.Group();
    const body = box(8, 5.5, 6, C.blue, { roughness: 0.4 });
    g.add(body);
    const lid = box(8, 1, 6, C.plasticLt, { roughness: 0.5 });
    lid.position.set(0, 3.2, 0);
    g.add(lid);
    [-2, 2].forEach(x => {
      [-3.4, 3.4].forEach(z => {
        const leg = cyl(0.15, 3, C.gold, { seg: 10 });
        leg.position.set(x, -3.4, z);
        g.add(leg);
      });
    });
    return g;
  };

  /* Transformador con nucleo y bobinados */
  MODELS.transformer = function () {
    const g = new THREE.Group();
    const core = box(3.5, 5.5, 3.5, C.gray, { roughness: 0.4 });
    g.add(core);
    [-1, 1].forEach(y => {
      const coil = torus(2.2, 0.55, C.gold, { seg: 18 });
      coil.position.y = y;
      g.add(coil);
    });
    [-1.2, 1.2].forEach(z => {
      const leg = cyl(0.16, 2.8, C.gold, { seg: 10 });
      leg.position.set(0, -4.2, z);
      g.add(leg);
    });
    return g;
  };

  /* Pulsador tactil de PCB (boton de reset/power) */
  MODELS.pushbutton = function () {
    const g = new THREE.Group();
    const base = box(5, 1.4, 5, C.black, { roughness: 0.4 });
    g.add(base);
    const cap = box(3, 1.8, 3, C.red, { roughness: 0.45 });
    cap.position.set(0, 1.5, 0);
    g.add(cap);
    [-1.4, 1.4].forEach(x => {
      [-1.4, 1.4].forEach(z => {
        const leg = cyl(0.13, 2, C.gold, { seg: 10 });
        leg.position.set(x, -1.8, z);
        g.add(leg);
      });
    });
    return g;
  };

  /* Buzzer piezoelectrico (emisor de beeps) */
  MODELS.buzzer = function () {
    const g = new THREE.Group();
    const base = cyl(3.2, 1.6, C.dark, { seg: 26 });
    g.add(base);
    const top = cyl(2.2, 0.6, C.gold, { seg: 24 });
    top.position.y = 1.1;
    g.add(top);
    const hole = cyl(0.5, 0.8, C.black, { seg: 12 });
    hole.position.y = 1.3;
    g.add(hole);
    [-1.8, 1.8].forEach(x => {
      const leg = cyl(0.14, 2.4, C.gray, { seg: 10 });
      leg.position.set(x, -2.2, 0);
      g.add(leg);
    });
    return g;
  };

  /* Fotoresistor LDR (sensor de luz) */
  MODELS.photoresistor = function () {
    const g = new THREE.Group();
    const body = cyl(1.9, 1.6, C.gray, { seg: 24 });
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const face = cyl(1.7, 0.4, C.orange, { seg: 24 });
    face.rotation.x = Math.PI / 2;
    face.position.z = 0.95;
    g.add(face);
    [-0.7, 0.7].forEach(x => {
      const leg = cyl(0.14, 2.8, C.gray, { seg: 10 });
      leg.position.set(x, -2.4, 0);
      g.add(leg);
    });
    return g;
  };

  /* Chip BIOS/UEFI (flash SOIC-8) */
  MODELS['bios-chip'] = function () {
    const g = new THREE.Group();
    const body = box(3.2, 3, 1.2, C.black, { roughness: 0.4 });
    g.add(body);
    const label = box(1.8, 1.2, 0.3, C.plasticLt);
    label.position.set(0, 0, 0.6);
    g.add(label);
    [-1.9, 1.9].forEach(x => {
      [-1, 0, 1].forEach(y => {
        const p = seg(0.12, 1, C.gold, { seg: 10 });
        p.position.set(x, y, 0);
        g.add(p);
      });
    });
    return g;
  };

  /* Codec de audio (chip de sonido tipo Realtek) */
  MODELS['audio-chip'] = function () {
    const g = new THREE.Group();
    const body = box(3.6, 3.6, 1.3, C.black, { roughness: 0.4 });
    g.add(body);
    const mark = box(1.2, 1.2, 0.3, C.green);
    mark.position.set(0, 0, 0.65);
    g.add(mark);
    [-2.1, 2.1].forEach(x => {
      [-1.2, 0, 1.2].forEach(y => {
        const p = seg(0.1, 0.9, C.gold, { seg: 8 });
        p.position.set(x, y, 0);
        g.add(p);
      });
    });
    return g;
  };

  /* Controlador LAN (chip de red Ethernet) */
  MODELS['lan-chip'] = function () {
    const g = new THREE.Group();
    const body = box(3, 5, 1.2, C.dark, { roughness: 0.4 });
    g.add(body);
    const mark = box(1.4, 1, 0.3, C.lightblue);
    mark.position.set(0, 0, 0.6);
    g.add(mark);
    [-1.8, 1.8].forEach(x => {
      [-1.9, -0.95, 0, 0.95, 1.9].forEach(y => {
        const p = seg(0.11, 1, C.gold, { seg: 10 });
        p.position.set(x, y, 0);
        g.add(p);
      });
    });
    return g;
  };

  /* Tarjeta Wi-Fi M.2 (modulo inalambrico) */
  MODELS['wifi-m2'] = function () {
    const g = new THREE.Group();
    const card = box(2.2, 9, 0.9, C.pcbDark);
    g.add(card);
    const shield = box(2.3, 3.6, 0.5, C.metal, { metalness: 0.6, roughness: 0.4 });
    shield.position.set(0, 1.5, 0.7);
    g.add(shield);
    const chip = box(1.6, 1.6, 0.4, C.black);
    chip.position.set(0, 1.5, 0);
    g.add(chip);
    [-0.6, 0.6].forEach(x => {
      const conn = box(0.9, 2, 0.6, C.gold, { metalness: 0.6 });
      conn.position.set(x, -3.4, 0);
      g.add(conn);
    });
    const edge = box(2.2, 1, 0.4, C.gold, { metalness: 0.6 });
    edge.position.set(0, -4.6, 0);
    g.add(edge);
    return g;
  };

  /* Gabinete Mid-Tower con panel de vidrio (interior visible) */
  MODELS.gabinete = function () {
    const g = new THREE.Group();

    function fan(radius, ringColor) {
      const f = new THREE.Group();
      f.add(seg(radius, 2.4, C.dark, { seg: 32 }));
      for (let i = 0; i < 7; i++) {
        const blade = box(radius * 0.82, 0.7, 2.8, C.plasticLt);
        blade.position.x = radius * 0.45;
        blade.rotation.z = (i * Math.PI) / 3.5;
        f.add(blade);
      }
      const hub = cyl(radius * 0.24, 3.4, C.gray, { seg: 20 });
      hub.rotation.x = Math.PI / 2;
      f.add(hub);
      const ring = torus(radius * 0.95, 0.5, ringColor || C.purple);
      f.add(ring);
      return f;
    }

    /* paneles del chasis */
    const top = box(54, 1.2, 46, C.dark, { roughness: 0.5 });
    top.position.set(0, 28, 0);
    g.add(top);
    const bottom = box(54, 1.2, 46, C.dark, { roughness: 0.5 });
    bottom.position.set(0, -28, 0);
    g.add(bottom);
    const front = box(54, 56, 1.2, C.dark, { roughness: 0.5 });
    front.position.set(0, 0, 23);
    g.add(front);
    const back = box(54, 56, 1.2, C.dark, { roughness: 0.5 });
    back.position.set(0, 0, -23);
    g.add(back);
    const right = box(1.2, 56, 46, C.dark, { roughness: 0.5 });
    right.position.set(27, 0, 0);
    g.add(right);

    /* vidrio lateral (transparente) con marco */
    const glass = box(1.1, 56, 46, C.plasticLt, { transparent: true, opacity: 0.16, metalness: 0.4, roughness: 0.08 });
    glass.position.set(-27.2, 0, 0);
    g.add(glass);
    box(1.6, 2.6, 48, C.black).position.set(-27.4, 28, 0);
    box(1.6, 2.6, 48, C.black).position.set(-27.4, -28, 0);
    box(1.6, 56, 2.6, C.black).position.set(-27.4, 0, 23);
    box(1.6, 56, 2.6, C.black).position.set(-27.4, 0, -23);

    /* patas */
    [[-24, 17], [24, 17], [-24, -17], [24, -17]].forEach(p => {
      const foot = cyl(2.2, 2.4, C.black, { seg: 20 });
      foot.position.set(p[0], -29.2, p[1]);
      g.add(foot);
    });

    /* ventiladores frontales de entrada (intake) */
    [[-14, 6], [0, 6], [14, 6], [-14, -8], [0, -8], [14, -8]].forEach(p => {
      const f = fan(8.5, C.blue);
      f.position.set(p[0], p[1], 22.8);
      g.add(f);
    });

    /* ventiladores superiores (exhaust) */
    [-9, 9].forEach(x => {
      const f = fan(8.5, C.teal);
      f.rotation.x = Math.PI / 2;
      f.position.set(x, 29.6, -3);
      g.add(f);
    });

    /* ventilador trasero (exhaust) */
    const rear = fan(8.5, C.red);
    rear.position.set(-15, 15, -22.8);
    g.add(rear);

    /* placa base dentro, mirando hacia el vidrio */
    const mb = MODELS.motherboard();
    mb.rotation.y = -Math.PI / 2;
    mb.scale.set(0.55, 0.55, 0.55);
    mb.position.set(24.8, 7, -2);
    g.add(mb);

    /* GPU horizontal con dos ventiladores hacia abajo */
    const gpu = new THREE.Group();
    const card = box(3.4, 5, 26, C.black);
    gpu.add(card);
    [-1.2, 1.2].forEach(x => {
      const f = fan(3.6, C.blue);
      f.rotation.x = Math.PI / 2;
      f.position.set(x, -3.4, 0);
      gpu.add(f);
    });
    const backplate = box(3.8, 0.4, 26, C.metal, { metalness: 0.6, roughness: 0.4 });
    backplate.position.set(0, 2.9, 0);
    gpu.add(backplate);
    const bracket = box(4.4, 2.6, 1.2, C.gray);
    bracket.position.set(0, -1.2, -12.6);
    gpu.add(bracket);
    gpu.position.set(10, -9, -4);
    g.add(gpu);

    /* fuente de poder (PSU) abajo */
    const psu = box(14, 7.5, 17, C.dark, { roughness: 0.5 });
    psu.position.set(12, -23.5, 10);
    g.add(psu);
    for (let i = -5; i <= 5; i++) {
      const bar = box(0.6, 0.6, 14, C.metal);
      bar.position.set(12, -27.4, 10 + i * 1.1);
      g.add(bar);
    }
    const psuLabel = box(5, 1.2, 0.3, C.white);
    psuLabel.position.set(12, -22.6, 2.6);
    g.add(psuLabel);

    /* tapa inferior (PSU shroud) y barra de cables */
    const shroud = box(52, 0.5, 40, C.black);
    shroud.position.set(0, -17.4, -1);
    g.add(shroud);
    const cableBar = box(1.4, 50, 2.2, C.black);
    cableBar.position.set(15, 1, -18);
    g.add(cableBar);

    /* I/O trasero */
    const io = box(10, 3, 1.4, C.metal);
    io.position.set(-17, 18, -22.7);
    g.add(io);

    return g;
  };

  /* Comparacion de tamanos de ventilador 120mm vs 140mm */
  MODELS['fan-sizes'] = function () {
    const g = new THREE.Group();
    function fan(radius, ringColor) {
      const f = new THREE.Group();
      f.add(cyl(radius, 2.2, C.dark, { seg: 32 }));
      for (let i = 0; i < 7; i++) {
        const blade = box(radius * 0.85, 0.55, 2.6, C.plasticLt);
        blade.position.y = radius * 0.45;
        blade.rotation.z = (i * Math.PI) / 3.5;
        f.add(blade);
      }
      const hub = cyl(radius * 0.22, 3.2, C.gray, { seg: 20 });
      f.add(hub);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.95, 0.5, 14, 36), M(ringColor));
      ring.rotation.x = Math.PI / 2;
      f.add(ring);
      return f;
    }
    const f120 = fan(6, C.blue);
    f120.position.set(-7.2, 0, 0);
    g.add(f120);
    const f140 = fan(7, C.teal);
    f140.position.set(7.8, 0, 0);
    g.add(f140);
    return g;
  };

  /* Disco duro mecanico 3.5" (HDD) */
  MODELS['hdd-35'] = function () {
    const g = new THREE.Group();
    g.add(box(22, 14, 3.4, C.metal, { roughness: 0.45, metalness: 0.35 }));
    const lid = box(20.4, 12, 0.5, C.dark, { roughness: 0.5 });
    lid.position.y = 1.9;
    g.add(lid);
    const label = box(15, 8, 0.35, C.gray, { roughness: 0.5 });
    label.position.set(0, 2.2, 0);
    g.add(label);
    const data = box(3.6, 2.4, 1.4, C.black);
    data.position.set(-7.5, -5.4, 2.4);
    g.add(data);
    const pw = box(5.6, 2.4, 1.4, C.black);
    pw.position.set(4.5, -5.4, 2.4);
    g.add(pw);
    [-7.2, 7.2].forEach(sy => {
      [-6, 0, 6].forEach(sz => {
        const hole = box(0.4, 0.6, 0.8, C.black);
        hole.position.set(0, sy, sz);
        g.add(hole);
      });
    });
    g.add(tube([
      new THREE.Vector3(-7.5, -5.4, 3.2),
      new THREE.Vector3(-7.5, -8, 7),
      new THREE.Vector3(-7.5, -8, 12)
    ], 0.5, 0x3a3e49, 16));
    return g;
  };

  /* Cuerpo comun de una PSU ATX */
  function psuBody() {
    const g = new THREE.Group();
    g.add(box(16, 9.5, 18, 0x1c1d24, { roughness: 0.5 }));
    g.add(box(16.6, 9.9, 18.4, 0x0d0e12, { roughness: 0.6 }));
    const fan = cyl(6, 1, C.dark, { seg: 28 });
    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, 5, 0);
    g.add(fan);
    const hub = cyl(1.4, 1.1, C.gray, { seg: 18 });
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, 5, 0);
    g.add(hub);
    [-4.2, 0, 4.2].forEach(y => {
      const bar = box(0.5, 0.5, 11, C.metal);
      bar.position.set(0, 5, y);
      g.add(bar);
    });
    const sw = box(3, 1.2, 1, C.black);
    sw.position.set(-5, 0, -9.5);
    g.add(sw);
    const inlet = box(4, 2.4, 0.8, C.gray);
    inlet.position.set(0, -2.8, -9.5);
    g.add(inlet);
    return g;
  }

  /* PSU modular: todos los cables se conectan (sockets) */
  MODELS['psu-modular'] = function () {
    const g = psuBody();
    const sh1 = box(2.6, 1.5, 1.4, 0xd8433d, { roughness: 0.4 });
    sh1.position.set(-5, 3, -9.5);
    g.add(sh1);
    const sh2 = box(2.6, 1.5, 1.4, 0x3b82c4, { roughness: 0.4 });
    sh2.position.set(5, 3, -9.5);
    g.add(sh2);
    const sh3 = box(2.6, 1.5, 1.4, 0x4cb057, { roughness: 0.4 });
    sh3.position.set(-5, 0.2, -9.5);
    g.add(sh3);
    const sh4 = box(2.6, 1.5, 1.4, 0xf6c344, { roughness: 0.4 });
    sh4.position.set(5, 0.2, -9.5);
    g.add(sh4);
    const atx = box(6, 2, 1.4, C.black, { roughness: 0.4 });
    atx.position.set(-2, -3.4, -9.5);
    g.add(atx);
    const label = box(8, 3, 0.3, 0x3b82c4);
    label.position.set(0, 0, 9.5);
    g.add(label);
    return g;
  };

  /* PSU semi-modular: cables principales fijos + sockets */
  MODELS['psu-semi'] = function () {
    const g = psuBody();
    function bundle(x, cols) {
      cols.forEach((c, i) => {
        g.add(tube([
          new THREE.Vector3(x, 2.5 - i * 0.5, -9.5),
          new THREE.Vector3(x * 0.8, 2.5 - i * 0.5 - 3, -12),
          new THREE.Vector3(x * 0.55, 2.5 - i * 0.5 - 6, -16)
        ], 0.45, c, 14));
      });
    }
    bundle(-4, [0xf6c344, 0x17181c, 0xd8433d, 0x17181c, 0xe27d2b, 0x17181c, 0x9aa0ab, 0x17181c]);
    bundle(4, [0xf6c344, 0x17181c, 0xf6c344, 0x17181c]);
    const sh1 = box(2.6, 1.5, 1.4, 0xd8433d, { roughness: 0.4 });
    sh1.position.set(-5, 3, -9.5);
    g.add(sh1);
    const sh2 = box(2.6, 1.5, 1.4, 0x3b82c4, { roughness: 0.4 });
    sh2.position.set(5, 3, -9.5);
    g.add(sh2);
    const label = box(8, 3, 0.3, 0x3b82c4);
    label.position.set(0, 0, 9.5);
    g.add(label);
    return g;
  };

  /* PSU no-modular: todos los cables van fijos (mazo grueso) */
  MODELS['psu-no-modular'] = function () {
    const g = psuBody();
    const cols = [0x17181c, 0x17181c, 0xf6c344, 0xd8433d, 0xe27d2b, 0x17181c, 0x9aa0ab, 0xf6c344, 0x17181c, 0xd8433d];
    cols.forEach((c, i) => {
      const x = -7 + (i % 5) * 3.5;
      const y = 3.5 - Math.floor(i / 5) * 5.5;
      g.add(tube([
        new THREE.Vector3(x, y, -9.5),
        new THREE.Vector3(x * 0.8, y - 3, -12),
        new THREE.Vector3(x * 0.55, y - 6, -16)
      ], 0.5, c, 14));
    });
    const sleeve = box(13, 2, 2.4, 0x0d0e12, { roughness: 0.6 });
    sleeve.position.set(0, -0.3, -10.5);
    g.add(sleeve);
    const label = box(8, 3, 0.3, 0x3b82c4);
    label.position.set(0, 0, 9.5);
    g.add(label);
    return g;
  };

  /* GPU tipo blower / referencia (un solo ventilador radial) */
  MODELS['gpu-blower'] = function () {
    const g = new THREE.Group();
    g.add(box(4.2, 24, 11, C.pcb, { roughness: 0.55 }));
    const shroud = box(4.4, 23, 10, 0x1c1d24, { roughness: 0.5 });
    shroud.position.set(0, 0.4, 0.3);
    g.add(shroud);
    const fan = cyl(3.6, 0.8, C.dark, { seg: 26 });
    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, -8.6, 1.1);
    g.add(fan);
    const hub = cyl(1.1, 0.9, C.gray, { seg: 18 });
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, -8.6, 1.1);
    g.add(hub);
    for (let i = 0; i < 7; i++) {
      const vent = box(4.8, 1.2, 0.4, C.black);
      vent.position.set(0, 6.5 - i * 1.8, 1.9);
      g.add(vent);
    }
    const bracket = box(4.4, 1.6, 11, C.metal, { roughness: 0.35, metalness: 0.6 });
    bracket.position.set(0, 12.6, 0);
    g.add(bracket);
    [-3.5, 0, 3.5].forEach(z => {
      const port = box(3.4, 0.7, 1.3, C.dark);
      port.position.set(0, 12.6, z);
      g.add(port);
    });
    const pcie = box(2.6, 10, 1.2, C.gold, { roughness: 0.3, metalness: 0.5 });
    pcie.position.set(0, -17, 0);
    g.add(pcie);
    return g;
  };

  /* GPU de gama alta con 3 ventiladores y backplate */
  MODELS['gpu-triple'] = function () {
    const g = new THREE.Group();
    g.add(box(5.4, 32, 15, C.pcb, { roughness: 0.55 }));
    const shroud = box(5.8, 30.5, 14, 0x1c1d24, { roughness: 0.5 });
    shroud.position.set(0, -0.5, 0.3);
    g.add(shroud);
    [-9, 0, 9].forEach(y => {
      const fr = cyl(3.4, 0.7, C.dark, { seg: 26 });
      fr.rotation.x = Math.PI / 2;
      fr.position.set(0, y, 1.2);
      g.add(fr);
      const h = cyl(1.0, 0.8, C.gray, { seg: 18 });
      h.rotation.x = Math.PI / 2;
      h.position.set(0, y, 1.2);
      g.add(h);
    });
    const backplate = box(5.6, 31, 0.5, C.metal, { metalness: 0.6, roughness: 0.35 });
    backplate.position.set(0, -0.5, 1.5);
    g.add(backplate);
    const accent = box(5.8, 30.5, 0.3, 0x3b82c4);
    accent.position.set(0, -0.5, 2.6);
    g.add(accent);
    const bracket = box(4.4, 1.8, 15, C.metal, { roughness: 0.35, metalness: 0.6 });
    bracket.position.set(0, 15.4, 0);
    g.add(bracket);
    [-5, 0, 5].forEach(z => {
      const port = box(3.4, 0.7, 1.3, C.dark);
      port.position.set(0, 15.4, z);
      g.add(port);
    });
    const pcie = box(2.6, 13, 1.2, C.gold, { roughness: 0.3, metalness: 0.5 });
    pcie.position.set(0, -21, 0);
    g.add(pcie);
    return g;
  };

  /* Generaciones de RAM: DDR3 / DDR4 / DDR5 (muesca en distinta posicion) */
  MODELS['ram-generations'] = function () {
    const g = new THREE.Group();
    function stick(accent, notchX, y) {
      const s = new THREE.Group();
      s.add(box(16, 4.5, 1, C.pcb, { roughness: 0.6 }));
      for (let i = 0; i < 8; i++) {
        const chip = box(1.6, 2.2, 0.35, C.black);
        chip.position.set(-6.3 + i * 1.8, 0.8, 0.7);
        s.add(chip);
      }
      const hs = box(16, 0.6, 1.6, accent, { roughness: 0.4 });
      hs.position.set(0, 2.9, 0);
      s.add(hs);
      const notch = box(1, 1.4, 1.2, C.dark);
      notch.position.set(notchX, -2.4, 0);
      s.add(notch);
      const plate = box(4.4, 1.5, 0.4, accent, { roughness: 0.5 });
      plate.position.set(0, -1.4, 1.1);
      s.add(plate);
      s.position.y = y;
      return s;
    }
    g.add(stick(0x3bc2c9, 4.2, 0));
    g.add(stick(0x8a5cf5, 2.4, -7));
    g.add(stick(0x3b82c4, -2.6, 7));
    return g;
  };

  /* Memoria RAM de laptop (SO-DIMM) */
  MODELS['ram-sodimm'] = function () {
    const g = new THREE.Group();
    g.add(box(10, 5, 1, C.pcb, { roughness: 0.6 }));
    for (let i = 0; i < 6; i++) {
      const chip = box(1.2, 1.7, 0.3, C.black);
      chip.position.set(-3.8 + i * 1.5, 0.6, 0.7);
      g.add(chip);
    }
    const hs = box(10, 0.5, 1.4, C.dark, { roughness: 0.4 });
    hs.position.set(0, 2.9, 0);
    g.add(hs);
    const notch = box(0.9, 1.3, 1.1, C.dark);
    notch.position.set(3.2, -2.7, 0);
    g.add(notch);
    return g;
  };

  /* Comparacion de formatos de placa base: E-ATX vs ATX vs mATX vs Mini-ITX */
  MODELS['mb-formats'] = function () {
    const g = new THREE.Group();
    const boards = [
      { w: 30.5, h: 33, x: -24, accent: 0xe27d2b },
      { w: 30.5, h: 24.4, x: -6, accent: 0x4cb057 },
      { w: 24.4, h: 24.4, x: 12, accent: 0x3b82c4 },
      { w: 17, h: 17, x: 30, accent: 0x8a5cf5 }
    ];
    boards.forEach(b => {
      const grp = new THREE.Group();
      grp.add(box(b.w, 0.8, b.h, C.pcb, { roughness: 0.75 }));
      const strip = box(b.w, 0.9, 0.5, b.accent, { roughness: 0.5 });
      strip.position.set(0, 0.2, b.h / 2 + 0.2);
      grp.add(strip);
      const socket = box(6.5, 0.7, 6.5, C.dark);
      socket.position.set(-b.w * 0.22, 0.5, -b.h * 0.22);
      grp.add(socket);
      const dimmN = b.w > 20 ? 4 : 2;
      for (let i = 0; i < dimmN; i++) {
        const slot = box(0.7, 0.6, 3.2, C.blue);
        slot.position.set(b.w * 0.24, 0.5, -b.h * 0.1 + i * 2.2);
        grp.add(slot);
      }
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(c => {
        const screw = cyl(0.5, 0.8, C.metal, { seg: 12 });
        screw.position.set(c[0] * (b.w / 2 - 1.4), 0, c[1] * (b.h / 2 - 1.4));
        grp.add(screw);
      });
      grp.position.x = b.x;
      g.add(grp);
    });
    return g;
  };

  /* USB Micro-B (celulares y perifericos antiguos) */
  MODELS['usb-micro'] = function () {
    const g = new THREE.Group();
    g.add(box(7.4, 1.9, 5.6, C.metal, { metalness: 0.85, roughness: 0.28 }));
    const taper = box(6.2, 1.3, 5.4, C.metal, { metalness: 0.85, roughness: 0.28 });
    taper.position.z = 0.8;
    g.add(taper);
    const inner = box(5.8, 1.1, 5, 0x17181c);
    inner.position.set(0, 0.15, 0.7);
    g.add(inner);
    [-0.4, 0, 0.4].forEach(x => {
      const p = seg(0.12, 1, C.gold);
      p.position.set(x, 0, 3.4);
      g.add(p);
    });
    g.add(wireBundle([new THREE.Vector3(0, 0, -2.8)], [0x2a2d36, 0x9aa0ab, 0x17181c, 0xd8433d], { down: 8, back: 4, radius: 0.4, spread: 1.2 }));
    return g;
  };

  /* USB Mini-B (camaras y consolas antiguas) */
  MODELS['usb-mini'] = function () {
    const g = new THREE.Group();
    g.add(box(7, 3.4, 4.8, C.metal, { metalness: 0.85, roughness: 0.28 }));
    const inner = box(5.6, 2.4, 4.2, 0x17181c);
    inner.position.set(0, 0.3, 0.4);
    g.add(inner);
    [-0.6, 0, 0.6].forEach(x => {
      const p = seg(0.14, 1, C.gold);
      p.position.set(x, 0, 3);
      g.add(p);
    });
    const notch = box(1.2, 0.5, 0.6, C.metal);
    notch.position.set(-2.2, -1.6, 1);
    g.add(notch);
    g.add(wireBundle([new THREE.Vector3(0, 0, -2.4)], [0x2a2d36, 0x9aa0ab, 0x17181c, 0xd8433d], { down: 8, back: 4, radius: 0.4, spread: 1.2 }));
    return g;
  };

  /* Memoria USB (pendrive) */
  MODELS['usb-flash'] = function () {
    const g = new THREE.Group();
    g.add(box(5.5, 11, 2.4, 0x3b82c4, { roughness: 0.4 }));
    const cap = box(5.8, 2, 2.6, C.dark, { roughness: 0.5 });
    cap.position.set(0, -7, 0);
    g.add(cap);
    const sleeve = box(5, 4.6, 2.2, C.metal, { metalness: 0.85, roughness: 0.28 });
    sleeve.position.set(0, -10.4, 0);
    g.add(sleeve);
    const inner = box(4.4, 4, 1.8, 0x17181c);
    inner.position.set(0, -10.4, 0.2);
    g.add(inner);
    const gold = box(4.4, 0.8, 0.6, C.gold, { metalness: 0.7 });
    gold.position.set(0, -10.4, 1.5);
    g.add(gold);
    const led = sphere(0.5, 0x4cb057, { transparent: true, opacity: 0.9 });
    led.position.set(0, 3.4, 1.3);
    g.add(led);
    const ring = torus(1, 0.25, C.metal, { metalness: 0.5 });
    ring.position.set(0, 5.6, 0);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    return g;
  };

  /* Socket PGA (AMD AM4): pines en el CPU */
  MODELS['cpu-pga'] = function () {
    const g = new THREE.Group();
    const socket = box(17, 2.4, 17, C.plastic, { roughness: 0.5 });
    socket.position.y = -1.2;
    g.add(socket);
    const cavity = box(13.5, 1, 13.5, C.black);
    cavity.position.set(0, 0.15, 0);
    g.add(cavity);
    const lever = box(17, 1, 1.4, C.metal);
    lever.position.set(0, -0.4, -8.8);
    g.add(lever);
    const handle = box(1.4, 5, 1.2, C.plasticLt);
    handle.position.set(0, -0.4, -8.8);
    handle.rotation.x = 0.5;
    g.add(handle);
    const cpu = box(10.5, 1.3, 10.5, C.dark, { roughness: 0.55 });
    cpu.position.y = 2.6;
    g.add(cpu);
    const heat = box(10.8, 0.5, 10.8, C.metal, { roughness: 0.35, metalness: 0.6 });
    heat.position.y = 3.6;
    g.add(heat);
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const p = cyl(0.16, 2, C.gold, { seg: 8 });
        p.position.set(-4.2 + r * 1.4, 1.5, -4.2 + c * 1.4);
        g.add(p);
      }
    }
    return g;
  };

  /* Puerto paralelo LPT (DB-25, 25 pines) */
  MODELS['port-db25'] = function () {
    const g = new THREE.Group();
    const shell = box(17, 10, 6, 0xb9bec7, { roughness: 0.4 });
    g.add(shell);
    const rows = [8, 7, 7, 3];
    rows.forEach((n, r) => {
      const w = (n - 1) * 2.2;
      const y = 3 - r * 2.2;
      for (let c = 0; c < n; c++) {
        const p = seg(0.32, 1.5, C.gold);
        p.position.set(-w / 2 + c * 2.2, y, 3.2);
        g.add(p);
      }
    });
    const screw = cyl(0.7, 1.8, C.metal, { seg: 12 });
    screw.rotation.x = Math.PI / 2;
    screw.position.set(8.6, 0, 0);
    g.add(screw);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0x9aa0ab], { down: 8, back: 4, radius: 0.7, spread: 0 }));
    return g;
  };

  /* Puerto FireWire (IEEE 1394, 6 pines) */
  MODELS['port-firewire'] = function () {
    const g = new THREE.Group();
    const shell = box(8, 5, 6, C.metal, { metalness: 0.85, roughness: 0.28 });
    g.add(shell);
    const inner = box(7, 4, 5.4, 0x17181c);
    inner.position.z = 0.3;
    g.add(inner);
    [-0.8, 0, 0.8].forEach(x => {
      [-0.7, 0.7].forEach(y => {
        const p = seg(0.14, 1.2, C.gold);
        p.position.set(x, y, 3.5);
        g.add(p);
      });
    });
    const notch = box(2.4, 0.7, 0.8, C.metal);
    notch.position.set(0, 2.4, 2.2);
    g.add(notch);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0x9aa0ab, 0x17181c, 0xd8433d, 0x4cb057], { down: 9, back: 4, radius: 0.5, spread: 1.2 }));
    return g;
  };

  /* Puerto eSATA (SATA externo) */
  MODELS['port-esata'] = function () {
    const g = new THREE.Group();
    const sleeve = box(12, 4.6, 6, C.metal, { metalness: 0.85, roughness: 0.28 });
    g.add(sleeve);
    const inner = box(10.6, 3.6, 5.4, 0x17181c);
    inner.position.z = 0.3;
    g.add(inner);
    for (let c = 0; c < 7; c++) {
      const p = seg(0.2, 1.3, C.gold);
      p.position.set(-3 + c * 1.0, 0.4, 3.5);
      g.add(p);
    }
    const tab = box(4.5, 1.1, 1.2, C.metal);
    tab.position.set(0, -2.4, 2.2);
    g.add(tab);
    g.add(wireBundle([new THREE.Vector3(0, 0, -3)], [0x17181c, 0x17181c, 0x17181c, 0x9aa0ab, 0x17181c, 0x17181c, 0x17181c], { down: 8, back: 4, radius: 0.45, spread: 1.4 }));
    return g;
  };

  /* Conectores RCA (video compuesto + audio estereo) */
  MODELS['port-rca'] = function () {
    const g = new THREE.Group();
    const plate = box(14, 6, 1.2, 0x2a2d36);
    plate.position.set(0, 0, -2);
    g.add(plate);
    [0xf6c344, 0xe9ebee, 0xd8433d].forEach((col, i) => {
      const x = (i - 1) * 4.5;
      const ring = cyl(1.7, 1, 0x2a2d36, { seg: 20 });
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0, -1.4);
      g.add(ring);
      const body = cyl(1.5, 3.4, col, { seg: 20, roughness: 0.4 });
      body.rotation.x = Math.PI / 2;
      body.position.set(x, 0, 0.4);
      g.add(body);
      const pin = cyl(0.6, 1.4, C.gold, { seg: 14 });
      pin.rotation.x = Math.PI / 2;
      pin.position.set(x, 0, 2.2);
      g.add(pin);
    });
    return g;
  };

  /* Conector BNC (bayoneta, un cuarto de vuelta) */
  MODELS['port-bnc'] = function () {
    const g = new THREE.Group();
    const plate = box(8, 5, 1.2, 0x2a2d36);
    plate.position.set(0, 0, -4.5);
    g.add(plate);
    const body = cyl(1.4, 5, C.metal, { seg: 20, metalness: 0.6, roughness: 0.35 });
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const knurl = cyl(1.75, 1.2, 0x2a2d36, { seg: 20 });
    knurl.rotation.x = Math.PI / 2;
    knurl.position.set(0, 0, -2.8);
    g.add(knurl);
    [-1, 1].forEach(s => {
      const lug = box(0.4, 1.1, 1.3, C.metal, { metalness: 0.6 });
      lug.position.set(s * 1.6, 0, 0.4);
      lug.rotation.z = s * 0.35;
      g.add(lug);
    });
    const center = cyl(0.5, 1.4, C.gold, { seg: 12 });
    center.rotation.x = Math.PI / 2;
    center.position.set(0, 0, 3.2);
    g.add(center);
    g.add(wireBundle([new THREE.Vector3(0, 0, -4.2)], [0x9aa0ab], { down: 8, back: 4, radius: 0.6, spread: 0 }));
    return g;
  };

  /* Thunderbolt (USB-C con rayo, 40 Gbps) */
  MODELS.thunderbolt = function () {
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
        p.position.set(-w / 2 + c * 0.42, y, 4.4);
        g.add(p);
      }
    });
    const shroud = box(7.2, 3.4, 2, C.dark, { roughness: 0.5 });
    shroud.position.set(0, 2.1, -1);
    g.add(shroud);
    const bolt1 = box(0.55, 1.8, 0.4, 0xf6c344);
    bolt1.position.set(-0.1, 2.3, -1);
    g.add(bolt1);
    const bolt2 = box(1.3, 0.55, 0.4, 0xf6c344);
    bolt2.position.set(0.6, 2.6, -1);
    g.add(bolt2);
    g.add(wireBundle([new THREE.Vector3(0, 0, -4)], [0x2a2d36, 0x9aa0ab], { down: 10, back: 5, radius: 0.5, spread: 1.4 }));
    return g;
  };

  /* Comparacion de blindaje de par trenzado: UTP vs FTP vs STP */
  MODELS['blindaje-par'] = function () {
    const g = new THREE.Group();
    const pairs = [
      [0xf6c344, 0xe9ebee], [0x4cb057, 0xe9ebee],
      [0x3b82c4, 0xe9ebee], [0x7a4e26, 0xe9ebee]
    ];
    const pos = [[1.4, 1.4], [-1.4, 1.4], [-1.4, -1.4], [1.4, -1.4]];
    function disc(r, h, color, o) { const d = cyl(r, h, color, o); d.rotation.x = Math.PI / 2; return d; }
    function cable(x, shields) {
      const grp = new THREE.Group();
      const jacket = disc(4.8, 0.7, 0x2a2d36);
      jacket.position.z = 1.1;
      grp.add(jacket);
      if (shields.outer) {
        const foil = disc(4.35, 0.75, 0xb9bec7, { metalness: 0.6, transparent: true, opacity: 0.55 });
        foil.position.z = 0.75;
        grp.add(foil);
        const mesh = torus(4.35, 0.18, C.metal, { metalness: 0.7 });
        mesh.position.z = 0.75;
        grp.add(mesh);
      }
      const core = disc(4.1, 0.6, 0xe9ebee);
      core.position.z = 0.35;
      grp.add(core);
      pos.forEach((p, i) => {
        const w1 = disc(0.62, 0.6, pairs[i][0]);
        w1.position.set(p[0], p[1], -0.1);
        grp.add(w1);
        const w2 = disc(0.62, 0.6, pairs[i][1]);
        w2.position.set(p[0], p[1], -0.6);
        grp.add(w2);
        if (shields.perPair) {
          const pring = torus(0.85, 0.12, C.gold, { metalness: 0.7 });
          pring.position.set(p[0], p[1], -0.35);
          grp.add(pring);
        }
      });
      grp.position.x = x;
      return grp;
    }
    g.add(cable(-13, { outer: false, perPair: false }));
    g.add(cable(0, { outer: true, perPair: false }));
    g.add(cable(13, { outer: true, perPair: true }));
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
