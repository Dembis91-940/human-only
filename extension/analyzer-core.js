/**
 * analyzer-core.js — Human Only v0.1.0
 * ─────────────────────────────────────────────────────────────
 * Cœur de détection heuristique. Fichier PARTAGÉ entre :
 *   • l'extension navigateur (content-script.js le charge en premier)
 *   • la démo de la page d'accueil (index.html le référence)
 *
 * 100 % local : aucun texte n'est envoyé ni stocké hors du navigateur.
 *
 * Ce module évalue des SIGNAUX LINGUISTIQUES (tournures types des
 * textes générés par IA, répétitions, structure homogène) et produit
 * un « indice » heuristique de 0 à 100. Ce n'est PAS une certitude :
 * un humain peut écrire comme une IA, et inversement. C'est un
 * premier filtre, pas un verdict.
 *
 * API exposée :
 *   window.HumanOnlyAnalyzer   (navigateur)
 *   module.exports             (Node.js — tests dans dev/)
 */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.HumanOnlyAnalyzer = api;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  /* ── Signaux lexicaux : tournures et expressions types ─────────── */
  var PHRASES = [
    /* Français — auto-désignation */
    { re: /en tant qu['’]?(assistant|ia|intelligence artificielle|modèle de langage|outil d['’]ia)/i, label: 'Auto-désignation « en tant qu’IA »', w: 2 },
    { re: /je suis (une|un) (ia|intelligence artificielle|modèle de langage)/i, label: 'Auto-désignation « je suis une IA »', w: 2 },
    { re: /je suis là pour (vous|t['’])aider/i, label: '« Je suis là pour vous aider »', w: 1 },
    /* Français — tournures de synthèse */
    { re: /il (est|serait) important de (noter|souligner|préciser)/i, label: '« Il est important de noter »', w: 1 },
    { re: /il convient de noter/i, label: '« Il convient de noter »', w: 1 },
    { re: /il est à noter que/i, label: '« Il est à noter que »', w: 1 },
    { re: /il est (essentiel|primordial|crucial|fondamental) de/i, label: '« Il est essentiel de »', w: 1 },
    { re: /n['’]hésitez pas à/i, label: 'Invitation « n’hésitez pas à »', w: 1 },
    { re: /n['’]oubliez pas de/i, label: '« N’oubliez pas de »', w: 1 },
    { re: /(en résumé|pour résumer|en bref|en conclusion|pour conclure)/i, label: 'Marqueur de synthèse', w: 1 },
    { re: /voici (quelques|les étapes|un guide|comment|les points|une liste)/i, label: '« Voici quelques… » (énumération)', w: 1 },
    { re: /(les points clés|principaux points à retenir)/i, label: '« Points clés »', w: 1 },
    { re: /comme (je l['’]ai )?(mentionné|dit) précédemment/i, label: '« Comme mentionné précédemment »', w: 1 },
    { re: /pour (aller plus loin|faire simple|récapituler|finir)/i, label: 'Formule de transition', w: 1 },
    { re: /si vous avez des questions/i, label: 'Formule de clôture', w: 1 },
    { re: /en fin de compte/i, label: '« En fin de compte »', w: 1 },
    { re: /en d['’]autres termes/i, label: '« En d’autres termes »', w: 1 },
    { re: /d['’]une part[^.]{0,120}d['’]autre part/i, label: 'Structure « d’une part… d’autre part »', w: 1 },
    /* Français — clichés */
    { re: /dans le monde (numérique|d['’]aujourd['’]hui|moderne|actuel)/i, label: 'Cliché « dans le monde numérique »', w: 1 },
    { re: /à l['’]ère du numérique/i, label: 'Cliché « à l’ère du numérique »', w: 1 },
    { re: /dans un monde en constante évolution/i, label: 'Cliché « monde en constante évolution »', w: 1 },
    { re: /aujourd['’]hui, plus que jamais/i, label: 'Cliché « aujourd’hui plus que jamais »', w: 1 },
    { re: /au fil (des années|du temps)/i, label: 'Cliché « au fil des années »', w: 1 },
    { re: /sans aucun doute/i, label: '« Sans aucun doute »', w: 1 },
    { re: /de nos jours/i, label: '« De nos jours »', w: 1 },
    { re: /gardez à l['’]esprit/i, label: '« Gardez à l’esprit »', w: 1 },
    { re: /il faut (savoir|comprendre|noter) que/i, label: '« Il faut savoir que »', w: 1 },
    { re: /(cependant|néanmoins), il est/i, label: 'Opposition stéréotypée', w: 1 },
    { re: /(essentiel|crucial|primordial|incontestablement|indéniablement|révolutionnaire|inédit)/i, label: 'Vocabulaire superlatif récurrent', w: 1 },
    /* Anglais — auto-désignation et tournures */
    { re: /as (an|a) (ai|language model|llm)/i, label: '« As an AI »', w: 2 },
    { re: /i am an (ai|artificial intelligence|llm)/i, label: '« I am an AI »', w: 2 },
    { re: /in today['’]?s (digital|fast-paced|modern) world/i, label: 'Cliché « in today’s digital world »', w: 1 },
    { re: /it('|i)s important to note/i, label: '« It’s important to note »', w: 1 },
    { re: /it (is|'s) worth noting/i, label: '« It is worth noting »', w: 1 },
    { re: /(in conclusion|to summarize|in summary|to sum up)/i, label: 'Marqueur de synthèse (EN)', w: 1 },
    { re: /delve into/i, label: '« Delve into »', w: 1 },
    { re: /in this article/i, label: '« In this article »', w: 1 },
    { re: /here (are|is) (some|the|a)/i, label: '« Here are some… »', w: 1 },
    { re: /key takeaways/i, label: '« Key takeaways »', w: 1 },
    { re: /embark on/i, label: '« Embark on »', w: 1 },
    { re: /unlock the potential/i, label: '« Unlock the potential »', w: 1 },
    { re: /navigate the complexities/i, label: '« Navigate the complexities »', w: 1 },
    { re: /(keep|bear) in mind/i, label: '« Keep in mind »', w: 1 },
    { re: /feel free to/i, label: '« Feel free to »', w: 1 },
    { re: /let['’]?s dive in/i, label: '« Let’s dive in »', w: 1 },
    { re: /(seamless|foster|leverage|moreover|furthermore|landscape)/i, label: 'Vocabulaire « corporate » récurrent (EN)', w: 1 },
  ];

  /* ── Marqueurs humains : soustraient des points ────────────────── */
  var HUMAN_MARKERS = [
    /je (pense|trouve|crois|me souviens|me dis|me rappelle)/i,
    /à mon avis/i,
    /franchement|honnêtement/i,
    /l['’]autre jour|la semaine dernière|hier,? je/i,
    /mon collègue|ma collègue|notre équipe|chez nous/i,
    /je vais vous raconter|je vous raconte/i,
    /je me suis dit/i,
    /en fait,? je/i,
    /perso(nallement)?,?/i,
  ];

  function normalize(t) {
    return t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function sentences(t) {
    return t.replace(/([.!?…]+)\s+/g, '$1\n').split('\n').map(function (s) { return s.trim(); }).filter(function (s) { return s.length >= 12; });
  }

  /* Points de répétition / structure (plafonnés à 5) */
  function repetitionPoints(text) {
    var pts = 0;
    var norm = normalize(text);
    var toks = norm.split(' ').filter(function (t) { return t.length > 2; });
    if (toks.length > 9) {
      var freq = {};
      for (var i = 0; i + 2 < toks.length; i++) {
        var key = toks[i] + ' ' + toks[i + 1] + ' ' + toks[i + 2];
        freq[key] = (freq[key] || 0) + 1;
      }
      var repeated = 0;
      for (var k in freq) { if (freq[k] >= 2) repeated++; }
      if (repeated >= 4) pts += 2;
      else if (repeated >= 2) pts += 1;
    }
    var sents = sentences(text);
    var seen = {};
    var dup = false;
    for (var j = 0; j < sents.length; j++) {
      var key2 = normalize(sents[j]);
      if (key2.length < 12) continue;
      if (seen[key2]) { dup = true; break; }
      seen[key2] = true;
    }
    if (dup) pts += 2;
    var openers = {};
    for (var s = 0; s < sents.length; s++) {
      var w = normalize(sents[s]).split(' ').slice(0, 3).join(' ');
      if (w.split(' ').length >= 3) openers[w] = (openers[w] || 0) + 1;
    }
    for (var o in openers) { if (openers[o] >= 3) { pts += 1; break; } }
    var lines = text.split('\n');
    var bullets = lines.filter(function (l) { return /^\s*([•▪◦-]|\d+[.)])\s+/.test(l); }).length;
    if (bullets >= 6 && bullets / lines.length >= 0.55) pts += 1;
    var dashes = (text.match(/—/g) || []).length;
    if (dashes >= 4 * (text.length / 1000)) pts += 1;
    return Math.min(pts, 5);
  }

  function countMatches(re, text) {
    var n = 0;
    var m;
    var r = new RegExp(re.source, re.flags.indexOf('g') === -1 ? re.flags + 'g' : re.flags);
    while ((m = r.exec(text)) !== null) { n++; if (n >= 4) break; }
    return n;
  }

  /**
   * analyze(text) → { score, level, label, signals, stats }
   *   level : 'humain' | 'faible' | 'modere' | 'eleve'
   *   score : indice heuristique 0–100 (estimation, pas une probabilité)
   *   signals : [{ label, weight }] — signaux effectivement détectés
   */
  function analyze(text) {
    var stats = { chars: 0, phraseHits: 0, repetition: 0, humanMarkers: 0 };
    if (typeof text !== 'string') { text = ''; }
    text = text.replace(/\s+/g, ' ').trim();
    stats.chars = text.length;
    if (stats.chars < 300) {
      return { score: 0, level: 'humain', label: 'Texte trop court pour être analysé', signals: [], stats: stats };
    }

    var pts = 0;
    var signals = [];
    var seenLabels = {};
    for (var i = 0; i < PHRASES.length; i++) {
      var p = PHRASES[i];
      var n = countMatches(p.re, text);
      if (n > 0) {
        var add = p.w * Math.min(n, 2);
        pts += add;
        stats.phraseHits += n;
        if (!seenLabels[p.label]) {
          seenLabels[p.label] = true;
          signals.push({ label: p.label, weight: add });
        }
      }
    }

    var rep = repetitionPoints(text);
    pts += rep;
    stats.repetition = rep;

    var humanAdj = 0;
    for (var h = 0; h < HUMAN_MARKERS.length; h++) {
      if (HUMAN_MARKERS[h].test(text)) {
        humanAdj++;
        stats.humanMarkers++;
      }
    }
    humanAdj = Math.min(humanAdj, 4);
    pts = Math.max(0, pts - humanAdj);

    var level, label, score;
    if (pts >= 6) {
      level = 'eleve';
      label = 'IA probable — indice élevé';
      score = Math.min(98, 68 + (pts - 6) * 5);
    } else if (pts >= 3) {
      level = 'modere';
      label = 'IA probable — indice modéré';
      score = 52 + (pts - 3) * 6;
    } else if (pts >= 1) {
      level = 'faible';
      label = 'Peut-être généré par IA — indice faible';
      score = 30 + pts * 8;
    } else {
      level = 'humain';
      label = 'Aucun signal IA détecté';
      score = 0;
    }

    return {
      score: score,
      level: level,
      label: label,
      signals: signals.slice(0, 6),
      stats: stats,
    };
  }

  return {
    version: '0.1.0',
    analyze: analyze,
    signalCount: PHRASES.length,
  };
});
