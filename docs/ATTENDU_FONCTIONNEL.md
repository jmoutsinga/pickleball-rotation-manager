# Attendu fonctionnel

Ce document décrit le comportement attendu de l’application indépendamment de son état d’implémentation.
La progression et la prochaine action sont suivies dans [`PLAN.md`](../PLAN.md).


## Fondations communes

- Introduire les modèles métier :
  - Location : id, name, description, nbCourts, status ;
  - Player : id, name ;
  - Court ;
  - Session ;
  - Rotation ;
  - probablement Game ou CourtResult pour les équipes et scores.
- Centraliser l’initialisation des données afin que chaque route fonctionne même lorsqu’elle est ouverte directement.
- Corriger la persistance des joueurs et de leurs affectations.
- Uniformiser les types d’identifiants.
- Séparer l’état métier, la persistance et l’interface.
- Décider à quel moment effectuer la migration Vuex → Pinia.
- À terme, remplacer ou encapsuler le localStorage derrière un service compatible avec la future persistance SQLite.

## Vue Home

- Supprimer le simple lien « Start Managing Session ».
- Charger et afficher les Locations existantes.
- Chaque Location est affichée sous forme de carte (composant réutilisable LocationCard).
- La première carte affichée en haut à gauche est une carte spéciale permettant de créer une Location.
- La création d'une Location est faite dans une fenêtre modale commune à la création et à l'édition.
- La carte d'une Location contient :
  - son nom ;
  - une commande Edit représentée par un crayon moderne dans un bouton circulaire ;
  - une commande Delete représentée par une poubelle au couvercle légèrement ouvert dans un bouton circulaire ;
  - les deux commandes placées côte à côte, Edit à gauche de Delete, dans un rail centré horizontalement, entièrement contenu dans la carte avec un retrait de 3 px sous la bordure supérieure ;
  - les commandes Edit/Delete visibles uniquement lorsque la Location est sélectionnée ;
  - lorsque la Location est sélectionnée, une action de Session en haut à droite, dont le cercle est séparé de 4 px des bordures supérieure et droite ;
  - Start utilise un pictogramme Play rond vert `#42b983`, 1,3 fois plus grand qu'Edit, avec le libellé court « Start » ;
  - Manage utilise un pictogramme Fast Forward rond orange `#FFAA1F`, de même taille, avec le libellé court « Continue » ;
  - le rail Edit/Delete, le titre, le nombre de courts et la description restent centrés sur l'axe de la carte.
- Permettre de sélectionner une Location.
- Le bouton "Start / Manage Session" n'est visible que sur la carte de la Location sélectionnée.
- L'ouverture de Create Location et toute interaction dans une modale Create/Edit/Delete conservent la Location sélectionnée ; seuls les clics réellement extérieurs déclenchent la désélection.
- Permettre de créer une Location avec :
  - un nom obligatoire ;
  - une description ;
  - un nombre de courts entier compris entre 1 et 50 inclus.
- Sauvegarder la nouvelle Location.
- Après une création réussie, sélectionner automatiquement la nouvelle Location et remplacer toute sélection antérieure.
- Autoriser la modification de `nbCourts` uniquement si aucune Session de la Location n'est `STARTED` ; l'absence de Session et un historique entièrement `FINISHED` autorisent la modification.
- Demander confirmation dans une modale avant toute suppression de Location.
- Après confirmation, déclencher la suppression logique afin de masquer la Location active tout en conservant ses références historiques.
- Rediriger vers la vue ManageSession après click sur le bouton "Start / Manage Session" de la carte Location sélectionnée.
- Transmettre l’identité de la Location et de la session dans l’URL, idéalement :
  `/manage/:locationId/:sessionId`

La route devient ainsi partageable et rechargeable sans dépendre d’une sélection uniquement conservée en mémoire.

## Vue Manage Players

- Corriger le chargement des joueurs lors d’un accès direct à la route.
- Charger tous les Players dans un store dédié, indépendamment de l'initialisation d'une Session.
- Remplacer la table actuelle par `CardGrid`, avec `CreateEntityCard` « Create Player » en première position puis une `PlayerCard` par Player visible.
- Sélectionner une seule PlayerCard à la fois et afficher ses commandes contextuelles sans les laisser dans l'ordre de tabulation hors sélection.
- Créer `PlayerForm`, limité au nom, et réutiliser une fenêtre `BaseModal` commune à la création et à l'édition.
- Après création, sélectionner le nouveau Player ; pendant l'édition, préserver identifiant, statut et sélection.
- Rechercher dynamiquement par sous-chaîne contiguë insensible à la casse et aux accents.
- Masquer par défaut les Players `DELETED` et ajouter le toggle « Show Deleted Players ».
- Demander confirmation avant de passer un Player à `DELETED`; refuser si ce Player est référencé par une Session `STARTED`.
- Ne jamais supprimer physiquement un Player afin de préserver l'historique des Sessions terminées.
- Afficher les Players supprimés sur fond gris, sans Edit/Delete, avec une action Restore accessible et centrée en haut lorsqu'ils sont sélectionnés.
- Restaurer un Player vers `AVAILABLE` en conservant sa carte sélectionnée.

