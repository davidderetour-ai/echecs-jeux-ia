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
