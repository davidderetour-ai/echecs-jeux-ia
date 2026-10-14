# Échecs & Jeux IA — V2.8 · Shogi & Académie

## Nouveautés

La V2.8 intègre un **jeu de Shogi 9 × 9** en français, un parcours de **8 catégories de 3 niveaux** (24 niveaux), un mode deux joueurs sur le même appareil et un **ordinateur d'initiation jouant localement**. Le Shogi comprend les déplacements, la promotion, le parachutage de pièces capturées, l'interdiction du double pion non promu sur une colonne et l'échec et mat (y compris l'interdiction du mat immédiat par pose de pion). Les règles particulières de répétition (*sennichite*) et de partie bloquée (*jishogi*) ne sont **pas encore arbitrées automatiquement**.

Les 8 catégories : **Découverte ; Déplacement des pièces ; Promotion ; Pièces capturées ; Protéger son roi ; Comprendre le mat ; Tactiques ; Combat guidé**. Chaque catégorie comprend deux explications/questions et un exercice pratique sur le plateau. Le niveau suivant n'est débloqué qu'après réussite de l'activité actuelle, sans étoiles, vies, cadenas ni pénalité pour un mauvais essai.

Le bouton **Conseil IA pédagogique** donne un indice pré-écrit adapté à l'exercice. Le bouton **Explication** présente la correction; **Écouter** la lit avec la synthèse vocale du téléphone si elle est disponible. En partie, le conseil choisit un coup légal plausible, **pas nécessairement le meilleur coup**. L'ordinateur de Shogi est un adversaire débutant, pas un moteur professionnel.

Le Shogi possède son **plateau en relief**, boutons de rotation, coordonnées facultatives et mode plein écran agrandi. La caméra WebGL à 360° existe pour les **échecs classiques et à 4 joueurs**; les jeux M800 et le Shogi disposent pour le moment d'une perspective en relief, mais pas de maillages 3D à 360° complets. L'affichage s'adapte aux petits écrans et conserve les options pendant une partie.

## Installation sur le projet Netlify existant

1. Ouvrir l'application actuelle **Échecs & Jeux IA**, aller dans **Réglages → Copier mes sauvegardes dans Fichiers** et exporter le fichier **JSON**. Vérifier sa présence dans l'application Fichiers de l'iPhone.
2. Télécharger **Echecs_Jeux_IA_V2_8_SITE_NETLIFY.zip**. Ne pas le décompresser pour le dépôt via Netlify si son interface accepte le ZIP; sinon extraire les fichiers et déposer le dossier contenant `index.html`.
3. Ouvrir le projet Netlify **gorgeous-fairy-4c7374** (section **Deploys**) et publier sur **ce même site**. Ne pas créer un nouveau projet ni changer le nom de domaine.
4. Ouvrir `https://gorgeous-fairy-4c7374.netlify.app/` avec Internet et vérifier le texte **v2.8** en bas de page. Sur iPhone, il peut être nécessaire de fermer puis rouvrir le site après la mise à jour du cache.
5. Tester **🏯 Shogi → 🎓 Entraînement → Comprendre le mat**. Puis **Jouer** et essayer un déplacement, la rotation, les coordonnées et le plein écran. Une fois les fichiers chargés en cache, tester la connexion coupée.
6. Vérifier ses parties et préférences **avant** de supprimer quoi que ce soit. L'application ouverte par un raccourci Safari et une PWA installée peuvent avoir des zones de stockage distinctes. Si les parties ne s'affichent pas, **importer le JSON** dans le contexte concerné, sans effacer les anciennes données.

## Portabilité et limites

La partie de Shogi, les niveaux terminés et les options sont enregistrés localement et inclus dans l'export JSON V2.8. La mise à jour de fichiers sur le même domaine ne vide normalement pas ce stockage; conserver tout de même une copie JSON.

Le mode en ligne multijoueur nécessite un serveur déployé séparément. Le chat Bluetooth natif et les appels vocaux entre joueurs **ne sont pas livrés comme fonctions actives** par le ZIP Netlify.

Tests : `npm test` ; le rendu WebGL complet doit encore être vérifié sur un iPhone réel.