## Vue Manage Session

- Charger la Location et la Session depuis l’identifiant de route.
- Vérifier que la Session est liée à la Location et qu'elle est dans l'état 'STARTED'.
- Si la Session est en état 'FINISHED', afficher une fenêtre modale avec le message 'Cette session est terminée, souhaitez-vous démarrer une nouvelle session ?' :
  - Si oui, créer une nouvelle Session dont session.order est initialisé à max+1 de toutes les sessions de cette location (max(location.sessions.order) + 1) puis rediriger vers la vue ManageSession avec cette nouvelle Session.
  - Si non, fermer la fenêtre modale et rediriger vers la vue Home.
- Afficher « Training Session Manager » comme titre principal de la vue.
- Afficher `Location.name # Session order` comme identité de la préparation et de la Session démarrée.
- Afficher un bouton « New Rotation ».
- Créer une nouvelle Rotation liée à la Session.
- Stocker l'horaire de début de la rotation.
- les Game Cards sont initialisées avec :
  - un titre "Game #number".
  - une TeamCard A et une TeamCard B.
  - un input dans chaque TeamCard pour la saisie des scores à la fin de la rotation. Ces inputs sont initialement cachés et disabled.
- Initialiser les Court Cards de cette rotation à partir de `location.nbCourts`.
- Initialiser les Game Cards de cette rotation de chaque Court avec Game.number = session.getNextGameNumber(). La GameCard contient le bloc Team A vs Team B ainsi que les 2 inputs pour l'enregistrement des scores à la fin de la rotation. Elle a également un titre "Game #1" où #1 est le numéro de la game dans la session.
- Initialiser la liste des joueurs disponible en récupérant tous les joueurs existant dans la base.
- Un bouton « Start Rotation » permet de lancer la rotation et le compte à rebours.
  - Ce bouton est visible uniquement quand la rotation est en status 'CREATED' avant le lancement.
  - Ce bouton passe la rotation en status 'IN_PROGRESS' (matchs en cours).
  - Ce bouton fige toutes les Teams liées à la rotation ainsi que les joueurs présents dans la OffCourtPlayers.
- Changer le titre de la OffCourtPlayers liste suivant le status de la Rotation :
  - Available Players quand la rotation est en status 'CREATED' avant le lancement ;
  - Waiting Players quand la rotation est en status 'IN_PROGRESS' (matchs en cours);
- Ajouter un minuteur paramétrable :
  - valeur ;
  - unité secondes ou minutes ;
  - affichage du temps restant.
- Pendant une rotation en cours (status 'IN_PROGRESS'), aucun changement n'est possible :
  - Toutes les Teams liées à la rotation ainsi que les joueurs présents dans la OffCourtPlayers sont figées
  - les inputs des scores sont disabled.
- Ajouter deux scores à chaque terrain :
  - score Team A dans la TeamCard sous le bloc Team A;
  - score Team B dans la TeamCard sous le bloc Team B.
- Les input des scores sont disabled tant que le compte à rebours n'est pas terminé.
- Dès la fin du compte à rebours :
  - les input des scores sont enabled et requis (Autoriser uniquement des entiers entre 0 et 100).
  - Afficher un bouton « Compute Next Rotation » qui est clickable uniquement lorsque tous les scores ont été saisis.
