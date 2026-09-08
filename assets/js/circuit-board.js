/* ============================================================
   TECHGUIDE - circuit-board.js (solo index.html)
   Iconos de hardware flotando por todo el hero: los 6 principales
   (Motherboard, CPU, RAM, GPU, SSD, PSU) mas iconos extra.
   Cada chip flota con duracion, demora, amplitud y tamano aleatorio.
   Uso:
     <div class="cb-icons" id="circuitBoard" aria-hidden="true"></div>
   ============================================================ */

(function () {
  var ICONS = [
    { label: 'Motherboard', icon: 'bi-motherboard' },
    { label: 'CPU', icon: 'bi-cpu' },
    { label: 'RAM', icon: 'bi-memory' },
    { label: 'GPU', icon: 'bi-gpu-card' },
    { label: 'SSD', icon: 'bi-device-ssd' },
    { label: 'PSU', icon: 'bi-plug' },
    { label: 'HDD', icon: 'bi-hdd' },
    { label: 'Ventilador', icon: 'bi-fan' },
    { label: 'USB', icon: 'bi-usb-symbol' },
    { label: 'Router', icon: 'bi-router' },
    { label: 'WiFi', icon: 'bi-wifi' },
    { label: 'Ethernet', icon: 'bi-ethernet' }
  ];

  var TOTAL = 14;

  function rand(min, max) { return min + Math.random() * (max - min); }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function build() {
    var container = document.getElementById('circuitBoard');
    if (!container) return;
    var pool = shuffle(ICONS.slice());
    var frag = document.createDocumentFragment();
    var i, spec, node;
    for (i = 0; i < TOTAL; i++) {
      spec = pool[i % pool.length];
      node = document.createElement('div');
      node.className = 'cb-node';
      node.title = spec.label;
      node.style.top = rand(5, 92).toFixed(1) + '%';
      node.style.left = rand(3, 97).toFixed(1) + '%';
      node.style.setProperty('--cb-dur', rand(5, 9).toFixed(2) + 's');
      node.style.setProperty('--cb-delay', rand(0, 4).toFixed(2) + 's');
      node.style.setProperty('--cb-amp', (-rand(7, 16)).toFixed(1) + 'px');
      node.style.setProperty('--cb-scale', rand(.65, 1.35).toFixed(2));
      node.innerHTML = '<span class="cb-chip"><i class="bi ' + spec.icon + '"></i></span>' +
        '<span class="cb-label">' + spec.label + '</span>';
      frag.appendChild(node);
    }
    container.appendChild(frag);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();