/* ============================================================
   TECHGUIDE - theme.js (modo oscuro/claro)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
});

function getSavedTheme() {
  try { return localStorage.getItem('tg-theme'); }
  catch(e) { return null; }
}
function setSavedTheme(val) {
  try { localStorage.setItem('tg-theme', val); }
  catch(e) {}
}
function initTheme() {
  const saved = getSavedTheme() || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  setSavedTheme(next);
  updateThemeBtn(next);
}
function updateThemeBtn(theme) {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const icon = btn.querySelector('i');
  const label = btn.querySelector('span');
  if (theme === 'dark') {
    icon.className = 'bi bi-sun-fill';
    if (label) label.textContent = 'Claro';
  } else {
    icon.className = 'bi bi-moon-fill';
    if (label) label.textContent = 'Oscuro';
  }
}
