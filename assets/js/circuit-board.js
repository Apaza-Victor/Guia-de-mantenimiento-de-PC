/* ============================================================
   TECHGUIDE - circuit-board.js (solo index.html)
   Reimplementacion en vanilla JS/SVG del componente
   "Circuit Board" de 21st.dev (https://21st.dev/@componentry):
   - trazas en angulo recto entre nodos de hardware
   - pulsos de electricidad que recorren las trazas (SMIL)
   - rejilla de puntos de fondo y vias en las esquinas
   - adaptacion al tema claro/oscuro y prefers-reduced-motion
   Uso:
     <div class="circuit-board" id="circuitBoard" aria-hidden="true"></div>
   ============================================================ */

(function () {
  var VB_W = 520;
  var VB_H = 400;

  var NODES = [
    { id: 'mother', x: 95, y: 150, label: 'Motherboard', icon: 'bi-motherboard' },
    { id: 'cpu', x: 390, y: 75, label: 'CPU', icon: 'bi-cpu' },
    { id: 'ram', x: 240, y: 100, label: 'RAM', icon: 'bi-memory' },
    { id: 'gpu', x: 455, y: 200, label: 'GPU', icon: 'bi-gpu-card' },
    { id: 'ssd', x: 330, y: 315, label: 'SSD', icon: 'bi-hdd' },
    { id: 'psu', x: 120, y: 300, label: 'PSU', icon: 'bi-plug' }
  ];

  var LINKS = [
    { from: 'mother', to: 'cpu', dur: 2.6, delay: 0 },
    { from: 'cpu', to: 'ram', dur: 2.2, delay: .9 },
    { from: 'cpu', to: 'gpu', dur: 2.8, delay: 1.4 },
    { from: 'ram', to: 'ssd', dur: 3.0, delay: 1.9 },
    { from: 'ssd', to: 'psu', dur: 2.4, delay: 2.4 },
    { from: 'psu', to: 'mother', dur: 2.6, delay: 3.0 }
  ];

  function byId(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }

  /* traza en angulo recto (con esquinas redondeadas) + esquinas */
  function trace(a, b) {
    var mx = Math.round((a.x + b.x) / 2);
    return {
      d: 'M' + a.x + ' ' + a.y + ' H' + mx + ' V' + b.y + ' H' + b.x,
      corners: [{ x: mx, y: a.y }, { x: mx, y: b.y }]
    };
  }

  function buildSvg(reduce) {
    var parts = [];
    parts.push('<svg class="circuit-svg" viewBox="0 0 ' + VB_W + ' ' + VB_H +
      '" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">');

    /* rejilla de puntos de fondo */
    parts.push('<defs><pattern id="cbGrid" width="22" height="22" patternUnits="userSpaceOnUse">' +
      '<circle cx="1.5" cy="1.5" r="1.3" class="cb-grid-dot"/></pattern></defs>');
    parts.push('<rect width="' + VB_W + '" height="' + VB_H + '" fill="url(#cbGrid)"/>');

    LINKS.forEach(function (l, i) {
      var a = byId(l.from);
      var b = byId(l.to);
      if (!a || !b) return;
      var t = trace(a, b);
      var id = 'cbTrace' + i;
      parts.push('<path id="' + id + '" class="cb-trace" d="' + t.d + '"/>');
      t.corners.forEach(function (c) {
        parts.push('<circle cx="' + c.x + '" cy="' + c.y + '" r="1.6" class="cb-junction"/>');
      });
      if (!reduce) {
        [0, .5].forEach(function (offset) {
          parts.push('<circle class="cb-pulse" r="3">' +
            '<animateMotion dur="' + l.dur + 's" begin="' + (l.delay + l.dur * offset) + 's" repeatCount="indefinite">' +
            '<mpath href="#' + id + '"/></animateMotion></circle>');
        });
      }
    });

    parts.push('</svg>');
    return parts.join('');
  }

  function buildNodes() {
    var frag = document.createDocumentFragment();
    NODES.forEach(function (n, i) {
      var el = document.createElement('div');
      el.className = 'cb-node';
      el.title = n.label;
      el.style.left = ((n.x / VB_W) * 100).toFixed(3) + '%';
      el.style.top = ((n.y / VB_H) * 100).toFixed(3) + '%';
      el.style.animationDelay = (i * .35).toFixed(2) + 's';
      el.innerHTML = '<span class="cb-chip"><i class="bi ' + n.icon + '"></i></span>' +
        '<span class="cb-label">' + n.label + '</span>';
      frag.appendChild(el);
    });
    return frag;
  }

  function init() {
    var container = document.getElementById('circuitBoard');
    if (!container) return;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.innerHTML = buildSvg(reduce);
    container.appendChild(buildNodes());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
