# Alicia et les projets GitHub — accès contrôlé

## Fonctions présentes
- Sur iPhone et Mac, le panneau **Mes projets GitHub** recherche les dépôts publics du compte `davidderetour-ai` après action sur « Actualiser » et détectera les dépôts publics créés ultérieurement.
- Il peut générer un fichier JSON de proposition **sans modifier aucun dépôt**.
- Le programme Mac `github-portfolio.mjs` lit les dépôts autorisés (publics et privés si l'authentification les couvre), inspecte les projets, prévisualise les changements, puis peut créer **une branche et une pull request brouillon** après confirmation interactive expresse.
- Ni l'accès privé, ni les droits d'écriture de l'application Alicia ne sont déjà configurés. La connexion GitHub de ChatGPT n'accorde pas automatiquement un accès à Alicia.

## Autorisation GitHub à effectuer par le propriétaire
Depuis GitHub, dans **Settings → Developer settings → Personal access tokens → Fine-grained tokens**, créer un jeton sous son propre compte uniquement après avoir décidé d'autoriser Alicia.

1. **Resource owner** : le compte contenant ses projets.
2. **Repository access** : « Only select repositories » est le plus prudent. Pour inclure ses **nouveaux dépôts futurs** sans renouveler la sélection, il peut choisir « All repositories » — portée plus large, à accepter en connaissance de cause.
3. **Repository permissions** : **Metadata : Read**, **Contents : Read and write** et **Pull requests : Read and write**, sans permission Administration, Secrets, Workflows, Deployments ni Actions write. Les permissions exactes peuvent évoluer avec GitHub ; vérifier celles que le site exige.
4. Date d'expiration courte et possibilité de révoquer à tout moment depuis GitHub.

**Ne jamais mettre le jeton dans le code, le navigateur, Alicia sur iPhone, la discussion, les fichiers GitHub, les sauvegardes ou une capture d'écran.** Utiliser uniquement la variable privée `ALICIA_GITHUB_TOKEN` dans une session Terminal Mac. Ne jamais coller le jeton dans une commande tapée en clair qui resterait dans l'historique.

## Lecture et propositions depuis le Mac
Le programme existant nécessite **Node.js 20 ou plus**, compatible avec la version de macOS utilisée. Dans un Terminal ouvert dans le dossier `assistant-ia`, après installation de Node et **sans utiliser sudo** :

```bash
# Lire les dépôts après avoir configuré ALICIA_GITHUB_TOKEN
node github-portfolio.mjs list
node github-portfolio.mjs inspect echecs-jeux-ia

# Vérifier le fichier JSON préparé dans l'application Alicia (aucun changement)
node github-portfolio.mjs preview echecs-jeux-ia /chemin/vers/alicia-proposition-echecs-jeux-ia.json

# Avec jeton privé ET confirmation tapée dans le Terminal : branche + PR brouillon
node github-portfolio.mjs propose echecs-jeux-ia /chemin/vers/alicia-proposition-echecs-jeux-ia.json
```

Le jeton peut être chargé temporairement dans un **shell Bash interactif** en utilisant `read -rs ALICIA_GITHUB_TOKEN` (saisie masquée) suivi de `export ALICIA_GITHUB_TOKEN`. Une fois terminé, taper `unset ALICIA_GITHUB_TOKEN` dans le même Terminal.

## Ce qu'Alicia ne fait pas
- Pas de branche, PR ou fusion créée seule, même si le jeton donne les droits.
- Pas de modification de la branche principale, de suppression de dépôt ou de publication App Store/Netlify automatique.
- Pas de découverte de dépôts privés via le seul panneau web, même si ChatGPT possède une connexion GitHub.
- Pas de modification des fichiers du Mac ou de l'iPhone sans accord.
- Pas de code auto-modifiant sans tests ni revue humaine.
- Les projets futurs de propriétaires différents demandent une autorisation GitHub supplémentaire.

## Pour chaque changement
1. Choisir le dépôt et lire les fichiers pertinents.
2. Préparer une proposition JSON : objectif, justification, chemins, contenu et tests.
3. Inspecter l'aperçu et les risques.
4. Donner la confirmation explicite pour créer la PR brouillon.
5. Lire le diff et les résultats de tests, puis **fusionner manuellement** si tout convient.

L'accès peut être révoqué par l'utilisateur depuis les paramètres GitHub. Les données d'apprentissage d'Alicia ne sont pas automatiquement envoyées à GitHub.
