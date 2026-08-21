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
- Avant validation et affichage, migrer les Sessions historiques qui ne respectent pas encore le nombre de Courts utilisables : conserver les Games des premiers Courts, replacer les autres Players hors Court, supprimer les Teams devenues orphelines et renuméroter les Games sans trou.
- Conserver la page 404 pour les identifiants absents, les relations Location/Session invalides et les Sessions terminées.
- Pour une erreur interne de migration, de graphe ou de chargement, générer un UUID, journaliser cet UUID avec un code d’erreur stable et rediriger vers `/500`.
- La page 500 affiche « erreur interne, merci de contacter l'administrateur en indiquant ce code erreur : codeErreur - uuidErreur », permet de copier ce message avec un pictogramme de copie, confirme temporairement par « message copié » et propose « Back to Home ».
- Si la Session est en état 'FINISHED', afficher une fenêtre modale avec le message 'Cette session est terminée, souhaitez-vous démarrer une nouvelle session ?' :
  - Si oui, créer une nouvelle Session dont session.order est initialisé à max+1 de toutes les sessions de cette location (max(location.sessions.order) + 1) puis rediriger vers la vue ManageSession avec cette nouvelle Session.
  - Si non, fermer la fenêtre modale et rediriger vers la vue Home.
- Afficher « Training Session Manager » comme titre principal de la vue.
- Afficher une seule fois `Location.name # Session order` dans l'en-tête sticky de `ManageSession`, pendant la préparation comme après le démarrage.
- Donner à ce `<h2>` d'identité la même taille que le `<h1>` principal.
- Pendant la préparation, afficher dans ce même en-tête le bouton « Start Session », désactivé tant que moins de quatre Players participent à la Session.
- Dès que la Session est `STARTED`, remplacer cette commande d’en-tête par « End Session », placé à droite de l’identité. L’activer lorsque la Rotation courante est encore `CREATED`, ou lorsqu’elle est `SCORING` et que « Next Rotation » est effectivement cliquable, sans Game rouverte avec KO.
- Un clic sur « End Session » depuis une Rotation `SCORING` résolue conserve tous ses scores, termine la Rotation puis la Session avec le même instant et redirige vers Home.
- Un clic sur « End Session » depuis une Rotation `CREATED` jamais démarrée retire cette Rotation et ses Teams orphelines de la persistance, termine la Session puis redirige vers Home.
- Après démarrage de la Session, afficher `Rotation N° order` dans un `<h3>` de `1.5rem`, au sein d'un second en-tête sticky placé immédiatement sous celui de la Session.
- Afficher un bouton « New Rotation ».
- Créer une nouvelle Rotation liée à la Session.
- Stocker l'horaire de début de la rotation.
- les Game Cards sont initialisées avec :
  - un titre `<h4>` « Game N°number » aligné en haut à gauche.
  - une TeamCard A et une TeamCard B dont le titre est centré sur toute la largeur, indépendamment de la présence du marqueur W/L.
  - un input numérique sous le titre de chaque TeamCard pour la saisie directe des scores ; ces inputs ne sont rendus qu'après le passage en `SCORING`, leur valeur est centrée et leur largeur est limitée à trois chiffres. Des boutons − et + permettent aussi de modifier chaque valeur entre 0 et 100 ; ils sont désactivés avec l’input après validation. Les trois contrôles sont regroupés dans un `fieldset` sémantique dont le rendu reste compact, sans bordure ni padding natifs, y compris en portrait smartphone.
- Initialiser les Court Cards de chaque Rotation à partir de tous les Courts physiques de la Location.
- Déterminer le nombre de Courts utilisables pendant toute la Session avec `min(location.nbCourts, floor(session.attendingPlayers.length / 4))` : 4–7 Players utilisent 1 Court, 8–11 en utilisent 2, 12–15 en utilisent 3, et ainsi de suite.
- Utiliser toujours les Courts depuis le numéro 1 dans l’ordre croissant. Afficher les Courts physiques suivants sur fond gris, avec la mention « Inutilisé » sous leur nom, sans Game, Team ni possibilité de drag & drop.
- Initialiser une Game Card uniquement pour chaque Court utilisable de la Rotation avec Game.number = session.getNextGameNumber(). La GameCard contient le bloc Team A vs Team B ainsi que les deux inputs pour l'enregistrement des scores à la fin de la rotation. Elle a également un titre « Game N°1 », où 1 est le numéro de la Game dans la Session.
- Initialiser la liste des joueurs disponible en récupérant tous les joueurs existant dans la base.
- Un bouton « Start Rotation » permet de lancer la rotation et le compte à rebours.
  - Ce bouton est visible uniquement quand la rotation est en status 'CREATED' avant le lancement.
  - Ce bouton reste désactivé tant que chaque Game ne possède pas exactement deux Players dans Team A et deux Players dans Team B.
  - La même composition complète est validée par le cas d'usage avant toute transition, y compris lors d'un appel direct sans passer par l'interface.
  - Ce bouton passe la rotation en status 'IN_PROGRESS' (matchs en cours).
  - Ce bouton fige toutes les Teams liées à la rotation ainsi que les joueurs présents dans la OffCourtPlayers.
