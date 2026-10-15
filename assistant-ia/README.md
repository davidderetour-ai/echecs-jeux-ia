# Atelier IA — prototype multiplateforme (PWA)

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
- *Évolution du logiciel* : les changements futurs sont proposés dans une branche GitHub et une pull request, vérifiés par tests et approuvés par le propriétaire avant déploiement. **Aucune modification autonome de son propre code, aucun accès direct à l'ordinateur, aucune commande ou suppression automatique.**
- Pour commencer les tests : \`cd assistant-ia && npm test\`. Les tests unitaires ne valident pas le modèle externe, qui requiert une clé API et le déploiement.

## Limitations de cette V1
Pas de clonage du modèle interne de ChatGPT, pas d'entraînement continu, pas d'accès aux fichiers de l'utilisateur, pas de modification du code GitHub sans revue. L'application est une interface à un service IA distant, pas un modèle local autonome. Pour la production grand public : ajouter authentification utilisateur robuste, contrôles d'abus et quotas, chiffrement et politique de conservation des données. Le stockage de code d'accès dans \`sessionStorage\` est un compromis pour prototype personnel, pas une solution multiutilisateur. Aucune clé d'API n'est envoyée au navigateur.
