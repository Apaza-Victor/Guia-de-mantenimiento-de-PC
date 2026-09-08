/* ============================================================
   TECHGUIDE - home-3d-loader.js (solo index.html)
   Carga perezosa de Three.js y su escena:
   - se pospone hasta idle/load + margen, o cuando el hero se acerca
   - respeta prefers-reduced-motion (no carga nada)
   - home3d.js hace no-op si falta la libreria
   ============================================================ */

(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.querySelector('.hero')) return;

  var base = 'assets/js/';
  var cs = document.currentScript;
  if (cs && cs.src) base = cs.src.replace(/home-3d-loader\.js[?#].*$/, '');

  var cdn = [
    'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js'
  ];

  function waitIdle(cb) {
    if (window.requestIdleCallback) requestIdleCallback(cb, { timeout: 2500 });
    else setTimeout(cb, 900);
  }

  function boot() {
    var pending = cdn.length;
    function dec() { if (--pending <= 0) loadScenes(); }
    cdn.forEach(function (src) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = dec; s.onerror = dec;
      document.head.appendChild(s);
    });
  }

  function loadScenes() {
    [base + 'home3d.js'].forEach(function (src) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      document.body.appendChild(s);
    });
  }

  if (window.IntersectionObserver) {
    var hero = document.querySelector('.hero');
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) {
        waitIdle(boot);
        io.disconnect();
      }
    }, { rootMargin: '800px' });
    io.observe(hero);
  } else {
    waitIdle(boot);
  }
})();