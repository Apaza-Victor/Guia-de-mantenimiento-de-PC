/* ============================================================
   TECHGUIDE - charts.js (graficas con Chart.js, aware del tema)
   Requiere Chart.js UMD (chart.umd.min.js) cargado antes.
   ============================================================ */

(function () {
  'use strict';

  var instances = {};

  function cssVar(name, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return v ? v.trim() : fb;
  }

  function readColors() {
    return {
      font: cssVar('--font-main', "'Inter', sans-serif"),
      text: cssVar('--text', '#e4e6ed'),
      textSec: cssVar('--text-sec', '#8b8fa3'),
      grid: cssVar('--border', '#2a2e3a'),
      card: cssVar('--bg-card', '#1a1d27'),
      accent: cssVar('--accent', '#6c63ff'),
      accent2: cssVar('--accent2', '#00d4aa'),
      accent3: cssVar('--accent3', '#ff6b6b'),
      cyan: cssVar('--accent-cyan', '#39d0d8'),
      green: cssVar('--accent-green', '#3fb950'),
      yellow: cssVar('--accent-yellow', '#e3b341'),
      orange: cssVar('--accent-orange', '#f78166'),
      muted: cssVar('--text-muted', '#5a5e72')
    };
  }

  function baseOptions(c) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: c.card,
          borderColor: c.grid,
          borderWidth: 1,
          titleColor: c.text,
          bodyColor: c.text,
          padding: 10,
          displayColors: true
        }
      }
    };
  }

  function make(id, cfg) {
    var canvas = document.getElementById(id);
    if (!canvas) return;
    if (instances[id]) instances[id].destroy();
    instances[id] = new Chart(canvas.getContext('2d'), cfg);
  }

  function valueAxis(c, title, opts) {
    return Object.assign({
      grid: { color: c.grid },
      ticks: { color: c.textSec, font: { family: c.font, size: 11 } },
      title: { display: true, text: title, color: c.textSec, font: { family: c.font, size: 12 } }
    }, opts || {});
  }

  function logBars(id, c, cfg) {
    make(id, {
      type: 'bar',
      data: {
        labels: cfg.labels,
        datasets: [{
          data: cfg.data,
          backgroundColor: cfg.colors || [c.accent],
          borderRadius: 6,
          maxBarThickness: 46
        }]
      },
      options: Object.assign(baseOptions(c), {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return (cfg.fmt ? cfg.fmt(ctx.parsed.x) : ctx.parsed.x) + ' ' + cfg.unit;
              }
            }
          }
        },
        scales: {
          x: Object.assign({ type: 'logarithmic', min: cfg.min, max: cfg.max }, valueAxis(c, cfg.axisTitle)),
          y: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 12 } } }
        }
      })
    });
  }

  function render() {
    if (typeof Chart === 'undefined') return;
    var c = readColors();

    make('chart-bw-gen', {
      type: 'bar',
      data: {
        labels: ['DDR', 'DDR2', 'DDR3', 'DDR4', 'DDR5'],
        datasets: [{
          data: [3.2, 8.5, 17, 25.6, 57.6],
          backgroundColor: [c.muted, c.accent, c.cyan, c.accent2, c.green],
          borderRadius: 6,
          maxBarThickness: 60
        }]
      },
      options: Object.assign(baseOptions(c), {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y + ' GB/s'; }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 11 } } },
          y: Object.assign({ beginAtZero: true }, valueAxis(c, 'GB/s'))
        }
      })
    });

    make('chart-lat-real', {
      type: 'bar',
      data: {
        labels: ['DDR4-3200\nCL16', 'DDR4-3600\nCL18', 'DDR5-4800\nCL40', 'DDR5-6000\nCL30', 'DDR5-7200\nCL34'],
        datasets: [{
          data: [10.0, 10.0, 16.7, 10.0, 9.4],
          backgroundColor: [c.accent, c.accent, c.accent3, c.accent, c.green],
          borderRadius: 6,
          maxBarThickness: 60
        }]
      },
      options: Object.assign(baseOptions(c), {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y + ' ns'; }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 11 } } },
          y: Object.assign({ beginAtZero: true, suggestedMax: 18 }, valueAxis(c, 'ns'))
        }
      })
    });

    make('chart-read-speed', {
      type: 'bar',
      data: {
        labels: ['HDD', 'SSD SATA', 'NVMe PCIe 3.0', 'NVMe PCIe 4.0'],
        datasets: [{
          data: [120, 550, 3500, 7000],
          backgroundColor: [c.orange, c.yellow, c.cyan, c.accent2],
          borderRadius: 6,
          maxBarThickness: 46
        }]
      },
      options: Object.assign(baseOptions(c), {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.x + ' MB/s'; }
            }
          }
        },
        scales: {
          x: Object.assign({ type: 'logarithmic', min: 10, max: 10000 }, valueAxis(c, 'MB/s (escala log)')),
          y: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 12 } } }
        }
      })
    });

    make('chart-ddr-mts', {
      type: 'bar',
      data: {
        labels: ['DDR', 'DDR2', 'DDR3', 'DDR4', 'DDR5'],
        datasets: [{
          data: [400, 1066, 2133, 3200, 7200],
          backgroundColor: [c.muted, c.accent, c.cyan, c.accent2, c.green],
          borderRadius: 6,
          maxBarThickness: 60
        }]
      },
      options: Object.assign(baseOptions(c), {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y.toLocaleString('es') + ' MT/s'; }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 11 } } },
          y: Object.assign({ beginAtZero: true }, valueAxis(c, 'MT/s'))
        }
      })
    });

    logBars('chart-wifi-speeds', c, {
      labels: ['Wi-Fi 1 (802.11b)', 'Wi-Fi 3 (802.11g)', 'Wi-Fi 4 (802.11n)', 'Wi-Fi 5 (802.11ac)', 'Wi-Fi 6/6E (802.11ax)', 'Wi-Fi 7 (802.11be)'],
      data: [11, 54, 600, 6900, 9600, 46000],
      colors: [c.muted, c.accent, c.cyan, c.accent2, c.green, c.orange],
      min: 1, max: 100000, unit: 'Mbps', axisTitle: 'Mbps (escala log)'
    });

    logBars('chart-usb-speeds', c, {
      labels: ['USB 2.0', 'USB 3.0', 'USB 3.1 Gen 2', 'USB 3.2 Gen 2x2', 'USB4', 'Thunderbolt 4'],
      data: [480, 5000, 10000, 20000, 40000, 40000],
      colors: [c.muted, c.accent, c.cyan, c.accent2, c.green, c.green],
      min: 100, max: 100000, unit: 'Mbps', axisTitle: 'Mbps (escala log)'
    });

    logBars('chart-storage-speeds', c, {
      labels: ['HDD (mecanico)', 'SSD SATA 2.5"', 'SSD M.2 SATA', 'SSD M.2 NVMe', 'SSD PCIe 5.0'],
      data: [200, 560, 560, 7000, 14000],
      colors: [c.orange, c.yellow, c.yellow, c.cyan, c.accent2],
      min: 50, max: 20000, unit: 'MB/s', axisTitle: 'MB/s (escala log)'
    });

    logBars('chart-cat-speed', c, {
      labels: ['CAT3', 'CAT5', 'CAT5e', 'CAT6', 'CAT6a', 'CAT7', 'CAT8'],
      data: [10, 100, 1000, 10000, 10000, 10000, 40000],
      colors: [c.muted, c.accent, c.accent, c.cyan, c.accent2, c.green, c.orange],
      min: 1, max: 100000, unit: 'Mbps', axisTitle: 'Mbps (escala log)'
    });

    logBars('chart-eth-speeds', c, {
      labels: ['10BaseT', '100BaseTX', '1000BaseT', '1000BaseTX', '10GBaseT'],
      data: [10, 100, 1000, 1000, 10000],
      colors: [c.muted, c.accent, c.cyan, c.cyan, c.accent2],
      min: 1, max: 100000, unit: 'Mbps', axisTitle: 'Mbps (escala log)'
    });

    make('chart-psu-watts', {
      type: 'bar',
      data: {
        labels: ['PCIe 6-pin', 'PCIe 8-pin', 'EPS 8-pin', 'SATA', 'Molex', 'Berg', '12VHPWR'],
        datasets: [{
          data: [75, 150, 235, 54, 54, 10, 600],
          backgroundColor: [c.accent, c.accent, c.accent, c.accent, c.accent, c.accent, c.accent3],
          borderRadius: 6,
          maxBarThickness: 60
        }]
      },
      options: Object.assign(baseOptions(c), {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return ctx.parsed.y + ' W'; }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 11 } } },
          y: Object.assign({ beginAtZero: true, suggestedMax: 650 }, valueAxis(c, 'W'))
        }
      })
    });

    make('chart-gpu-price', {
      type: 'bar',
      data: {
        labels: ['Entrada', 'Media', 'Media-alta', 'Alta', 'Top'],
        datasets: [{
          data: [[200, 280], [300, 380], [500, 650], [900, 1300], [1600, 2100]],
          backgroundColor: [c.cyan, c.accent2, c.accent, c.orange, c.accent3],
          borderRadius: 6,
          maxBarThickness: 34
        }]
      },
      options: Object.assign(baseOptions(c), {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var min = ctx.parsed._custom && ctx.parsed._custom.barStart;
                var txt = min != null ? '$' + Math.round(min) + ' - ' : '$';
                return txt + '$' + ctx.parsed.x + (ctx.parsed.x >= 1600 ? '+' : '');
              }
            }
          }
        },
        scales: {
          x: Object.assign({ beginAtZero: true, suggestedMax: 2200 }, valueAxis(c, 'USD')),
          y: { grid: { display: false }, ticks: { color: c.textSec, font: { family: c.font, size: 12 } } }
        }
      })
    });
  }

  var lastTheme = document.documentElement.getAttribute('data-theme');
  function checkTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t !== lastTheme) {
      lastTheme = t;
      render();
    }
  }
  new MutationObserver(checkTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  function boot() { render(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
