/* Académie Alicia : 41 leçons originales hors ligne. Fiches vérifiables, pas un LLM. */
export const LESSONS=[
 {
  "domain": "info",
  "title": "Réseau et Internet",
  "summary": "Le Wi-Fi relie un appareil à un réseau local par ondes radio. Internet est un réseau de réseaux ; le Wi-Fi peut fonctionner sans accès à Internet.",
  "example": "Le Wi-Fi, c’est la route locale ; Internet est le réseau de destinations.",
  "question": "Le Wi-Fi garantit-il une connexion Internet ?",
  "correct": 1,
  "correction": "Wi-Fi et Internet sont distincts.",
  "keywords": "wifi internet réseau",
  "id": "fiche-01",
  "options": [
   "Oui, toujours",
   "Non, pas nécessairement",
   "Seulement sur Mac",
   "Seulement en 5G"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "Matériel et logiciels",
  "summary": "Le processeur exécute des instructions, la RAM contient les données temporaires, et le stockage conserve des fichiers quand l'appareil est éteint.",
  "example": "Le programme tourne en RAM et reste enregistré sur le disque.",
  "question": "Quel composant garde les fichiers après extinction ?",
  "correct": 2,
  "correction": "Le stockage est persistant ; la RAM est volatile.",
  "keywords": "ordinateur ram cpu stockage",
  "id": "fiche-02",
  "options": [
   "RAM",
   "Carte graphique",
   "Stockage",
   "Processeur"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "Système d'exploitation",
  "summary": "Un système d'exploitation gère mémoire, fichiers, périphériques et applications. macOS, iOS, Windows et Linux en sont des exemples.",
  "example": "Une application iOS dépend du système iOS, même si elle utilise un navigateur intégré.",
  "question": "Le rôle principal d'un système d'exploitation est…",
  "correct": 1,
  "correction": "L'OS fait le lien entre matériel et logiciels.",
  "keywords": "macos ios systeme noyau",
  "id": "fiche-03",
  "options": [
   "Colorier l'écran",
   "Gérer les ressources et applications",
   "Fournir l'électricité",
   "Fabriquer le clavier"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "Versions et sauvegardes",
  "summary": "Git conserve l'historique de fichiers. Une branche isole des changements, un commit fixe une étape et une sauvegarde indépendante protège des pertes.",
  "example": "Tester sur une branche avant de modifier la version publique.",
  "question": "À quoi sert une branche Git ?",
  "correct": 1,
  "correction": "Une branche sépare le travail avant fusion.",
  "keywords": "github git branche commit sauvegarde",
  "id": "fiche-04",
  "options": [
   "À sauvegarder les mots de passe",
   "À travailler isolément",
   "À augmenter la RAM",
   "À éteindre le Mac"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "Python : affichage et saisie",
  "summary": "En Python 3.12.9, print() affiche une valeur et input() lit une saisie clavier sous forme de texte.",
  "example": "print(2+3) affiche 5. age=int(input('Âge ? ')) convertit en entier.",
  "question": "Que renvoie input() par défaut ?",
  "correct": 1,
  "correction": "input() renvoie une chaîne str.",
  "keywords": "python 3.12.9 print input",
  "id": "fiche-05",
  "options": [
   "Un nombre entier",
   "Une chaîne de caractères",
   "Un booléen",
   "Un fichier"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "Variables, boucles et fonctions",
  "summary": "Une variable associe un nom à une valeur. Une boucle for répète des étapes. def définit une fonction réutilisable. L'indentation est importante en Python.",
  "example": "for i in range(3): print(i) affiche 0, 1, 2 si print est correctement indenté.",
  "question": "Que permet def en Python ?",
  "correct": 0,
  "correction": "def introduit une définition de fonction.",
  "keywords": "python def for boucle variables",
  "id": "fiche-06",
  "options": [
   "Définir une fonction",
   "Effacer un fichier",
   "Installer Python",
   "Créer une fenêtre"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "VS Code et débogage",
  "summary": "Visual Studio Code édite des fichiers. L'interpréteur Python exécute le code. Le débogueur permet de placer des points d'arrêt pour observer les variables.",
  "example": "Sélectionne l'interpréteur Python de ton projet avant l'exécution.",
  "question": "Un point d'arrêt sert à…",
  "correct": 1,
  "correction": "Un point d'arrêt aide à examiner l'état du programme.",
  "keywords": "vscode visual studio code debugger terminal",
  "id": "fiche-07",
  "options": [
   "Arrêter le réseau",
   "Suspendre le programme pendant le débogage",
   "Supprimer le programme",
   "Créer un dossier"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "info",
  "title": "Données et JSON",
  "summary": "JSON représente des objets, listes, chaînes, nombres, booléens et null. Il sert à transférer des données, pas à exécuter des programmes.",
  "example": "Un objet JSON : {\"jeu\":\"échecs\",\"joueurs\":2}.",
  "question": "JSON sert principalement à…",
  "correct": 1,
  "correction": "JSON est un format de données.",
  "keywords": "json api fichier sauvegarder",
  "id": "fiche-08",
  "options": [
   "Exécuter du code natif",
   "Structurer des données",
   "Remplacer le noyau",
   "Mesurer la tension"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "ia",
  "title": "IA et modèles",
  "summary": "Une intelligence artificielle est un système qui réalise certaines tâches comme classer, reconnaître, prédire ou générer. Un petit moteur à règles n'a pas les capacités d'un grand modèle de langage.",
  "example": "Alicia Original peut chercher des leçons locales ; elle ne devient pas automatiquement un grand modèle.",
  "question": "Alicia peut-elle acquérir toutes les capacités d'un LLM en chargeant quelques fiches ?",
  "correct": 1,
  "correction": "Une bibliothèque de connaissances ne remplace pas l'entraînement d'un modèle.",
  "keywords": "ia intelligence artificielle modele llm",
  "id": "fiche-09",
  "options": [
   "Oui",
   "Non",
   "Uniquement avec du Wi-Fi",
   "Par un changement de couleur"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "ia",
  "title": "Entraînement et inférence",
  "summary": "L'entraînement ajuste les paramètres d'un modèle à partir d'exemples. L'inférence utilise le modèle déjà entraîné pour produire un résultat.",
  "example": "Apprendre une correction locale n'est pas entraîner un réseau neuronal profond.",
  "question": "Que signifie inférence ?",
  "correct": 1,
  "correction": "L'inférence exploite un modèle existant.",
  "keywords": "machine learning entrainement inference",
  "id": "fiche-10",
  "options": [
   "Installer un modèle",
   "Utiliser un modèle pour une prédiction",
   "Effacer les données",
   "Créer une batterie"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "ia",
  "title": "RAG et sources",
  "summary": "Le RAG retrouve des documents pertinents puis les utilise comme contexte. Pour une réponse fiable, il faut citer le document et signaler les informations absentes.",
  "example": "Chercher une procédure dans tes notes puis afficher le passage et son titre.",
  "question": "Si aucun document ne parle du sujet, Alicia doit…",
  "correct": 1,
  "correction": "L'absence de source doit être signalée.",
  "keywords": "rag recherche documents retrieval reranking",
  "id": "fiche-11",
  "options": [
   "Inventer",
   "Dire qu'elle ne sait pas",
   "Changer la date",
   "Copier une autre question"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "ia",
  "title": "Images et profondeur 3D",
  "summary": "Une photo 2D fournit des couleurs et une projection, mais pas directement la géométrie cachée. Un nuage de points calculé par luminosité est un relief approximatif, pas un scanner 3D.",
  "example": "Le verso d'un personnage sur une seule photo n'est pas observable.",
  "question": "Une photo seule permet-elle de connaître exactement le dos d'un objet ?",
  "correct": 1,
  "correction": "La géométrie cachée exige des hypothèses ou des vues supplémentaires.",
  "keywords": "3d image profondeur webgl glb",
  "id": "fiche-12",
  "options": [
   "Oui",
   "Non",
   "Seulement en JPEG",
   "Seulement sur iPhone"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "maths",
  "title": "Fractions",
  "summary": "Une fraction a/b exprime a parts d'un tout divisé en b parts égales, avec b différent de zéro. On peut simplifier en divisant numérateur et dénominateur par un même nombre.",
  "example": "2/4 est équivalent à 1/2.",
  "question": "Quelle fraction est égale à 1/2 ?",
  "correct": 2,
  "correction": "2/4 se simplifie par 2.",
  "keywords": "fraction numerateur denominateur",
  "id": "fiche-13",
  "options": [
   "2/3",
   "3/4",
   "2/4",
   "1/3"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "maths",
  "title": "Aire et périmètre",
  "summary": "Le périmètre mesure la longueur du contour. L'aire mesure une surface. Pour un rectangle, P=2(L+l) et A=L×l.",
  "example": "Pour 5 m par 3 m, P=16 m et A=15 m².",
  "question": "Quelle est l'aire d'un rectangle de 5 m par 3 m ?",
  "correct": 1,
  "correction": "Aire = longueur × largeur.",
  "keywords": "geometrie rectangle aire perimetre",
  "id": "fiche-14",
  "options": [
   "8 m²",
   "15 m²",
   "16 m²",
   "30 m²"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "maths",
  "title": "Proportions",
  "summary": "Une proportion compare des quantités. Pour passer de 2 portions à 6 portions, on multiplie les ingrédients par 3.",
  "example": "Pour 200 g de farine destinés à 2 personnes, il faut 600 g pour 6 personnes.",
  "question": "Si une recette pour 2 nécessite 200 g, combien pour 6 ?",
  "correct": 2,
  "correction": "On multiplie par 6/2 = 3.",
  "keywords": "proportion regle de trois recettes",
  "id": "fiche-15",
  "options": [
   "300 g",
   "400 g",
   "600 g",
   "800 g"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "maths",
  "title": "Pourcentages",
  "summary": "Un pourcentage désigne un nombre de parts sur cent. Calculer 20 % de 150 revient à 0,20×150 = 30.",
  "example": "Une baisse de 10 % puis une hausse de 10 % ne reviennent pas forcément au départ.",
  "question": "20 % de 150 valent…",
  "correct": 2,
  "correction": "0,20 × 150 = 30.",
  "keywords": "pourcentage remise",
  "id": "fiche-16",
  "options": [
   "15",
   "20",
   "30",
   "50"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "science",
  "title": "Matière et atomes",
  "summary": "La matière est constituée d'atomes. Un atome comporte un noyau de protons et neutrons (sauf l'hydrogène le plus courant) et des électrons autour.",
  "example": "L'eau contient deux atomes d'hydrogène et un d'oxygène par molécule.",
  "question": "La formule chimique de l'eau est…",
  "correct": 1,
  "correction": "H₂O correspond à deux H et un O.",
  "keywords": "physique chimie atomes molecules",
  "id": "fiche-17",
  "options": [
   "CO₂",
   "H₂O",
   "O₂",
   "NaCl"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "science",
  "title": "Énergie et électricité",
  "summary": "L'énergie peut changer de forme. Un circuit électrique fermé permet le passage du courant. Une pile fournit une différence de potentiel ; évite de court-circuiter une batterie.",
  "example": "Une LED doit être alimentée avec une tension adaptée et souvent une résistance.",
  "question": "Que se passe-t-il dans un circuit ouvert ?",
  "correct": 1,
  "correction": "L'ouverture coupe la continuité du circuit.",
  "keywords": "electricite energie batterie",
  "id": "fiche-18",
  "options": [
   "Le courant circule normalement",
   "Le courant est interrompu",
   "La batterie se recharge",
   "La résistance disparaît"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "science",
  "title": "Corps et respiration",
  "summary": "Les poumons assurent les échanges gazeux entre air et sang. Le diaphragme aide à faire entrer et sortir l'air. L'oxygène est utilisé par les cellules.",
  "example": "À l'inspiration, le diaphragme se contracte et s'abaisse.",
  "question": "Quel organe aide directement le mouvement respiratoire ?",
  "correct": 0,
  "correction": "Le diaphragme est un muscle respiratoire.",
  "keywords": "corps humain poumons respiration",
  "id": "fiche-19",
  "options": [
   "Diaphragme",
   "Vésicule biliaire",
   "Pancréas",
   "Rein"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "science",
  "title": "Méthode scientifique",
  "summary": "La méthode scientifique implique une question, des hypothèses testables, des observations et une vérification reproductible. Corrélation ne signifie pas nécessairement causalité.",
  "example": "Deux variables qui changent ensemble n'établissent pas automatiquement la cause.",
  "question": "Une corrélation prouve-t-elle toujours une cause ?",
  "correct": 1,
  "correction": "D'autres facteurs peuvent expliquer une corrélation.",
  "keywords": "science preuve hypothese experience",
  "id": "fiche-20",
  "options": [
   "Oui",
   "Non",
   "Seulement sur ordinateur",
   "Seulement en physique"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "geo",
  "title": "Continents et océans",
  "summary": "On compte couramment sept continents selon un découpage géographique : Afrique, Antarctique, Asie, Europe, Amérique du Nord, Amérique du Sud et Océanie. Les cinq océans sont Pacifique, Atlantique, Indien, Austral et Arctique.",
  "example": "Le découpage des continents peut varier selon les conventions scolaires.",
  "question": "Le Pacifique est…",
  "correct": 1,
  "correction": "Le Pacifique est un océan.",
  "keywords": "geographie oceans continents",
  "id": "fiche-21",
  "options": [
   "Un continent",
   "Un océan",
   "Un pays",
   "Une capitale"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "geo",
  "title": "Cartes et échelles",
  "summary": "Une échelle indique le rapport entre une distance sur la carte et sur le terrain. À l'échelle 1:100 000, 1 cm représente 1 km.",
  "example": "2 cm sur une carte au 1:100 000 correspondent à 2 km.",
  "question": "À l'échelle 1:100 000, 1 cm vaut…",
  "correct": 2,
  "correction": "100 000 cm = 1 km.",
  "keywords": "carte echelle kilometre",
  "id": "fiche-22",
  "options": [
   "10 m",
   "100 m",
   "1 km",
   "100 km"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "histoire",
  "title": "Chronologie et sources",
  "summary": "L'histoire étudie des sociétés passées en examinant des traces et documents. Une source primaire date de l'époque étudiée ; une source secondaire l'analyse après coup.",
  "example": "Une lettre écrite pendant un événement peut être une source primaire.",
  "question": "Une lettre de témoin écrite au moment des faits est…",
  "correct": 0,
  "correction": "Elle provient directement de l'époque.",
  "keywords": "histoire sources primaires",
  "id": "fiche-23",
  "options": [
   "Source primaire",
   "Source secondaire",
   "Expérience scientifique",
   "Carte météo"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "histoire",
  "title": "Révolution française",
  "summary": "La Révolution française commence en 1789, notamment avec la réunion des États généraux et la prise de la Bastille le 14 juillet. Ses événements transforment durablement les institutions.",
  "example": "La Déclaration des droits de l'homme et du citoyen est adoptée en août 1789.",
  "question": "En quelle année débute la Révolution française ?",
  "correct": 1,
  "correction": "1789 est une date historique de référence.",
  "keywords": "1789 revolution france",
  "id": "fiche-24",
  "options": [
   "1492",
   "1789",
   "1914",
   "1945"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "francais",
  "title": "Nature des mots",
  "summary": "Un nom désigne une personne, chose ou idée. Le verbe exprime une action ou un état. Un adjectif précise un nom.",
  "example": "Dans « Le chat noir dort », chat est un nom, noir un adjectif, dort un verbe.",
  "question": "Dans « Le chat dort », quel mot est le verbe ?",
  "correct": 2,
  "correction": "Dort est une forme du verbe dormir.",
  "keywords": "grammaire francais orthographe",
  "id": "fiche-25",
  "options": [
   "Le",
   "chat",
   "dort",
   "aucun"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "francais",
  "title": "Accord sujet-verbe",
  "summary": "Le verbe s'accorde en personne et en nombre avec son sujet. Pour trouver le sujet, on peut demander « qui est-ce qui ? » devant le verbe.",
  "example": "« Les enfants jouent » prend -ent au présent à la troisième personne du pluriel.",
  "question": "Quelle phrase est correcte ?",
  "correct": 1,
  "correction": "Le sujet pluriel impose jouent.",
  "keywords": "conjugaison sujet verbe accord",
  "id": "fiche-26",
  "options": [
   "Les enfants joue",
   "Les enfants jouent",
   "Les enfants joues",
   "Les enfants jouer"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "francais",
  "title": "Résumé et rédaction",
  "summary": "Un bon résumé reformule l'idée principale et les informations essentielles sans copier longuement ni ajouter des opinions. Une rédaction organise introduction, développement et conclusion.",
  "example": "Lire, relever les idées, organiser, reformuler, relire.",
  "question": "Un résumé doit-il ajouter de nouveaux faits ?",
  "correct": 1,
  "correction": "Le résumé doit rester fidèle au texte.",
  "keywords": "resume redaction college 6eme",
  "id": "fiche-27",
  "options": [
   "Oui",
   "Non",
   "Toujours une blague",
   "Toujours une liste de références inventées"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "jeux",
  "title": "Échecs : objectif",
  "summary": "Aux échecs, le but est de mettre le roi adverse échec et mat : il est attaqué et aucune réponse légale ne peut sauver le roi.",
  "example": "On ne capture pas effectivement le roi lors d'une partie régulière.",
  "question": "Qu'est-ce qu'un échec et mat ?",
  "correct": 0,
  "correction": "Échec et mat termine la partie.",
  "keywords": "echecs chess roi mat",
  "id": "fiche-28",
  "options": [
   "Un roi attaqué sans coup légal pour échapper",
   "Deux dames sur la table",
   "Une partie nulle",
   "Un pion promu"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "jeux",
  "title": "Échecs : roque",
  "summary": "Le roque est un déplacement spécial du roi et d'une tour, autorisé sous conditions : ni l'un ni l'autre n'ont bougé, aucune pièce entre eux et le roi n'est pas en échec, ne traverse ni n'arrive sur une case attaquée.",
  "example": "Le petit roque des Blancs amène le roi en g1 et la tour en f1.",
  "question": "Peut-on roquer en étant en échec ?",
  "correct": 1,
  "correction": "Le roi ne peut pas roquer depuis une position d'échec.",
  "keywords": "echecs roque",
  "id": "fiche-29",
  "options": [
   "Oui",
   "Non",
   "Seulement avec deux tours",
   "Seulement à quatre joueurs"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "jeux",
  "title": "Échecs : promotion",
  "summary": "Lorsqu'un pion atteint sa dernière rangée, il est promu en dame, tour, fou ou cavalier de sa couleur. Il n'est pas obligatoire de choisir une dame.",
  "example": "Une promotion en cavalier peut créer une fourchette.",
  "question": "En quoi peut-on promouvoir un pion ?",
  "correct": 1,
  "correction": "Ce sont les quatre choix réglementaires.",
  "keywords": "echecs promotion pion",
  "id": "fiche-30",
  "options": [
   "En roi",
   "En dame, tour, fou ou cavalier",
   "En pion adverse",
   "En deux rois"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "jeux",
  "title": "Shogi",
  "summary": "Au shogi japonais, les pièces capturées peuvent généralement être réintroduites sur l'échiquier par leur nouveau propriétaire sous certaines restrictions.",
  "example": "Le parachutage d'une pièce change considérablement la stratégie.",
  "question": "Que peut-on faire avec une pièce capturée au shogi ?",
  "correct": 1,
  "correction": "Le parachutage est une mécanique centrale du shogi.",
  "keywords": "shogi japonais pieces",
  "id": "fiche-31",
  "options": [
   "Jamais la réutiliser",
   "La réintroduire selon les règles",
   "La remplacer par un dé",
   "La donner à l'arbitre"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "jeux",
  "title": "Go : intersections",
  "summary": "Au Go, les pierres se posent sur les intersections de la grille, pas au milieu des carrés. Le goban 9×9 a 81 points, le 13×13 en a 169 et le 19×19 en a 361.",
  "example": "Un goban de 19 lignes horizontales et 19 verticales contient 361 intersections.",
  "question": "Combien d'intersections compte un goban de 9×9 ?",
  "correct": 1,
  "correction": "9 multiplié par 9 donne 81.",
  "keywords": "go goban pierres intersections",
  "id": "fiche-32",
  "options": [
   "64",
   "81",
   "90",
   "100"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "cyber",
  "title": "Mots de passe et secrets",
  "summary": "Un mot de passe doit être long, unique par service et protégé. Un gestionnaire de mots de passe facilite cette pratique. La double authentification ajoute une protection.",
  "example": "Ne colle jamais tes clés API ou mots de passe dans les notes publiques GitHub.",
  "question": "Peut-on publier sa clé API sur GitHub ?",
  "correct": 1,
  "correction": "Une clé API est un secret et ne doit pas être publié.",
  "keywords": "cybersecurite mot de passe secret api",
  "id": "fiche-33",
  "options": [
   "Oui",
   "Non",
   "Seulement un mardi",
   "Seulement dans un README"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "cyber",
  "title": "Sites et liens",
  "summary": "HTTPS chiffre les échanges avec un site et permet d'authentifier son domaine, mais ne garantit pas à lui seul qu'un vendeur ou contenu soit honnête.",
  "example": "Vérifie l'adresse exacte, les avis crédibles et les conditions d'achat.",
  "question": "Un cadenas HTTPS prouve-t-il qu'un site est commercialement fiable ?",
  "correct": 1,
  "correction": "HTTPS protège la connexion, pas toute la confiance.",
  "keywords": "https phishing internet",
  "id": "fiche-34",
  "options": [
   "Oui",
   "Non",
   "Seulement sur Mac",
   "Seulement en France"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "administratif",
  "title": "Accueil professionnel",
  "summary": "Un agent d'accueil écoute, reformule le besoin, oriente vers le bon service et protège la confidentialité. La qualité de l'accueil tient à la clarté et à l'impartialité.",
  "example": "Avant de transmettre un document personnel, vérifier la procédure et le destinataire.",
  "question": "Face à une demande confidentielle, il faut…",
  "correct": 1,
  "correction": "Confidentialité et bonne orientation sont essentielles.",
  "keywords": "accueil gestion administrative metier",
  "id": "fiche-35",
  "options": [
   "La publier",
   "Respecter la confidentialité et les procédures",
   "La raconter aux collègues",
   "Deviner la réponse"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "administratif",
  "title": "Classement des dossiers",
  "summary": "Un classement cohérent utilise des noms explicites, des dates, des versions et des droits d'accès adaptés. Le plan de classement doit être compréhensible par les personnes autorisées.",
  "example": "2026-10-16_facture_version-01.pdf est un nom plus précis que document3.pdf.",
  "question": "Qu'est-ce qu'un bon classement ?",
  "correct": 1,
  "correction": "Cohérence et traçabilité facilitent le travail.",
  "keywords": "dossier administratif classement archivage",
  "id": "fiche-36",
  "options": [
   "Des noms au hasard",
   "Une organisation cohérente et traçable",
   "Un seul dossier sans règles",
   "La suppression immédiate des documents"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "art",
  "title": "Couleurs et contrastes",
  "summary": "La couleur se décrit notamment par teinte, saturation et luminosité. Pour une interface lisible, le contraste texte-fond est important. Les couleurs n'ont pas une signification universelle.",
  "example": "Texte clair sur fond bleu très sombre peut être lisible si le contraste est suffisant.",
  "question": "Pour faciliter la lecture, il faut vérifier…",
  "correct": 1,
  "correction": "Le contraste facilite l'accessibilité.",
  "keywords": "dessin couleurs design arts",
  "id": "fiche-37",
  "options": [
   "La taille seule",
   "Le contraste",
   "La marque du téléphone",
   "La vitesse du Wi-Fi"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "art",
  "title": "Perspective en dessin",
  "summary": "La perspective linéaire représente la profondeur avec des lignes qui convergent vers un ou plusieurs points de fuite. Elle sert à représenter des objets 3D sur une surface 2D.",
  "example": "Les lignes parallèles d'une route semblent se rejoindre vers l'horizon.",
  "question": "À quoi sert un point de fuite ?",
  "correct": 1,
  "correction": "La convergence suggère la profondeur.",
  "keywords": "dessin perspective art",
  "id": "fiche-38",
  "options": [
   "Créer un mot de passe",
   "Représenter la profondeur",
   "Corriger les fautes",
   "Mesurer le son"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "musique",
  "title": "Notes et rythme",
  "summary": "En musique occidentale, on utilise notamment do, ré, mi, fa, sol, la, si. Le tempo indique la vitesse des pulsations, souvent exprimée en battements par minute.",
  "example": "Un tempo de 60 BPM correspond à une pulsation par seconde.",
  "question": "Que signifie BPM ?",
  "correct": 0,
  "correction": "BPM exprime la vitesse du tempo.",
  "keywords": "musique rythme tempo chant",
  "id": "fiche-39",
  "options": [
   "Battements par minute",
   "Bases par modèle",
   "Bruits par mélodie",
   "Barres par mesure"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "musique",
  "title": "Hauteur et intensité",
  "summary": "La hauteur d'un son est liée à sa fréquence. L'intensité sonore dépend de l'amplitude et se mesure selon un niveau exprimé en décibels. Le timbre distingue les sources sonores.",
  "example": "Une flûte et un violon peuvent jouer une même note avec des timbres différents.",
  "question": "Deux instruments peuvent-ils jouer la même note avec des timbres différents ?",
  "correct": 0,
  "correction": "Le timbre dépend du contenu spectral et de l'évolution du son.",
  "keywords": "musique son fréquence timbre",
  "id": "fiche-40",
  "options": [
   "Oui",
   "Non",
   "Seulement en studio",
   "Seulement en mineur"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 },
 {
  "domain": "robotique",
  "title": "Capteurs et actionneurs",
  "summary": "Un capteur mesure une grandeur (lumière, distance, température), un actionneur agit sur le monde (moteur, voyant, servomoteur). Un programme relie observation et action.",
  "example": "Si un capteur détecte un obstacle, le robot peut arrêter son moteur.",
  "question": "Un moteur est généralement…",
  "correct": 1,
  "correction": "Un moteur produit un mouvement.",
  "keywords": "robot robotique ingenierie moteur capteurs",
  "id": "fiche-41",
  "options": [
   "Un capteur",
   "Un actionneur",
   "Un navigateur",
   "Une donnée JSON"
  ],
  "revision": 1,
  "source": "Cours original Alicia — connaissances pédagogiques générales, révision 2026"
 }
];

const STOP=new Set(["comment","quelle","quel","quelles","quels","quoi","est","sont","les","des","une","dans","pour","sur","par","avec","sans","plus","qui","que","une","un","la","le","du","de","et","ou","au","aux","en","je","tu","nous","vous","mes","mon","ma","ton","vos","explique","expliquer","reponds","dis","donne","parle","fiche","cours","sujet","sais","selon"]);
export function norm(value){return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();}
const tok=s=>norm(s).split(" ").filter(x=>x.length>2&&!STOP.has(x)).map(x=>x.length>5?x.replace(/(ement|ation|iques|ique|eurs|eur|ons|ent|es|s)$/,""):x);
const docTerms=lesson=>new Set(tok(lesson.title+" "+lesson.keywords));
export function subjects(){return [...new Set(LESSONS.map(x=>x.domain))].sort();}
export function searchLessons(query,{domain="all",limit=5}={}){
 const qt=[...new Set(tok(query))];
 const candidates=LESSONS.filter(x=>domain==="all"||x.domain===domain);
 if(!qt.length)return candidates.slice(0,limit);
 const matches=[];
 for(const lesson of candidates){
  const titleTerms=docTerms(lesson),fullTerms=new Set(tok(lesson.summary+" "+lesson.example));
  const found=qt.filter(x=>titleTerms.has(x)||fullTerms.has(x));
  if(!found.length)continue;
  const coverage=found.length/qt.length;
  if(qt.length>=4&&coverage<.4)continue;
  const special=qt.some(x=>titleTerms.has(x));
  const score=found.reduce((n,x)=>n+(titleTerms.has(x)?5:1),0)+coverage*3+(special?2:0);
  matches.push({lesson,score,coverage});
 }
 return matches.sort((a,b)=>b.score-a.score||a.lesson.id.localeCompare(b.lesson.id))
               .slice(0,Math.max(1,Math.min(20,limit))).map(({lesson,score,coverage})=>({...lesson,score,coverage}));
}
export function answerFromLesson(query){
 const q=norm(query);
 if(!q||q.length>400)return null;
 const results=searchLessons(query,{limit:2});
 if(!results.length||results[0].score<5||results[0].coverage<.4)return null;
 const best=results[0];
 return {answer:best.title+"\n\n"+best.summary+"\n\nExemple : "+best.example+
    "\n\nPour vérifier ta compréhension : "+best.question+
    "\n\nRéférence : "+best.source+" — "+best.id+".",
   local:true,verified:false,provider:"Bibliothèque pédagogique Alicia",
   lessonId:best.id,confidence:best.coverage,sources:[]};
}
export function lessonById(id){return LESSONS.find(x=>x.id===id)||null;}
export function gradeLesson(id,choice){
 const lesson=lessonById(id);
 if(!lesson||!Number.isInteger(choice)||choice<0||choice>3)return {ok:false,reason:"Question ou réponse invalide."};
 return {ok:true,correct:choice===lesson.correct,
  expected:lesson.options[lesson.correct],explanation:lesson.correction,lessonId:id};
}
export function selfCheckAcademy(){
 const failures=[];
 for(const lesson of LESSONS){
  const hit=answerFromLesson(lesson.title);
  if(!hit||hit.lessonId!==lesson.id)failures.push(lesson.id+": recherche de la leçon ambiguë");
  const r=gradeLesson(lesson.id,lesson.correct);
  if(!r.ok||!r.correct)failures.push(lesson.id+": réponse-corrigé incohérente");
 }
 return {tested:LESSONS.length,passed:LESSONS.length-failures.length,failures};
}
