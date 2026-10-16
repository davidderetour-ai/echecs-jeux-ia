# Alicia — référence d'interface iPhone (16 octobre 2026)

**Référence visuelle fournie par le propriétaire d'Alicia dans la conversation.**
Capture : maquette mobile « ALICIA », portrait blonde en chignon, vêtement bleu nuit marqué du A lumineux. L'image source appartient à la conversation ; ne pas prétendre qu'elle a été importée en tant qu'asset 3D ou fichier image dans le dépôt.

## Ligne graphique à conserver (Mac, iPhone et Android)
- Palette : bleu nuit profond (#080d24 et #101a3b), bleu électrique (#50a9ff), violet (#8869ff), touches cyan, textes blancs bleutés ; halo lumineux léger et bords fins.
- En-tête : monogramme étoile + « ALICIA », sous-titre « Assistant · Code · Diagnostic · Création », raccourcis compacts.
- Carte d'accueil : **avatar blond aux yeux bleus**, personnage souriant, statut vert « Alicia est prête », deux ou trois attributs sans promesses fictives.
- Commandes vocales : choix de la voix française, style, bouton lumineux pour écouter une démonstration.
- Émotions : quatre boutons Rire / Tristesse / Peur / Colère et expression automatique.
- Modes d'expertise : raccourcis Général / Code / Réparation / Création / Professeur liés au sélecteur de mode existant.
- Conversation : bulles distinctes utilisateur / Alicia, fond sombre, action de copie, champ clair et envoi violet.
- Mise en page : cartes arrondies, hiérarchie lisible, éléments tactiles >= 44 px, comportement responsive et hors ligne.

## Limites de réalisme
- La capture est une **maquette de référence**, pas une photographie d'une application déjà fonctionnelle.
- L'avatar 3D stylisé original de la première version ne peut pas égaler immédiatement la qualité photoréaliste de cette maquette.
- L'application ne doit pas afficher des qualificatifs comme « intelligence illimitée » ou « toujours disponible » si cela n'est pas vérifiable.
- Three.js et OrbitControls r147 sont intégrés sous licence MIT pour la scène 3D autonome sans CDN.
- Toutes les options payantes, liens de signature et faux indicateurs de disponibilité sont exclus.

## Validation
- Les boutons de mode doivent mettre à jour le sélecteur réel `#mode`.
- Les boutons d'avatar doivent faire tourner un vrai objet 3D uniquement si WebGL est disponible et garder un rendu de secours sinon.
- Les voix et émotions conservent les actions déjà présentes.
- Les nouvelles feuilles de style sont présentes dans le cache PWA et dans le paquet Mac.
- Aucun fichier de mémoire utilisateur n'est remplacé par la mise à jour.
