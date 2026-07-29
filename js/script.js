/* ============================================================
   TECHGUIDE - JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initAccordions();
  initChecklist();
  initSteps();
  initBackToTop();
  initScrollSpy();
  initNetPills();
  initCodeCopy();
  initSearch();
  AOS.init({ duration: 600, once: true, offset: 60 });
});

/* === THEME TOGGLE === */
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

/* === NAV (hamburger + mobile dropdown + desktop hover) === */
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

/* === ACCORDIONS === */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    if (header.hasAttribute('onclick')) return;
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const wasOpen = item.classList.contains('open');
      item.classList.toggle('open');
      if (!wasOpen) {
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + 'px';
      } else {
        item.querySelector('.accordion-body').style.maxHeight = '0';
      }
    });
  });
}

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
    document.querySelectorAll('.accordion-item, .comp-card, .tool-card, .device-card, .topo-card, .rec-card, .shortcut-item').forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = (q === '' || text.includes(q)) ? '' : 'none';
    });
  });
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
  const wasOpen = item.classList.contains('open');
  item.classList.toggle('open');
  const body = item.querySelector('.accordion-body');
  if (!wasOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
  } else {
    body.style.maxHeight = '0';
  }
}

/* === TOGGLE ITEM (inline onclick for accordion headers) === */
function toggleItem(header) {
  const item = header.closest('.accordion-item') || header.parentElement;
  if (!item) return;
  const wasOpen = item.classList.contains('open');
  item.classList.toggle('open');
  const body = item.querySelector('.accordion-body');
  if (body) {
    body.style.maxHeight = wasOpen ? '0' : body.scrollHeight + 'px';
  }
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

/* === SUBNET CALCULATOR === */
function calcSubnet() {
  const ipInput = document.getElementById('subnet-ip');
  const cidrInput = document.getElementById('subnet-cidr');
  if (!ipInput || !cidrInput) return;
  const ip = ipInput.value.trim();
  const cidr = parseInt(cidrInput.value, 10);
  if (!ip || isNaN(cidr) || cidr < 1 || cidr > 32) return;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return;
  const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const netAddr = (ipNum & mask) >>> 0;
  const broadcast = (netAddr | (~mask >>> 0)) >>> 0;
  const firstHost = cidr >= 31 ? netAddr : (netAddr + 1) >>> 0;
  const lastHost = cidr >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const hosts = cidr >= 31 ? (cidr === 32 ? 1 : 2) : Math.pow(2, 32 - cidr) - 2;
  function toDot(n) {
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  function toMask(c) {
    return toDot(c === 0 ? 0 : (~0 << (32 - c)) >>> 0);
  }
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('sr-net', toDot(netAddr));
  set('sr-mask', toMask(cidr));
  set('sr-first', toDot(firstHost));
  set('sr-last', toDot(lastHost));
  set('sr-bc', toDot(broadcast));
  set('sr-hosts', hosts.toLocaleString());
}
