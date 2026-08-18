/**
 * popup.js — Human Only v0.1.0
 * Réglages de l'extension (activation + sensibilité), stockés dans
 * chrome.storage.local. Le content-script écoute les changements
 * (storage.onChanged) et s'adapte sans rechargement de page.
 */
(function () {
  'use strict';

  var enabled = document.getElementById('ho-enabled');
  var level = document.getElementById('ho-level');
  var status = document.getElementById('ho-status');

  function apply(o) {
    o = o || {};
    enabled.checked = o.hoEnabled !== false;
    level.value = o.hoMinLevel || 'modere';
    renderStatus();
  }

  function renderStatus() {
    status.innerHTML = enabled.checked
      ? 'Détection active — <b>100&nbsp;% local</b>'
      : 'Détection en pause';
  }

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['hoEnabled', 'hoMinLevel'], apply);

    enabled.addEventListener('change', function () {
      chrome.storage.local.set({ hoEnabled: enabled.checked });
      renderStatus();
    });

    level.addEventListener('change', function () {
      chrome.storage.local.set({ hoMinLevel: level.value });
    });
  } else {
    apply({});
  }
})();
