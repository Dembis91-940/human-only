/* Config du chatbot — Human Only
 * Couleur = accent du site (bleu ciel #38bdf8). Textes 100 % spécifiques au business.
 */
window.CHATBOT_CONFIG = {
  name: 'Maya',
  subtitle: 'Assistante Human Only',
  accent: '#38bdf8',
  welcome: 'Bonjour 👋 Je suis Maya, l’assistante de Human Only. Une question sur l’extension, les offres ou l’accès bêta ?',
  quick: [
    'Combien ça coûte ?',
    'C’est fiable à 100 % ?',
    'Comment installer l’extension ?',
    'Où vont mes données ?'
  ],
  emailjs: {
    serviceId: 'service_cy1ytdb',
    templateId: 'template_xpo58cv',
    publicKey: '8Pui4ZEqxW2jRVF7h'
  },
  faqs: [
    {
      keywords: ['prix', 'coût', 'coute', 'tarif', 'gratuit', 'gratuite', 'abonnement', 'offre', '3 €', '9 €'],
      answer: 'L’offre Gratuite reste gratuite, sans limite de temps : badge de base, navigation sans tracking, mises à jour incluses. L’offre Pro coûte 3 €/mois : badge avancé, seuil de sensibilité réglable, rapport hebdomadaire de votre fil et support prioritaire. L’offre Business est à 9 €/mois pour les équipes (gestion des seuils, facture fournisseur, politique de confidentialité dédiée). Sans engagement : résiliable à tout moment, en un message. Les bêta-testeurs gardent le tarif annoncé.'
    },
    {
      keywords: ['fiable', 'fiability', 'précision', 'se trompe', 'fiabilité', 'exact', 'erreur', 'certitude'],
      answer: 'Honnêtement : non, pas à 100 %. Human Only repose sur une détection heuristique (tournures types, répétitions, structure du texte) qui donne une estimation, pas une certitude. Un humain peut écrire comme une IA, et une IA peut imiter un humain. C’est pour ça que le badge reste discret, réglable et masquable : vous gardez toujours le dernier mot. Une version avec un modèle de classification dédié est en préparation.'
    },
    {
      keywords: ['installer', 'installation', 'install', 'chrome', 'extension', 'navigateur', 'edge', 'brave', 'arc', 'télécharger', 'telecharger'],
      answer: 'Pour la bêta, l’installation se fait en quelques clics, sans passer par un store : téléchargez le dossier de l’extension, ouvrez chrome://extensions (ou edge://extensions), activez le « Mode développeur », cliquez sur « Charger l’extension non empaquetée » et sélectionnez le dossier. Un guide détaillé accompagne le dossier. Compatible Chrome, Edge, Brave et Arc. Firefox est prévu.'
    },
    {
      keywords: ['données', 'donnee', 'confidentialité', 'confidentialite', 'privé', 'prive', 'rgpd', 'local', 'stocké', 'stocke', 'envoyé', 'envoye'],
      answer: 'Rien ne quitte votre navigateur : l’analyse des textes est 100 % locale, aucun texte consulté n’est envoyé ni stocké sur un serveur. Les seules données transmises sont celles que vous envoyez volontairement via le formulaire d’accès bêta (nom, email, éventuellement votre site et votre question) — uniquement pour vous répondre, jamais revendues.'
    },
    {
      keywords: ['bêta', 'beta', 'accès', 'acces', 'essai', 'tester', 'inscription', 'attente', 'quand'],
      answer: 'L’extension est en bêta fermée. Le formulaire « Accès bêta » envoie votre demande directement à l’équipe : réponse personnelle sous 48 h ouvrées, avec le dossier d’installation et vos identifiants d’accès. Les bêta-testeurs qui passent au plan Pro conservent le tarif annoncé.'
    },
    {
      keywords: ['annuler', 'résilier', 'resilier', 'engagement', 'désabonner', 'desabonner', 'arrêter', 'arreter', 'garantie'],
      answer: 'Aucun engagement : vous pouvez résilier à tout moment, en un message, et conserver l’offre gratuite. Pas de période d’essai piégée, pas de reconduction cachée.'
    },
    {
      keywords: ['pourquoi', 'intérêt', 'interet', 'utile', 'à quoi', 'a quoi', 'fatigue', 'human'],
      answer: 'Parce que les fils sont envahis de textes formatés « IA » : la curation devient un travail, la confiance s’érode et le temps file. Human Only remet une information simple entre vos mains — « ceci est probablement généré par IA » — pour que vous décidiez quoi lire, en connaissance de cause.'
    }
  ]
};
