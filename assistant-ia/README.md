# Alicia — assistant IA multiplateforme (PWA)

Prototype d'assistant IA en français utilisable dans le navigateur et installable sur **iPhone, Android, Windows et macOS** en tant qu'application web progressive (PWA). Il est isolé dans le dossier \`assistant-ia/\` du dépôt de jeux pour **ne pas remplacer le jeu d'échecs**.

## Fonctions déjà codées
- Conversations générales, expert programmation, dépannage Windows/macOS/Linux/iPhone/Android, création de logiciels et professeur.
- Auto-vérification optionnelle des réponses par un **deuxième appel** au modèle (coût et durée plus élevés) ; bouton **Corriger** pour relire une réponse.
- Notes/corrections locales **volontaires** conservées sur l'appareil ; elles influencent les réponses futures mais ne réentraînent pas le modèle.
- Recherche Web optionnelle via l'outil de l'API OpenAI, lecture vocale et dictée lorsque le navigateur la prend en charge.
- Interface responsive, manifest PWA et cache du squelette hors connexion. **Les réponses IA restent en ligne.**
- Secrets API côté serveur dans Netlify Functions ; code d'accès demandé à l'utilisateur, conservé uniquement pour la session.

## Mise en service Netlify
1. Créer un **nouveau site Netlify** rattaché au dépôt GitHub, sans toucher au site déjà utilisé par les jeux.
2. Après fusion de la branche proposée sur \`main\`, sélectionner le dépôt et renseigner **Base directory : \`assistant-ia\`** (Publish directory: \`.\` ; functions: \`netlify/functions\`).
3. Dans Netlify > Configuration du projet > Environment variables, créer \`OPENAI_API_KEY\` (clé de l'API OpenAI) et \`APP_ACCESS_TOKEN\` (mot de passe personnel fort et distinct). Ne jamais les insérer dans GitHub, dans le navigateur ou dans un fichier public. Facultatif : \`OPENAI_MODEL\` ; valeur par défaut \`gpt-5.6-terra\`.
4. Déployer puis ouvrir l'URL HTTPS ; saisir le mot de passe correspondant à \`APP_ACCESS_TOKEN\`. **Le compte ChatGPT Plus ne comprend pas les frais éventuels de l'API OpenAI.**
5. iPhone : Safari > Partager > Sur l'écran d'accueil. Android : Chrome > Installer l'application. Windows/Mac : Chrome ou Edge > Installer. Selon le navigateur, l'option d'installation peut varier.
6. Configurer un **plafond de dépenses API** et surveiller l'usage. L'auto-vérification double souvent le nombre d'appels ; la recherche Web peut entraîner des frais supplémentaires.

## Autocorrection et évolution
- *Autocorrection d'une réponse* : critique + réécriture par le modèle. Ce contrôle n'est pas une garantie d'exactitude.
- *Évolution des préférences* : notes locales créées avec consentement explicite ; effaçables d'un clic.
- *Évolution du logiciel* : Alicia peut analyser un problème, chercher des méthodes, concevoir une correction et préparer des changements proposés dans une branche GitHub et une pull request. Elle ne doit appliquer les changements sensibles qu'après **ta permission explicite pour chaque opération**, avec aperçu, tests, sauvegarde et possibilité de revenir en arrière. Aucune permission globale implicite.
- *Protocole de permission* : détailler ce qui sera modifié/supprimé/installé, l'utilité, les risques, le coût éventuel et les possibilités de restauration ; demander une approbation spécifique ; agir uniquement dans le périmètre validé ; présenter un journal et le résultat. Une permission peut être refusée ou retirée avant l'exécution.
- *État réel du prototype* : l'interface actuelle peut discuter et proposer du code, mais **ne dispose pas encore d'outils permettant de manipuler les fichiers ou d'installer des logiciels sur l'appareil**. Ce protocole est une règle de conception pour les futures intégrations, pas une exécution déjà disponible.
- Pour commencer les tests : \`cd assistant-ia && npm test\`. Les tests unitaires ne valident pas le modèle externe, qui requiert une clé API et le déploiement.


## Analyse et comparaison des données (v1, gratuite et hors ligne)
Dans **📊 Analyse et comparaison de données**, charge un fichier CSV/TSV, ou deux fichiers à comparer.
- Les fichiers restent dans le navigateur : ils ne sont **pas envoyés à l'API ni au serveur**.
- Calculs reproductibles : nombre de valeurs valides/exclues, somme, moyenne, médiane, minimum et maximum ; écart absolu et relatif des moyennes entre deux fichiers utilisant le même nom de colonne.
- CSV séparés par des virgules, points-virgules ou tabulations ; nombres français (virgule décimale) reconnus.
- Les nombres ambigus, unités mélangées et données manquantes sont exclus ou signalés, **jamais devinés**.
- Pour comparer deux groupes, contrôler les unités, les définitions, la période et les biais : le même titre de colonne ne prouve pas la même mesure.
- Aucun accès automatique à des bases de données, aucun résultat inféré par l'IA. L'analyse textuelle par modèle conversationnel et la vérification Web exigent encore un moteur configuré, distinct de cet outil local.
- Fonctionne hors ligne lorsque les fichiers de la PWA ont été mis en cache une première fois ; limite de 1,5 Mo et 10 000 lignes par fichier.

## Fiabilité des réponses
Le mode **Analyse et vérification de données** invite Alicia à distinguer observation, calcul et hypothèse ; ne pas inventer de sources, de mesures ou de résultats et expliquer les limites. Une seconde vérification linguistique ne garantit **jamais zéro erreur**. Les chiffres de l'outil CSV sont calculés de façon déterministe, et couverts par des tests unitaires.

## Limitations de cette V1
Pas de clonage du modèle interne de ChatGPT, pas d'entraînement continu, pas d'accès aux fichiers de l'utilisateur, pas de modification du code GitHub sans revue. L'application est une interface à un service IA distant, pas un modèle local autonome. Pour la production grand public : ajouter authentification utilisateur robuste, contrôles d'abus et quotas, chiffrement et politique de conservation des données. Le stockage de code d'accès dans \`sessionStorage\` est un compromis pour prototype personnel, pas une solution multiutilisateur. Aucune clé d'API n'est envoyée au navigateur.

## Expressions faciales et disciplines éducatives
- Six expressions **simulées** dans l'avatar 3D : neutre, joyeuse, concentrée, curieuse, bienveillante et inspirée. Un sélecteur permet de choisir l'expression ou le mode automatique selon les mots de la conversation.
- L'avatar conserve le clignement des yeux et la bouche animée lors de la lecture vocale. Ses iris suivent le **curseur ou les gestes à l'écran**. Le suivi d'un visage par caméra et la véritable synchronisation labiale phonétique ne sont pas encore implémentés.
- Alicia ne ressent pas ces émotions et ne les détecte pas chez l'interlocuteur ; ce sont des animations conventionnelles.
- Nouveaux modes : français et orthographe, mathématiques, sciences, géographie, histoire, dessin et arts plastiques, musique et composition, chant et technique vocale.
- Ces domaines ajoutent des consignes au modèle, **sans constituer une garantie d'exactitude** : les maths complexes demandent parfois un moteur de calcul, l'histoire et les sciences des sources fiables, et le chant audio un moteur spécialisé.
- L'avatar et ses expressions sont utilisables depuis les fichiers de l'application en cache hors ligne ; les réponses IA conversationnelles demandent encore une connexion au moteur configuré.
- Les tests automatisés couvrent les choix d'expressions et les outils de calcul, non la perfection des réponses du modèle.


## Diagnostic et amélioration du Mac — première étape

Alicia inclut un module **Améliorer mon Mac** en lecture seule, prévu notamment pour macOS Big Sur 11.7.11 :
1. Télécharger le script `mac-audit.sh` depuis Alicia.
2. Examiner son contenu puis, sur le Mac, ouvrir Terminal et exécuter `bash ~/Downloads/mac-audit.sh`.
3. Copier le rapport dans le module Mac d’Alicia. L'analyse des valeurs a lieu **localement dans le navigateur**.
4. Examiner les recommandations : stockage, mémoire, compatibilité logicielle et sauvegardes. Aucun correctif ne s'exécute automatiquement.

Ce script lit uniquement la version de macOS, le modèle, l'architecture, la RAM totale et l'espace disque disponible. Il ne récolte pas de numéro de série, de mots de passe, de fichiers personnels ou de journaux. Il ne se connecte pas à Internet et ne modifie pas macOS.

**Limitations :** l'application Ollama officielle exige macOS 14 ou plus récent ; une optimisation ne peut pas rendre arbitrairement compatible une version plus récente d'un programme. Une mise à niveau macOS doit être vérifiée selon le modèle exact du Mac, sauvegardée et décidée par le propriétaire. Les futures opérations de nettoyage, mise à jour ou installation demanderont un consentement distinct, des contrôles et une possibilité de retour en arrière. Le module actuel n'exécute aucune modification du Mac.

Sources : https://ollama.com/download/mac et https://support.apple.com/en-us/108382

## Première modification Mac contrôlée : animation du Dock
Un second script distinct, **mac-improve.sh**, démontre le cycle complet :
- `bash ~/Downloads/mac-improve.sh preview` : plan précis, effet et risques, aucune modification ;
- `bash ~/Downloads/mac-improve.sh apply` : demande explicite de saisir `OUI ALICIA` dans un Terminal interactif, sans `sudo`, avant toute modification ;
- `bash ~/Downloads/mac-improve.sh verify` : contrôle de la préférence après action ;
- `bash ~/Downloads/mac-improve.sh undo` : permission explicite, restauration de l'ancienne valeur sauvegardée, puis vérification.

La seule préférence modifiée est `com.apple.dock launchanim` (animation d'ouverture depuis le Dock). Cela n'améliore **pas la puissance CPU/RAM** et ne permet **pas de faire tourner des applications incompatibles avec Big Sur**. Un redémarrage bref du Dock peut survenir. Le script crée un petit fichier de sauvegarde privé dans le dossier utilisateur Alicia ; il ne supprime aucun document et ne modifie aucun fichier système macOS. Aucune commande de ce script n'a été exécutée sur ton Mac à distance. Le téléchargement du script ne constitue pas une autorisation de l'exécuter.

D'autres changements comme la désinstallation de logiciels, la gestion des programmes au démarrage et les mises à jour demandent une analyse supplémentaire et un mécanisme d'autorisation séparé.

## GitHub et amélioration continue — état de la première intégration

Alicia peut désormais **consulter l'historique public des tests** du dépôt GitHub dans l'interface, sans abonnement ni clé payante. Le chiffre affiché est le taux d'exécutions de tests GitHub terminées avec succès, sur les dernières exécutions consultées ; une exécution contenant plusieurs tests représente **une** exécution. Ce taux ne garantit ni la qualité des réponses du modèle ni les chances de succès de l'amélioration suivante. Sans historique, le taux est « inconnu ».

Le workflow `.github/workflows/alicia-watchdog.yml` programme **un contrôle quotidien** par GitHub Actions : tests et vérification de syntaxe. Sur la branche principale, un échec peut ouvrir un ticket GitHub (sans le dupliquer), si GitHub Actions et les autorisations de création d'issues sont activées. **Cette surveillance ne s'exécute automatiquement qu'une fois le workflow intégré à `main`.** Elle ne réécrit pas du code à l'aveugle et ne déploie pas automatiquement une correction.

### Création d'une proposition de correction, avec ta permission

Un programme local `github-maintainer.mjs` prépare des changements limités au dossier `assistant-ia/` :
- `node github-maintainer.mjs status` : consulter l'état des tests GitHub (connexion Internet requise).
- `node github-maintainer.mjs preview mon-correctif.json` : vérifier les fichiers et les vérifications prévues, **sans modifier GitHub**.
- `node github-maintainer.mjs propose mon-correctif.json` : après configuration d'un jeton GitHub **secret côté ordinateur** (`ALICIA_GITHUB_TOKEN`, autorisations Contents et Pull requests uniquement sur ce dépôt) et saisie explicite de `CREER PR ALICIA`, créer une **branche séparée et une pull request en brouillon**. La branche de base utilisée pour les prochaines corrections est `main` une fois la PR initiale intégrée. Tu peux choisir une autre branche avec `ALICIA_GITHUB_BASE_BRANCH`.

Le programme crée une proposition, **pas une mise à jour installée** : les tests GitHub doivent ensuite réussir et le propriétaire doit relire les modifications puis approuver la fusion et le déploiement. **Ne jamais saisir le jeton GitHub dans le navigateur Alicia, dans ChatGPT, dans un fichier commité ni dans un message.** Une connexion GitHub à ChatGPT ne connecte pas automatiquement Alicia au même compte.

La génération automatique de correctifs et de capacités nouvelles à partir des journaux d'erreurs requiert encore un moteur de programmation réellement connecté, un environnement d'essai isolé et une chaîne de tests approuvée. Les nouvelles capacités ne sont pas considérées comme acquises sur la seule base d'une proposition. L'outil proposé aujourd'hui ne dispose pas encore d'une boucle qui corrige tous ses bugs sans assistance.

### Périmètre d'autorisation

Ton Mac personnel est le seul appareil prévu pour les optimisations locales. L'intervention sur **tout autre appareil** nécessite ton autorisation personnelle distincte. Les changements sensibles doivent être testés et accompagnés d'un plan de restauration ; en cas d'échec, suspendre l'intervention et proposer ou réaliser seulement la restauration déjà autorisée pour cette intervention.

## Fonctionnement gratuit en mode local et mises à jour proposées

L'interface propose maintenant **Connexion IA : Hors ligne / local (gratuit)** par défaut. Pour fonctionner, ce mode requiert un serveur Alicia démarré avec `node local-server.mjs` et un moteur Ollama local déjà installé avec un modèle (`ollama pull qwen3:1.7b`, puis `ollama serve` selon l'installation). Il n'y a pas de frais d'API OpenAI dans ce mode. L'application ne retombe **jamais automatiquement sur une API payante**. Le mode en ligne peut être choisi explicitement et exige une API et un mot de passe Netlify configurés. La recherche Internet est indisponible en mode local hors réseau.

**Attention sur macOS Big Sur 11.7.11 : la version actuelle d'Ollama n'est pas compatible.** Pour ce Mac il faudra vérifier le processeur, la mémoire et choisir un moteur compatible avant d'annoncer un véritable chat IA hors ligne. Installer le serveur Node ou télécharger une PWA ne règle pas cette incompatibilité. L'accès depuis iPhone/Android n'est pas automatiquement équivalent à une IA locale sur le téléphone : il nécessite un moteur sur l'appareil ou un serveur joignable et sécurisé.

### Génération locale de suggestions d'autocorrection

Sur un ordinateur compatible équipé d'Ollama :
1. Placer les fichiers Alicia localement. Dans `assistant-ia/`, exécuter `node github-draft.mjs "Décris précisément le bug à réparer"`.
2. Le modèle lit uniquement un ensemble restreint de fichiers déjà présents (jamais de secrets), produit `alicia-proposition.json` **sans exécuter le code généré**, et ne remplace aucun fichier existant.
3. Examiner le résultat : `node github-maintainer.mjs preview alicia-proposition.json`.
4. Avant toute création de branche sur GitHub, installer personnellement un **jeton GitHub à portée réduite** dans une variable d'environnement `ALICIA_GITHUB_TOKEN`. Limiter son accès au dépôt `davidderetour-ai/echecs-jeux-ia`, avec uniquement **Contents: Read and write** et **Pull requests: Read and write**. Ne jamais l'inscrire dans une page web ou GitHub. Le jeton n'est pas créé par ChatGPT.
5. Après contrôle et avec ton accord explicite dans le terminal, `node github-maintainer.mjs propose alicia-proposition.json` crée une branche séparée et une PR **en brouillon**. La CI vérifie son code ; la revue puis la fusion et le déploiement restent manuels.

Les brouillons générés localement sont susceptibles de contenir des erreurs ; les tests doivent porter sur le code **proposé** dans la branche PR, pas simplement le code existant. Une fusion n'est jamais autorisée automatiquement par Alicia.


## Alicia Original et copies — collaboration volontaire

**Alicia Original** désigne l'installation appartenant au créateur de ce projet, qui en conserve la gestion. **Une installation téléchargée publiquement depuis GitHub est une copie par défaut.** Sur le Mac du propriétaire, l'utilitaire `Activer Alicia Original.command` permet une vérification ponctuelle de l'identité GitHub `davidderetour-ai` grâce à `/user` ; aucun jeton n'est enregistré. Le statut est inscrit uniquement dans le dossier utilisateur `~/Library/Application Support/Alicia/original-status.json` et survit aux mises à jour. C'est un **marqueur local non infalsifiable**, pas une protection anticopie ou une preuve cryptographique de propriété.

### Apprendre des copies sans surveiller les utilisateurs

Un panneau **Alicia Original ↔ copies** permet :
1. À l'utilisateur d'une copie de **décrire volontairement** un bogue, une solution déjà testée, une idée ou une alerte de sécurité. Il doit cocher son accord, voir un aperçu, retirer toute information personnelle puis ouvrir lui-même le formulaire GitHub Issues. La proposition est publique dans ce dépôt public. **Aucun message, historique, fichier ou information de l'appareil n'est transmis automatiquement.**
2. Au propriétaire d'Alicia Original de lire les retours, de comparer les sources, de reproduire les tests puis, **seulement après revue**, de publier les conseils dans `copy-learning-catalog.json` avec une référence GitHub (Issue/PR) et `reviewed: true`.
3. Aux copies de **consulter à leur demande** les fiches publiées et, si elles le souhaitent, d'ajouter un conseil à une question. Cette opération n'installe pas de code et ne change pas les paramètres de l'appareil.
4. À tout utilisateur de consulter les alertes de `copy-safety.json`, notamment les versions déconseillées. Le fichier permet des avis informatifs **sans exécution distante**.

**Important :** cette boucle est une mémoire documentaire partagée, pas un réentraînement automatique du modèle. Une solution soumise n'est ni acceptée ni traitée comme vraie avant vérification. Les fiches ne sont pas chargées automatiquement dans les réponses de l'IA. Un signalement malveillant, une erreur ou une instruction cachée ne doivent jamais être exécutés comme une commande.

Les copies peuvent être modifiées ou fonctionner hors ligne. Alicia Original **ne peut pas garantir d'accéder à toutes les copies, les désactiver, les supprimer à distance ou contrôler les appareils de leurs utilisateurs**. Elle peut publier des correctifs et des alertes, retirer une version de la distribution qu'elle administre et suspendre l'accès à des services qu'elle contrôle, selon les autorisations existantes. L'utilitaire `Désinstaller cette copie.command` ouvre seulement un dossier local et laisse à l'utilisateur la décision de retirer ses fichiers.

### Mac Big Sur 11.7.11

L'installateur `INSTALLER_MAC_BIG_SUR.command` copie l'interface dans `~/Applications/Alicia`, crée un raccourci sur le Bureau si possible et conserve le marqueur Original privé lors des mises à jour. Une mise à jour d'une installation existante exige une confirmation et enregistre d'abord une sauvegarde. Les fonctionnalités locales de l'interface peuvent fonctionner sans modèle IA ; une conversation hors ligne requiert un moteur adapté à la configuration réelle du Mac.

L'iPhone peut échanger des messages texte avec le Mac sur un Wi-Fi privé grâce à `Lancer liaison iPhone.command`, mais **le protocole HTTP n'est pas chiffré** : ne jamais y transmettre de données sensibles. Le programme `Voir mes projets GitHub.command` liste les dépôts que le propriétaire autorise après saisie locale d'un jeton personnel. L'interface web ne doit jamais recevoir ce jeton.


## Alicia sur iPhone — assistant IA avec compte Puter (octobre 2026)

La PWA propose un troisième moteur pour l'iPhone : **« iPhone — IA en ligne (compte Puter, quota gratuit) »**, sélectionné automatiquement au premier démarrage sur iPhone/iPad. Un bouton **« Connecter mon compte IA (Puter) »** lance l'identification dans Safari. Après identification, le formulaire Alicia envoie les messages à `puter.ai.chat()` en utilisant un modèle conversationnel fourni par Puter, sans clé API propriétaire, puis affiche la réponse et peut la lire à voix haute si la synthèse vocale de l'appareil est disponible.

Important sur les coûts : [Puter utilise son modèle « User-Pays »](https://docs.puter.com/user-pays-model/). **Le compte Puter comprend une allocation mensuelle gratuite limitée** ; une utilisation au-delà peut nécessiter des crédits payants auprès de Puter. Alicia ne souscrit aucun abonnement et ne fait aucun achat ; elle affiche l'erreur de quota plutôt que d'activer un moteur payant en cachette. Le mode **Auto-vérifier les réponses** est désactivé par défaut pour ne pas doubler les requêtes de manière inattendue ; l'utilisateur peut l'activer.

### Installation iPhone
1. Publier le dossier `assistant-ia/` sur une **adresse HTTPS** accessible depuis Safari. Avec le site Netlify du dépôt de jeux, l'URL visée est `https://echecs-jeux-ia.netlify.app/assistant-ia/` si le déploiement publie bien le dossier ; **vérifier l'URL sur l'iPhone avant de considérer l'installation réussie**.
2. Depuis Safari, ouvrir Alicia, choisir Puter puis toucher « Connecter mon compte IA (Puter) ». Un compte Puter distinct peut être nécessaire. Le bouton doit être touché explicitement pour que Safari autorise la fenêtre de connexion.
3. Tester une conversation, puis Safari → Partager → Sur l'écran d'accueil → Ajouter.
4. Le document `installer-iphone.html` explique ces étapes dans l'application.