- Lors de son activation, enregistrer :
  - les équipes de chaque terrain ainsi que leur score respectif ;
  - déterminer pour chaque game quelle est la winnerTeam et la looserTeam (la winnerTeam est celle ayant le plus haut score, l'autre team est automatiquement la looserTeam) ;
  - si les scores d'une game sont identiques (score TeamA = score TeamB), sur la gameCard, un texte 'WINNER ?' apparaît à coté du titre de la GameCard, permettre de désigner la winnerTeam en cliquant soit sur la TeamCard TeamA, soit sur la TeamCard TeamB ;
  - les joueurs en attente ;
  - l’ordre ou le numéro de rotation ;
  - l'horaire de fin de la rotation.
- Calculer la nouvelle affectation de chaque joueur pour la rotation suivante en suivant les règles suivantes :
  - Les joueurs de la winnerTeam sont affectés sur le Court number-1 de la game et les 2 joueurs sont réafectés : Player1 dans la TeamA, Player2 dans la TeamB
  - Les joueurs de la looserTeam sont affectés sur le Court number+1 de la game et les 2 joueurs sont réafectés : Player1 dans la TeamA, Player2 dans la TeamB
  - La winnerTeam de la game du premier Court reste sur le même Court et les 2 joueurs sont réafectés : Player1 dans la TeamA, Player2 dans la TeamB
  - La looserTeam de la game du dernier Court reste sur le même Court et les 2 joueurs sont réafectés : Player1 dans la TeamA, Player2 dans la TeamB
  - Durant le calcul de la nouvelle affectation, chaque waiting player de la liste va remplacer un des 2 joueurs de la looserTeam en commençant par les joueurs sur le Court ayant le plus grand number puis en remontant vers le Court ayant le plus petit number
  - Les joueurs remplacés seront ajoutés à la fin de la OffCourtPlayers liste.
  - Lorsque toutes les affectations ont été effectuées, la nouvelle rotation est affichée et prête à être lancée.
  - La nouvelle rotation peut être lancée en cliquant sur le bouton « Start Rotation ».
  - Tant que la Rotation n'est pas lancée :
    - tous les joueurs présents sur les Court peuvent être manuellement réaffectés.
    - le drag/drop d'un joueur d'une TeamCard sur un autre joueur d'une autre TeamCard change les 2 joueurs de Team
    - le drag/drop d'un joueur d'une TeamCard sur un joueur de la OffCourtPlayers liste interverti les 2 joueurs. Le joueur de la Team est ajouté à la liste des waiting players. Le joueur de la waiting players est ajouté à la Team.
- Extraire les composants :
  - SessionTimer ;
  - RotationCard ;
  - CourtCard ;
  - GameCard ;
  - TeamCard ;
  - ScoreInput ;
  - PlayerCard ;
  - OffCourtPlayers.

### Cycle de vie d’une Session et d’une Rotation


Une petite machine à états évitera de disperser les conditions dans le template :

```text
SETUP
  │ Start / Manage Session
  ▼
STARTED
  │ New Rotation
  ▼
CREATED
  │ Configuration des éléments de la rotation
  │ Start Rotation
  ▼
IN_PROGRESS
  │ Minuteur à zéro
  ▼
SCORING
  │ Compute Next Rotation
  ▼
STARTED (rotation suivante)
  │ Compute Next Rotation
  ▼
CREATED
  │ Configuration des éléments de la nouvelle rotation en utilisant les résultats de l'algorithme de réaffectation des joueurs
  │ Start Rotation
  ▼
IN_PROGRESS
  │ Minuteur à zéro
  ▼
SCORING
  │ End Session
  ▼
FINISHED (session terminée)
```

- SETUP : vérification du status de la session pour affichage de la session en cours ou proposition de création d'une nouvelle session.
- STARTED : session en status 'STARTED'. Le bouton "New Rotation" permet de lancer la création de la rotation.
- CREATED : session en status 'STARTED'. Rotation en status 'CREATED'. Affichage de la RotationCard en utilisant les données de la rotation, de la session et de la location. C'est à cette étape que la rotation est configurée : setup des Courts, des Games, de la OffCourtPlayers liste, composition des équipes par drag & drop, équipes modifiables, input scores des GameCards cachés et désactivés. Le bouton "Start Rotation" permet de mettre la rotation en status 'IN_PROGRESS'.
- IN_PROGRESS : parties en cours, titre du composant OffCourtPlayers renommée en Waiting Players, toutes les informations de la Rotation ne sont plus modifiables. Minuteur démarre. Compte à rebours jusqu'à zero. A la fin du minuteur, la rotation passe automatiquement au status 'SCORING'.
- SCORING : Les inputs des scores de toutes les Games deviennent visibles et doivent être saisis (requis). La rotation est en status 'SCORING'. Les boutons "Compute Next Rotation" et "End Session" sont disponibles. Le bouton "Compute Next Rotation" permet de passer la rotation en cours du status 'SCORING' au status 'FINISHED', de lancer le calcul de réaffactation des joueurs dans la prochaine rotation, de créer la prochaine rotation (status 'CREATED') en l'initialisant avec le résultat du calcul des réaffectations des joueurs. Puis, d'afficher cette nouvelle rotation dans la page (composant RotationCard rendu à partir de la nouvelle rotation). Le bouton "End Session" permet de mettre la rotation en cours au status 'FINISHED' et de terminer la session (status de la Session passe de 'STARTED' à 'FINISHED').
- FINISHED : La session est en status 'FINISHED'. La rotation est en status 'FINISHED'. La rotationCard indique que la rotation est terminée. Un nouveau bouton "New Session" permet de créer une nouvelle session.
