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

/* === FONDO DE GRADIENTE ANIMADO (colores aleatorios) === */
function initHeroGradient() {
  const top = document.getElementById('heroBgTop');
  const bottom = document.getElementById('heroBgBottom');
  if (!top || !bottom) return;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDark = () => (document.documentElement.getAttribute('data-theme') || 'dark') !== 'light';

  const rand = (min, max) => min + Math.random() * (max - min);
  /* tonos masculinos: verde -> cian -> azul (sin morado/rojo/rosado) */
  const hue = () => Math.floor(150 + Math.random() * 110);

  function buildGradient() {
    const dark = isDark();
    const s = dark ? Math.round(50 + Math.random() * 40) : Math.round(55 + Math.random() * 35);
    const l1 = dark ? Math.round(9 + Math.random() * 11) : Math.round(84 + Math.random() * 8);
    const l2 = dark ? Math.round(14 + Math.random() * 14) : Math.round(74 + Math.random() * 12);
    const h1 = hue(), h2 = hue(), h3 = hue();
    return 'radial-gradient(at 18% 18%, hsl(' + h1 + ',' + s + '%,' + l1 + '%) 0%, transparent 55%),' +
           'radial-gradient(at 82% 72%, hsl(' + h2 + ',' + s + '%,' + l2 + '%) 0%, transparent 55%),' +
           'linear-gradient(135deg, hsl(' + h3 + ',' + s + '%,' + (dark ? 10 : 88) + '%) 0%, hsl(' + ((h3 + 45) % 360) + ',' + s + '%,' + (dark ? 18 : 76) + '%) 100%)';
  }

  let active = top, idle = bottom;
  active.style.background = buildGradient();
  active.style.opacity = 1;

  if (reduceMotion) return;

  const timer = setInterval(function () {
    if (!document.body.contains(active)) { clearInterval(timer); return; }
    idle.style.background = buildGradient();
    idle.style.opacity = 1;
    active.style.opacity = 0;
    const tmp = active; active = idle; idle = tmp;
  }, 5000);

  new MutationObserver(function () {
    active.style.background = buildGradient();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroAnime();
  initHeroGradient();
  initCounters();
  initCardReveal();
  if (window.VanillaTilt) initTilt();
});