Les messages utilisent Puter et ses sous-traitants IA ; ils **ne restent pas exclusivement sur l'iPhone**. Les autres notes locales du navigateur ne sont pas envoyées tant qu'elles ne sont pas ajoutées au contexte des demandes. **Pas de chat hors ligne sur l'iPhone** avec ce moteur. Les fonctionnalités autonomes de vidéo, de chant audio et de création de jeux restent incomplètes et ne doivent pas être présentées comme testées sur appareil réel.

### Développement et tests
- Code : `puter-engine.js`, `app.js`, `installer-iphone.html`.
- Tests automatisés : `tests/puter-engine.test.mjs`, qui simule le SDK et vérifie le routage des réponses, le refus hors ligne ou sans connexion et l'absence de bascule implicite vers une API facturable.
- L'authentification Safari, la disponibilité réelle du modèle Puter et les réglages Netlify requièrent un **test manuel sur iPhone** après la publication.


## Publication iPhone après l'erreur « Site not found » de Netlify

L'adresse `https://echecs-jeux-ia.netlify.app/assistant-ia/` a renvoyé **Site not found** sur iPhone. Ne pas la communiquer comme installation valide sans vérification.

Une seconde méthode est préparée avec le workflow `.github/workflows/alicia-pages.yml`. Il publie uniquement le dossier `assistant-ia/` en site HTTPS via **GitHub Pages**. Le code du jeu à la racine du dépôt n'est pas écrasé. Pour activer l'hébergement lors de la première utilisation :

