/* ============================================================
   TECHGUIDE - ui.js (acordeones, checklist, pasos, scroll,
   pills, copiar codigo, busqueda)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initAccordions();
  initChecklist();
  initSteps();
  initBackToTop();
  initScrollSpy();
  initNetPills();
  initCodeCopy();
  initSearch();
  initRecSearch();
  initPrintButton();
  initActiveNav();
  AOS.init({ duration: 800, once: true, offset: 80, easing: 'ease-out-cubic' });
});

/* === ACCORDIONS (contenido siempre visible, sin toggle) === */
function initAccordions() {}

/* === CHECKLIST === */
function initChecklist() {
  document.querySelectorAll('.checklist-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
      updateChecklistProgress();
    });
  });
}
function updateChecklistProgress() {
  document.querySelectorAll('.checklist-box').forEach(box => {
    const items = box.querySelectorAll('.checklist-item');
    const checked = box.querySelectorAll('.checklist-item.checked');
    const fill = box.querySelector('.checklist-progress-fill');
    const stat = box.querySelector('.check-stat');
    if (items.length > 0 && fill) {
      const pct = (checked.length / items.length) * 100;
      fill.style.width = pct + '%';
    }
    if (stat) {
      stat.textContent = checked.length + ' / ' + items.length;
    }
  });
}

/* === STEPS === */
function initSteps() {
  document.querySelectorAll('.step-check-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = btn.closest('.step-item');
      item.classList.toggle('completed');
      updateStepProgress();
    });
  });
}
function updateStepProgress() {
  const total = document.querySelectorAll('.step-item').length;
  const done = document.querySelectorAll('.step-item.completed').length;
  const badge = document.getElementById('stepsBadge');
  const pill = document.getElementById('globalProgress');
  if (badge) badge.textContent = done;
  if (pill) pill.textContent = done + ' / ' + total + ' pasos';
}

/* === BACK TO TOP === */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* === SCROLL SPY === */
function initScrollSpy() {
  const links = document.querySelectorAll('.nav-dropdown a');
  const sections = [];
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (!href || !href.includes('#')) return;
    const id = href.split('#')[1];
    const sec = document.getElementById(id);
    if (sec) sections.push({ el: sec, link });
  });
  if (sections.length === 0) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active-link'));
        const match = sections.find(s => s.el === entry.target);
        if (match) match.link.classList.add('active-link');
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px' });
  sections.forEach(s => observer.observe(s.el));
}

/* === NET PILLS === */
function initNetPills() {
  document.querySelectorAll('.net-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const group = pill.dataset.group;
      const container = pill.closest('.content-section') || document;
      container.querySelectorAll('.net-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      container.querySelectorAll('.net-group').forEach(g => {
        g.style.display = (group === 'all' || g.dataset.group === group) ? '' : 'none';
      });
      container.querySelectorAll('.net-group').forEach(g => {
        if (g.style.display === 'none') return;
        g.querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-animate'));
      });
    });
  });
}

/* === CODE COPY === */
function initCodeCopy() {
  document.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = btn.closest('.code-block').querySelector('pre');
      if (!pre) return;
      navigator.clipboard.writeText(pre.textContent).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copiado!';
        btn.style.color = 'var(--accent2)';
        btn.style.borderColor = 'var(--accent2)';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 1500);
      });
    });
  });
}

/* === SEARCH === */
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    document.querySelectorAll('.accordion-item, .comp-card, .tool-card, .device-card, .topo-card, .shortcut-item').forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = (q === '' || text.includes(q)) ? '' : 'none';
    });
  });
}

/* === RECURSOS: buscador en vivo de tarjetas === */
function initRecSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('recSearchClear');
  if (!input) return;

  const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const applyFilter = () => {
    const q = normalize(input.value.trim());
    const container = input.closest('.content-section') || document;
    const activeGroup = container.querySelector('.net-pill.active')?.dataset.group || 'all';
    let visible = 0;

    container.querySelectorAll('.net-group').forEach(group => {
      if (activeGroup !== 'all' && group.dataset.group !== activeGroup) return;
      let groupVisible = false;
      group.querySelectorAll('.rec-card').forEach(card => {
        const match = q === '' || normalize(card.textContent).includes(q);
        card.style.display = match ? '' : 'none';
        if (match) groupVisible = true;
      });
      group.style.display = groupVisible ? '' : 'none';
      if (groupVisible) visible++;
    });

    container.querySelectorAll('.net-group h3.sub-heading').forEach(h => {
      const group = h.closest('.net-group');
      h.style.display = (group.style.display !== 'none') ? '' : 'none';
    });

    const empty = container.querySelector('.rec-empty');
    if (empty) empty.classList.toggle('show', visible === 0);
    if (clear) clear.style.display = q ? 'flex' : 'none';
  };

  input.addEventListener('input', applyFilter);
  if (clear) clear.addEventListener('click', () => {
    input.value = '';
    applyFilter();
    input.focus();
  });

  // al cambiar la categoria (pill), re-aplica el filtro de texto
  document.querySelectorAll('.net-pill').forEach(pill => {
    pill.addEventListener('click', () => setTimeout(applyFilter, 0));
  });

  applyFilter();
}

/* === SMOOTH NAV === */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* === TOGGLE ACCORDION (inline onclick) === */
function toggleAccordion(id) {
  const item = document.getElementById(id);
  if (!item) return;
  item.classList.toggle('open');
}

/* === TOGGLE ITEM (inline onclick for accordion headers) === */
function toggleItem(header) {
  const item = header.closest('.accordion-item') || header.parentElement;
  if (!item) return;
  item.classList.toggle('open');
}

/* === COPY CODE (standalone for inline onclick) === */
function copyCode(btn) {
  const block = btn.closest('.code-block') || btn.closest('.code-block-header')?.parentElement;
  if (!block) return;
  const pre = block.querySelector('pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copiado!';
    btn.style.color = 'var(--accent2)';
    btn.style.borderColor = 'var(--accent2)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
      btn.style.borderColor = '';
    }, 1500);
  });
}

/* === PRINT / PDF BUTTON === */
function initPrintButton() {
  var actions = document.querySelector('.topbar-actions');
  if (!actions || document.getElementById('printBtn')) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'printBtn';
  btn.className = 'topbar-btn';
  btn.title = 'Imprimir / Guardar PDF';
  btn.setAttribute('aria-label', 'Imprimir');
  btn.innerHTML = '<i class="bi bi-printer"></i>';
  btn.addEventListener('click', () => window.print());
  actions.insertBefore(btn, actions.firstChild);
}

/* === ACTIVE TOP NAV === */
function initActiveNav() {
  var path = location.pathname.toLowerCase();
  var section = '';
  if (path.includes('/ensamblaje/')) section = 'ensamblaje';
  else if (path.includes('/mantenimiento/')) section = 'mantenimiento';
  else if (path.includes('/redes/')) section = 'redes';
  else if (path.includes('/herramientas/')) section = 'herramientas';
  else if (path.includes('comandos')) section = 'comandos';
  else if (path.includes('glosario')) section = 'glosario';
  else if (path.includes('recursos')) section = 'recursos';
  if (!section) return;
  document.querySelectorAll('.nav-item a').forEach(a => {
    if (a.getAttribute('href').toLowerCase().includes(section)) a.classList.add('active-link');
  });
}
