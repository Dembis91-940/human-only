/**
 * test_analyzer.mjs — Tests Node du moteur de détection Human Only.
 * Usage : node dev/test_analyzer.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const code = readFileSync(join(here, '..', 'extension', 'analyzer-core.js'), 'utf8');

// Charger le module comme le ferait Node (UMD : module.exports)
const m = { exports: {} };
new Function('module', 'exports', 'window', code)(m, m.exports, undefined);
const A = m.exports;

let failures = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  →  ${actual}${ok ? '' : ` (attendu : ${expected})`}`);
}

const AI_FR = `Dans le monde numérique d'aujourd'hui, il est important de noter que la productivité est essentielle. Voici quelques points clés à retenir : d'abord, il est crucial d'organiser son temps. Ensuite, il convient de noter que la concentration est primordiale pour avancer efficacement. Enfin, n'oubliez pas de prendre des pauses régulières et de rester hydraté tout au long de la journée.

En résumé, une bonne gestion du temps repose sur la discipline, la constance et la régularité. Il est essentiel de garder à l'esprit que chaque action compte, même la plus petite. N'hésitez pas à appliquer ces conseils dès aujourd'hui pour transformer votre quotidien.

En conclusion, la maîtrise de votre emploi du temps est le premier pas vers une vie plus sereine, plus productive et plus épanouissante. Prenez soin de vous et de votre organisation, et les résultats suivront naturellement.`;

const HUMAN_FR = `Hier soir, mon collègue et moi on a passé deux heures sur notre tableau de bord, et franchement, je me suis dit qu'il fallait que je partage ça. On a enfin trouvé pourquoi nos emails partaient en spam : un simple en-tête mal configuré, et hop, tout partait en courrier indésirable.

Je me souviens qu'on avait galéré une semaine là-dessus l'année dernière, avec le prestataire qui nous renvoyait vers la doc. Bref, j'ai noté les trois étapes dans un gist, je vous mets le lien en commentaire. Ça nous a pris deux heures de tests, mais la solution tient en dix lignes.

Si ça peut vous éviter la même galère, tant mieux. Et si vous avez une astuce pour les webhooks, je suis preneur, on a un souci avec les relances automatiques.`;

const AI_EN = `In today's digital world, it's important to note that productivity is essential. Here are some key takeaways: first, it is crucial to organize your time. As an AI assistant, I would recommend keeping in mind the importance of focus. In conclusion, let's dive into the main steps and unlock the potential of your daily routine. Feel free to apply these tips.`;

const REPETITIVE = `La gestion du temps est essentielle pour votre productivité. La gestion du temps est essentielle pour votre productivité. La gestion du temps est essentielle pour votre productivité. Il est important de noter que la gestion du temps repose sur la discipline. En conclusion, la gestion du temps change tout.`;

const SHORT = 'Petit texte.';

console.log('--- analyzer-core.js v' + A.version + ' — ' + A.signalCount + ' signaux ---\n');

check('signalCount >= 40', A.signalCount >= 40, true);
check('AI_FR → eleve', A.analyze(AI_FR).level, 'eleve');
check('AI_FR → score >= 60', A.analyze(AI_FR).score >= 60, true);
check('AI_FR → signaux détectés', A.analyze(AI_FR).signals.length >= 5, true);
check('HUMAN_FR → humain', A.analyze(HUMAN_FR).level, 'humain');
check('HUMAN_FR → score 0', A.analyze(HUMAN_FR).score, 0);
check('AI_EN → modere ou eleve', ['modere', 'eleve'].includes(A.analyze(AI_EN).level), true);
check('REPETITIVE → modere ou eleve', ['modere', 'eleve'].includes(A.analyze(REPETITIVE).level), true);
check('SHORT → humain (trop court)', A.analyze(SHORT).level, 'humain');
check('texte vide → humain', A.analyze('').level, 'humain');

const ai = A.analyze(AI_FR);
console.log('\nExemple — AI_FR : ' + ai.label + ' · indice ' + ai.score + '/100');
ai.signals.forEach((s) => console.log('  ✦ ' + s.label));
console.log('\n' + (failures === 0 ? '✅ Tous les tests passent.' : '❌ ' + failures + ' test(s) en échec.'));
process.exit(failures === 0 ? 0 : 1);
