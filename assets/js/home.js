/* ============================================================
   TECHGUIDE - home.js (solo index.html)
   Animaciones con anime.js:
   - entrada escalonada del hero (badge, titulo por linea, CTA)
   - contadores animados de las stats
   - revelado de tarjetas al hacer scroll
   Tarjetas 3D con VanillaTilt
   ============================================================ */

/* el script se ejecuta al final del body: el hero ya esta parseado,
   asi que marcamos el hero para ocultar solo si anime.js esta activo */
(function markHero() {
  if (!window.anime) return;
  const hero = document.querySelector('.hero');
  if (hero) hero.classList.add('hero-init');
  document.documentElement.classList.add('js-anime');
})();

function initHeroAnime() {
  if (!window.anime) return;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lines = Array.from(document.querySelectorAll('.hero-line'));

  if (reduceMotion) {
    document.querySelectorAll('.hero-anime, .hero-line').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
    return;
  }

  const tl = anime.timeline({ easing: 'easeOutCubic', autoplay: true });

  tl.add({
    targets: '.hero-badge',
    opacity: [0, 1],
    translateY: [-18, 0],
    duration: 700
  }, 150);

  tl.add({
    targets: lines,
    opacity: [0, 1],
    translateY: [42, 0],
    rotateX: [12, 0],
    duration: 800,
    delay: anime.stagger(140)
  }, 250);

  tl.add({
    targets: '.hero p',
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 700
  }, 1100);

  tl.add({
    targets: '.hero-cta a',
    opacity: [0, 1],
    translateY: [22, 0],
    duration: 650,
    delay: anime.stagger(120)
  }, 1350);
}

/* === CONTADORES ANIMADOS (anime.js) === */
function animateCounter(el) {
  const raw = el.textContent.replace(/[^0-9.+-]/g, '');
  const target = parseFloat(raw) || 0;
  const suffix = el.textContent.replace(/[0-9]/g, '').trim();
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.anime || reduced) {
    el.textContent = target + suffix;
    return;
  }
  const state = { v: 0 };
  anime({
    targets: state,
    v: target,
    round: 1,
    duration: 1400,
    easing: 'easeOutExpo',
    update: () => { el.textContent = Math.round(state.v) + suffix; }
  });
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

/* === REVELADO DE TARJETAS AL SCROLL === */
function initCardReveal() {
  if (!window.anime) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    document.querySelectorAll('.mod-card, .feat-card').forEach(card => { card.style.opacity = 1; });
    return;
  }
  const cards = document.querySelectorAll('.mod-card, .feat-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        anime({
          targets: entry.target,
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 650,
          easing: 'easeOutCubic'
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .15 });
  cards.forEach(card => observer.observe(card));
}

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

document.addEventListener('DOMContentLoaded', () => {
  initHeroAnime();
  initCounters();
  initCardReveal();
  if (window.VanillaTilt) initTilt();
});