1. Dans GitHub, ouvrir `https://github.com/davidderetour-ai/echecs-jeux-ia/settings/pages`.
2. Sous **Build and deployment**, régler **Source : GitHub Actions**. Cette première activation est une action du propriétaire du compte GitHub.
3. Aller dans GitHub → **Actions** → **Alicia — publier sur GitHub Pages** et lancer `Run workflow` sur `main` si la publication n'est pas déjà passée au vert.
4. Lorsque le workflow `Déployer` réussit, contrôler dans Safari l'adresse calculée par GitHub Pages, généralement `https://davidderetour-ai.github.io/echecs-jeux-ia/`. Ne pas installer avant d'avoir vérifié que la page affiche **ALICIA**.
5. Safari → Partager → Sur l'écran d'accueil → Ajouter, puis connecter Puter volontairement.

Un succès du workflow « Tests Atelier IA » ne signifie pas que le site est déployé. Un succès Netlify Preview ne garantit pas que le domaine de production Netlify existe. GitHub Pages nécessite l'activation préalable dans Settings par un administrateur ; les identifiants et paramètres personnels du compte ne sont pas manipulés par Alicia.

## Avatar iPhone V2 — animations faciales (prototype 3D stylisé)

L'avatar WebGL de Safari a désormais une morphologie moins schématique (visage ovale, coiffure blonde multi-mèches, paupières et cils, oreilles, bouche et vêtements détaillés), sans charger de bibliothèque 3D lourde. Il comprend :
- des **clignements de paupières** à intervalles légèrement irréguliers, et le respect de `prefers-reduced-motion` ;
- un **regard qui suit les touches et déplacements du doigt** sur iPhone (ou le pointeur sur ordinateur) ; il n'utilise **pas** l'appareil photo et ne prétend pas suivre le regard ou le visage de l'utilisateur ;
- six expressions faciales visuelles liées au contexte ou au choix manuel ; **pas de reconnaissance de sentiments** ;
- des mouvements de lèvres approximatifs lors de `speechSynthesis`, avec la prise en compte facultative de `onboundary`. Safari ne garantit **pas** l'accès aux phonèmes, la synchronisation labiale n'est donc pas exacte ;
- un bouton **« Tester les yeux et la voix »** qui prononce une phrase sans envoyer de requête au moteur IA (pas de consommation du quota Puter) ;
- un rafraîchissement plafonné autour de 30 images/seconde et une pause de rendu lorsque la page est masquée, pour réduire la charge sur iPhone.

