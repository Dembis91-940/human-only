// Vérification rapide : débordement horizontal des petites pages (popup + test-page).
// Usage : node dev/check_overflow_small.mjs <baseUrl> <page...>
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const base = process.argv[2] || 'http://localhost:8137';
const pages = process.argv.slice(3);
const port = 9900 + (process.pid % 50);

function findShell() {
  const cache = path.join(os.homedir(), 'Library/Caches/ms-playwright');
  if (!fs.existsSync(cache)) return null;
  for (const d of fs.readdirSync(cache)) {
    if (!d.startsWith('chromium_headless_shell-')) continue;
    const p = path.join(cache, d, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
    if (fs.existsSync(p)) return p;
  }
  return null;
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const shell = findShell();
  if (!shell) { console.error('shell introuvable'); process.exit(2); }
  const chrome = spawn(shell, [`--remote-debugging-port=${port}`, '--headless', '--disable-gpu', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/list`); targets = await r.json(); if (targets.length) break; } catch (e) {}
    await sleep(250);
  }
  if (!targets || !targets.length) { console.error('CDP KO'); chrome.kill(); process.exit(2); }
  const ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const pending = {};
  const send = (method, params = {}) => new Promise(res => { const mid = ++id; pending[mid] = res; ws.send(JSON.stringify({ id: mid, method, params })); });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const evalJs = async expr => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result.result.value; };
  const waitFor = async (expr, t = 6000) => { const t0 = Date.now(); while (Date.now() - t0 < t) { try { if (await evalJs(expr)) return true; } catch (e) {} await sleep(120); } return false; };

  await send('Page.enable'); await send('Runtime.enable');
  let failed = 0;
  for (const page of pages) {
    for (const [label, w] of [['desktop', 1440], ['mobile', 390]]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: label === 'mobile' });
      await send('Page.navigate', { url: base + '/' + page });
      if (!(await waitFor(`document.body && document.body.children.length > 0`))) { console.log(`${page} [${label}] chargement KO`); failed++; continue; }
      await sleep(400);
      const r = await evalJs(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`);
      const ok = r.sw <= r.cw + 1;
      console.log(`${page} [${label}] scrollWidth=${r.sw} clientWidth=${r.cw} → ${ok ? 'OK' : 'DÉBORDEMENT'}`);
      if (!ok) failed++;
    }
  }
  chrome.kill();
  console.log(failed ? `== ${failed} débordement(s) ==` : '== TOUT OK ==');
  process.exit(failed ? 1 : 0);
})();
