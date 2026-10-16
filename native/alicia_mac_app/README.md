# Alicia Mac native — MacBook Pro Intel macOS Big Sur 11.7.11

## Téléchargement gratuit

Le workflow GitHub **Alicia Mac Big Sur — application native gratuite** fabrique une application SwiftUI Intel compatible macOS 11 minimum.

1. Ouvrir l'onglet **Actions** du dépôt, puis un lancement vert du workflow **Alicia Mac Big Sur**.
2. Sous **Artifacts**, télécharger **Alicia-Mac-BigSur** (connexion GitHub nécessaire).
3. Dans **Téléchargements**, ouvrir l'archive GitHub. Elle contient une seconde archive nommée **Alicia-Mac-BigSur.zip**. Ouvrir également celle-ci pour obtenir **Alicia.app**.
4. Déplacer **Alicia.app** dans le dossier **Applications** du Mac (aucune installation de Flutter/Xcode sur le Mac personnel).
5. Lors du premier lancement, si macOS bloque une application non signée, faire un clic droit sur Alicia.app → **Ouvrir**, puis confirmer **Ouvrir**, si cette option existe. Si nécessaire : Préférences Système → Sécurité et confidentialité → Général → **Ouvrir quand même**, uniquement après vérification que le fichier vient bien de ton propre dépôt. Ne pas désactiver Gatekeeper globalement.

## Fonctionnement et limites

- Application Mac native, indépendante de Safari et d'AltStore.
- Aucun compte développeur Apple payant ou renouvellement tous les 7 jours sur Mac ; un Mac peut exécuter une application personnelle non notarifiée après accord explicite de l'utilisateur.
- Interface native SwiftUI, portrait d'Alicia, synthèse vocale française, messages de démonstration, modes d'expertise sélectionnables et détection locale de la présence d'AltServer.
- **Ce n'est pas encore le moteur complet IA** : pas de conversation intelligente, dictée vocale, avatar 3D animé ou synchronisation iPhone ↔ Mac.
- La connexion réseau est une indication de l'interface active (Wi-Fi/Ethernet) ; elle ne garantit pas Internet.
- La présence d'AltServer ne garantit pas que l'iPhone ait été renouvelé.
- Aucune donnée de compte Apple demandée par Alicia Mac, aucun changement automatique du système, aucune suppression de fichiers.
- Ne remplace pas l'installation native iPhone. Le suivi du renouvellement iPhone continue dans AltStore.

## Sécurité

Application sans signature Developer ID et sans notarisation Apple. Sa fiabilité n'est **pas attestée** par Apple. Ne l'ouvrir que si le téléchargement correspond à ce dépôt GitHub et si tu acceptes le risque habituel d'une app non notarifiée. Ne jamais désactiver toutes les protections du Mac.
