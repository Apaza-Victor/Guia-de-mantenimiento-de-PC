/* ============================================================
   TECHGUIDE - subnet.js (calculadora de subred)
   ============================================================ */

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
