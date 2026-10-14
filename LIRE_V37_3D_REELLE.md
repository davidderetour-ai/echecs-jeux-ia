# V3.7 — Go et 100 défis de paix en véritable 3D WebGL

## Changements
- Go : trois gobans 9×9 / 13×13 / 19×19, pierres volumétriques, plateau épais en 3D, caméra à 360°, inclinaison et zoom tactile. On peut toucher directement une intersection depuis la vue 3D (plus besoin de remettre le plateau à plat).
- 100 défis de paix : échiquier 5×5 et sept pièces d’échecs modélisées en volume, rotation 360°, zoom, toucher sur les cases dans la vue 3D.
- Échecs et 4 joueurs : le moteur WebGL 3D 360° original est conservé.
- Pour Go et Paix, un bouton permet de basculer entre 3D et 2D ; repli 2D si WebGL indisponible.
- Les IA locales, les règles et la progression ne sont pas changées.
- Le service worker met en cache hors ligne les deux jeux autonomes, leurs scripts, les 100 défis et le moteur 3D.

## Installation Netlify
Importer le ZIP dans Netlify Drop (ou envoyer son contenu comme dossier de publication). Le site doit être servi en HTTPS pour l'installation mobile et le service worker. Mettre à jour l’application depuis le navigateur et recharger la page si un ancien cache persiste.

## Limites
Les autres mini-jeux et le Shogi conservent les effets 3D CSS de V3.6 ; les volumes WebGL ajoutés dans cette version concernent le Go et les défis de paix. Le rendu dépend du support WebGL de l’appareil et peut être plus lent sur les mobiles anciens, surtout pour le goban 19×19. L’IA Go reste heuristique, pas professionnelle.
