/* ============================================================
   TECHGUIDE - visuals-2d.js
   Diagramas 2D (SVG) ligeros que reemplazan parte del visor 3D.
   No requiere Three.js.
   - Paginas mixtas (window.__CABLES3D__ definido por cables-3d.js):
     el conector macho sigue en 3D y se agrega un bloque .port-2d
     con el puerto hembra en 2D junto a el.
   - Paginas sin Three.js (flag ausente): llena .three-stage con el
     diagrama 2D (herramientas, simbolos, discos, topologias...).
   FEMALE = contraparte hembra de un conector macho (recibe .port-2d).
   MODELS = diagramas independientes que no usan 3D.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function svg(w, h, inner) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" role="img">' + inner + '</svg>'; }
  function rect(x, y, w, h, fill, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + (fill || 'none') + '"' + (extra || '') + '/>'; }
  function circle(cx, cy, r, fill, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (fill || 'none') + '"' + (extra || '') + '/>'; }
  function el(x, y, rx, ry, fill, extra) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + (fill || 'none') + '"' + (extra || '') + '/>'; }
  function path(d, fill, extra) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (extra || '') + '/>'; }
  function text(x, y, s, fs, fill, anchor) { return '<text x="' + x + '" y="' + y + '" font-size="' + (fs || 10) + '" fill="' + (fill || '#9aa0ab') + '" text-anchor="' + (anchor || 'middle') + '" font-family="JetBrains Mono, monospace">' + esc(s) + '</text>'; }
  function ledges(x, y, len, stroke) { return '<line x1="' + x + '" y1="' + y + '" x2="' + (x + len) + '" y2="' + y + '" stroke="' + (stroke || '#9aa0ab') + '" stroke-width="2"/>'; }
  function holesGrid(rows, cols, x0, y0, gap, r, color) {
    var s = '';
    for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) s += circle(x0 + j * gap, y0 + i * gap, r, color || '#000');
    return s;
  }
  /* Agujero de socket hembra: borde dorado + fondo oscuro */
  function goldHole(cx, cy, r) {
    return circle(cx, cy, r, '#d7a94a', ' stroke="#8a6a1f" stroke-width="1"') +
      circle(cx, cy, Math.max(1, r * 0.55), '#000');
  }
  /* Pin dorado con brillo (contacto dorado visto de frente) */
  function goldPin(cx, cy, r) {
    return circle(cx, cy, r, '#d7a94a', ' stroke="#8a6a1f" stroke-width="1"') +
      circle(cx - r * 0.3, cy - r * 0.3, Math.max(0.6, r * 0.32), '#f3dc9a');
  }
  function frameLabel(name) {
    return '<g opacity=".9">' + text(80, 19, name, 12.5, '#c9cdd6') + '</g>';
  }

  /* === PUERTOS HEMBRA (vista frontal: cavidad + pines) === */
  var FEMALE = {};

  FEMALE.atx24 = function () {
    var inner = frameLabel('ATX 24');
    inner += rect(14, 26, 132, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(18, 30, 124, 40, '#0d0f14', ' rx="1"');
    inner += rect(62, 22, 28, 4, '#5a5f6e', ' rx="1"');
    for (var c = 0; c < 12; c++) {
      inner += goldHole(28 + c * 10, 42, 3.6);
      inner += goldHole(28 + c * 10, 52, 3.6);
    }
    return svg(160, 92, inner);
  };
  FEMALE.atx20 = function () {
    var inner = frameLabel('ATX 20');
    inner += rect(14, 26, 112, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(18, 30, 104, 40, '#0d0f14', ' rx="1"');
    inner += rect(62, 22, 28, 4, '#5a5f6e', ' rx="1"');
    for (var c = 0; c < 10; c++) {
      inner += goldHole(28 + c * 10, 42, 3.6);
      inner += goldHole(28 + c * 10, 52, 3.6);
    }
    return svg(160, 92, inner);
  };
  FEMALE.eps8 = function () {
    var inner = frameLabel('EPS 8 (CPU)');
    inner += rect(30, 26, 72, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(34, 30, 64, 40, '#0d0f14', ' rx="1"');
    inner += rect(50, 22, 22, 4, '#5a5f6e', ' rx="1"');
    for (var c = 0; c < 4; c++) {
      inner += goldHole(42 + c * 12, 42, 3.6);
      inner += goldHole(42 + c * 12, 54, 3.6);
    }
    return svg(140, 92, inner);
  };
  FEMALE.eps4 = function () {
    var inner = frameLabel('EPS 4');
    inner += rect(36, 26, 50, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(40, 30, 42, 40, '#0d0f14', ' rx="1"');
    inner += rect(52, 22, 18, 4, '#5a5f6e', ' rx="1"');
    inner += goldHole(48, 42, 3.6); inner += goldHole(60, 42, 3.6);
    inner += goldHole(48, 54, 3.6); inner += goldHole(60, 54, 3.6);
    return svg(140, 92, inner);
  };
  FEMALE.pcie62 = function () {
    var inner = frameLabel('PCIe 6+2');
    inner += rect(18, 26, 62, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(22, 30, 54, 40, '#0d0f14', ' rx="1"');
    for (var c = 0; c < 3; c++) {
      inner += goldHole(32 + c * 11, 42, 3.5);
      inner += goldHole(32 + c * 11, 53, 3.5);
    }
    inner += rect(92, 26, 28, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(96, 30, 20, 40, '#0d0f14', ' rx="1"');
    inner += goldHole(106, 42, 3.5);
    inner += goldHole(106, 53, 3.5);
    inner += rect(30, 22, 14, 4, '#5a5f6e', ' rx="1"');
    return svg(140, 92, inner);
  };
  FEMALE['12vhpwr'] = function () {
    var inner = frameLabel('12VHPWR 12+4');
    inner += rect(16, 26, 88, 48, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(20, 30, 80, 40, '#0d0f14', ' rx="1"');
    for (var c = 0; c < 6; c++) {
      inner += goldHole(29 + c * 10.5, 42, 3);
      inner += goldHole(29 + c * 10.5, 52, 3);
    }
    inner += rect(112, 20, 18, 22, '#17181c', ' stroke="#3a3e49" stroke-width="1.2" rx="1"');
    inner += goldHole(117, 27, 2.2); inner += goldHole(125, 27, 2.2);
    inner += goldHole(117, 35, 2.2); inner += goldHole(125, 35, 2.2);
    return svg(150, 92, inner);
  };
  FEMALE['sata-power'] = function () {
    var inner = frameLabel('SATA Power 15');
    inner += path('M10 40 L142 40 L142 70 L10 70 Z', '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += path('M14 44 L138 44 L138 66 L14 66 Z', '#0d0f14', ' rx="1"');
    inner += rect(20, 32, 112, 6, '#5a5f6e', ' rx="1"');
    for (var c = 0; c < 15; c++) inner += goldPin(18 + c * 8, 55, 2.8);
    return svg(160, 90, inner);
  };
  FEMALE['sata-data'] = function () {
    var inner = frameLabel('SATA Data 7');
    inner += path('M10 30 L114 30 L114 66 L10 66 Z', '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += path('M14 34 L110 34 L110 62 L14 62 Z', '#0d0f14', ' rx="1"');
    inner += rect(22, 22, 60, 8, '#5a5f6e', ' rx="1"');
    for (var c = 0; c < 7; c++) inner += goldPin(19 + c * 12, 48, 2.6);
    return svg(140, 88, inner);
  };
  FEMALE.molex = function () {
    var inner = frameLabel('Molex 4');
    inner += rect(24, 30, 92, 40, '#e4e6e9', ' stroke="#b9bdc4" stroke-width="1.5" rx="2"');
    inner += rect(28, 34, 84, 32, '#f4f6f8', ' rx="1"');
    inner += rect(40, 24, 12, 6, '#b9bdc4', ' rx="1"');
    for (var c = 0; c < 4; c++) inner += goldHole(40 + c * 18, 50, 5);
    inner += rect(44, 66, 8, 3, '#b9bdc4', ' rx="1"');
    return svg(150, 90, inner);
  };
  FEMALE.berg = function () {
    var inner = frameLabel('Berg 4');
    inner += rect(30, 30, 70, 40, '#e4e6e9', ' stroke="#b9bdc4" stroke-width="1.2" rx="2"');
    inner += rect(34, 34, 62, 32, '#f4f6f8', ' rx="1"');
    for (var c = 0; c < 4; c++) inner += goldHole(40 + c * 12, 50, 3);
    return svg(140, 90, inner);
  };

  FEMALE.hdmi = function () {
    var inner = frameLabel('HDMI 19');
    inner += path('M30 28 H128 L132 50 Q132 72 124 72 H36 Q28 72 28 50 Z', '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M34 32 H124 L127 50 Q127 68 121 68 H39 Q33 68 33 50 Z', '#0d0f14');
    for (var c = 0; c < 10; c++) inner += goldPin(42 + c * 7.2, 40, 2.2);
    for (var c = 0; c < 9; c++) inner += goldPin(46 + c * 7.2, 60, 2.2);
    return svg(160, 92, inner);
  };
  FEMALE['hdmi-mini'] = function () {
    var inner = frameLabel('HDMI Mini');
    inner += path('M42 32 H116 L120 50 Q120 66 112 66 H48 Q42 66 42 50 Z', '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.2"');
    inner += path('M45 35 H113 L116 50 Q116 63 109 63 H51 Q46 63 46 50 Z', '#0d0f14');
    for (var c = 0; c < 10; c++) inner += goldPin(52 + c * 5.4, 43, 1.8);
    for (var c = 0; c < 9; c++) inner += goldPin(55 + c * 5.4, 57, 1.8);
    return svg(160, 92, inner);
  };
  FEMALE['hdmi-micro'] = function () {
    var inner = frameLabel('HDMI Micro');
    inner += path('M50 36 H108 L112 50 Q112 62 105 62 H55 Q49 62 49 50 Z', '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.2"');
    inner += path('M52 38 H106 L109 50 Q109 60 103 60 H57 Q51 60 51 50 Z', '#0d0f14');
    for (var c = 0; c < 10; c++) inner += goldPin(58 + c * 4.2, 45, 1.5);
    for (var c = 0; c < 9; c++) inner += goldPin(60 + c * 4.2, 56, 1.5);
    return svg(160, 92, inner);
  };
  FEMALE.dp = function () {
    var inner = frameLabel('DisplayPort 20');
    inner += rect(36, 28, 88, 44, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5" rx="2"');
    inner += rect(40, 32, 80, 36, '#0d0f14', ' rx="1"');
    for (var c = 0; c < 20; c++) inner += goldPin(43 + c * 3.8, 50, 1.7);
    inner += rect(52, 20, 40, 8, '#8a5cf5', ' stroke="#6d3fb8" stroke-width="1" rx="1"');
    inner += rect(48, 72, 44, 6, '#9aa0ab', ' rx="1"');
    return svg(160, 92, inner);
  };
  FEMALE.minidp = function () {
    var inner = frameLabel('Mini DP');
    inner += rect(50, 32, 60, 36, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.2" rx="2"');
    inner += rect(53, 35, 54, 30, '#0d0f14', ' rx="1"');
    for (var c = 0; c < 20; c++) inner += goldPin(55 + c * 2.5, 50, 1.2);
    inner += rect(60, 24, 30, 8, '#8a5cf5', ' stroke="#6d3fb8" stroke-width="1" rx="1"');
    return svg(160, 92, inner);
  };
  FEMALE.vga = function () {
    var inner = frameLabel('VGA DB-15');
    inner += path('M34 32 H126 L133 61 Q135 77 121 78 H39 Q25 77 27 61 Z', '#2b5bb0', ' stroke="#12327a" stroke-width="2"');
    inner += path('M41 39 H119 L124 62 Q125 72 115 72.5 H45 Q35 72 36 62 Z', '#0d0f14');
    var rows = [48, 58, 68];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 5; c++) {
        inner += circle(58 + c * 11, rows[r], 2.6, '#d7a94a', ' stroke="#8a6a1f" stroke-width="1"');
      }
    }
    inner += circle(31, 55, 5, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1"');
    inner += circle(31, 55, 2, '#5a5f6e');
    inner += circle(129, 55, 5, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1"');
    inner += circle(129, 55, 2, '#5a5f6e');
    return svg(160, 104, inner);
  };
  FEMALE.dvi = function () {
    var inner = frameLabel('DVI 24+1');
    inner += path('M16 26 H144 L148 50 L144 78 H16 L12 50 Z', '#e9ebee', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M22 32 H138 L142 50 L138 74 H22 L18 50 Z', '#0d0f14');
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 8; c++) inner += goldPin(30 + c * 12, 38 + r * 12, 2.2);
    }
    inner += rect(92, 38, 5, 12, '#d7a94a', ' stroke="#8a6a1f" stroke-width="1"');
    inner += goldPin(112, 46, 2);
    inner += goldPin(112, 58, 2);
    inner += circle(17, 50, 4, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1"');
    inner += circle(143, 50, 4, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1"');
    return svg(160, 92, inner);
  };
  FEMALE.svideo = function () {
    var inner = frameLabel('S-Video');
    inner += circle(80, 50, 30, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += circle(80, 50, 23, '#0d0f14');
    inner += goldPin(73, 43, 2.5); inner += goldPin(82, 43, 2.5);
    inner += goldPin(73, 52, 2.5); inner += goldPin(82, 52, 2.5);
    inner += rect(104, 46, 12, 6, '#17181c', ' rx="1"');
    return svg(160, 92, inner);
  };
  FEMALE['rca-video'] = function () {
    var inner = frameLabel('RCA Video');
    inner += circle(80, 50, 26, '#f6c344', ' stroke="#d8a13a" stroke-width="1.5"');
    inner += circle(80, 50, 19, '#d8a13a');
    inner += circle(80, 50, 14, '#0d0f14');
    inner += goldPin(80, 50, 7);
    return svg(160, 92, inner);
  };
  FEMALE.ypbpr = function () {
    var inner = frameLabel('YPbPr');
    var cols = ['#4cb057', '#3b82c4', '#d8433d'];
    for (var i = 0; i < 3; i++) {
      var cx = 52 + i * 28;
      inner += circle(cx, 50, 13, cols[i], ' stroke="#1f1f24" stroke-width="1.2"');
      inner += circle(cx, 50, 8, '#0d0f14');
      inner += goldPin(cx, 50, 3.5);
    }
    return svg(160, 92, inner);
  };

  function usbAFrame() {
    var inner = rect(34, 34, 92, 32, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5" rx="2"');
    inner += rect(38, 38, 84, 24, '#0d0f14', ' rx="1"');
    inner += rect(52, 44, 46, 12, '#8b9099', ' rx="1"');
    inner += rect(56, 45.5, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(64, 45.5, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(72, 53, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(80, 53, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    return inner;
  }
  FEMALE['usb-a'] = function () {
    return svg(160, 92, frameLabel('USB-A') + usbAFrame());
  };
  FEMALE['usb-b'] = function () {
    var inner = frameLabel('USB-B');
    inner += rect(40, 28, 80, 64, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5" rx="2"');
    inner += rect(46, 34, 68, 52, '#0d0f14', ' rx="1"');
    inner += rect(58, 50, 44, 12, '#8b9099', ' rx="1"');
    inner += rect(62, 51.5, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(70, 51.5, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(78, 58, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(86, 58, 6, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    return svg(160, 104, inner);
  };
  FEMALE['usb-c'] = function () {
    var inner = frameLabel('USB-C 24');
    inner += el(80, 50, 42, 17, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += el(80, 50, 37, 13, '#0d0f14');
    inner += path('M46 46 H114 Q117 46 117 48.5 V53 Q117 55.5 114 55.5 H46 Q43 55.5 43 53 V48.5 Q43 46 46 46 Z', '#e4e6e9');
    inner += rect(43, 46, 74, 1, '#b9bdc4');
    inner += rect(43, 54.5, 74, 1, '#b9bdc4');
    for (var i = 0; i < 12; i++) {
      inner += rect(63.5 + i * 3, 39.5, 1.8, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.5"');
      inner += rect(63.5 + i * 3, 59.5, 1.8, 3, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.5"');
    }
    return svg(160, 92, inner);
  };
  FEMALE.thunderbolt = function () {
    var inner = frameLabel('Thunderbolt 3/4');
    inner += el(80, 50, 42, 17, '#8a5cf5', ' stroke="#6d3fb8" stroke-width="1.5"');
    inner += el(80, 50, 37, 13, '#0d0f14');
    inner += path('M78 36 l10 12 h-5 l5 10 h-10 l-10 -12 h5 l-5 -10 z', '#e9ebee');
    return svg(160, 92, inner);
  };
  FEMALE['usb-mini'] = function () {
    var inner = frameLabel('USB Mini-B');
    inner += path('M44 36 L116 36 L112 64 L48 64 Z', '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M48 40 L112 40 L108 60 L52 60 Z', '#0d0f14');
    for (var c = 0; c < 5; c++) inner += goldPin(54 + c * 10, 50, 1.9);
    return svg(160, 92, inner);
  };
  FEMALE['usb-micro'] = function () {
    var inner = frameLabel('USB Micro-B');
    inner += path('M46 42 L114 42 L110 60 L50 60 Z', '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M50 45 L110 45 L107 57 L53 57 Z', '#0d0f14');
    for (var c = 0; c < 5; c++) inner += goldPin(60 + c * 9, 51, 1.6);
    return svg(160, 92, inner);
  };
  FEMALE.jack35 = function () {
    var inner = frameLabel('Jack 3.5mm');
    inner += rect(28, 30, 104, 40, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.2" rx="3"');
    inner += circle(80, 50, 19, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += circle(80, 50, 12, '#0d0f14');
    inner += goldPin(80, 50, 6);
    return svg(160, 92, inner);
  };
  FEMALE.toslink = function () {
    var inner = frameLabel('S/PDIF optico');
    inner += rect(40, 30, 80, 40, '#17181c', ' stroke="#3a3e49" stroke-width="1.5" rx="3"');
    inner += rect(48, 38, 64, 24, '#0d0f14', ' rx="2"');
    inner += circle(80, 50, 12, '#d8433d', ' stroke="#a03030" stroke-width="1.5"');
    inner += circle(80, 50, 6, '#ff6b6b', ' opacity=".85"');
    return svg(160, 92, inner);
  };
  FEMALE.rj45 = function () {
    var inner = frameLabel('RJ-45 hembra');
    inner += rect(34, 28, 92, 44, '#3a3e49', ' stroke="#4a4f5a" stroke-width="1.5" rx="2"');
    inner += rect(40, 34, 80, 32, '#0d0f14', ' rx="1"');
    for (var c = 0; c < 8; c++) inner += rect(48 + c * 8.6, 37, 6, 4, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(40, 34, 80, 5, '#0d0f14');
    return svg(160, 92, inner);
  };
  FEMALE.rj11 = function () {
    var inner = frameLabel('RJ-11');
    inner += rect(44, 32, 72, 36, '#3a3e49', ' stroke="#4a4f5a" stroke-width="1.5" rx="2"');
    inner += rect(49, 37, 62, 26, '#0d0f14', ' rx="1"');
    for (var c = 0; c < 6; c++) {
      var gold = c > 0 && c < 5;
      inner += rect(56 + c * 8, 39, 5, 3.4, gold ? '#d7a94a' : '#3a3e49', gold ? ' stroke="#8a6a1f" stroke-width="0.6"' : '');
    }
    return svg(160, 92, inner);
  };
  FEMALE.ps2 = function () {
    var inner = frameLabel('PS/2');
    inner += circle(80, 50, 29, '#8a5cf5', ' stroke="#6d3fb8" stroke-width="1.5"');
    inner += circle(80, 50, 21, '#6d3fb8');
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      inner += goldPin(80 + Math.cos(a) * 12, 50 + Math.sin(a) * 12, 2.4);
    }
    return svg(160, 92, inner);
  };
  FEMALE.com = function () {
    var inner = frameLabel('COM DB-9');
    inner += path('M52 26 L108 26 L116 38 L116 62 L108 74 L52 74 L44 62 L44 38 Z', '#b9bec7', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M54 30 L106 30 L112 39 L112 61 L106 70 L54 70 L48 61 L48 39 Z', '#0d0f14');
    for (var c = 0; c < 5; c++) inner += goldPin(55 + c * 10, 36, 2.2);
    for (var c = 0; c < 4; c++) inner += goldPin(60 + c * 10, 58, 2.2);
    inner += circle(41, 50, 3, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1"');
    inner += circle(119, 50, 3, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1"');
    return svg(160, 92, inner);
  };
  FEMALE['ac-cable'] = function () {
    var inner = frameLabel('IEC C14');
    inner += rect(40, 30, 80, 40, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += path('M58 34 L102 34 L96 66 L64 66 Z', '#0d0f14');
    inner += rect(72, 38, 16, 24, '#17181c');
    inner += rect(64, 46, 4, 8, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    inner += rect(92, 46, 4, 8, '#d7a94a', ' stroke="#8a6a1f" stroke-width="0.6"');
    return svg(160, 92, inner);
  };
  FEMALE['dc-jack'] = function () {
    var inner = frameLabel('DC barrel');
    inner += rect(28, 30, 104, 40, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.5" rx="3"');
    inner += circle(80, 50, 19, '#bfc6cf', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += circle(80, 50, 11, '#0d0f14');
    inner += circle(80, 50, 4, '#d7a94a');
    return svg(160, 92, inner);
  };
  FEMALE['coax-fconn'] = function () {
    var inner = frameLabel('F (coaxial)');
    inner += path('M60 24 h40 l10 10 v32 l-10 10 h-40 l-10 -10 v-32 z', '#8a8f98', ' stroke="#6b7078" stroke-width="1.5"');
    inner += circle(80, 50, 13, '#0d0f14');
    inner += goldPin(80, 50, 5);
    return svg(160, 92, inner);
  };
  FEMALE['fiber-sc'] = function () {
    var inner = frameLabel('SC');
    inner += rect(52, 28, 56, 44, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.5" rx="2"');
    inner += rect(58, 36, 44, 28, '#4cb057', ' rx="2"');
    inner += rect(66, 42, 28, 16, '#0d0f14', ' rx="1"');
    inner += goldPin(80, 50, 4);
    return svg(160, 92, inner);
  };
  FEMALE['fiber-lc'] = function () {
    var inner = frameLabel('LC duplex');
    inner += rect(44, 26, 28, 48, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.2" rx="2"');
    inner += rect(88, 26, 28, 48, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.2" rx="2"');
    inner += rect(50, 34, 16, 32, '#2b5bb0', ' rx="1"');
    inner += rect(94, 34, 16, 32, '#2b5bb0', ' rx="1"');
    inner += goldPin(58, 50, 3);
    inner += goldPin(102, 50, 3);
    return svg(160, 92, inner);
  };
  FEMALE['fiber-st'] = function () {
    var inner = frameLabel('ST');
    inner += circle(80, 50, 22, '#2a2d36', ' stroke="#3a3e49" stroke-width="1.5"');
    inner += rect(72, 28, 16, 8, '#bfc6cf', ' rx="1"');
    inner += circle(80, 50, 13, '#0d0f14');
    inner += goldPin(80, 50, 5);
    return svg(160, 92, inner);
  };

  /* === MODELOS NO-PUERTO (simbolos, herramientas, discos, topologias) === */
  var MODELS = {};

  MODELS.resistor = function () {
    return svg(160, 92, frameLabel('Resistor') + rect(40, 42, 60, 16, '#e9ebee') + ledges(20, 50, 20, '#9aa0ab') + ledges(120, 50, 20, '#9aa0ab') + rect(48, 34, 4, 4, '#d8433d') + rect(64, 60, 4, 4, '#d8433d'));
  };
  MODELS.potentiometer = function () {
    return svg(160, 92, frameLabel('Potenciometro') + rect(40, 42, 60, 16, '#e9ebee') + ledges(20, 50, 20, '#9aa0ab') + ledges(120, 50, 20, '#9aa0ab') + path('M60 42 L70 28', '#d8433d') + circle(70, 26, 3, '#d8433d'));
  };
  MODELS.thermistor = function () {
    return svg(160, 92, frameLabel('Termistor') + rect(40, 42, 60, 16, '#e9ebee') + ledges(20, 50, 20, '#9aa0ab') + ledges(120, 50, 20, '#9aa0ab') + path('M60 42 L70 58 L80 42 L90 58 L100 42', 'none', ' stroke="#d8433d" stroke-width="2" fill="none"'));
  };
  MODELS.varistor = function () {
    return svg(160, 92, frameLabel('Varistor') + rect(40, 42, 60, 16, '#e9ebee') + ledges(20, 50, 20, '#9aa0ab') + ledges(120, 50, 20, '#9aa0ab') + path('M50 50 l5 6 l5 -6 l5 6 l5 -6 l5 6 l5 -6', 'none', ' stroke="#d8433d" stroke-width="2" fill="none"') + text(80, 26, '/', 18, '#d8433d'));
  };
  MODELS.capacitor = function () {
    return svg(160, 92, frameLabel('Capacitor') + rect(72, 34, 4, 32, '#e9ebee') + rect(80, 34, 4, 32, '#e9ebee') + ledges(20, 50, 52, '#9aa0ab') + ledges(108, 50, 32, '#9aa0ab'));
  };
  MODELS.inductor = function () {
    return svg(160, 92, frameLabel('Inductor') + ledges(20, 50, 20, '#9aa0ab') + path('M40 50 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0 a10 10 0 0 1 20 0', 'none', ' stroke="#e9ebee" stroke-width="2.5" fill="none"') + ledges(120, 50, 20, '#9aa0ab'));
  };
  MODELS.diode = function () {
    return svg(160, 92, frameLabel('Diodo') + ledges(20, 50, 32, '#9aa0ab') + path('M52 34 L52 66 L92 50 Z', '#e9ebee') + rect(92, 36, 4, 28, '#e9ebee') + ledges(96, 50, 44, '#9aa0ab'));
  };
  MODELS.led = function () {
    return svg(160, 92, frameLabel('LED') + ledges(20, 50, 32, '#9aa0ab') + path('M52 34 L52 66 L92 50 Z', '#f6c344') + rect(92, 36, 4, 28, '#e9ebee') + ledges(96, 50, 44, '#9aa0ab') + path('M104 26 l6 6 M104 34 l6 6 M112 22 l6 6', 'none', ' stroke="#f6c344" stroke-width="1.6" fill="none"'));
  };
  MODELS.transistor = function () {
    return svg(160, 92, frameLabel('Transistor NPN') + circle(70, 50, 16, '#e9ebee') + rect(82, 48, 22, 3, '#e9ebee') + ledges(20, 50, 34, '#9aa0ab') + path('M70 34 L70 26', '#e9ebee') + path('M70 50 L70 66', '#e9ebee') + path('M70 26 L104 26', '#9aa0ab') + path('M70 66 L104 66', '#9aa0ab') + path('M104 20 L104 72', '#e9ebee'));
  };
  MODELS['ic-chip'] = function () {
    var inner = frameLabel('Circuito integrado');
    inner += rect(48, 30, 64, 40, '#17181c');
    inner += rect(56, 36, 48, 28, '#2a2d36');
    for (var i = 0; i < 7; i++) { inner += rect(42, 34 + i * 5, 7, 2, '#d7a94a'); inner += rect(111, 34 + i * 5, 7, 2, '#d7a94a'); }
    return svg(160, 92, inner);
  };
  MODELS.crystal = function () {
    return svg(160, 92, frameLabel('Cristal') + rect(64, 38, 32, 24, '#e9ebee') + rect(64, 38, 32, 6, '#9aa0ab') + rect(64, 56, 32, 6, '#9aa0ab') + ledges(34, 50, 30, '#9aa0ab') + ledges(96, 50, 30, '#9aa0ab'));
  };
  MODELS.fuse = function () {
    return svg(160, 92, frameLabel('Fusible') + rect(40, 44, 60, 12, '#e9ebee') + path('M40 50 L100 50', '#d8433d') + ledges(20, 50, 20, '#9aa0ab') + ledges(120, 50, 20, '#9aa0ab'));
  };
  MODELS.relay = function () {
    var inner = frameLabel('Relay');
    inner += rect(34, 30, 40, 40, '#17181c');
    inner += rect(44, 42, 20, 8, '#d7a94a');
    inner += rect(96, 34, 6, 28, '#e9ebee');
    inner += rect(104, 34, 6, 28, '#e9ebee');
    inner += path('M96 48 L104 48', '#d8433d');
    return svg(160, 92, inner);
  };
  MODELS.transformer = function () {
    var inner = frameLabel('Transformador');
    for (var i = 0; i < 3; i++) inner += path('M44 ' + (38 + i * 8) + ' a8 8 0 0 1 16 0', 'none', ' stroke="#e9ebee" stroke-width="2" fill="none"');
    for (var j = 0; j < 3; j++) inner += path('M100 ' + (38 + j * 8) + ' a8 8 0 0 1 16 0', 'none', ' stroke="#e9ebee" stroke-width="2" fill="none"');
    return svg(160, 92, inner);
  };
  MODELS.pushbutton = function () {
    var inner = frameLabel('Push button');
    inner += rect(52, 32, 10, 36, '#e9ebee');
    inner += path('M62 50 L96 50', '#9aa0ab');
    inner += path('M90 40 L96 50 L90 60', 'none', ' stroke="#e9ebee" stroke-width="2" fill="none"');
    inner += ledges(20, 50, 32, '#9aa0ab');
    inner += ledges(96, 50, 44, '#9aa0ab');
    return svg(160, 92, inner);
  };
  MODELS.buzzer = function () {
    var inner = frameLabel('Buzzer');
    inner += circle(80, 50, 22, '#f6c344');
    inner += circle(80, 50, 16, '#0d0f14');
    inner += path('M72 46 l6 2 l6 -2 M74 52 l4 2 M78 57 l2 1', 'none', ' stroke="#e9ebee" stroke-width="2" fill="none"');
    return svg(160, 92, inner);
  };
  MODELS.photoresistor = function () {
    return svg(160, 92, frameLabel('Fotorresistencia') + rect(40, 42, 60, 16, '#e9ebee') + ledges(20, 50, 20, '#9aa0ab') + ledges(120, 50, 20, '#9aa0ab') + path('M104 26 l6 6 M104 34 l6 6 M112 22 l6 6', 'none', ' stroke="#f6c344" stroke-width="1.6" fill="none"'));
  };

  MODELS.screwdriver = function () {
    var inner = frameLabel('Destornillador');
    inner += rect(56, 30, 8, 30, '#9aa0ab');
    inner += rect(59, 20, 2, 10, '#9aa0ab');
    inner += rect(48, 60, 24, 6, '#e27d2b');
    inner += rect(44, 66, 32, 8, '#3a3e49');
    return svg(160, 92, inner);
  };
  MODELS.esd_strap = function () {
    var inner = frameLabel('Pulsera antiestatica');
    inner += el(80, 50, 30, 22, '#4cb057');
    inner += rect(70, 46, 20, 8, '#0d0f14');
    inner += rect(80, 64, 30, 6, '#9aa0ab');
    return svg(160, 92, inner);
  };
  MODELS.air_duster = function () {
    var inner = frameLabel('Aire comprimido');
    inner += rect(58, 30, 24, 34, '#d8433d');
    inner += rect(82, 42, 18, 10, '#3a3e49');
    inner += rect(100, 44, 14, 6, '#9aa0ab');
    inner += rect(64, 20, 12, 10, '#d8433d');
    return svg(160, 92, inner);
  };
  MODELS.thermal_paste = function () {
    var inner = frameLabel('Pasta termica');
    inner += rect(50, 30, 60, 40, '#3bc2c9');
    inner += rect(56, 36, 48, 28, '#17181c');
    inner += path('M62 44 l14 10 l8 -8 l12 10', 'none', ' stroke="#e9ebee" stroke-width="2.5" fill="none"');
    return svg(160, 92, inner);
  };
  MODELS.isopropyl = function () {
    var inner = frameLabel('Alcohol isopropilico');
    inner += rect(56, 30, 28, 40, '#e9ebee');
    inner += rect(52, 24, 36, 8, '#3b82c4');
    inner += text(70, 34, 'IPA', 8, '#fff');
    return svg(160, 92, inner);
  };
  MODELS.multimeter = function () {
    var inner = frameLabel('Multimetro');
    inner += rect(38, 26, 84, 48, '#e9ebee');
    inner += rect(48, 34, 64, 22, '#0d0f14');
    inner += text(80, 49, '20.00', 14, '#f6c344');
    inner += circle(54, 68, 4, '#3a3e49');
    inner += circle(72, 68, 4, '#3a3e49');
    inner += circle(90, 68, 4, '#3a3e49');
    return svg(160, 92, inner);
  };
  MODELS.tester_net = function () {
    var inner = frameLabel('Tester de red');
    inner += rect(30, 26, 100, 40, '#2a2d36');
    inner += rect(80, 32, 44, 28, '#0d0f14');
    for (var i = 0; i < 8; i++) { inner += circle(48, 36 + i * 3.6, 1.4, '#f6c344'); }
    inner += text(102, 44, '1-8', 8, '#f6c344');
    return svg(160, 92, inner);
  };
  MODELS.crimper = function () {
    var inner = frameLabel('Crimpadora');
    inner += rect(40, 36, 26, 10, '#d8433d');
    inner += rect(40, 48, 26, 10, '#d8433d');
    inner += rect(66, 40, 44, 14, '#3a3e49');
    inner += rect(110, 42, 10, 10, '#d7a94a');
    return svg(160, 92, inner);
  };
  MODELS.punchdown = function () {
    var inner = frameLabel('Ponchadora impacto');
    inner += rect(60, 34, 40, 8, '#9aa0ab');
    inner += rect(74, 42, 12, 20, '#e27d2b');
    inner += rect(76, 62, 8, 6, '#9aa0ab');
    return svg(160, 92, inner);
  };
  MODELS.stripper = function () {
    var inner = frameLabel('Pelacables');
    inner += rect(38, 40, 84, 8, '#6bb7e8');
    inner += rect(48, 34, 64, 6, '#e27d2b');
    inner += circle(80, 50, 5, '#0d0f14');
    return svg(160, 92, inner);
  };
  MODELS.flashlight = function () {
    var inner = frameLabel('Linterna');
    inner += rect(52, 40, 44, 16, '#2a2d36');
    inner += rect(96, 42, 14, 12, '#9aa0ab');
    inner += circle(110, 48, 4, '#f6c344');
    inner += rect(48, 46, 4, 4, '#3a3e49');
    return svg(160, 92, inner);
  };
  MODELS.ventoy_usb = function () {
    var inner = frameLabel('USB Ventoy');
    inner += rect(40, 36, 72, 18, '#0d0f14');
    inner += rect(112, 38, 16, 14, '#3bc2c9');
    inner += text(76, 49, 'Ventoy', 9.5, '#3bc2c9');
    return svg(160, 92, inner);
  };
  MODELS.spudger = function () {
    var inner = frameLabel('Palanca plastica');
    inner += path('M70 34 L94 58 L88 66 L66 42 Z', '#e27d2b');
    inner += rect(60, 50, 34, 8, '#e27d2b');
    return svg(160, 92, inner);
  };

  MODELS['disk-mbr'] = function () {
    var inner = frameLabel('MBR / BIOS');
    inner += rect(20, 34, 120, 24, '#2a2d36');
    inner += rect(26, 40, 14, 12, '#8a5cf5');
    inner += rect(44, 40, 72, 12, '#3b82c4');
    inner += rect(120, 40, 14, 12, '#e27d2b');
    inner += text(24, 80, 'MBR: 512B + 4 primarias', 9.5, '#aeb4bf', 'start');
    return svg(160, 92, inner);
  };
  MODELS['disk-gpt'] = function () {
    var inner = frameLabel('GPT / UEFI');
    inner += rect(20, 34, 120, 24, '#2a2d36');
    inner += rect(26, 40, 12, 12, '#4cb057');
    inner += rect(42, 40, 60, 12, '#3b82c4');
    inner += rect(106, 40, 16, 12, '#e27d2b');
    inner += rect(126, 40, 8, 12, '#4cb057');
    inner += text(24, 74, 'GPT: tablas espejadas', 9.5, '#aeb4bf', 'start');
    inner += text(24, 87, '128 particiones posibles', 9, '#aeb4bf', 'start');
    return svg(160, 92, inner);
  };

  MODELS['hub-vs-switch'] = function () {
    var inner = frameLabel('Hub vs Switch');
    inner += rect(20, 26, 50, 40, '#e27d2b');
    inner += text(45, 48, 'HUB', 12, '#fff');
    inner += text(45, 60, 'comparte', 8, '#fff');
    inner += rect(90, 26, 50, 40, '#4cb057');
    inner += text(115, 48, 'SWITCH', 9, '#fff');
    inner += text(115, 60, 'segmenta', 8, '#fff');
    for (var i = 0; i < 3; i++) inner += circle(30, 80, 4, '#e27d2b') + circle(115, 80, 4, '#4cb057');
    return svg(160, 92, inner);
  };
  MODELS['switch-vlan'] = function () {
    var inner = frameLabel('Switch + VLAN');
    inner += rect(30, 30, 100, 26, '#2a2d36');
    for (var i = 0; i < 8; i++) inner += rect(38 + i * 12, 34, 6, 18, i < 4 ? '#3bc2c9' : '#e27d2b');
    inner += text(30, 74, 'Puertos en VLAN 10 / 20', 8, '#9aa0ab', 'start');
    return svg(160, 92, inner);
  };
  MODELS['vlan-trunk'] = function () {
    var inner = frameLabel('Trunk 802.1Q');
    inner += rect(20, 36, 50, 20, '#2a2d36');
    inner += rect(90, 36, 50, 20, '#2a2d36');
    inner += path('M70 46 L90 46', '#f6c344');
    inner += rect(72, 42, 16, 8, '#0d0f14');
    inner += text(80, 49, 'T', 9, '#f6c344');
    for (var i = 0; i < 3; i++) { inner += circle(26, 30, 3, '#3bc2c9'); inner += circle(96, 30, 3, '#e27d2b'); }
    return svg(160, 92, inner);
  };
  MODELS['routing-topo'] = function () {
    var inner = frameLabel('Topologia');
    inner += circle(80, 24, 6, '#3bc2c9');
    inner += circle(32, 70, 5, '#e27d2b');
    inner += circle(80, 70, 5, '#4cb057');
    inner += circle(128, 70, 5, '#8a5cf5');
    inner += path('M80 30 L35 66 M80 30 L75 66 M80 30 L123 66 M32 70 L128 70', 'none', ' stroke="#9aa0ab" stroke-width="1.5" fill="none"');
    return svg(160, 92, inner);
  };

  MODELS['aio-cooler'] = function () {
    var inner = frameLabel('AIO');
    inner += rect(28, 30, 104, 10, '#2a2d36');
    inner += rect(28, 52, 104, 10, '#2a2d36');
    for (var i = 0; i < 8; i++) { inner += rect(34 + i * 12, 42, 8, 8, '#3b82c4'); }
    inner += rect(60, 40, 40, 12, '#0d0f14');
    inner += text(80, 49, 'Bomba', 8.5, '#e9ebee');
    return svg(160, 92, inner);
  };
  MODELS['air-cooler'] = function () {
    var inner = frameLabel('Air cooler');
    inner += rect(50, 26, 60, 40, '#9aa0ab');
    for (var i = 0; i < 4; i++) inner += rect(54, 28 + i * 9, 52, 4, '#2a2d36');
    inner += rect(78, 66, 4, 8, '#3b82c4');
    inner += rect(62, 74, 36, 6, '#0d0f14');
    return svg(160, 92, inner);
  };
  MODELS['liquid-loop'] = function () {
    var inner = frameLabel('Custom loop');
    inner += rect(20, 30, 30, 18, '#3b82c4');
    inner += rect(110, 42, 30, 14, '#d8433d');
    inner += path('M50 40 L80 26 L110 50', 'none', ' stroke="#3bc2c9" stroke-width="3" fill="none"');
    inner += path('M120 56 L80 66 L50 48', 'none', ' stroke="#3bc2c9" stroke-width="3" fill="none"');
    inner += circle(80, 46, 5, '#f6c344');
    return svg(160, 92, inner);
  };

  /* === VISTAS DE PLACA / BRACKET (no requieren 3D) === */
  MODELS['usb-colors'] = function () {
    var inner = frameLabel('Version por color');
    var rows = [
      ['USB 2.0', '#17181c'], ['USB 3.0', '#3b82c4'], ['USB 3.1', '#e27d2b'], ['USB 3.2', '#d8433d']
    ];
    rows.forEach(function (r, i) {
      var y = 34 + i * 14;
      inner += rect(30, y, 44, 10, r[1]);
      inner += text(86, y + 8, r[0], 10.5, '#c8ccd4', 'start');
    });
    return svg(160, 92, inner);
  };
  MODELS.m2 = function () {
    var inner = frameLabel('Slot M.2');
    inner += rect(16, 44, 128, 12, '#1c3a2f');
    inner += rect(16, 44, 128, 3, '#2f7d3a');
    inner += rect(24, 46, 6, 8, '#0d0f14');
    inner += rect(120, 46, 8, 8, '#0d0f14');
    inner += text(30, 78, 'Key B/M · PCIe / SATA', 8, '#9aa0ab', 'start');
    return svg(160, 92, inner);
  };
  MODELS['pcie-slot'] = function () {
    var inner = frameLabel('Slot PCIe x16');
    inner += rect(18, 40, 124, 16, '#1c3a2f');
    inner += rect(18, 40, 124, 3, '#2f7d3a');
    for (var i = 0; i < 22; i++) inner += rect(24 + i * 5, 46, 2, 8, '#0d0f14');
    inner += rect(88, 42, 12, 12, '#0d0f14');
    inner += text(28, 72, 'x16 · 164 pines', 8, '#9aa0ab', 'start');
    return svg(160, 92, inner);
  };
  MODELS['sata-ports'] = function () {
    var inner = frameLabel('Puertos SATA');
    for (var i = 0; i < 6; i++) {
      inner += rect(22 + i * 20, 34, 14, 30, '#3bc2c9');
      inner += rect(25 + i * 20, 40, 8, 18, '#0d0f14');
    }
    return svg(160, 92, inner);
  };
  MODELS['gpu-ports'] = function () {
    var inner = frameLabel('Bracket GPU');
    inner += rect(20, 20, 120, 72, '#2a2d36');
    inner += rect(30, 30, 40, 14, '#bfc6cf');
    inner += holesGrid(1, 19, 32, 37, 2, 0.8, '#000');
    inner += rect(78, 30, 46, 14, '#bfc6cf');
    inner += holesGrid(1, 20, 80, 37, 2.1, 0.8, '#000');
    inner += rect(48, 52, 40, 12, '#e9ebee');
    return svg(160, 104, inner);
  };
  MODELS['io-panel'] = function () {
    var inner = frameLabel('Panel I/O');
    inner += rect(14, 26, 132, 48, '#0d0f14');
    inner += rect(24, 32, 18, 14, '#bfc6cf');
    inner += rect(48, 32, 18, 14, '#bfc6cf');
    inner += rect(72, 32, 22, 14, '#3a3e49');
    inner += rect(24, 52, 22, 14, '#8a5cf5');
    inner += rect(52, 52, 14, 14, '#2a2d36');
    inner += rect(72, 52, 22, 14, '#3a3e49');
    inner += rect(100, 32, 26, 14, '#3a3e49');
    inner += rect(100, 52, 26, 14, '#3a3e49');
    return svg(160, 92, inner);
  };
  MODELS['port-db25'] = function () {
    var inner = frameLabel('LPT DB-25');
    inner += path('M44 20 L116 20 L126 34 L126 66 L116 80 L44 80 L34 66 L34 34 Z', '#2b5bb0');
    inner += holesGrid(2, 12, 48, 31, 6.5, 1.8, '#000');
    inner += holesGrid(1, 13, 47, 55, 6.5, 1.8, '#000');
    return svg(160, 92, inner);
  };
  MODELS['port-firewire'] = function () {
    var inner = frameLabel('FireWire 1394');
    inner += rect(40, 30, 80, 40, '#bfc6cf');
    inner += holesGrid(2, 3, 50, 39, 12, 2.6, '#000');
    return svg(160, 92, inner);
  };
  MODELS['port-esata'] = function () {
    var inner = frameLabel('eSATA');
    inner += rect(34, 32, 72, 40, '#3a3e49');
    inner += rect(42, 38, 44, 28, '#0d0f14');
    inner += holesGrid(1, 7, 46, 52, 6, 1.6, '#000');
    return svg(160, 92, inner);
  };
  MODELS['port-rca'] = function () {
    var inner = frameLabel('RCA');
    inner += circle(80, 50, 26, '#d8433d');
    inner += circle(80, 50, 18, '#0d0f14');
    inner += circle(80, 50, 7, '#000');
    return svg(160, 92, inner);
  };
  MODELS['port-bnc'] = function () {
    var inner = frameLabel('BNC');
    inner += circle(80, 50, 24, '#bfc6cf');
    inner += rect(76, 26, 8, 10, '#9aa0ab');
    inner += circle(80, 50, 12, '#0d0f14');
    inner += circle(80, 50, 5, '#000');
    return svg(160, 92, inner);
  };

  /* === MONITORES Y PRESUPUESTO (ens-guia-compra) === */
  MODELS['monitor-panels'] = function () {
    var inner = frameLabel('Tipos de panel');
    var rows = [
      ['TN', '#d8433d', 'Velocidad'], ['VA', '#e3b341', 'Contraste'],
      ['IPS', '#3b82c4', 'Color/Angulo'], ['OLED', '#4cb057', 'Negros puros']
    ];
    rows.forEach(function (r, i) {
      var y = 28 + i * 16;
      inner += rect(20, y, 34, 10, r[1]);
      inner += text(60, y + 8, r[0], 9.5, '#e9ebee', 'start');
      inner += text(100, y + 8, r[2], 8, '#aeb4bf', 'start');
    });
    return svg(160, 96, inner);
  };
  MODELS['monitor-refresh'] = function () {
    var inner = frameLabel('Frecuencia de refresco');
    var vals = [60, 75, 144, 240];
    vals.forEach(function (h, i) {
      var y = 30 + i * 14;
      var w = Math.max(8, h * 0.35);
      inner += rect(24, y, w, 8, ['#9aa0ab', '#3b82c4', '#3b82c4', '#4cb057'][i]);
      inner += text(24 + w + 8, y + 8, h + ' Hz', 8.5, '#c8ccd4', 'start');
    });
    return svg(160, 96, inner);
  };
  MODELS['build-budget'] = function () {
    var inner = frameLabel('Armado por presupuesto');
    var tiers = [
      ['Basico', '#4cb057', 40, '~$600'],
      ['Medio', '#e3b341', 70, '~$1.1K'],
      ['Alto', '#d8433d', 100, '~$2K+']
    ];
    tiers.forEach(function (t, i) {
      var y = 32 + i * 20;
      inner += rect(20, y, t[2], 12, t[1]);
      inner += text(20 + t[2] + 8, y + 9, t[0] + '  ' + t[3], 9.5, '#e9ebee', 'start');
    });
    return svg(160, 96, inner);
  };

  MODELS['smart-attr'] = function () {
    var inner = frameLabel('Atributos SMART');
    var rows = [
      ['Reallocated', '#e3b341', 'Vigilar'],
      ['Pending', '#e3b341', 'Revisar'],
      ['Temp (50C)', '#4cb057', 'OK'],
      ['Raw ERR', '#d8433d', 'Crash']
    ];
    rows.forEach(function (r, i) {
      var y = 30 + i * 15;
      inner += rect(20, y, 40, 9, r[1]);
      inner += text(66, y + 8, r[0], 9, '#e9ebee', 'start');
      inner += text(130, y + 8, r[2], 8, '#c8ccd4', 'middle');
    });
    return svg(160, 96, inner);
  };
  MODELS['laptop-layers'] = function () {
    var inner = frameLabel('Laptop por capas');
    var rows = [
      ['Bezel + panel LCD', '#3a3e49'],
      ['Cable eDP / antenas', '#3b82c4'],
      ['Deck + teclado', '#4cb057'],
      ['Base + placa + bateria', '#2a2d36']
    ];
    rows.forEach(function (r, i) {
      var y = 28 + i * 16;
      inner += rect(20, y, 120, 10, r[1]);
      inner += text(80, y + 8, r[0], 7.5, '#e9ebee');
    });
    return svg(160, 96, inner);
  };
  MODELS['cpu-ladder'] = function () {
    var inner = frameLabel('Gama y cantidad de hilos');
    var rows = [
      ['Entrada', 20, '#4cb057', '4C / 8T'],
      ['Media', 32, '#e3b341', '6C / 12T'],
      ['Alta', 46, '#d98f3e', '8C / 16T'],
      ['Top', 58, '#d8433d', '16C+']
    ];
    rows.forEach(function (r, i) {
      var y = 30 + i * 17;
      inner += text(14, y + 8, r[0], 7.5, '#c8ccd4', 'start');
      inner += rect(66, y, r[1], 9, r[2]);
      inner += text(66 + r[1] + 3, y + 8, r[3], 7.5, '#e9ebee', 'start');
    });
    return svg(160, 98, inner);
  };
  MODELS['backup-chain'] = function () {
    var inner = frameLabel('Cadenas de restauracion');
    function row(y, names, color, label) {
      var s = '', x = 20;
      names.forEach(function (n) {
        s += rect(x, y, 8, 8, color);
        x += 11;
      });
      return s + text(70, y + 8, label, 8, '#c8ccd4', 'start');
    }
    inner += row(28, ['F'], '#4cb057', 'Full: 1');
    inner += row(46, ['F', 'I1', 'I2', 'I3'], '#e3b341', 'Incremental: 4');
    inner += row(64, ['F', 'D1', 'D2', 'D3'], '#3b82c4', 'Diferencial: 2');
    return svg(160, 96, inner);
  };
  MODELS['diagnostico-post'] = function () {
    var inner = frameLabel('Diagnostico POST');
    inner += rect(10, 30, 60, 16, '#d8433d', ' rx="2"');
    inner += text(40, 40, 'No enciende', 7.5, '#fff');
    inner += rect(90, 30, 70, 16, '#e3b341', ' rx="2"');
    inner += text(125, 40, '1s y corta', 7.5, '#1c1f29');
    inner += rect(10, 56, 60, 16, '#e3b341', ' rx="2"');
    inner += text(40, 66, 'Pitidos RAM', 7.5, '#1c1f29');
    inner += rect(90, 56, 70, 16, '#3b82c4', ' rx="2"');
    inner += text(125, 66, 'Sin video', 7.5, '#fff');
    inner += path('M70 38 H88', '#9aa0ab', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M40 46 V52', '#9aa0ab', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += path('M125 46 V52', '#9aa0ab', ' stroke="#9aa0ab" stroke-width="1.5"');
    inner += rect(20, 74, 120, 12, '#4cb057', ' rx="2"');
    inner += text(80, 82, 'Minimo: placa + CPU + 1 RAM', 8.5, '#fff');
    return svg(160, 96, inner);
  };
  MODELS['bench-scores'] = function () {
    var inner = frameLabel('Que mide cada test');
    var rows = [
      ['Cinebench', '#3b82c4', 'CPU multi'],
      ['3DMark', '#e27d2b', 'GPU + CPU'],
      ['Prime95', '#d8433d', 'Estabilidad'],
      ['FurMark', '#e3b341', 'GPU termal']
    ];
    rows.forEach(function (r, i) {
      var y = 30 + i * 15;
      inner += rect(20, y, 44, 9, r[1]);
      inner += text(70, y + 8, r[0], 9, '#e9ebee', 'start');
      inner += text(134, y + 8, r[2], 8, '#aeb4bf', 'middle');
    });
    return svg(160, 96, inner);
  };

  /* === PLANES DE MANTENIMIENTO (man-preventivo) === */
  MODELS['backup-321'] = function () {
    var inner = frameLabel('Regla 3-2-1');
    for (var i = 0; i < 3; i++) {
      var x = 24 + i * 40;
      inner += rect(x, 28, 26, 20, i === 2 ? '#4cb057' : '#3b82c4');
      inner += circle(x + 13, 36, 5.5, '#0d0f14');
      inner += text(x + 13, 43, String(i + 1), 8.5, '#fff');
      inner += text(x + 13, 62, ['Original', 'Local', 'Remoto'][i], 7.5, '#c8ccd4');
    }
    inner += text(80, 80, '3 copias · 2 medios · 1 externo', 8.5, '#aeb4bf', 'middle');
    return svg(160, 92, inner);
  };
  MODELS['plan-calendar'] = function () {
    var inner = frameLabel('Calendario');
    inner += rect(26, 26, 108, 12, '#d8433d');
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 6; c++) {
        inner += rect(29 + c * 18, 42 + r * 12, 14, 8, (r + c) % 3 === 0 ? '#3bc2c9' : '#1c2129');
      }
    }
    inner += text(26, 82, 'Dias de mantenimiento', 8, '#9aa0ab', 'start');
    return svg(160, 92, inner);
  };
  MODELS.ups = function () {
    var inner = frameLabel('UPS');
    inner += rect(34, 30, 92, 44, '#2a2d36');
    inner += rect(44, 38, 26, 22, '#4cb057');
    inner += rect(76, 40, 30, 12, '#0d0f14');
    inner += rect(80, 44, 6, 4, '#f6c344');
    inner += text(80, 70, 'Bateria + regulador', 8.5, '#aeb4bf');
    return svg(160, 92, inner);
  };

  /* Nombre legible de cada conector para la tarjeta .port-2d */
  var DISPLAY = {
    atx24: 'ATX 24 pines', atx20: 'ATX 20 pines', eps8: 'EPS 8 pines (CPU)', eps4: 'EPS 4 pines',
    pcie62: 'PCIe 6+2 pines', '12vhpwr': '12VHPWR 16 pines', 'sata-power': 'SATA Power 15',
    'sata-data': 'SATA Data 7', molex: 'Molex 4', berg: 'Berg 4 (FDD)', hdmi: 'HDMI (19 pines)',
    'hdmi-mini': 'HDMI Mini', 'hdmi-micro': 'HDMI Micro', dp: 'DisplayPort (20 pines)',
    minidp: 'Mini DisplayPort', vga: 'VGA (DB-15)', dvi: 'DVI (24+1)', svideo: 'S-Video',
    'rca-video': 'RCA compuesto', ypbpr: 'Componentes YPbPr', 'usb-a': 'USB-A',
    'usb-b': 'USB-B', 'usb-c': 'USB-C 24 pines', thunderbolt: 'Thunderbolt 3/4',
    'usb-mini': 'USB Mini-B', 'usb-micro': 'USB Micro-B', jack35: 'Jack 3.5 mm',
    toslink: 'S/PDIF optico', rj45: 'RJ-45', rj11: 'RJ-11 (telefono)', ps2: 'PS/2',
    com: 'COM (DB-9)', 'ac-cable': 'IEC C14', 'dc-jack': 'Jack DC (barrel)',
    'coax-fconn': 'Coaxial F', 'fiber-sc': 'Fibra SC', 'fiber-lc': 'Fibra LC (duplex)', 'fiber-st': 'Fibra ST'
  };

  function resolve(name, dataMode) {
    var f = FEMALE[name] || MODELS[name];
    if (!f) {
      return svg(160, 92, rect(16, 30, 128, 40, '#17181c') + rect(22, 36, 116, 28, '#0d0f14') + text(80, 54, name, 11, '#9aa0ab') + text(80, 70, 'diagrama 2D', 8, '#5a5f6e'));
    }
    var out = f();
    if (dataMode && name === 'rj45' && window.__CABLES3D__) {
      return svg(160, 92, rect(16, 30, 128, 40, '#17181c') + rect(22, 36, 116, 28, '#0d0f14') + holesGrid(1, 8, 30, 50, 12, 3, '#000') + text(30, 76, 'T568' + (dataMode === 'a' ? 'A' : 'B'), 9, '#f6c344', 'start'));
    }
    return out;
  }

  function portBlock(name, dataMode) {
    var d = document.createElement('div');
    d.className = 'port-2d';
    var label = DISPLAY[name] || name;
    d.innerHTML = '<div class="port-2d-title" title="' + esc(label) + '"><i class="bi bi-hdd"></i> ' + esc(label) + ' · vista frontal</div>' + resolve(name, dataMode);
    return d;
  }

  function renderPortInto(el, block, name) {
    var mode = el.dataset.mode || (el.querySelector('[data-norm].active') || {}).dataset.norm;
    block.querySelector('.port-2d-svg, svg') && block.querySelector('.port-2d-svg, svg').remove();
    block.insertAdjacentHTML('beforeend', resolve(name, mode));
  }

  function init() {
    var is3D = !!window.__CABLES3D__;
    document.querySelectorAll('.three-canvas[data-model]').forEach(function (el) {
      var name = el.dataset.model;
      var mode = el.dataset.mode;
      var stage = el.querySelector('.three-stage');
      if (is3D) {
        var hasFemale = !!FEMALE[name];
        if (hasFemale && stage) {
          var block = portBlock(name, mode);
          el.appendChild(block);
          var hint = el.querySelector('.three-hint');
          if (hint) hint.textContent = 'macho 3D · hembra 2D';
          el.querySelectorAll('[data-norm], [data-wire-order]').forEach(function (btn) {
            btn.addEventListener('click', function () { renderPortInto(el, block, name); });
          });
        }
      } else if (stage) {
        stage.innerHTML = resolve(name, mode);
        stage.classList.add('stage-2d');
        var hint = el.querySelector('.three-hint');
        if (hint) hint.textContent = 'diagrama 2D';
      }
      var tv = el.querySelector('.three-title');
      if (tv) {
        var full = el.dataset.title || null;
        if (full) {
          tv.textContent = full;
          tv.title = full;
        }
      }
    });
    if (!is3D) document.body.classList.add('page-vis2d');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
