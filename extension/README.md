# Human Only — Installation de l'extension (bêta 0.1.0)

L'extension se charge **manuellement**, sans passer par un store. Comptez 2 minutes.

## Prérequis

- Un navigateur basé sur **Chromium** : Google Chrome, Microsoft Edge, Brave ou Arc.
- Firefox : **pas encore supporté** (Manifest V3 Chromium). Une version est prévue, sans date annoncée.

## Installation (Chrome)

1. **Récupérez le dossier `extension/`** (celui qui contient `manifest.json`). Gardez-le à un endroit stable : c'est le dossier source, ne le déplacez pas ensuite.
2. Ouvrez la page des extensions : tapez `chrome://extensions` dans la barre d'adresse.
3. Activez **« Mode développeur »** (interrupteur en haut à droite).
4. Cliquez sur **« Charger l'extension non empaquetée »**.
5. Sélectionnez le dossier `extension/`.
6. L'icône ✦ Human Only apparaît dans la barre d'outils. C'est installé.

### Edge, Brave, Arc

Le principe est identique, avec leur page d'extensions :
- Edge : `edge://extensions` → « Mode développeur » → « Charger l'extension décompressée ».
- Brave : `brave://extensions` → « Mode développeur » → « Charger l'extension non empaquetée ».
- Arc : `arc://extensions` → « Mode développeur » → « Load unpacked » (même procédure que Chrome).

## Vérifier que ça fonctionne

1. Ouvrez n'importe quel article de blog ou fil d'actualité (au moins 300 caractères de texte par bloc).
2. Attendez 1 à 2 secondes : des badges discrets **« ✦ IA probable »** apparaissent en haut à droite des blocs détectés.
3. Cliquez sur un badge pour voir l'indice heuristique (0–100) et les signaux détectés.
4. Cliquez sur l'icône de l'extension pour **désactiver** la détection ou régler la **sensibilité** :
   - *Sensible* : plus de badges (y compris les indices faibles) ;
   - *Équilibré* (recommandé) : indices modérés et élevés ;
   - *Strict* : uniquement les indices élevés.

## Utilisation au quotidien

- **Masquer un badge** : cliquez sur le badge → « Masquer ce contenu ».
- **Masquer tout un site** : cliquez sur le badge → « Masquer sur ce site » (mémorisé localement).
- **Tout désactiver** : icône de l'extension → interrupteur.

## Après une modification du code

Sur `chrome://extensions`, cliquez sur l'icône **↻ recharger** de la carte « Human Only », puis rechargez la page testée.

## Désinstallation

`chrome://extensions` → « Supprimer » sur la carte Human Only. Aucune donnée ne reste : les préférences sont stockées dans `chrome.storage.local`, supprimées avec l'extension.

---

## Limites — à lire avant de l'utiliser

Cette bêta est **honnête avec vous** :

- La détection est **heuristique** (tournures types, répétitions, structure). Ce n'est **pas** une certitude : elle peut se tromper dans les deux sens.
- Les textes de **moins de 300 caractères** ne sont pas analysés.
- Les contenus dans les blocs de code, champs de saisie et éléments cachés sont ignorés.
- **Aucune donnée n'est envoyée** : tout se passe dans votre navigateur. Les domaines que vous masquez et vos réglages sont stockés localement (`chrome.storage.local`), rien d'autre.
- Le badge affiche un **indice heuristique**, pas une probabilité ni un jugement de qualité : un texte signalé peut être excellent, un texte non signalé peut être généré par IA.
- Pas de modèle de classification (ML) dans cette version — c'est la piste n°1 de la V2, toujours en local.

## Fichiers

| Fichier | Rôle |
|---|---|
| `manifest.json` | Manifest V3 (permissions : `storage` uniquement) |
| `analyzer-core.js` | Moteur heuristique pur (46 signaux lexicaux + structure/répétition) |
| `content-script.js` | Scan du DOM, ancrage des badges (shadow DOM = isolation stylistique) |
| `popup.html` / `popup.js` | Réglages : activation + sensibilité |
| `icons/` | Icônes 16/32/48/128 |

## Signaler un problème

Écrivez à **bonjour@human-only.fr** en précisant : navigateur, page testée, et une capture du badge (ou de son absence). Les retours de bêta-testeurs alimentent directement la V2.
