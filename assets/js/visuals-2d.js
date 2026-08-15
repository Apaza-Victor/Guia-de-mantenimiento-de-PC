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
  function frameLabel(name) {
    return '<g opacity=".55">' + text(80, 24, name, 9, '#9aa0ab') + '</g>';
  }

  /* === PUERTOS HEMBRA (vista frontal: cavidad + pines) === */
  var FEMALE = {};

  FEMALE.atx24 = function () {
    var inner = frameLabel('ATX 24');
    inner += rect(14, 26, 132, 48, '#17181c');
    inner += rect(18, 30, 124, 40, '#0d0f14');
    inner += holesGrid(2, 12, 28, 42, 10, 3.4, '#000');
    inner += rect(40, 26, 22, 6, '#5a5f6e');
    return svg(160, 92, inner);
  };
  FEMALE.atx20 = function () {
    var inner = frameLabel('ATX 20');
    inner += rect(14, 26, 112, 48, '#17181c');
    inner += rect(18, 30, 104, 40, '#0d0f14');
    inner += holesGrid(2, 10, 28, 42, 10, 3.4, '#000');
    inner += rect(40, 26, 22, 6, '#5a5f6e');
    return svg(160, 92, inner);
  };
  FEMALE.eps8 = function () {
    var inner = frameLabel('EPS 8 (CPU)');
    inner += rect(30, 26, 72, 48, '#17181c');
    inner += rect(34, 30, 64, 40, '#0d0f14');
    inner += holesGrid(2, 4, 42, 42, 12, 3.6, '#000');
    inner += rect(46, 26, 22, 6, '#5a5f6e');
    return svg(140, 92, inner);
  };
  FEMALE.eps4 = function () {
    var inner = frameLabel('EPS 4');
    inner += rect(36, 26, 50, 48, '#17181c');
    inner += rect(40, 30, 42, 40, '#0d0f14');
    inner += holesGrid(2, 2, 48, 42, 12, 3.6, '#000');
    return svg(140, 92, inner);
  };
  FEMALE.pcie62 = function () {
    var inner = frameLabel('PCIe 6+2');
    inner += rect(18, 26, 62, 48, '#17181c');
    inner += rect(22, 30, 54, 40, '#0d0f14');
    inner += holesGrid(2, 3, 32, 42, 11, 3.5, '#000');
    inner += rect(92, 26, 28, 48, '#17181c');
    inner += rect(96, 30, 20, 40, '#0d0f14');
    inner += holesGrid(2, 1, 106, 42, 11, 3.5, '#000');
    inner += rect(30, 26, 10, 6, '#5a5f6e');
    return svg(140, 92, inner);
  };
  FEMALE['12vhpwr'] = function () {
    var inner = frameLabel('12VHPWR 12+4');
    inner += rect(16, 26, 88, 48, '#17181c');
    inner += rect(20, 30, 80, 40, '#0d0f14');
    inner += holesGrid(2, 6, 29, 42, 10.5, 3, '#000');
    inner += rect(112, 20, 18, 22, '#17181c');
    inner += holesGrid(2, 2, 117, 27, 8, 2.2, '#000');
    return svg(150, 92, inner);
  };
  FEMALE['sata-power'] = function () {
    var inner = frameLabel('SATA Power 15');
    inner += rect(10, 30, 132, 40, '#17181c');
    inner += rect(14, 34, 124, 32, '#0d0f14');
    inner += holesGrid(1, 15, 18, 50, 8, 2.8, '#000');
    inner += rect(20, 20, 112, 10, '#5a5f6e');
    return svg(160, 90, inner);
  };
  FEMALE['sata-data'] = function () {
    var inner = frameLabel('SATA Data 7');
    inner += rect(10, 30, 104, 36, '#17181c');
    inner += rect(14, 34, 96, 28, '#0d0f14');
    inner += holesGrid(1, 7, 19, 48, 12, 2.6, '#000');
    inner += rect(30, 24, 54, 8, '#5a5f6e');
    return svg(140, 88, inner);
  };
  FEMALE.molex = function () {
    var inner = frameLabel('Molex 4');
    inner += rect(24, 30, 92, 40, '#e4e6e9');
    inner += rect(28, 34, 84, 32, '#fff');
    inner += holesGrid(1, 4, 40, 50, 18, 5, '#000');
    inner += rect(40, 24, 10, 8, '#b9bdc4');
    return svg(150, 90, inner);
  };
  FEMALE.berg = function () {
    var inner = frameLabel('Berg 4');
    inner += rect(30, 30, 70, 40, '#e4e6e9');
    inner += holesGrid(1, 4, 40, 50, 12, 3, '#000');
    return svg(140, 90, inner);
  };

  FEMALE.hdmi = function () {
    var inner = frameLabel('HDMI 19');
    inner += rect(30, 26, 100, 48, '#bfc6cf');
    inner += rect(34, 30, 92, 40, '#0d0f14');
    inner += holesGrid(1, 10, 42, 38, 7.2, 2, '#000');
    inner += holesGrid(1, 9, 46, 56, 7.2, 2, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['hdmi-mini'] = function () {
    var inner = frameLabel('HDMI Mini');
    inner += rect(42, 32, 76, 36, '#bfc6cf');
    inner += rect(45, 35, 70, 30, '#0d0f14');
    inner += holesGrid(1, 10, 52, 43, 5.4, 1.5, '#000');
    inner += holesGrid(1, 9, 55, 57, 5.4, 1.5, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['hdmi-micro'] = function () {
    var inner = frameLabel('HDMI Micro');
    inner += rect(50, 36, 60, 28, '#bfc6cf');
    inner += rect(52, 38, 56, 24, '#0d0f14');
    inner += holesGrid(1, 10, 58, 45, 4.2, 1.2, '#000');
    inner += holesGrid(1, 9, 60, 56, 4.2, 1.2, '#000');
    return svg(160, 92, inner);
  };
  FEMALE.dp = function () {
    var inner = frameLabel('DisplayPort 20');
    inner += rect(36, 28, 88, 44, '#bfc6cf');
    inner += rect(40, 32, 80, 36, '#0d0f14');
    inner += holesGrid(1, 20, 43, 50, 3.8, 1.7, '#000');
    inner += rect(52, 20, 40, 8, '#8a5cf5');
    return svg(160, 92, inner);
  };
  FEMALE.minidp = function () {
    var inner = frameLabel('Mini DP');
    inner += rect(50, 32, 60, 36, '#bfc6cf');
    inner += rect(53, 35, 54, 30, '#0d0f14');
    inner += holesGrid(1, 20, 55, 50, 2.5, 1.2, '#000');
    inner += rect(60, 24, 30, 8, '#8a5cf5');
    return svg(160, 92, inner);
  };
  FEMALE.vga = function () {
    var inner = frameLabel('VGA DB-15');
    inner += rect(18, 20, 124, 64, '#2b5bb0');
    inner += rect(28, 28, 40, 18, '#12327a');
    inner += rect(28, 48, 40, 18, '#12327a');
    inner += rect(28, 68, 40, 18, '#12327a');
    inner += holesGrid(3, 5, 36, 35, 8, 2.2, '#000');
    return svg(160, 104, inner);
  };
  FEMALE.dvi = function () {
    var inner = frameLabel('DVI 24+1');
    inner += rect(16, 26, 128, 52, '#e9ebee');
    inner += rect(22, 32, 116, 40, '#0d0f14');
    inner += holesGrid(3, 8, 30, 38, 12, 2.2, '#000');
    inner += rect(112, 38, 6, 12, '#000');
    return svg(160, 92, inner);
  };
  FEMALE.svideo = function () {
    var inner = frameLabel('S-Video');
    inner += circle(80, 50, 30, '#bfc6cf');
    inner += circle(80, 50, 22, '#0d0f14');
    inner += holesGrid(2, 2, 73, 43, 9, 2.5, '#000');
    inner += rect(110, 50, 8, 8, '#17181c');
    return svg(160, 92, inner);
  };
  FEMALE['rca-video'] = function () {
    var inner = frameLabel('RCA Video');
    inner += circle(80, 50, 26, '#f6c344');
    inner += circle(80, 50, 18, '#0d0f14');
    inner += circle(80, 50, 7, '#000');
    return svg(160, 92, inner);
  };
  FEMALE.ypbpr = function () {
    var inner = frameLabel('YPbPr');
    var cols = ['#4cb057', '#3b82c4', '#d8433d'];
    for (var i = 0; i < 3; i++) {
      var cx = 52 + i * 28;
      inner += circle(cx, 50, 12, cols[i]);
      inner += circle(cx, 50, 7, '#0d0f14');
    }
    return svg(160, 92, inner);
  };

  function usbAFrame() {
    var inner = rect(34, 34, 92, 32, '#bfc6cf');
    inner += rect(38, 38, 84, 24, '#0d0f14');
    inner += rect(38, 46, 84, 6, '#000');
    inner += rect(48, 44, 4, 3, '#d7a94a');
    inner += rect(60, 44, 4, 3, '#d7a94a');
    return inner;
  }
  FEMALE['usb-a'] = function () {
    return svg(160, 92, frameLabel('USB-A') + usbAFrame());
  };
  FEMALE['usb-b'] = function () {
    var inner = frameLabel('USB-B');
    inner += rect(40, 28, 80, 64, '#bfc6cf');
    inner += rect(46, 34, 68, 52, '#0d0f14');
    inner += rect(46, 52, 68, 6, '#000');
    inner += rect(56, 50, 4, 3, '#d7a94a');
    inner += rect(68, 50, 4, 3, '#d7a94a');
    return svg(160, 104, inner);
  };
  FEMALE['usb-c'] = function () {
    var inner = frameLabel('USB-C 24');
    inner += el(80, 50, 42, 16, '#bfc6cf');
    inner += el(80, 50, 36, 12, '#0d0f14');
    inner += rect(74, 46, 12, 8, '#000');
    for (var i = 0; i < 12; i++) {
      inner += rect(56 + i * 4, 44, 1.5, 2, '#d7a94a');
      inner += rect(56 + i * 4, 55, 1.5, 2, '#d7a94a');
    }
    return svg(160, 92, inner);
  };
  FEMALE.thunderbolt = function () {
    var inner = frameLabel('Thunderbolt 3/4');
    inner += el(80, 50, 42, 16, '#8a5cf5');
    inner += el(80, 50, 36, 12, '#0d0f14');
    inner += path('M78 38 l8 10 h-4 l4 8 h-8 l-8 -10 h4 l-4 -8 z', '#e9ebee');
    return svg(160, 92, inner);
  };
  FEMALE['usb-mini'] = function () {
    var inner = frameLabel('USB Mini-B');
    inner += rect(44, 36, 72, 28, '#bfc6cf');
    inner += rect(48, 40, 64, 20, '#0d0f14');
    inner += holesGrid(1, 5, 54, 50, 10, 1.8, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['usb-micro'] = function () {
    var inner = frameLabel('USB Micro-B');
    inner += path('M46 44 L114 44 L108 58 L52 58 Z', '#bfc6cf');
    inner += path('M50 46 L110 46 L105 56 L55 56 Z', '#0d0f14');
    inner += holesGrid(1, 5, 60, 51, 9, 1.6, '#000');
    return svg(160, 92, inner);
  };
  FEMALE.jack35 = function () {
    var inner = frameLabel('Jack 3.5mm');
    inner += rect(28, 30, 104, 40, '#2a2d36');
    inner += circle(80, 50, 18, '#bfc6cf');
    inner += circle(80, 50, 8, '#000');
    return svg(160, 92, inner);
  };
  FEMALE.toslink = function () {
    var inner = frameLabel('S/PDIF optico');
    inner += rect(40, 30, 80, 40, '#17181c');
    inner += rect(48, 38, 64, 24, '#0d0f14');
    inner += circle(80, 50, 12, '#d8433d');
    return svg(160, 92, inner);
  };
  FEMALE.rj45 = function () {
    var inner = frameLabel('RJ-45 hembra');
    inner += rect(34, 28, 92, 44, '#3a3e49');
    inner += rect(40, 34, 80, 32, '#0d0f14');
    for (var c = 0; c < 8; c++) inner += rect(48 + c * 8.6, 36, 6, 4, '#d7a94a');
    inner += rect(40, 34, 80, 6, '#0d0f14');
    return svg(160, 92, inner);
  };
  FEMALE.rj11 = function () {
    var inner = frameLabel('RJ-11');
    inner += rect(44, 32, 72, 36, '#3a3e49');
    inner += rect(49, 37, 62, 26, '#0d0f14');
    for (var c = 0; c < 6; c++) inner += rect(56 + c * 8, 39, 5, 3.4, '#d7a94a');
    return svg(160, 92, inner);
  };
  FEMALE.ps2 = function () {
    var inner = frameLabel('PS/2');
    inner += circle(80, 50, 28, '#8a5cf5');
    inner += circle(80, 50, 20, '#6d3fb8');
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      inner += circle(80 + Math.cos(a) * 12, 50 + Math.sin(a) * 12, 2.4, '#000');
    }
    return svg(160, 92, inner);
  };
  FEMALE.com = function () {
    var inner = frameLabel('COM DB-9');
    inner += path('M52 26 L108 26 L116 38 L116 62 L108 74 L52 74 L44 62 L44 38 Z', '#b9bec7');
    inner += holesGrid(1, 5, 55, 36, 10, 2.2, '#000');
    inner += holesGrid(1, 4, 60, 58, 10, 2.2, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['ac-cable'] = function () {
    var inner = frameLabel('IEC C14');
    inner += rect(40, 30, 80, 40, '#2a2d36');
    inner += path('M58 34 L102 34 L96 66 L64 66 Z', '#0d0f14');
    inner += rect(72, 38, 16, 24, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['dc-jack'] = function () {
    var inner = frameLabel('DC barrel');
    inner += rect(28, 30, 104, 40, '#2a2d36');
    inner += circle(80, 50, 18, '#bfc6cf');
    inner += circle(80, 50, 9, '#000');
    inner += circle(80, 50, 3, '#d7a94a');
    return svg(160, 92, inner);
  };
  FEMALE['coax-fconn'] = function () {
    var inner = frameLabel('F (coaxial)');
    inner += path('M60 24 h40 l10 10 v32 l-10 10 h-40 l-10 -10 v-32 z', '#8a8f98');
    inner += circle(80, 50, 12, '#0d0f14');
    inner += circle(80, 50, 4, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['fiber-sc'] = function () {
    var inner = frameLabel('SC');
    inner += rect(52, 28, 56, 44, '#2a2d36');
    inner += rect(58, 36, 44, 28, '#4cb057');
    inner += rect(64, 42, 32, 16, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['fiber-lc'] = function () {
    var inner = frameLabel('LC duplex');
    inner += rect(44, 26, 28, 48, '#2a2d36');
    inner += rect(88, 26, 28, 48, '#2a2d36');
    inner += rect(50, 34, 16, 32, '#2b5bb0');
    inner += rect(94, 34, 16, 32, '#2b5bb0');
    inner += rect(54, 42, 8, 16, '#000');
    inner += rect(98, 42, 8, 16, '#000');
    return svg(160, 92, inner);
  };
  FEMALE['fiber-st'] = function () {
    var inner = frameLabel('ST');
    inner += circle(80, 50, 22, '#2a2d36');
    inner += rect(72, 28, 16, 8, '#bfc6cf');
    inner += circle(80, 50, 12, '#0d0f14');
    inner += circle(80, 50, 5, '#000');
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
    inner += text(76, 49, 'Ventoy', 8, '#3bc2c9');
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
    inner += text(24, 80, 'MBR 512B + 4 particiones primarias', 8, '#9aa0ab', 'start');
    return svg(160, 92, inner);
  };
  MODELS['disk-gpt'] = function () {
    var inner = frameLabel('GPT / UEFI');
    inner += rect(20, 34, 120, 24, '#2a2d36');
    inner += rect(26, 40, 12, 12, '#4cb057');
    inner += rect(42, 40, 60, 12, '#3b82c4');
    inner += rect(106, 40, 16, 12, '#e27d2b');
    inner += rect(126, 40, 8, 12, '#4cb057');
    inner += text(24, 80, 'GPT: tablas espejadas + 128 particiones', 8, '#9aa0ab', 'start');
    return svg(160, 92, inner);
  };

  MODELS['hub-vs-switch'] = function () {
    var inner = frameLabel('Hub vs Switch');
    inner += rect(20, 26, 50, 40, '#e27d2b');
    inner += text(45, 48, 'HUB', 12, '#fff');
    inner += text(45, 60, 'comparte', 7, '#fff');
    inner += rect(90, 26, 50, 40, '#4cb057');
    inner += text(115, 48, 'SWITCH', 9, '#fff');
    inner += text(115, 60, 'segmenta', 7, '#fff');
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
    inner += text(80, 49, 'Bomba', 7, '#e9ebee');
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
      inner += text(86, y + 8, r[0], 9, '#c8ccd4', 'start');
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

  /* === PLANES DE MANTENIMIENTO (man-preventivo) === */
  MODELS['backup-321'] = function () {
    var inner = frameLabel('Regla 3-2-1');
    for (var i = 0; i < 3; i++) {
      var x = 24 + i * 40;
      inner += rect(x, 34, 28, 24, i === 2 ? '#4cb057' : '#3b82c4');
      inner += circle(x + 14, 40, 6, '#0d0f14');
      inner += text(x + 14, 52, ['Original', 'Local', 'Remoto'][i], 6.5, '#fff');
    }
    inner += text(24, 76, '3 copias · 2 medios · 1 externo', 8, '#9aa0ab', 'start');
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
    inner += text(80, 70, 'Bateria + regulador', 7, '#9aa0ab');
    return svg(160, 92, inner);
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
    d.innerHTML = '<div class="port-2d-title"><i class="bi bi-hdd"></i> Puerto hembra (2D)</div>' + resolve(name, dataMode);
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
        var t = el.querySelector('.three-title');
        if (t && FEMALE[name]) t.textContent = t.textContent.replace(/ \u00b7 macho \+ hembra/, '') + ' · puerto';
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
