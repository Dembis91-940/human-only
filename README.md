# Human Only — extension anti-fatigue IA (bêta 0.1.0)

> **Reprenez le contrôle de votre fil.** Human Only signale discrètement le contenu probablement généré par IA pendant que vous naviguez. Détection 100 % locale, badge discret, décision humaine.

## Ce que c'est — et ce que ce n'est pas (honnêteté d'abord)

**Ce que c'est :** une extension navigateur (Manifest V3, Chromium) qui analyse les textes que vous consultez **dans votre navigateur** et pose un petit badge en haut à droite des blocs probablement générés par IA. L'analyse repose sur des **heuristiques** : tournures types des textes générés (« il est important de noter », « en conclusion »…), répétitions de phrases ou de structures, vocabulaire superlatif, énumérations homogènes.

**Ce que ce n'est pas :**
- ❌ Pas une détection parfaite. Les heuristiques produisent une **estimation**, pas une certitude. Un humain peut écrire comme une IA, et une IA peut imiter un humain. Les badges peuvent se tromper — c'est assumé, documenté, et c'est pourquoi ils sont discrets, réglables et masquables.
- ❌ Pas un modèle de classification (ML). Aucun texte n'est envoyé à un serveur : tout est local. Un modèle de classification **hors-ligne** est la piste n°1 de la V2 (voir roadmap).
- ❌ Pas une certification « contenu humain ». Aucun badge ne garantit qu'un texte est écrit par un humain ; l'absence de badge signifie seulement « aucun signal IA détecté sur un texte d'au moins 300 caractères ».

## Arborescence

```
human-only/
├── index.html              # Landing page complète (démo réelle, EmailJS, chatbot, FAQ)
├── chatbot.js              # Widget chatbot (référence corrigée ai-course-builder)
├── chatbot-config.js       # Config chatbot — accent #38bdf8, FAQs 100 % business
├── og-image.png            # Image Open Graph (1200×630, générée)
├── extension/              # ← L'EXTENSION À INSTALLER (dossier complet)
│   ├── manifest.json       # Manifest V3
│   ├── analyzer-core.js    # Moteur heuristique (partagé avec la démo du site)
│   ├── content-script.js   # Scan DOM + badges (shadow DOM)
│   ├── popup.html / popup.js  # Réglages : activation + sensibilité
│   ├── icons/              # icônes 16/32/48/128
│   └── README.md           # Guide d'installation pas à pas
└── dev/
    ├── gen_icons.py        # Générateur des icônes/OG (Python pur, aucune dépendance)
    └── test_analyzer.mjs   # Tests Node du moteur de détection
```

## Tester localement

1. **La landing page** : `python3 -m http.server 8000` à la racine du dossier, puis ouvrir `http://localhost:8000/`.
   La démo « La détection, sous vos yeux » exécute **le même `analyzer-core.js` que l'extension** — ce n'est pas une simulation.
2. **Le moteur de détection** : `node dev/test_analyzer.mjs` (textes IA vs humains, assertions de niveau).
3. **L'extension** : voir `extension/README.md` — installation en 5 clics, sans store.

## Formulaire EmailJS (réel)

Le formulaire d'accès bêta utilise EmailJS avec un **compte réel** :
- `serviceId: service_cy1ytdb` · `templateId: template_xpo58cv` · `publicKey: 8Pui4ZEqxW2jRVF7h`
- Payload : `{ site, name, email, question }` (template de l'utilisateur)
- Le SDK est chargé **à la demande** au moment de la soumission (pattern validé — pas de course async).
- Honeypot anti-spam + validation côté client. Les champs `site` et `question` sont optionnels.

⚠️ Ne pas déclencher d'envoi de test pendant les vérifications (éviter les faux leads). Pour tester sans envoyer : stubber `window.emailjs` avant la soumission.

## Les offres (affichées sur le site)

| Offre | Prix | Contenu |
|---|---|---|
| Gratuit | 0 € | Badge de base, 100 % local, mises à jour incluses |
| Pro (LE PLUS CHOISI) | 3 €/mois | Badge avancé, seuil réglable, rapport hebdomadaire, support prioritaire — sans engagement |
| Business | 9 €/mois | Pour les équipes : seuils gérés, rapports agrégés, facture fournisseur |

Paiement par **virement ou message privé**, confirmation par email. Résiliable à tout moment, en un message. Les bêta-testeurs conservent le tarif annoncé.

## Limites connues (documentées, pas cachées)

- Textes de **moins de 300 caractères** : non analysés (estimation trop peu fiable).
- Les articles composés de **nombreux courts paragraphes** : chaque paragraphe peut être sous le seuil → badge absent ou partiel. Le clustering de blocs est prévu en V2.
- Le badge s'ancre sur le conteneur le plus « serré » (remontée limitée à 30 000 caractères et 20 blocs enfants).
- Les textes dans `pre`, `code`, champs de saisie, et les contenus cachés sont ignorés.
- **Faux positifs possibles** (texte humain très formaté) et **faux négatifs** (IA bien imitée). Assumé.
- Site de démo : 46 signaux lexicaux + 5 signaux de structure/répétition.
- Firefox : non supporté pour l'instant (Manifest V3 Chromium). Aucune date annoncée.

## Roadmap (honnête, sans date)

1. **V2** : clustering de blocs (articles multi-paragraphes courts), nouveaux signaux, options par site.
2. **V3** : modèle de classification léger **hors-ligne** (ex. ONNX/WebAssembly) pour remplacer/augmenter les heuristiques — toujours zéro envoi de données.
3. **V4** : Firefox + WebKit (Safari), liste blanche/noire par domaine, export des rapports.

## RGPD / vie privée

- Aucun texte consulté n'est envoyé ni stocké hors du navigateur.
- `chrome.storage.local` ne contient que : préférences (activation, sensibilité) et domaines masqués par l'utilisateur.
- Les seules données transmises sont celles envoyées volontairement via le formulaire d'accès bêta.

---

© 2026 Human Only — prototype/bêta. Ce site et cette extension ont été conçus et rédigés par un humain.
