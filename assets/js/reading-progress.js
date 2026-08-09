/* ============================================================
   TECHGUIDE - reading-progress.js (barra de progreso + modo lectura)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initReadingProgress();
  initReadingMode();
});

function initReadingProgress() {
  const bar = document.getElementById('readingProgress');
  if (!bar) return;
  const fill = bar.querySelector('.reading-progress-fill');
  if (!fill) return;
  const onScroll = () => {
    const h = document.documentElement;
    const total = h.scrollHeight - h.clientHeight;
    const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
    fill.style.width = pct + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initReadingMode() {
  const btn = document.getElementById('readingModeBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const active = document.body.classList.toggle('reading-mode');
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active);
    const icon = btn.querySelector('i');
    if (icon) icon.className = active ? 'bi bi-book-half' : 'bi bi-journal-text';
  });
}
