/* ============================================================
   TECHGUIDE - home.js (solo index.html)
   Tarjetas 3D + contadores animados
   (el fondo 3D del hero vive en home3d.js)
   ============================================================ */

/* === 3D TILT ON CARDS === */
function initTilt() {
  document.querySelectorAll('.mod-card, .feat-card').forEach(card => {
    VanillaTilt.init(card, {
      max: 10,
      speed: 400,
      glare: true,
      'max-glare': .18,
      scale: 1.02,
      perspective: 800
    });
  });
}

/* === ANIMATED COUNTERS === */
function animateCounter(el) {
  const raw = el.textContent.replace(/[^0-9.+-]/g, '');
  const target = parseFloat(raw) || 0;
  const suffix = el.textContent.replace(/[0-9]/g, '').trim();
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function initCounters() {
  const stats = document.querySelectorAll('.home-stat-val');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .4 });
  stats.forEach(s => observer.observe(s));
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.VanillaTilt) initTilt();
  initCounters();
});