- Pendant `IN_PROGRESS`, remplacer « Start Rotation » par « Stop Rotation ». En attendant l'implémentation du minuteur, cette commande manuelle passe la Rotation à `SCORING`; elle disparaît après la transition.
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
  - la GameCard devient orange tant que sa saisie est ouverte ; un bouton icône OK placé sous `VS` persiste les deux scores et verrouille les inputs.
  - après OK, une Game résolue passe sur fond vert clair, le bouton devient KO et une coche SVG verte apparaît en haut à droite ; la Team gagnante reçoit une bordure `4px solid #ff4600` et la perdante une bordure grise de `2px`.
  - dans une Game résolue, afficher un marqueur rond W dans la Team gagnante et L dans la perdante, de la couleur de leur bordure respective ; le marqueur est toujours en haut à droite de Team A et en haut à gauche de Team B.
  - KO conserve le dernier score et son résultat persistés pendant l’édition, préremplit les inputs redevenus saisissables, retire temporairement la coche, les bordures et les marqueurs W/L de résultat, puis remet la GameCard sur fond orange jusqu'au prochain OK.
  - si les scores sont égaux après OK, afficher « WINNER ? » entre les titres des Teams et permettre de désigner le gagnant par clic ou clavier sur l'une des TeamCards avant de considérer la Game résolue. Pendant ce choix, mettre en surbrillance grise uniquement la TeamCard survolée par le pointeur. Après KO, toute nouvelle validation OK de scores toujours égaux invalide le choix manuel précédent et redemande obligatoirement le gagnant, même si les valeurs n’ont pas changé.
  - Afficher un bouton « Next Rotation », désactivé tant que toutes les Games ne sont pas résolues ou qu'au moins une Game est rouverte localement par KO.
- Lors de son activation, enregistrer :
  - les équipes de chaque terrain ainsi que leur score respectif ;
  - déterminer pour chaque game quelle est la winnerTeam et la looserTeam (la winnerTeam est celle ayant le plus haut score, l'autre team est automatiquement la looserTeam) ;
  - si les scores d'une game sont identiques (score TeamA = score TeamB), sur la gameCard, un texte 'WINNER ?' apparaît à coté du titre de la GameCard, permettre de désigner la winnerTeam en cliquant soit sur la TeamCard TeamA, soit sur la TeamCard TeamB ;
  - les joueurs en attente ;
  - l’ordre ou le numéro de rotation ;
  - l'horaire de fin de la rotation.
- « Next Rotation » valide à nouveau que toutes les Games sont résolues, termine la Rotation courante, puis appelle `RotationService.planNextRotation(currentGames)` avec l'ensemble de ses Games.
- Dans un premier incrément, `planNextRotation()` retourne un plan structurel sans affectation de Player : une nouvelle Game sur chacun des mêmes Courts utilisables, deux nouvelles Teams vides par Game et une numérotation poursuivie à l’échelle de la Session. La nouvelle Rotation est créée en `CREATED`, avec l'ordre suivant et tous les participants replacés dans `waitingPlayers` ; `Start Rotation` reste désactivé jusqu’à ce que chaque Team contienne deux Players.
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
    - le drag/drop direct d’un joueur sur un autre joueur intervertit leurs positions exactes, y compris entre deux Teams d’un même Court ou de Courts différents et entre les deux slots d’une même Team.
    - le même échange fonctionne dans les deux sens entre une TeamCard et la OffCourtPlayers liste : le joueur de la Team prend exactement l’indice libéré dans `waitingPlayers` et le joueur hors Court prend exactement son slot `player1` ou `player2`.
    - l’échange fonctionne à la souris, au doigt et au stylet ; il est refusé dès que la Rotation n’est plus `CREATED`.
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
  │ Next Rotation
  ▼
STARTED (rotation suivante)
  │ Next Rotation
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
- CREATED : session en status 'STARTED'. Rotation en status 'CREATED'. Affichage de la RotationCard en utilisant les données de la rotation, de la session et de la location. C'est à cette étape que la rotation est configurée : setup des Courts, des Games, de la OffCourtPlayers liste, composition des équipes par drag & drop, équipes modifiables, input scores des GameCards cachés et désactivés. Le bouton "Start Rotation" permet de mettre la rotation en status 'IN_PROGRESS'. « End Session » est également actif ; il termine la Session sans conserver cette Rotation jamais démarrée.
- IN_PROGRESS : parties en cours, titre du composant OffCourtPlayers renommée en Waiting Players, toutes les informations de la Rotation ne sont plus modifiables. Minuteur démarre. Compte à rebours jusqu'à zero. A la fin du minuteur, la rotation passe automatiquement au status 'SCORING'.
- SCORING : Les inputs des scores de toutes les Games deviennent visibles et doivent être saisis (requis). La rotation est en status 'SCORING'. Les boutons "Next Rotation" et "End Session" restent désactivés tant que toutes les Games ne sont pas résolues ou qu’un score est rouvert avec KO. Le bouton "Next Rotation" permet de passer la rotation en cours du status 'SCORING' au status 'FINISHED', de lancer le calcul de réaffectation des joueurs dans la prochaine rotation, de créer la prochaine rotation (status 'CREATED') en l'initialisant avec le résultat du calcul des réaffectations des joueurs. Puis, d'afficher cette nouvelle rotation dans la page (composant RotationCard rendu à partir de la nouvelle rotation). Le bouton "End Session" conserve les scores, met la rotation en cours au status 'FINISHED', termine la Session et redirige vers Home.
- FINISHED : La session est en status 'FINISHED'. La rotation est en status 'FINISHED'. La rotationCard indique que la rotation est terminée. Un nouveau bouton "New Session" permet de créer une nouvelle session.