Le visage est **toujours stylisé et non photoréaliste**. Atteindre l'apparence de la maquette nécessitera un véritable modèle de personnage détaillé, des textures et un système d'animation facial spécialisé. Les tests unitaires vérifient les limites numériques et les choix d'expressions, mais un essai dans Safari iPhone est nécessaire pour évaluer la qualité visuelle et la synthèse vocale.

## iPhone — préférence Wi-Fi uniquement

Le propriétaire souhaite utiliser le **Wi-Fi de son iPhone**, sans consommation cellulaire pour les conversations IA. Alicia affiche un panneau « Wi-Fi uniquement » et, sur iPhone, n'envoie plus de requêtes IA tant que la personne n'a pas déclaré « Je suis connecté au Wi-Fi ». Le SDK Puter ne se charge plus automatiquement au démarrage de la page : il est chargé après cette confirmation. Un état `navigator.connection.type === 'cellular'`, lorsqu'il est exposé, entraîne un blocage ; une perte réseau ou un événement de changement de connexion révoque la confirmation.

**Limite incontournable :** Safari iOS n'expose généralement pas le type du réseau, et la confirmation manuelle ne détecte pas une bascule silencieuse du Wi-Fi vers 4G/5G. Une application web ne peut donc pas garantir ce choix. Pour **empêcher effectivement les données cellulaires**, le propriétaire doit intervenir dans iOS : **Réglages → Données cellulaires**, couper les données pour Alicia si l'app apparaît (sinon pour Safari), et désactiver l'option « Assistance Wi-Fi » en bas de la liste si présente. Le système iOS est la protection effective, et les autres applications peuvent rester autorisées. L'affichage et le cache de l'interface peuvent toujours être téléchargés lors d'une ouverture initiale si iOS autorise le cellulaire.

