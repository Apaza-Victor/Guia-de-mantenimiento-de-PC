/* ============================================================
   TECHGUIDE - nav.js (hamburguesa + dropdown movil + hover)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
});

function initNav() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  const overlay = document.getElementById('navOverlay');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      overlay?.classList.toggle('show');
      document.body.classList.toggle('nav-open', isOpen);
      const icon = toggle.querySelector('i');
      icon.className = isOpen ? 'bi bi-x-lg' : 'bi bi-list';
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeNav);
  }

  /* Mobile: toggle dropdown on button click */
  document.querySelectorAll('.nav-drop-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (window.innerWidth <= 991) {
        e.preventDefault();
        const item = btn.closest('.nav-item');
        item.classList.toggle('open');
      }
    });
  });

  /* Close nav when clicking any link (mobile) */
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 991) {
        e.preventDefault();
        closeNav();
        location.href = link.getAttribute('href');
      }
    });
  });
}

function closeNav() {
  const menu = document.getElementById('navMenu');
  const overlay = document.getElementById('navOverlay');
  const toggle = document.getElementById('navToggle');
  menu?.classList.remove('open');
  overlay?.classList.remove('show');
  document.body.classList.remove('nav-open');
  document.querySelectorAll('.nav-item.open').forEach(el => el.classList.remove('open'));
  if (toggle) toggle.querySelector('i').className = 'bi bi-list';
}
