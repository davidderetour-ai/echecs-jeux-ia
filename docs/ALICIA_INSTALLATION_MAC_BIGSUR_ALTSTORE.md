# Installer Alicia native sur iPhone avec un Mac Big Sur — sans abonnement Apple Developer

**Projet : Alicia** · Mac personnel : **macOS Big Sur 11.7.11** · iPhone personnel · objectif : **renouvellement automatique de la signature tous les 7 jours**, sans compte développeur payant.

> **Important :** ce guide prépare l’installation ; il ne la réalise pas. La version Flutter native d’Alicia, dans la branche `alicia-flutter-native-v1`, est pour l’instant du code source de démonstration, **sans fichier IPA compilé ni installation vérifiée**. Le Mac Big Sur peut faire tourner AltServer, mais il ne prend pas en charge les dernières chaînes de compilation Flutter/Xcode. Il faudra produire le fichier IPA sur un environnement macOS récent avant de l’installer via AltStore Classic.

## 1. Installer le compagnon sur ton Mac

1. Ouvre [le site officiel d’AltStore](https://altstore.io/) sur ton Mac.
2. Télécharge **AltServer pour macOS** (macOS **11 minimum**, donc Big Sur convient pour AltServer).
3. Déplace **AltServer.app** dans le dossier **Applications**, puis ouvre-le.
4. Regarde la **barre de menus du Mac** : l’icône AltServer doit y apparaître.
5. Dans **Préférences Système → Utilisateurs et groupes → Ouverture** (ou « Éléments d’ouverture »), ajoute AltServer si tu souhaites qu’il se lance à chaque ouverture de session. **Ne change aucun réglage système automatiquement.**

Site officiel : https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos

## 2. Préparer l’iPhone avec le Mac

1. Déverrouille ton iPhone.
2. Branche-le **une première fois en câble USB/Lightning** au Mac.
3. Si l’iPhone demande **« Faire confiance à cet ordinateur ? »**, accepte seulement si c’est bien ton Mac.
4. Ouvre le **Finder**, sélectionne l’iPhone dans la barre latérale, puis coche **« Afficher cet iPhone lorsqu’il est en Wi-Fi »**.
5. Laisse l’iPhone et le Mac sur **le même réseau local Wi-Fi** pour la configuration initiale. En cas de problème avec un Mac connecté en Ethernet, commence avec les deux appareils sur le même Wi-Fi.

## 3. Installer AltStore Classic sur l’iPhone

1. Sur le Mac, clique sur l’icône **AltServer** dans la barre de menus.
2. Choisis **Install AltStore**, puis sélectionne ton iPhone.
3. Si nécessaire, saisis tes identifiants Apple **dans le logiciel sur TON Mac**, **jamais dans ChatGPT ni dans un dépôt GitHub**.
4. Attends que l’icône **AltStore** apparaisse sur l’écran d’accueil.
5. Sur l’iPhone : **Réglages → Général → VPN et gestion de l’appareil** (nom variable) ; approuve le profil de ton identifiant si demandé.
6. Pour iOS 16 ou plus récent : **Réglages → Confidentialité et sécurité → Mode développeur**, puis suis la procédure de l’iPhone si ce réglage est requis.
7. Ouvre AltStore Classic.

La signature iOS **reste obligatoire** : AltStore et AltServer l’effectuent au moyen de ton compte Apple gratuit.

## 4. Installer Alicia (seulement APRÈS la compilation du fichier IPA)

1. Récupère un vrai fichier `.ipa` de l’application Alicia native, conçu pour iPhone. **Le projet Github ne produit pas encore cet IPA.**
2. Transfère cet IPA dans l’application **Fichiers** de l’iPhone.
3. Ouvre **AltStore Classic → My Apps** et utilise le bouton **+** pour sélectionner l’IPA (selon la version d’AltStore).
4. Laisse AltServer actif pendant l’installation.
5. Vérifie qu’**Alicia** apparaît comme application indépendante sur l’écran d’accueil.

**Ne pas confondre** la PWA Alicia existante (icône Safari) avec l’application Flutter iOS native : la PWA n’utilise pas les signatures de 7 jours et continue de fonctionner séparément.

## 5. Renouvellement gratuit automatique des 7 jours

- Dans le Mac, garde **AltServer ouvert** (idéalement lancé à l’ouverture de session).
- Laisse régulièrement ton Mac **allumé et éveillé** lorsque ton iPhone est sur le **même Wi-Fi**. Un Mac éteint/en veille profonde ne peut pas aider au renouvellement.
- AltStore essaie de **rafraîchir automatiquement** les applications en arrière-plan pendant la semaine. Ce renouvellement n’est **ni garanti à une heure précise, ni possible uniquement depuis Alicia**.
- Sur iPhone, ouvre **AltStore Classic → My Apps** pour regarder les jours restants. Au moins une fois par semaine, vérifie que le compteur est bien remonté.
- Si besoin, avec le Mac et AltServer disponibles, touche **Refresh All** dans AltStore.
- Si une application expire, elle peut cesser de s’ouvrir. Le guide officiel AltStore explique comment réinstaller/réactualiser AltStore sans supprimer ses données dans certains cas ; évite de supprimer Alicia ou de perdre ses sauvegardes.

Documentation officielle du renouvellement : https://faq.altstore.io/altstore-classic/altserver

## 6. En cas de problème

| Problème | Vérification |
|---|---|
| L’iPhone n’apparaît pas | Rebranche en USB, déverrouille, valide la confiance, puis regarde le Finder. |
| « Could not find AltServer » | Vérifie qu’AltServer est ouvert et que Mac/iPhone se voient sur le réseau local ; essaie temporairement le câble. |
| Le renouvellement reste à 1–2 jours | Ouvre AltStore → My Apps → Refresh All avec le Mac éveillé. |
| L’application est expirée | Ne la supprime pas d’emblée. Consulte la procédure AltStore de renouvellement/réinstallation. |
| iPhone en 4G/5G | Reconnecte-le au Wi-Fi ; ce guide ne garantit pas de renouvellement via réseau cellulaire. |
| IPA inexistant | **Étape bloquante actuelle** : compiler Alicia sur un Mac récent ou environnement macOS de compilation compatible. |
| Apple demande de se reconnecter | Effectue l’authentification dans AltServer sur ton Mac. Aucune autorisation ne doit être envoyée à ChatGPT. |

Dépannage officiel : https://faq.altstore.io/altstore-classic/troubleshooting-guide

## 7. Ce que ce système garantit — et ce qu’il ne garantit pas

| Fonction | État |
|---|---|
| Installation personnelle sans abonnement Apple Developer | Possible avec AltStore Classic + compte Apple gratuit. |
| Signer une application native sans aucune signature Apple | **Impossible** sur un iPhone standard. |
| Renouvellement automatique en arrière-plan | **Tenté** par AltStore si AltServer et le réseau sont disponibles ; **non garanti**. |
| Compiler le Flutter récent sur macOS Big Sur 11.7.11 | **Non pris en charge par les versions actuelles.** |
| Installer dès maintenant Alicia native | **Non** : un IPA compilé doit d’abord être produit et testé. |
| Garder Alicia web installée aujourd’hui | **Oui**, sans modifier ni supprimer son installation. |

### Liens officiels

- [AltStore](https://altstore.io/)
- [Installation AltStore Classic sur macOS](https://faq.altstore.io/altstore-classic/how-to-install-altstore-macos)
- [AltServer / renouvellement automatique](https://faq.altstore.io/altstore-classic/altserver)
- [Dépannage AltStore](https://faq.altstore.io/altstore-classic/troubleshooting-guide)
- [Flutter iOS (nécessite une version moderne d’Xcode)](https://docs.flutter.dev/platform-integration/ios/setup)

**Confidentialité :** tu conserves la maîtrise de ton identifiant Apple, de ton Mac et de ton iPhone. Ne transmets jamais ton mot de passe ni un code de validation ici ou sur GitHub.
