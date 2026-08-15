/* ============================================================
   TECHGUIDE - mermaid-init.js
   Inicializa Mermaid (cargado como UMD) con los colores del tema
   (claro/oscuro automatico via CSS variables) y lo re-renderiza
   al cambiar de tema. Espera diagramas en <div class="mermaid">.
   ============================================================ */
(function () {
  'use strict';

  function css(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function themeVariables() {
    return {
      background: css('--bg-card', '#1a1d27'),
      mainBkg: css('--bg-card', '#1a1d27'),
      nodeBkg: css('--bg-card', '#1a1d27'),
      nodeBorder: css('--border-hover', '#3d4255'),
      clusterBkg: css('--bg-body', '#0f1117'),
      clusterBorder: css('--border', '#2a2e3a'),
      primaryColor: css('--bg-card', '#1a1d27'),
      primaryTextColor: css('--text', '#e4e6ed'),
      primaryBorderColor: css('--border-hover', '#3d4255'),
      lineColor: css('--accent-cyan', '#39d0d8'),
      textColor: css('--text', '#e4e6ed'),
      nodeTextColor: css('--text', '#e4e6ed'),
      edgeLabelBackground: css('--bg-card', '#1a1d27'),
      edgeLabelTextColor: css('--text-sec', '#8b8fa3'),
      actorBkg: css('--bg-card', '#1a1d27'),
      actorBorder: css('--accent-cyan', '#39d0d8'),
      actorTextColor: css('--text', '#e4e6ed'),
      actorLineColor: css('--accent-cyan', '#39d0d8'),
      signalColor: css('--accent-cyan', '#39d0d8'),
      signalTextColor: css('--text', '#e4e6ed'),
      labelBoxBkgColor: css('--bg-card', '#1a1d27'),
      labelBoxBorderColor: css('--border-hover', '#3d4255'),
      labelTextColor: css('--text', '#e4e6ed'),
      noteBkgColor: 'rgba(227,179,65,.12)',
      noteBorderColor: css('--accent-yellow', '#e3b341'),
      noteTextColor: css('--text', '#e4e6ed'),
      activationBkgColor: 'rgba(57,208,216,.12)',
      activationBorderColor: css('--accent-cyan', '#39d0d8'),
      sequenceNumberColor: css('--text-muted', '#5a5e72'),
      fontSize: '13px',
      fontFamily: css('--font-main', 'Inter, sans-serif')
    };
  }

  var sources = new WeakMap();

  function renderAll() {
    if (!window.mermaid) return;
    var diagrams = Array.prototype.slice.call(document.querySelectorAll('div.mermaid'));
    if (!diagrams.length) return;
    diagrams.forEach(function (el) {
      if (!sources.has(el)) sources.set(el, el.textContent);
      el.textContent = sources.get(el);
    });
    window.mermaid.run({ nodes: diagrams }).catch(function (e) {
      console.warn('TechGuide mermaid: fallo al renderizar', e);
    });
  }

  function boot() {
    if (!window.mermaid) return;
    window.mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: themeVariables(),
      flowchart: { curve: 'linear', htmlLabels: true, useMaxWidth: true },
      sequence: { useMaxWidth: true, mirrorActors: false, actorMargin: 28, messageMargin: 30 }
    });
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderAll);
    } else {
      renderAll();
    }
    if ('MutationObserver' in window) {
      new MutationObserver(renderAll).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
