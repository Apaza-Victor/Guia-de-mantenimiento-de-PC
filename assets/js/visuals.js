/* ============================================================
   TECHGUIDE - visuals.js
   Interactividad de ejemplos visuales SVG (topologias, diagramas).
   Requiere .vis-svg[data-interactive] con nodos <g data-node="id">
   y enlaces con data-edge="nodoA nodoB".
   Al pasar el mouse (o tocar/clickear) un nodo, resalta el nodo
   y sus enlaces, atenuando el resto. Un segundo click desactiva.
   ============================================================ */
(function () {
  'use strict';

  function wireTopology(svg) {
    var nodes = Array.prototype.slice.call(svg.querySelectorAll('[data-node]'));
    var edges = Array.prototype.slice.call(svg.querySelectorAll('[data-edge]'));
    if (!nodes.length) return;

    var active = null;

    function apply(id) {
      nodes.forEach(function (n) {
        var isActive = n.getAttribute('data-node') === id;
        n.classList.toggle('node-hl', isActive);
        n.classList.toggle('node-dim', !!id && !isActive);
      });
      edges.forEach(function (e) {
        var pair = (e.getAttribute('data-edge') || '').split(' ');
        var on = !id || pair.indexOf(id) !== -1;
        e.classList.toggle('edge-hl', !!id && on);
        e.classList.toggle('edge-dim', !!id && !on);
      });
    }

    function onNode(ev) {
      ev.stopPropagation();
      var id = this.getAttribute('data-node');
      active = active === id ? null : id;
      apply(active);
    }

    nodes.forEach(function (n) {
      n.addEventListener('mouseenter', function () {
        active = null;
        apply(n.getAttribute('data-node'));
      });
      n.addEventListener('mouseleave', function () {
        if (!active) apply(null);
      });
      n.addEventListener('click', onNode);
    });

    svg.addEventListener('mouseleave', function () {
      if (!active) apply(null);
    });
    svg.addEventListener('click', function (ev) {
      if (ev.target === svg) {
        active = null;
        apply(null);
      }
    });
  }

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.vis-svg[data-interactive]'),
      wireTopology
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