Aucune permission réseau permanente n'est conférée à Alicia et son bouton ne modifie aucun paramètre de l'iPhone.


## Alicia 0.3.0 — Menu « + » et conseils avec ChatGPT

L'en-tête présente **v0.3.0**, avec « Actualiser » et « Nouveau ». **Nouveau** remet en place une conversation vide, affiche une confirmation visible et réinitialise le brouillon et la pièce jointe, sans effacer les notes enregistrées. « Actualiser » demande au service worker de chercher une mise à jour puis recharge la page (réseau Wi-Fi si requis par les réglages du propriétaire).

Le bouton **+** de la zone d'écriture présente :
- **Caméra** et **Photos** : sélection d'une image JPEG/PNG/WebP/GIF de **4 Mo maximum**, aperçu avant transmission. Seul le clic sur « Envoyer » peut transmettre la photo au moteur IA **Puter**. Les images sont envoyées sous forme de données multimodales à Puter et à son fournisseur de modèle. Le modèle et Safari doivent accepter cette fonction ; le traitement réel reste à vérifier sur iPhone.
- **Fichiers** : documents texte `.txt`, `.md`, `.csv`, `.tsv`, `.json`, `.log` et `.xml` avec lecture locale et aperçu du nom. Seul l'extrait des **7 500 premiers caractères** est joint à la question envoyée ; la lecture de PDF et Word n'est **pas** implémentée, un message l'indique au lieu de prétendre les analyser.
- **Plugins et outils** : ouvre la liste de suggestions d'outils libres d'Alicia. Cela ne connecte pas les plugins du compte ChatGPT et n'installe rien.
- **Double vérification** : active ou désactive le deuxième passage du moteur IA ; il peut consommer davantage de crédits de l'allocation Puter.
- **Demander conseil à ChatGPT** : prépare une question claire avec l'objectif saisi dans le champ, la copie (si autorisée par Safari) et ouvre le site ChatGPT au choix de l'utilisateur. **Il n'existe pas de dialogue automatique direct entre Alicia et le compte ChatGPT**.
- **Apprendre de ChatGPT** : colle volontairement une réponse de ChatGPT, prévisualise-la, accepte son enregistrement et garde jusqu'à cinq conseils **localement dans le navigateur**. Ces conseils sont transmis comme contexte aux prochaines requêtes IA, avec une limite de longueur. **Il ne s'agit pas d'un entraînement du modèle IA** et aucune réponse n'est jugée vraie sans vérification.

