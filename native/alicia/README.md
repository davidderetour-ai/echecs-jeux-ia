# Alicia native — application Flutter (prototype indépendant)

Objectif : créer une véritable application iOS et Android, compilée pour le système et fonctionnant **sans Safari ni WebView**. Flutter partage le code Dart entre iOS, Android et éventuellement Windows/macOS.

## Réalisé

- Interface bleu nuit/violet et portrait tiré de la maquette fournie et embarqué hors connexion.
- Synthèse vocale française via les voix de l'appareil.
- Dictée native avec autorisation du microphone ; la reconnaissance peut nécessiter Internet.
- Rire, peur, colère et tristesse sous forme d'exclamations synthétiques (pas d'enregistrements ni de voix humaine clonée).
- Mode d'expertise, boîte de conversation, champ de saisie, écran de réglages.
- Type de réseau via l'API native : Wi-Fi, Ethernet, mobile, déconnecté, inconnu. Par défaut, les données mobiles sont bloquées pour les demandes IA.
- Passerelle optionnelle vers un serveur Alicia HTTPS personnel. Le code d'accès saisi n'est pas enregistré dans cette version.

## Limites actuelles

Cette version est un **prototype d'interface native**, pas encore la migration complète d'Alicia Web.

- Le portrait utilisé provient de la maquette, mais le reste de l'interface ne reproduit pas encore exactement tous les détails : l'application contient une image recadrée de la maquette fournie. Le rendu est inspiré du modèle, pas identique au pixel près.
- Puter.js est un moteur JavaScript Web et **ne fonctionne pas directement en Flutter natif**. Il faut une intégration native autorisée ou un serveur IA distinct. Sans URL de serveur IA valide, l'application montre un aperçu explicitement étiqueté et ne prétend pas avoir répondu.
- Pas encore de moteur hors ligne embarqué ni des fonctions GitHub, CAO, caméra, jeux et réparation d'ordinateur.
- Les émotions sont des courtes phrases TTS, pas des fichiers audio réalistes.
- La détection Wi-Fi/ethernet de l'OS ne révèle pas de façon garantie le SSID (réseau principal) et ne prouve pas l'accès Internet.
- Aucun binaire iOS signé n'a été produit à ce stade.

## Android

Sur un poste doté de Flutter et d'un Android SDK :

    cd native/alicia
    flutter create --platforms=android --project-name alicia_native .
    python3 scripts/configure_platforms.py
    flutter pub get
    flutter analyze
    flutter test
    flutter run -d android

GitHub Actions peut compiler un APK Android de test et l'ajouter aux artefacts du workflow Alicia native, après succès des vérifications. L'APK n'est pas installable sur iPhone.

## iPhone sans abonnement Apple payant (tests personnels)

Il faut un Mac compatible avec la version actuelle de Xcode et Flutter, un Apple ID, un iPhone connecté et une signature de développement. Un compte Apple de développement personnel gratuit peut servir pour tester sur son propre appareil, avec des restrictions et une durée de signature limitée. Pour l'App Store, l'inscription au programme payant est normalement requise.

Sur un Mac compatible :

    cd native/alicia
    flutter create --platforms=ios --project-name alicia_native .
    python3 scripts/configure_platforms.py
    flutter pub get
    flutter run -d <identifiant-iphone>

Configure Signing & Capabilities dans Xcode (Apple ID personnel, identifiant d'app unique), fais confiance au Mac et active le mode développeur sur iPhone si demandé.

**Un Mac sous macOS Big Sur 11 ne satisfait plus les prérequis actuels de Flutter pour macOS et des versions récentes de Xcode pour iOS.** Ne contourne pas les protections macOS : utilise un Mac compatible pour construire l'app ou garde l'application Web en attendant.

**Important :** l'icône Web Alicia déjà installée sur iPhone est une PWA. On ne peut pas la remplacer silencieusement par une application iOS native. La nouvelle application signée devra être installée séparément.

## Sécurité et évolution de tes autres apps

- Aucun secret/API key public. HTTPS pour le serveur IA (HTTP localhost réservé aux développeurs).
- Le code est isolé dans native/alicia/ ; assistant-ia/ et les sauvegardes de Échecs & Jeux IA restent inchangés.
- Pour migrer le jeu d'échecs et les autres applications, réutiliser ce thème Flutter dans un projet séparé ; valider chaque fonction et migration de sauvegardes avant déploiement.
- Les fonctions natives sensibles (photos, fichiers, réparation, notifications) requièrent leurs permissions spécifiques et un développement ultérieur.
