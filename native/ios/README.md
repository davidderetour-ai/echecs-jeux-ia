# Prototype iPhone natif — ÉCHECS & JEUX IA

Ce dossier contient **du code source SwiftUI**, pas une application déjà installable (.ipa).

## Fonctionnalités réellement implémentées
- Onglets natifs iOS « Jeux », « Coach IA » et « Réglages ».
- Accès aux jeux actuels dans un composant WKWebView intégré (ce n'est pas Safari, mais **le moteur des jeux reste web**).
- Coach pédagogique **local à réponses préprogrammées** sur les échecs, les échecs à quatre, le Go et le Shogi.
- Préférences natives stockées sur l'appareil, non encore reliées au jeu.

## Limites actuelles
- La vue des jeux nécessite Internet pour son premier chargement ; le mode hors ligne des jeux n'est **pas garanti** par ce prototype.
- Pas de modèle IA génératif, pas de microphone ni de reconnaissance vocale.
- Pas de synchronisation des coups entre le moteur JavaScript et le coach.
- Pas d'amélioration de performances 3D prouvée.
- Pas de compilation ou test sur iPhone réalisés.

## Installation future
1. Ouvrir Xcode sur un Mac compatible et créer un projet iOS App (SwiftUI).
2. Remplacer le fichier SwiftUI principal par `EchecsJeuxIAApp.swift` ; supprimer l'entrée `@main` créée par défaut pour n'en garder qu'une.
3. Configurer un identifiant d'application unique et sélectionner l'iPhone comme appareil cible.
4. Compiler, signer avec son compte Apple personnel et installer via Xcode. Un compte gratuit peut être utilisé pour des essais sur son propre iPhone, sous réserve des limites et exigences de compatibilité Apple.

**Ne pas fusionner ce prototype avant vérification sur un vrai appareil.**

## Étapes suivantes
- Évaluer la compatibilité de Xcode avec le Mac disponible.
- Ajouter un pont JavaScript natif sécurisé pour communiquer avec les jeux.
- Tester les sessions longues, les sauvegardes, les pendules compactes et la rotation 3D.
- Prévoir un assistant plus avancé via un moteur local réellement disponible.
- Créer un projet Android Kotlin/Jetpack Compose distinct pour une interface Android native.
