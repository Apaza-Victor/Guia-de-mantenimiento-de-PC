/* ============================================================
   TECHGUIDE - search.js (buscador global)
   ============================================================ */

(function () {
  function normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function buildSearchUI() {
    const actions = document.querySelector('.topbar-actions');
    if (!actions || document.getElementById('globalSearchWrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'global-search';
    wrap.id = 'globalSearchWrap';
    wrap.innerHTML = `
      <i class="bi bi-search global-search-icon"></i>
      <input type="text" id="globalSearchInput" class="global-search-input"
        placeholder="Buscar..." autocomplete="off" aria-label="Buscar">
      <button type="button" class="global-search-clear" id="globalSearchClear" title="Limpiar">
        <i class="bi bi-x-circle"></i>
      </button>
      <div class="global-search-results" id="globalSearchResults"></div>`;

    actions.insertBefore(wrap, actions.firstChild);

    const input = wrap.querySelector('#globalSearchInput');
    const results = wrap.querySelector('#globalSearchResults');
    const clear = wrap.querySelector('#globalSearchClear');
    let selected = -1;
    let currentItems = [];

    function close() {
      results.classList.remove('show');
      selected = -1;
    }

    function open() {
      if (currentItems.length > 0) results.classList.add('show');
    }

    function render(items) {
      currentItems = items;
      if (items.length === 0) {
        results.classList.remove('show');
        return;
      }
      results.innerHTML = items.map((it, i) => {
        const h = it.heading ? `<span class="global-search-path">${it.heading}</span>` : '';
        return `<a href="${it.url}" class="global-search-item" data-idx="${i}">
          <i class="bi bi-file-earmark-text"></i>
          <div><div class="global-search-title">${it.title}</div>${h}</div>
        </a>`;
      }).join('');
      results.classList.add('show');
    }

    function run(query) {
      const q = normalize(query.trim());
      if (q.length < 2) { close(); results.innerHTML = ''; currentItems = []; return; }
      const terms = q.split(' ');
      const matches = [];
      const index = window.SEARCH_INDEX || [];
      for (const page of index) {
        const titleN = normalize(page.t);
        const headingHits = (page.h || []).map(h => normalize(h));
        let score = 0;
        let bestHeading = '';
        for (const term of terms) {
          if (titleN.includes(term)) score += 10;
          if ((page.k || []).some(k => normalize(k).includes(term))) score += 3;
          for (const h of headingHits) {
            if (h.includes(term)) {
              if (h.indexOf(term) === 0) score += 5;
              else score += 2;
              if (!bestHeading) bestHeading = page.h[headingHits.indexOf(h)];
            }
          }
        }
        if (score > 0) {
          matches.push({ url: page.u, title: page.t, heading: bestHeading, score });
        }
      }
      matches.sort((a, b) => b.score - a.score);
      render(matches.slice(0, 8));
    }

    input.addEventListener('input', () => {
      run(input.value);
      clear.style.display = input.value ? 'flex' : 'none';
    });

    clear.addEventListener('click', () => {
      input.value = '';
      run('');
      clear.style.display = 'none';
      input.focus();
    });

    input.addEventListener('keydown', (e) => {
      const items = results.querySelectorAll('.global-search-item');
      if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        selected = (selected + 1) % items.length;
        items[selected].classList.add('active');
        items[selected].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        selected = (selected - 1 + items.length) % items.length;
        items[selected].classList.add('active');
        items[selected].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        const active = results.querySelector('.global-search-item.active');
        const target = active || items[0];
        if (target) window.location.href = target.getAttribute('href');
      } else if (e.key === 'Escape') {
        close();
        input.blur();
      }
    });

    results.addEventListener('mousemove', (e) => {
      const item = e.target.closest('.global-search-item');
      if (item) {
        results.querySelectorAll('.global-search-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        selected = parseInt(item.dataset.idx, 10);
      }
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) close();
    });

    window.addEventListener('scroll', close, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', buildSearchUI);
})();