Le moteur Puter n'a pas accès directement au compte ChatGPT du propriétaire, à ses mémoires, ni aux fichiers de ChatGPT. La communication automatique nécessiterait une API officielle et une autorisation distincte, avec conditions tarifaires possibles. La protection Wi-Fi existante reste applicable aux appels IA. Le jeu d'échecs et ses fichiers ne sont pas modifiés.

## Alicia v0.3.1 — importer un audio ou une vidéo sur iPhone

Le menu **+** comporte deux nouveaux boutons :
- **🎵 Importer un audio** : sélectionner un fichier MP3, M4A, AAC, WAV, OGG ou Opus (20 Mo maximum) et l'écouter localement dans Alicia. Le bouton **Transcrire avec l'IA** envoie *uniquement après cette action explicite* l'enregistrement au service Puter `puter.ai.speech2txt(file)`, sous réserve de connexion au compte, de Wi-Fi confirmé, de compatibilité du format et de crédits disponibles. Une transcription obtenue est convertie en pièce jointe texte, relue avant envoi à la conversation. La transcription distante peut consommer des crédits ; elle n'est ni gratuite sans limite ni hors ligne.
- **🎬 Importer une vidéo** : sélectionner un film MP4, MOV, M4V ou WebM (80 Mo maximum), puis le lire **localement** sur l'iPhone grâce au lecteur HTML5. Avec **Capturer l'image affichée**, seule la trame vidéo choisie est préparée comme photo JPEG (max 1280 pixels sur le plus grand côté) pour une question ultérieure. Le film complet n'est **jamais transmis automatiquement** et l'application n'analyse pas encore l'intégralité d'une vidéo.

