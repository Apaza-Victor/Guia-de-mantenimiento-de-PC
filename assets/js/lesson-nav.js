/* ============================================================
   TECHGUIDE - lesson-nav.js (navegacion prev/next de lecciones)
   Inserta enlaces Anterior / Siguiente al pie de cada leccion,
   siguiendo el orden de la navegacion de cada seccion (subnav).
   No se dibuja en hubs ni en paginas raiz.
   ============================================================ */

(function () {
  var SECTIONS = {
    'ensamblaje': [
      ['ens-herramientas.html', 'Herramientas'],
      ['ens-componentes.html', 'Componentes de una PC'],
      ['ens-elegir-psu.html', 'Elegir la fuente correcta'],
      ['ens-almacenamiento.html', 'Almacenamiento y discos'],
      ['ens-tipos.html', 'Tipos de PC'],
      ['ens-simbolos-unidades.html', 'Simbolos y unidades'],
      ['placa-base.html', 'Placa base paso a paso'],
      ['ens-paso-a-paso.html', 'Ensamblado paso a paso'],
      ['ens-cableado.html', 'Cableado y conexiones'],
      ['ens-checklist.html', 'Checklist de ensamblado'],
      ['ens-primer-encendido.html', 'Primer encendido'],
      ['ens-instalacion-detallada.html', 'Instalacion detallada'],
      ['ens-instalacion-so.html', 'Sistema operativo'],
      ['ens-electronica-gabinete.html', 'Electronica del gabinete'],
      ['ens-guia-puertos.html', 'Guia de puertos'],
      ['ens-gabinete.html', 'Gabinete y refrigeracion'],
      ['ens-atajos-bios.html', 'Atajos de BIOS'],
      ['ens-bios-update.html', 'Actualizar BIOS'],
      ['ens-conceptos-clave.html', 'Conceptos clave'],
      ['ens-overclocking.html', 'Overclocking'],
      ['ens-refrigeracion-liquida.html', 'Refrigeracion liquida'],
      ['ens-upgrade.html', 'Upgrade de componentes'],
      ['ens-upgrade-laptop.html', 'Upgrade de laptop'],
      ['ens-guia-compra.html', 'Guia de compra'],
      ['ens-cable-management.html', 'Cable management']
    ],
    'mantenimiento': [
      ['man-preventivo.html', 'Mantenimiento preventivo'],
      ['man-correctivo.html', 'Mantenimiento correctivo'],
      ['man-software-diag.html', 'Software de diagnostico'],
      ['man-seguridad-malware.html', 'Seguridad y malware'],
      ['man-kit-tecnico.html', 'Kit del tecnico'],
      ['man-pasta-termica.html', 'Pasta termica'],
      ['man-gestion-termica.html', 'Gestion termica'],
      ['man-laptop.html', 'Mantenimiento de laptop'],
      ['man-diagnostico-sintomas.html', 'Diagnostico por sintomas'],
      ['man-conceptos-clave.html', 'Conceptos clave'],
      ['man-cables-alimentacion.html', 'Cables de alimentacion'],
      ['man-headers-motherboard.html', 'Headers de placa base'],
      ['man-optimizacion.html', 'Optimizacion del sistema'],
      ['man-borrado-seguro.html', 'Borrado seguro'],
      ['man-recuperacion-datos.html', 'Recuperacion de datos'],
      ['man-banco-pruebas-psu.html', 'Banco de pruebas PSU'],
      ['man-plan-respaldo.html', 'Plan de respaldo'],
      ['man-plan-mantenimiento.html', 'Plan de mantenimiento'],
      ['man-impresoras.html', 'Impresoras'],
      ['man-formatear-pc.html', 'Formatear la PC']
    ],
    'redes': [
      ['red-tcp-osi.html', 'Modelos TCP/IP y OSI'],
      ['red-topologias.html', 'Topologias de red'],
      ['red-dispositivos-red.html', 'Dispositivos de red'],
      ['red-ip-address.html', 'Direccionamiento IP'],
      ['red-ipv6.html', 'IPv4 e IPv6'],
      ['red-dns.html', 'DNS'],
      ['red-dhcp.html', 'DHCP'],
      ['red-routing.html', 'Enrutamiento'],
      ['red-so-red.html', 'Sistemas operativos de red'],
      ['red-componentes-red.html', 'Componentes de red'],
      ['red-medios-transmision.html', 'Medios de transmision'],
      ['red-cables-conectores.html', 'Cables y conectores'],
      ['red-wifi.html', 'Redes inalambricas'],
      ['red-arquitectura-red.html', 'Arquitectura de red'],
      ['red-router-practico.html', 'Router practico'],
      ['red-nat.html', 'NAT y Port Forwarding'],
      ['red-troubleshooting.html', 'Troubleshooting'],
      ['red-monitoreo.html', 'Monitoreo de red'],
      ['red-vlan.html', 'VLAN'],
      ['red-switch.html', 'Switches'],
      ['red-seguridad-redes.html', 'Seguridad en redes'],
      ['red-vpn.html', 'VPN'],
      ['red-laboratorio.html', 'Laboratorio de redes']
    ],
    'herramientas': [
      ['faq.html', 'Preguntas frecuentes'],
      ['comparativas.html', 'Comparativas'],
      ['cuestionarios.html', 'Cuestionarios'],
      ['presupuesto.html', 'Presupuesto'],
      ['referencia.html', 'Referencia rapida'],
      ['instalacion.html', 'Guia de instalacion'],
      ['memoria-ram.html', 'Memoria RAM']
    ]
  };

  var dirs = {
    'pages/ensamblaje/': 'ensamblaje',
    'pages/mantenimiento/': 'mantenimiento',
    'pages/redes/': 'redes',
    'pages/herramientas/': 'herramientas'
  };

  function init() {
    var path = location.pathname;
    var file = path.split('/').pop();
    var dir = path.slice(0, path.lastIndexOf('/') + 1);
    var section = dirs[dir];
    if (!section) return;

    var list = SECTIONS[section];
    if (!list) return;

    var i = -1;
    for (var n = 0; n < list.length; n++) {
      if (list[n][0] === file) { i = n; break; }
    }
    if (i < 0) return;

    var prev = i > 0 ? list[i - 1] : null;
    var next = i < list.length - 1 ? list[i + 1] : null;

    var nav = document.createElement('nav');
    nav.className = 'lesson-nav';
    nav.setAttribute('aria-label', 'Navegacion de la leccion');

    function card(dirName, title, label, cls) {
      var a = document.createElement('a');
      a.href = dirName;
      a.className = 'lesson-nav-card ' + cls;
      a.innerHTML =
        '<span class="lesson-nav-label"><i class="bi bi-arrow-' + (cls.indexOf('prev') >= 0 ? 'left' : 'right') + '"></i> ' + label + '</span>' +
        '<span class="lesson-nav-title">' + title + '</span>';
      return a;
    }

    var cells = [];
    if (prev) cells.push(card(prev[0], prev[1], 'Anterior', 'lesson-nav-prev'));
    else cells.push('<span class="lesson-nav-empty"></span>');

    if (next) cells.push(card(next[0], next[1], 'Siguiente', 'lesson-nav-next'));
    else cells.push('<span class="lesson-nav-empty"></span>');

    cells.forEach(function (c) {
      if (typeof c === 'string') nav.insertAdjacentHTML('beforeend', c);
      else nav.appendChild(c);
    });

    var footer = document.querySelector('.footer');
    var anchor = footer || document.body.lastChild;
    if (footer) footer.parentNode.insertBefore(nav, footer);
    else document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();