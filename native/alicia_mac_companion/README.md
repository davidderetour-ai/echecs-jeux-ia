# Alicia sur Mac — AltServer et suivi iPhone

## Deux interfaces, un seul but
- Alicia native Flutter : carte « Signature AltStore » sur iPhone et « Suivi de l'iPhone » sur Mac compatible, utilisant une date saisie manuellement après vérification dans AltStore.
- Alicia Renouvellement Mac SwiftUI : petit compagnon compatible avec **macOS Big Sur 11**, montrant le processus AltServer (lancé ou non détecté), une échéance iPhone déclarée et une alerte si l'échéance approche.

Le Mac n'a PAS besoin de renouveler sa propre application tous les 7 jours. Seule l'application sur iPhone est concernée par cette durée.

## AltServer gratuit sur ton Mac
Site officiel : https://altstore.io/
Guide officiel : https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos

AltServer macOS demande au moins macOS 11. Sur le Mac :
1. Déposer AltServer.app dans Applications, le lancer et vérifier son icône dans la barre des menus.
2. Brancher l'iPhone au Mac, le déverrouiller et choisir « Faire confiance » s'il le demande.
3. Dans Finder, sélectionner l'iPhone et activer « Afficher cet iPhone lorsqu'il est connecté au Wi-Fi ».
4. Installer AltStore Classic via AltServer, puis Alicia quand un paquet IPA compatible aura été créé.
5. Dans Préférences Système → Utilisateurs et groupes → Ouverture, ajouter AltServer pour qu'il démarre avec la session. Le Mac doit rester allumé, AltServer lancé et les deux appareils sur le même Wi-Fi, ou reliés par USB.
6. Dans AltStore iPhone → Mes apps, vérifier régulièrement la nouvelle date. En cas d'échec d'autorenouvellement, actualiser manuellement avant l'expiration.

AltStore tente les renouvellements en arrière-plan. Ni ce script ni Alicia ne garantissent leur réussite. Le compte Apple gratuit permet de signer une application pour un appareil personnel, mais la signature Apple est toujours nécessaire.

## Compiler le compagnon natif SwiftUI sur Big Sur
Ce dossier contient :
- AliciaRenewalMac.swift : interface native pour l'état du processus AltServer sur le Mac et l'échéance déclarée de l'iPhone.
- build-mac.sh : compilation locale prudente. Aucune suppression ou installation système et aucune connexion Apple ID.

Sur le Mac avec un environnement Swift/Xcode compatible Big Sur, dans le Terminal :
1. Vérifier le compilateur : xcrun --find swiftc
2. Dans le dossier native/alicia_mac_companion du dépôt : bash build-mac.sh
3. Si la compilation réussit, ouvrir build/AliciaRenouvellement.app dans le Finder.

Le script ne remplace pas un paquet existant, ne lance pas AltServer automatiquement et ne demande jamais de mot de passe. La compilation n'a PAS été exécutée sur ton Mac. Un ajustement pourrait être nécessaire selon les outils Xcode réellement présents.

## Ce que les états signifient
- AltServer actif (vert) : seul le processus AltServer a été observé sur ce Mac. Ne signifie PAS que l'iPhone est accessible ou qu'un renouvellement a réussi.
- AltServer non détecté (orange) : AltServer n'est pas visible dans les applications du Mac.
- Échéance inconnue : aucune date n'est inventée. Lire la date dans AltStore sur iPhone, puis la saisir sur Mac.
- À 2 jours ou moins, l'interface avertit d'une échéance proche ou dépassée.

Les données sont stockées localement dans chaque application, et ne se synchronisent pas entre Mac et iPhone. Après un renouvellement confirmé dans AltStore, corriger la date sur les deux appareils.

## Limite de compatibilité
La version actuelle de Flutter ne prend plus en charge macOS 11 pour compiler son application Mac. Ce compagnon Mac utilise SwiftUI ciblant macOS 11. Le code Flutter est conservé pour un Mac compatible, mais son build sur Big Sur ne doit pas être promis sans outils compatibles. L'application iPhone Flutter elle-même n'est pas encore compilée en IPA.

Aucun mot de passe ou jeton Apple ne doit jamais être enregistré dans les fichiers de GitHub.
