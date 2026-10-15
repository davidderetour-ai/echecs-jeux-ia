# Alicia native — iPhone, Android et Mac compatible

Projet Flutter en cours de préparation. Il comporte l'interface visuelle Alicia, la détection Wi-Fi/Ethernet, la voix française, les bruitages artificiels et un panneau de suivi de signature AltStore.

## Signature de l'application iPhone

Le panneau « iPhone · Signature AltStore » présente :
- « Expiration non renseignée » au départ : aucune échéance fictive ;
- une date à saisir après l'avoir lue dans AltStore Classic sur l'iPhone ;
- un décompte des jours restants, avec avertissement dès 2 jours ;
- aucun mensonge sur la réussite d'un renouvellement.

Le suivi est enregistré uniquement sur l'appareil via shared_preferences. Le renouvellement proprement dit est tenté par AltStore + AltServer ; une application Flutter ordinaire ne peut pas prolonger elle-même son certificat Apple.

## Suivi sur Mac

La même carte s'affiche avec l'intitulé « Mac · Suivi de l'iPhone » quand Flutter tourne sur un **Mac compatible**. Un Mac ne doit pas renouveler sa propre signature tous les 7 jours.

**Pour le Mac personnel sous Big Sur 11.7.11**, utiliser le compagnon SwiftUI prévu dans le dossier ../alicia_mac_companion. Il peut afficher la présence du processus AltServer et la date iPhone saisie. La dernière version Flutter ne prend plus en charge Big Sur ; le compagnon SwiftUI a été écrit en ciblant macOS 11.

La date enregistrée sur le Mac n'est pas synchronisée avec l'iPhone. Il faut la vérifier dans AltStore après chaque renouvellement.

## État du projet

Les sources Flutter sont enregistrées sur GitHub mais n'ont pas encore été compilées en APK, IPA ou application Mac. Aucune application n'a été installée sur un appareil. Le moteur de conversation IA native et la dictée ne sont pas encore connectés. Le code de l'interface est une étape de développement distincte de l'application web actuellement installée. Les identifiants Apple ne doivent jamais être placés dans ce dépôt.