Tant qu'un média audio/vidéo est simplement importé, le bouton « Envoyer » bloque l'envoi de la question et explique comment préparer une transcription ou une image. Retirer une pièce jointe libère son URL temporaire locale. Les vérifications de formats et de volumes restent avant l'import. Le mode Wi-Fi et l'autorisation de Puter sont obligatoires pour la transcription, pas pour une lecture locale. Safari sur iPhone peut ne pas prendre en charge tous les codecs même lorsque l'extension est reconnue.


## Alicia — reconnexion automatique au réseau (Wi-Fi préféré)

La connexion aux réseaux Wi-Fi enregistrés est gérée **par iOS et non par Alicia**. Sur l'iPhone : **Réglages → Wi-Fi → bouton (i) du réseau utilisé → Connexion auto**, à activer si cette option est disponible. Alicia ne peut pas saisir le mot de passe Wi-Fi, sélectionner le réseau ou actionner les radios de l'iPhone.

Dans l'application, si le navigateur expose explicitement `navigator.connection.type === "wifi"`, Alicia reprend automatiquement sa connexion au moteur Puter (sans achat ni reconnexion au compte si la session est déjà valide), au lancement, après rétablissement du réseau et au retour au premier plan. Si la connexion est reconnue cellulaire, le moteur reste bloqué. **Safari iPhone ne communique généralement pas le type réel du réseau** : dans ce cas, Alicia conserve sa demande de confirmation manuelle. Ne pas persister cette confirmation indéfiniment : l'app ne peut pas garantir qu'iOS n'a pas basculé vers la 4G/5G. Pour une protection réseau réelle, désactiver les données cellulaires du navigateur ou de l'application dans les réglages iOS.

Il n'y a pas de connexion automatique au compte Puter si l'utilisateur n'a pas déjà autorisé la session. La connexion initiale demeure un acte volontaire.

## Alicia v0.5.0 — navigation Web et atelier de conception réelle

### Navigation et connaissances IA
Le menu « + » permet de coller un lien HTTPS public, de l'ajouter à la question, de le copier, de l'ouvrir et de partager l'URL publique d'Alicia via le partage natif iOS. Le nouveau bouton **« Lire cette page en direct »** active la recherche Web et ajoute le lien à la question. La case **« Naviguer sur Internet en direct »** est désactivée par défaut : lorsqu'elle reste désactivée, Alicia utilise les connaissances de son modèle IA, qui ne constituent **pas** une connexion au Web ni une mise à jour de son entraînement.

Quand la navigation est activée, le module **web-browse** peut lire au maximum deux pages HTTPS publiques explicitement fournies avec `puter.net.fetch`. Il refuse les identifiants intégrés, protocoles non HTTP(S), adresses IP littérales et hôtes locaux, les réponses non HTML, pages trop volumineuses et redirections, puis extrait un court texte qui est passé au modèle comme **données non fiables**. Si aucun lien n'est fourni, Alicia demande une recherche Web intégrée au modèle OpenAI proposé par Puter via `tools: [{type:"web_search"}]`, sous réserve de disponibilité et de quota. Elle affiche les URL citées lorsque le fournisseur les livre ; elle ne prétend jamais avoir trouvé des sources manquantes. Les sites non publics, protégés, écrits entièrement en JavaScript ou qui interdisent l'extraction peuvent rester illisibles. L'accès aux comptes privés, à des paiements ou à des systèmes internes n'est pas autorisé.

