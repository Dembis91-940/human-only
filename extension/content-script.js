/**
 * content-script.js — Human Only v0.1.0
 * ─────────────────────────────────────────────────────────────
 * Injecte des badges discrets sur les blocs de texte probablement
 * générés par IA. La détection elle-même vit dans analyzer-core.js
 * (chargé avant ce fichier dans manifest.json).
 *
 * Principes :
 *   • 100 % local — aucun texte n'est envoyé à un serveur.
 *   • Discret — un petit badge en haut à droite du bloc analysé.
 *   • Réversible — clic sur le badge pour masquer le contenu ou
 *     tout le site ; l'icône de l'extension règle la sensibilité.
 *   • Honnête — le badge affiche un indice heuristique, jamais
 *     une certitude.
 */
(function () {
  'use strict';
  if (window.__humanOnlyLoaded) return;
  window.__humanOnlyLoaded = true;

  var analyzer = window.HumanOnlyAnalyzer;
  if (!analyzer || typeof analyzer.analyze !== 'function') return;

  var MIN_LEN = 300;        // en dessous, texte trop court pour une estimation honnête
  var MAX_LEN = 30000;
  var MAX_BADGES = 120;     // garde-fou de performance par page
  var BATCH = 200;          // éléments analysés par frame
  var HOST_CLASS = 'ho-host';

  var settings = { enabled: true, minLevel: 'modere' };
  var dismissed = {};       // domaine -> timestamp (masqué par l'utilisateur)
  var processed = new WeakSet();
  var badged = new WeakSet();
  var queue = [];
  var running = false;
  var badgeCount = 0;
  var scheduled = false;

  function getDomain() {
    try { return location.hostname || 'local'; } catch (e) { return 'local'; }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Stockage (chrome.storage si dispo, mémoire sinon) ─────────── */
  function loadSettings(cb) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['hoEnabled', 'hoMinLevel', 'hoDismissed'], function (o) {
        o = o || {};
        if (typeof o.hoEnabled === 'boolean') settings.enabled = o.hoEnabled;
        if (o.hoMinLevel) settings.minLevel = o.hoMinLevel;
        if (o.hoDismissed) dismissed = o.hoDismissed;
        cb();
      });
    } else {
      cb();
    }
  }

  function saveDismissed() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ hoDismissed: dismissed });
    }
  }

  /* ── Collecte des candidats ────────────────────────────────────── */
  function ownText(el) {
    var s = '';
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3) s += n.nodeValue; // TEXT_NODE
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  function isSkippable(el) {
    if (el.closest('script, style, noscript, pre, code, textarea, input, select, svg, canvas, template, iframe')) return true;
    if (el.isContentEditable) return true;
    if (el.closest('.' + HOST_CLASS)) return true;
    if (el.getAttribute('aria-hidden') === 'true') return true;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    if (parseFloat(cs.fontSize) < 10) return true;
    var r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 16) return true;
    return false;
  }

  function linkRatio(el) {
    var total = (el.textContent || '').length;
    if (!total) return 1;
    var links = 0;
    var as = el.querySelectorAll('a');
    for (var i = 0; i < as.length; i++) links += (as[i].textContent || '').length;
    return links / total;
  }

  function depthOf(el) {
    var d = 0;
    while (el && el.parentElement && el.parentElement !== document.body) { d++; el = el.parentElement; }
    return d;
  }

  function scan() {
    if (!settings.enabled || badgeCount >= MAX_BADGES) return;
    if (dismissed[getDomain()]) return;
    var els = document.querySelectorAll('article, section, div, li, blockquote, td, p');
    var candidates = [];
    for (var i = 0; i < els.length && candidates.length < 400; i++) {
      var el = els[i];
      if (processed.has(el) || badged.has(el)) continue;
      if (isSkippable(el)) { processed.add(el); continue; }
      var t = ownText(el);
      if (t.length < MIN_LEN || t.length > MAX_LEN) continue;
      if (linkRatio(el) > 0.6) continue;
      processed.add(el);
      candidates.push({ el: el, len: t.length, text: t });
    }
    candidates.sort(function (a, b) { return depthOf(b.el) - depthOf(a.el); }); // profondeur d'abord
    queue = queue.concat(candidates);
    if (!running) { running = true; drain(); }
  }

  /* ── Ancrage : remonte vers le conteneur le plus « serré » ─────── */
  function anchorFor(el, ownLen) {
    var cur = el;
    var curText = ownLen;
    while (cur.parentElement && cur.parentElement !== document.body && cur.parentElement !== document.documentElement) {
      var p = cur.parentElement;
      var pt = (p.textContent || '').replace(/\s+/g, ' ').trim().length;
      if (pt > MAX_LEN || pt < MIN_LEN) break;
      if (pt < curText * 0.7) break;
      var kids = 0;
      var ch = p.children;
      for (var i = 0; i < ch.length; i++) {
        if ((ch[i].textContent || '').trim().length > 40) kids++;
      }
      if (kids > 20) break;
      cur = p;
      curText = pt;
    }
    return cur;
  }

  var LEVEL_ORDER = { faible: 0, modere: 1, eleve: 2 };

  function levelAtLeast(lvl, min) {
    return (LEVEL_ORDER[lvl] || 0) >= (LEVEL_ORDER[min] || 0);
  }

  function drain() {
    if (!queue.length || badgeCount >= MAX_BADGES) { running = false; return; }
    var slice = queue.splice(0, BATCH);
    for (var i = 0; i < slice.length; i++) {
      if (badgeCount >= MAX_BADGES) break;
      var c = slice[i];
      if (badged.has(c.el)) continue;
      var res = analyzer.analyze(c.text);
      if (!res || res.level === 'humain') continue;
      if (!levelAtLeast(res.level, settings.minLevel)) continue;
      var a = anchorFor(c.el, c.len);
      if (badged.has(a)) continue;
      if (a.closest && a.closest('.' + HOST_CLASS)) continue;
      badged.add(a);
      badge(a, res);
      badgeCount++;
    }
    requestAnimationFrame(drain);
  }

  /* ── Badge (shadow DOM = isolation stylistique totale) ─────────── */
  var LEVEL_COLOR = { faible: '#6ee7b7', modere: '#38bdf8', eleve: '#f59e0b' };

  function badge(anchor, res) {
    var host = document.createElement('div');
    host.className = HOST_CLASS;
    if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';
    host.style.cssText =
      'position:absolute;top:6px;right:6px;z-index:2147483000;line-height:1;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;';
    var root = host.attachShadow({ mode: 'open' });
    root.innerHTML = renderBadge(res);
    bindBadge(root, host, anchor, res);
    anchor.appendChild(host);
  }

  function renderBadge(res) {
    var c = LEVEL_COLOR[res.level] || '#38bdf8';
    var signals = (res.signals || []).slice(0, 4).map(function (s) {
      return '<li>' + esc(s.label) + '</li>';
    }).join('');
    return '' +
      '<style>' +
        '.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;' +
          'background:rgba(255,255,255,.97);border:1px solid ' + c + ';color:#0f172a;' +
          'font:600 11px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
          'cursor:pointer;box-shadow:0 1px 6px rgba(15,23,42,.14);user-select:none;' +
          'transition:box-shadow .15s ease;}' +
        '.chip:hover{box-shadow:0 2px 10px rgba(15,23,42,.22)}' +
        '.dot{width:7px;height:7px;border-radius:50%;background:' + c + ';flex:none}' +
        '.card{display:none;position:absolute;top:calc(100% + 6px);right:0;width:264px;background:#fff;' +
          'border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.18);' +
          'padding:12px;font:400 11.5px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
          'color:#334155;z-index:2147483001;text-align:left;}' +
        '.card.open{display:block}' +
        '.card h4{margin:0 0 6px;font-size:12px;color:#0f172a}' +
        '.card ul{margin:0 0 8px;padding-left:16px}' +
        '.card .sig{color:#0f172a;font-weight:600}' +
        '.card .note{font-size:10.5px;color:#64748b;border-top:1px dashed #e2e8f0;padding-top:8px;margin-top:8px}' +
        '.card .btns{display:flex;gap:6px;margin-top:8px}' +
        '.card button{flex:1;border:1px solid #cbd5e1;background:#fff;color:#0f172a;border-radius:8px;' +
          'padding:5px 6px;font:600 10.5px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
          'cursor:pointer}' +
        '.card button:hover{background:#f1f5f9}' +
      '</style>' +
      '<div class="chip" role="button" tabindex="0" aria-haspopup="true" title="Human Only — estimation heuristique">' +
        '<span class="dot"></span><span>✦ IA probable</span>' +
      '</div>' +
      '<div class="card" role="dialog" aria-label="Détails de la détection">' +
        '<h4>' + esc(res.label) + '</h4>' +
        '<div>Indice heuristique&nbsp;: <span class="sig">' + res.score + '/100</span> — estimation, pas une certitude.</div>' +
        (signals ? '<ul>' + signals + '</ul>' : '') +
        '<div class="btns">' +
          '<button data-act="hide-one">Masquer ce contenu</button>' +
          '<button data-act="hide-site">Masquer sur ce site</button>' +
        '</div>' +
        '<div class="note">Détection 100&nbsp;% locale — rien n’est envoyé. Human&nbsp;Only peut se tromper : vous gardez toujours le dernier mot.</div>' +
      '</div>';
  }

  function closeAllCards() {
    var hosts = document.querySelectorAll('.' + HOST_CLASS);
    for (var i = 0; i < hosts.length; i++) {
      var card = hosts[i].shadowRoot && hosts[i].shadowRoot.querySelector('.card');
      if (card) card.classList.remove('open');
    }
  }

  function bindBadge(root, host, anchor, res) {
    var chip = root.querySelector('.chip');
    var card = root.querySelector('.card');
    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAllCards();
      card.classList.toggle('open');
    });
    chip.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
    });
    card.addEventListener('click', function (e) { e.stopPropagation(); });
    root.querySelector('[data-act="hide-one"]').addEventListener('click', function () {
      host.remove();
    });
    root.querySelector('[data-act="hide-site"]').addEventListener('click', function () {
      dismissed[getDomain()] = Date.now();
      saveDismissed();
      var hosts = document.querySelectorAll('.' + HOST_CLASS);
      for (var i = 0; i < hosts.length; i++) hosts[i].remove();
    });
  }

  document.addEventListener('click', closeAllCards);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAllCards(); });

  /* ── Réaction aux contenus dynamiques (fils infinis, SPA) ──────── */
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      scan();
    }, 900);
  }

  /* ── Démarrage ─────────────────────────────────────────────────── */
  function start() {
    if (!document.body) { requestAnimationFrame(start); return; }
    scan();
    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(schedule);
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  loadSettings(function () {
    start();
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area !== 'local') return;
        if (changes.hoEnabled) settings.enabled = changes.hoEnabled.newValue;
        if (changes.hoMinLevel) settings.minLevel = changes.hoMinLevel.newValue;
        if (changes.hoDismissed) dismissed = changes.hoDismissed.newValue || {};
      });
    }
  });
})();
