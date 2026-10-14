# Échecs & Jeux IA — Version 3.8

## Moteur graphique hybride

- **WebGPU**, prioritaire quand il est disponible sur l’appareil et le navigateur.
- **WebGL** en repli automatique si WebGPU n’est pas pris en charge.
- **Vue 2D** accessible depuis l’interface ou utilisée si WebGL n’est pas disponible.
- Les plateaux 3D ont un volume, la caméra peut tourner à 360°, le zoom est tactile et on peut sélectionner les cases dans la vue 3D.
- Les modèles 3D sont intégrés aux fichiers de l’application : aucune bibliothèque 3D distante n’est nécessaire.

## Jeux inclus

Échecs classiques, échecs 4 joueurs, Shogi, Go (9×9, 13×13, 19×19 **intersections**), dames, Reversi, Puissance 4, Renard et oies, Sauterelle, Northcote, Nim, Morpion, Memory, et 100 défis de paix originaux.

Les règles et les IA locales restent indépendantes du moteur graphique. Les fonctionnalités réseau facultatives peuvent demander une connexion et/ou un serveur.

## Installation et mise à jour avec Netlify

1. Décompresser cette archive ZIP.
2. Importer le **contenu du dossier décompressé** comme site statique sur Netlify (par exemple via Netlify Drop). `index.html` doit se trouver à la racine du dossier publié.
3. Ouvrir l’adresse **HTTPS** du site sur iPhone, Android ou ordinateur.
4. Sur iPhone, dans Safari : bouton Partager > **Sur l’écran d’accueil**.
5. Sur Android, dans Chrome : menu > **Installer l’application** ou **Ajouter à l’écran d’accueil** selon les options proposées.
6. Pour une mise à jour, republier tous les fichiers au même endroit puis rouvrir/recharger l’application.

Le service worker prépare les principaux fichiers pour le jeu **hors connexion après la première visite et la mise en cache**. Vérifier le mode avion seulement **après** un premier chargement complet en ligne.

## Essais réalisés et limites

- 10 tests automatiques portant sur les règles d’échecs et les coups du mode 4 joueurs : réussis.
- 12 configurations de rendu WebGL **simulé** ont produit une géométrie et accepté une sélection de case : réussies.
- Vérification syntaxique des principaux scripts : réussie.
- Le moteur WebGPU/WebGL n’a **pas** pu être testé visuellement sur un vrai iPhone/Android dans l’environnement de préparation. Le rendu exact et les performances restent à vérifier sur l’appareil.
- L’IA Go est heuristique et n’équivaut pas à un moteur expert. Les 100 défis ne reproduisent pas les supports physiques du jeu commercial.