Ces fonctionnalités s'appuient sur un service Puter en ligne et ne sont **pas testées sur l'iPhone physique** lors de la publication. Le Wi-Fi confirmé est requis pour les appels IA ; iOS reste responsable du choix du réseau.

### Atelier de conception paramétrique
Alicia propose une section **« 📐 Atelier de conception »** sur iPhone pour produire un **meuble de rangement ouvert** (sans porte) avec largeur, hauteur, profondeur, épaisseurs, matériau et nombre d'étagères paramétrables. Les calculs géométriques produisent :
- un plan à vues face/profil coté au format **SVG**, téléchargeable ;
- une **liste de panneaux CSV** (millimètres, quantités et épaisseurs) et une estimation de surface nette ;
- un fichier **DXF R12** contenant les contours des panneaux, utile pour préparer la CAO, mais pas un fichier G-code utilisable directement sur une machine de découpe ;
- un descriptif technique qui peut être inséré dans la conversation avec Alicia.

Tous les calculs sont réalisés localement dans le navigateur et ne consomment pas de crédits IA. Ils **n'effectuent aucun calcul de charges, aucun contrôle réglementaire, aucune tolérance d'assemblage ou validation des découpes CNC** : un menuisier doit confirmer notamment quincaillerie, fixation anti-basculement, structure, jeux de découpe, choix de panneaux et sécurité.

Pour l'architecture, les pièces mécaniques et la cartographie, l'atelier construit un **cahier des charges à transmettre à Alicia** avec une liste d'outils professionnels pertinents (FreeCAD, Blender, QGIS ; Revit/SolidWorks/Autodesk pour travaux spécialisés). Les connecteurs effectifs vers ces logiciels, les imports IFC/STEP/LiDAR, les simulations par éléments finis et les fichiers machines sont **des développements futurs**, pas des capacités actuellement exécutées.

Le jeu d'échecs du dépôt reste entièrement séparé et inchangé.

## Alicia 0.6 : niveau mesuré, émotions et interface iPhone

L'écran affiche **✦ Niveau Alicia : Non évaluée** tant que le modèle actif n'a pas passé d'exercices. Il n'y a pas de chiffre inventé ni de QI simulé. Le bouton « Évaluer Alicia » teste 5 domaines simples (ou 10 questions en mode étendu), compare les réponses à un barème déterministe, puis affiche le taux de réussite, le nombre de questions et la date. C'est une **mesure limitée des performances sur ces questions**, pas une mesure universelle d'intelligence. Une nouvelle évaluation peut remplacer l'ancienne ; résultat stocké uniquement sur l'appareil, effaçable et périmé après 30 jours.

- **iPhone / Puter :** le test demande confirmation avant de lancer plusieurs requêtes utilisant l'allocation gratuite limitée de Puter, avec aucun achat automatique.
- **Mode local :** utilise le serveur Alicia local et le modèle effectivement installé sur l'ordinateur.
- **Mode API potentiellement payant :** évaluation bloquée pour éviter des dépenses.
- **Personnes, animaux, logiciels et objets :** grille descriptive facultative de compétences observables, jamais présentée comme QI ni comme intelligence globale. Participation volontaire demandée pour une personne ; aucun jugement d'intelligence sur un objet passif. Leurs résultats ne remplacent pas le niveau d'Alicia.
- **Interface :** thème bleu-violet, styles de voix française, rires, sanglots, peur, colère. Les sons sont générés localement, sans voix humaine enregistrée et déclenchés uniquement sur clic.
- **Cache PWA :** version `alicia-shell-v21`. Actualiser depuis Safari ou le bouton ↻ pour télécharger le nouveau code, sans effacer les préférences. La publication sur la branche principale doit encore être synchronisée par l'hébergeur de l'application.

## v0.6.1 — réseau principal Wi-Fi, Ethernet et connexion Puter

- Le grand encadré Wi-Fi a été remplacé par une ligne `📶 / 🔌 / 🌐` avec voyant vert (connexion autorisée), rouge (coupée/bloquée) ou jaune (type de réseau non vérifiable).
- `navigator.connection.type` peut éventuellement indiquer `wifi` ou `ethernet` sur certains navigateurs ; Safari sur iPhone ne permet généralement PAS de lire le type et ne fournit jamais de nom de réseau (SSID).
- En l'absence de détection, l'utilisateur peut déclarer « Wi-Fi principal », « Ethernet » ou « Autre ». Il s'agit d'une **déclaration manuelle**, et non d'une preuve de connexion au réseau principal.
- La connexion et la restauration de la session Puter existante sont lancées automatiquement **sur un réseau autorisé et reconnu**, sans ouvrir une fenêtre de connexion forcée ; le bouton de connexion n'apparaît que si la session n'est pas signée.
- Sur iPhone en réseau indéterminé, l'utilisateur confirme d'abord Wi-Fi/Ethernet pour la session. Le cellulaire rapporté explicitement est bloqué. Pour empêcher réellement la 4G/5G, il faut configurer iOS (désactiver les données cellulaires pour Alicia/Safari et Assistance Wi-Fi).
- Le cache hors ligne est `alicia-shell-v22` ; le code est associé à la version 0.6.1.
