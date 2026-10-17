# Échecs & Jeux IA — application iPhone native (v3.8.8)

**Produit distinct de l'application Alicia Fusion.**

## Ce qui est réellement fourni
- Un exécutable **iOS arm64**, associé à **WKWebView** et à un petit serveur HTTP local accessible seulement par l'appareil sur `127.0.0.1`.
- Tous les fichiers nécessaires aux jeux, aux règles JS, à l'interface, aux moteurs IA locaux et aux plateaux sont embarqués dans l'IPA. Pas besoin de Safari ni d'un serveur distant pour les modes de jeu locaux.
- Tests unitaires Node.js des moteurs de dames et Go, vérification statique des fichiers et compilation Swift réalisés par GitHub Actions.
- Les fonctions réseau comme les salons distants, la connexion à Alicia en ligne ou certains services tiers **ne fonctionnent pas sans Internet et nécessitent une configuration indépendante**.
- Aucun test physique sur iPhone n'est garanti par une compilation GitHub ; certaines fonctions WebKit demandent une validation sur appareil.

## Télécharger le fichier

Depuis GitHub connecté :
1. Ouvrir l'onglet **Actions** du dépôt, choisir le workflow **Échecs & Jeux IA — Compiler IPA iPhone native gratuite**.
2. Ouvrir une exécution marquée d'un cercle vert.
3. Sous **Artifacts**, télécharger `Echecs-Jeux-IA-iPhone-IPA-v3.8.8`.
4. Décompresser **une seule fois** le ZIP de GitHub pour récupérer `Echecs-Jeux-IA-iPhone-unsigned.ipa`.
5. **Ne pas double-cliquer sur ce fichier IPA depuis le Finder Mac.** Ce fichier n'est ni une application Mac ni une archive à décompresser pour l'installer.

## Installer gratuitement sur un iPhone avec AltStore Classic

1. Installer **AltServer sur Mac** depuis https://altstore.io/ (Big Sur 11.7.11 convient pour AltServer sous réserve de la version disponible).
2. Brancher l'iPhone au Mac, autoriser la confiance, et installer **AltStore Classic sur iPhone** via le menu AltServer.
3. Dans les réglages de l'iPhone, valider le profil Apple requis et activer le mode développeur si iOS l'exige.
4. Copier l'IPA dans **Fichiers** sur iPhone avec AirDrop, iCloud Drive ou un câble.
5. Ouvrir **AltStore Classic → My Apps → +**, choisir l'IPA et laisser AltServer effectuer la signature puis l'installation avec le compte Apple gratuit.
6. Lancer « Échecs & Jeux IA » depuis l'écran d'accueil ; vérifier un jeu sans réseau en mode avion et tester l'import des sauvegardes.

Il n'y a **pas d'installation iPhone native sans signature Apple** sur un iPhone normal. Le compte gratuit impose en général un renouvellement de signature environ tous les **7 jours** ; AltStore peut le tenter automatiquement si l'iPhone et le Mac avec AltServer se voient sur le même réseau. Rien ne garantit 100 % de renouvellements automatiques.

Documentation officielle : https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos

## Sauvegardes et versions

- L'application native possède un identifiant de paquet **distinct** : `fr.echecsjeuxia.iphone.native`. Elle **ne remplace pas** Alicia et ne supprime pas la PWA Échecs.
- Les données dans Safari, celles de la PWA et celles de la nouvelle application native sont **isolées par iOS**. Il n'y a pas de migration automatique de `localStorage`.
- Si la version web permet d'**exporter un JSON de sauvegarde**, conserver le fichier, puis tester l'import dans le jeu natif. Certaines parties de jeux comme Go et dames peuvent ne pas être comprises dans l'ancien format JSON commun.
- **Ne supprimer aucune ancienne application avant d'avoir comparé les parties et les sauvegardes.** En cas de remplacement d'une même application native, sauvegarder les données avant une réinstallation.

## Compilation reproductible

Le workflow `.github/workflows/echecs-ios-ipa.yml` utilise `macos-15`, les outils Swift/iPhoneOS d'Xcode et le script `native/echecs_ios/build_ipa.sh`. L'IPA est volontairement **non signée** afin de pouvoir être signée par AltStore au moment de l'installation personnelle, sans frais Apple Developer.

La voix et les versions d'Alicia ne sont pas modifiées par ce projet.

## Correctif iPhone 3.8.8 — écran blanc

Une capture d'écran iPhone a révélé une page blanche après installation de l'IPA initiale.
Le test HTTP local a reproduit une erreur de démarrage `POSIXErrorCode 22 (Invalid argument)` : le port était défini deux fois dans les paramètres de `NWListener`. Le correctif utilise une écoute TCP ordinaire sur le même port, filtrée pour n'accepter que les connexions de boucle locale, et un test d'intégration HTTP vérifie les fichiers des jeux.

- **Ne supprimer ni Alicia ni la première version des jeux** avant la mise à jour.
- Télécharger l'artefact `Echecs-Jeux-IA-iPhone-IPA-v3.8.8` depuis un run vert récent sur main.
- Dans AltStore Classic, sélectionner le nouvel IPA pour mettre à jour la version existante portant le même identifiant `fr.echecsjeuxia.iphone.native`. Éviter toute désinstallation ou changement d'identifiant : cela pourrait perdre des données.
- Tester le menu de jeux ; si un message d'erreur apparaît, envoyer la capture. Un diagnostic natif lisible indique désormais si le serveur local ou la page WebKit échoue.
- La réussite du test Mac n'est pas une garantie de fonctionnement physique sur iPhone : il faut confirmer après installation.

## Dépannage iPhone v3.8.8 — capture de page blanche persistante

La capture réelle de l'iPhone est restée entièrement blanche après la tentative de mise à jour 3.8.7. Il n'est pas établi si le nouvel IPA a réellement remplacé le précédent ; le statut « Active » dans AltStore ne donne pas cette preuve.

La version 3.8.8 ajoute un **bandeau de navigation UIKit indépendant de WebKit**, visible dès l'ouverture en haut, indiquant explicitement « Échecs & Jeux IA · v3.8.8 » et quatre commandes :

- **Accueil** recharge le menu principal inclus dans l'IPA.
- **Go** ouvre le jeu de Go local dans la même application.
- **Dames** ouvre les dames françaises locales.
- **Diagnostic** affiche les informations locales (page ouverte, état d'initialisation, texte présent dans le DOM), sans envoyer de données sur Internet.

Si ce bandeau **n'apparaît pas** après mise à jour AltStore, la version installée n'est probablement pas le binaire 3.8.8 ou l'installation a rencontré un problème ; **ne pas désinstaller l'app** sans sauvegarde préalable.

Dans le seul paquet IPA, l'installation d'un nouveau service worker est désactivée et les anciens enregistrements de service worker sont désinscrits. Aucune valeur localStorage n'est supprimée ; la PWA Safari n'est pas modifiée.

Le workflow vérifie la syntaxe et les moteurs, compile un vrai exécutable iOS et teste les réponses HTTP local du serveur Swift. **Un test automatisé sur Mac n'est pas une validation visuelle sur iPhone**.
