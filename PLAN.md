# Plan de développement

## Suivi

- Étape en cours : **0.5 — Ajouter les tests unitaires minimaux des stores et modèles**.
- État : **migration Vuex → Pinia terminée ; automatisation E2E Cypress opérationnelle ; runner de tests unitaires purs à choisir**.
- Dernières étapes terminées : **0.1**, **0.2**, **0.3**, **0.4**, ainsi que les sous-étapes **1 à 11** de la migration Vuex → Pinia.
- Éléments anticipés : la persistance et la restauration du graphe de l'étape **3.11**, ainsi que les affectations manuelles de l'étape **4.4**, sont partiellement implémentées. Les étapes 3 et 4 restent à réaliser dans leur ensemble.
- Prochaine action : choisir le runner dédié aux tests unitaires purs, puis tester en priorité le store Pinia et les modèles métier sans navigateur.
- Marqueurs d'avancement : `[x]` terminée ; `[==>]` en cours ; `[ ]` pas encore commencée.

### Migration Vuex → Pinia

1. [x] Installer Pinia tout en conservant Vuex.
2. [x] Enregistrer temporairement les deux plugins.
3. [x] Créer `useSessionStore`.
4. [x] Déplacer la persistance du graphe dans le service de stockage.
5. [x] Migrer le garde de route vers Pinia, avec initialisation Vuex temporaire pendant la transition.
6. [x] Migrer `ManageSession`, puis supprimer l'initialisation Vuex du garde.
7. [x] Garantir l'accès direct à `/manage-players` et migrer `ManagePlayers`.
8. [x] Retirer Vuex de l'application — ancien store supprimé et absence de référence Vuex vérifiée sous `src`.
9. [x] Désinstaller les dépendances directes `vuex` et `@vue/cli-plugin-vuex`.
10. [x] Vérifier le lint, le build et la navigation automatisée des trois routes.
11. [x] Finaliser le suivi et le journal de décisions dans `PLAN.md`.

### Automatisation des tests

1. [x] Installer et configurer Cypress pour les tests E2E.
2. [x] Tester l'accès direct et le rechargement complet de `/`, `/manage` et `/manage-players`.
3. [x] Faire échouer les tests en cas d'erreur JavaScript ou de réponse HTTP en erreur.
4. [x] Exécuter le lint et les tests de routes automatiquement avant chaque build.
5. [ ] Introduire Cypress Component Testing lors de l'extraction des composants Vue.
6. [ ] Choisir à l'étape 0.5 un runner dédié aux tests unitaires purs des modèles, stores et algorithmes.

### État d'avancement

| Étape | État |
|---|---|
| 0.1 — Initialisation globale des données | Terminée |
| 0.2 — Problème des joueurs invisibles | Terminée |
| 0.3 — Modèles minimaux et règles d'identifiants | Terminée |
| 0.4 — Pinia et séparation de la persistance | Terminée |
| 0.5 — Tests unitaires minimaux | En cours — automatisation E2E Cypress anticipée, runner unitaire à choisir |
| 1 — Home et Locations | À faire |
| 2 — Manage Players | À faire |
| 3 — Modèle et structure de Manage Session | À faire — 3.11 partiellement anticipée |
| 4 — Préparation et lancement d’une Rotation | À faire — 4.4 partiellement anticipée |
| 5 — Scoring et fin de Session | À faire |
| 6 — Calcul de la rotation suivante | À faire |
| 7 — SQLite | À faire |

### Décisions techniques

Les décisions antérieures sont horodatées à la date de leur consignation dans ce journal lorsque leur heure de décision initiale n'est pas connue.

- **2026-08-10 01:41:38** — Utiliser `localStorage` comme persistance active à ce stade. Justification : `database.js` n'est pas utilisé et `better-sqlite3` ne peut pas fonctionner directement dans une SPA exécutée par le navigateur.
- **2026-08-10 01:41:38** — Représenter les identifiants métier par des UUID sous forme de chaînes. Justification : disposer d'un type uniforme pour toutes les entités et générer les identifiants côté application sans collision avec les anciennes représentations numériques.
- **2026-08-10 01:41:38** — Maintenir Vuex tant que la migration vers Pinia n'a pas été présentée et explicitement approuvée. Justification : cette migration est une modification architecturale significative.
- **2026-08-10 01:41:38** — Séparer l'état métier, la persistance et l'interface. Justification : permettre au futur service SQLite de remplacer le stockage courant sans coupler les composants au mécanisme de persistance.
- **2026-08-10 01:41:38** — Réutiliser une Session active lors des changements de vue. Justification : conserver les affectations et l'état courant de la Session pendant la navigation.
- **2026-08-10 01:41:38** — Utiliser temporairement une `Location` nommée `default`. Justification : permettre l'initialisation du modèle tant que la sélection des Locations depuis Home n'est pas implémentée.
- **2026-08-10 01:41:38** — Limiter `SessionStatus` à `STARTED` et `FINISHED`. Justification : les phases de préparation et de jeu appartiennent au cycle de vie d'une Rotation ou à l'interface, pas au statut persistant de la Session.
- **2026-08-10 01:41:38** — Introduire `RotationStatus` avec `CREATED`, `IN_PROGRESS`, `SCORING` et `FINISHED`. Justification : porter explicitement les transitions métier propres à chaque Rotation.
- **2026-08-10 01:41:38** — Considérer `SETUP` comme une étape d'interface et non comme un statut métier persistant. Justification : `SETUP` décrit la validation et l'orientation de la vue avant le chargement d'une Session.
- **2026-08-10 01:41:38** — Associer exactement un `Game` à chaque `Court` dans une Rotation. Justification : chaque terrain accueille une partie par Rotation.
- **2026-08-10 01:41:38** — Numéroter les Games séquentiellement à l'échelle d'une Session. Justification : identifier sans ambiguïté l'ordre des parties au-delà d'une seule Rotation.
- **2026-08-10 01:41:38** — Enregistrer `Rotation.startTime` et `Rotation.endTime`. Justification : conserver la durée réelle et l'historique de chaque Rotation.
- **2026-08-10 01:41:38** — Employer systématiquement le terme `loserTeam`. Justification : utiliser une terminologie anglaise correcte et cohérente dans le modèle et l'interface.
- **2026-08-10 01:41:38** — Employer le mot « base » pour désigner `localStorage` jusqu'à l'étape SQLite. Justification : lever l'ambiguïté sur le mécanisme de persistance réellement actif.
- **2026-08-10 01:41:38** — Faire de `PLAN.md` la source de vérité du travail et le mettre à jour après chaque étape significative avant de poursuivre. Justification : conserver un état d'avancement et un journal de décisions persistants entre les conversations.
- **2026-08-10 14:50:43** — Approuver la migration de Vuex vers Pinia et confier les modifications applicatives au développeur avec un accompagnement étape par étape. Justification : apprendre Pinia en réalisant directement chaque changement tout en conservant des incréments petits et vérifiables.
- **2026-08-12 00:37:27** — Initialiser temporairement Pinia et Vuex dans le garde de la route `/manage` jusqu'à la migration de `ManageSession`. Justification : le composant consomme encore Vuex ; supprimer immédiatement son initialisation rendrait son état vide, tandis que cette transition permet de vérifier chaque modification séparément.
- **2026-08-12 01:19:11** — Garantir explicitement l'initialisation du store pour chaque route qui le consomme, au moyen d'un garde partagé entre `/manage` et `/manage-players`. Justification : `ManagePlayers` dépendait implicitement d'un passage préalable par `/manage`; chaque route doit fonctionner lors d'un accès direct et ne pas dépendre de l'ordre de navigation.
- **2026-08-12 01:45:07** — Servir le favicon depuis `public/favicon.ico` et le référencer dans `public/index.html` avec `BASE_URL`. Justification : supprimer la réponse 404 au rechargement complet et conserver un chemin valide lorsque l'application est déployée sous un chemin de base non racine.
- **2026-08-12 02:22:35** — Choisir Cypress pour les tests E2E et les futurs tests de composants Vue, et réserver un runner dédié aux tests unitaires purs. Justification : apprendre les deux niveaux de tests, bénéficier de l'interface interactive de Cypress pour Vue, automatiser les accès directs et rechargements de routes, tout en conservant des tests unitaires rapides et indépendants du navigateur pour le domaine.
- **2026-08-12 02:27:17** — Exécuter automatiquement le lint et les smoke tests Cypress des routes via le hook npm `prebuild`. Justification : empêcher la production d'un build lorsque l'accès direct, le rechargement d'une route ou une ressource HTTP de l'application est en erreur.
- **2026-08-12 02:51:58** — Supprimer `src/store/index.js` après avoir migré tous ses consommateurs vers `useSessionStore`. Justification : l'ancien store Vuex ne faisait plus partie du graphe de modules actif ; le lint, les trois tests Cypress de routes et le build de production confirment que Pinia est désormais l'unique store utilisé par l'application.
- **2026-08-12 02:55:26** — Retirer les dépendances directes `vuex` et `@vue/cli-plugin-vuex`, tout en conservant l'occurrence transitive du plugin imposée par `@vue/cli-service@5.0.9`. Justification : le runtime Vuex et sa déclaration projet ont entièrement disparu ; éliminer également le plugin transitif nécessiterait une migration distincte hors de Vue CLI. Le lint, les trois tests Cypress de routes et le build de production réussissent après ce retrait.

## Modifications identifiées

### Fondations communes

- Introduire les modèles métier :
  - Location : id, name, courtCount ;
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

### Vue Home

- Supprimer le simple lien « Start Managing Session ».
- Charger et afficher les Locations existantes.
- Chaque Location est affichée sous forme de carte (composant réutilisable LocationCard).
- La première carte affichée en haut à gauche est une carte spéciale permettant de créer une Location.
- La création d'une Location est faite dans une fenêtre modale commune à la création et à l'édition.
- La carte d'une Location contient :
  - son nom ;
  - son nombre de courts ;
  - une commande Edit ;
  - une commande Delete ;
  - un bouton "Start / Manage Session"
- Permettre de sélectionner une Location.
- Le bouton "Start / Manage Session" n'est visible que sur la carte de la Location sélectionnée.
- Permettre de créer une Location avec :
  - un nom obligatoire ;
  - un nombre de courts valide (entre 1 et 20).
- Sauvegarder la nouvelle Location.
- Rediriger vers la vue ManageSession après click sur le bouton "Start / Manage Session" de la carte Location sélectionnée.
- Transmettre l’identité de la Location et de la session dans l’URL, idéalement :
  `/manage/:locationId/:sessionId`

La route devient ainsi partageable et rechargeable sans dépendre d’une sélection uniquement conservée en mémoire.

### Vue Manage Players

- Corriger le chargement des joueurs lors d’un accès direct à la route.
- Remplacer la table actuelle par une grille de cartes.
- Afficher en première position une carte spéciale :
  - icône + ;
  - texte « Créer Player ».
- Afficher ensuite une carte par joueur contenant :
  - son nom ;
  - une commande Edit ;
  - une commande Delete.
- Créer un composant réutilisable PlayerCard.
- Créer une fenêtre modale commune à la création et à l’édition.
- Fermer la modale par :
  - bouton Cancel ;
  - bouton de fermeture ;
  - éventuellement touche Échap et clic sur l’arrière-plan.
- Ajouter une confirmation avant suppression.
- Faire en sorte que Delete supprime réellement le joueur, contrairement au comportement actuel.
- Définir le comportement si le joueur est référencé dans une session ou une rotation historique.

### Vue Manage Session

- Charger la Location et la Session depuis l’identifiant de route.
- Vérifier que la Session est liée à la Location et qu'elle est dans l'état 'STARTED'.
- Si la Session est en état 'FINISHED', afficher une fenêtre modale avec le message 'Cette session est terminée, souhaitez-vous démarrer une nouvelle session ?' :
  - Si oui, créer une nouvelle Session dont session.order est initialisé à max+1 de toutes les sessions de cette location (max(location.sessions.order) + 1) puis rediriger vers la vue ManageSession avec cette nouvelle Session.
  - Si non, fermer la fenêtre modale et rediriger vers la vue Home.
- Afficher en titre dans la vue : Location.name # Session.order.
- Afficher un bouton « New Rotation ».
- Créer une nouvelle Rotation liée à la Session.
- Stocker l'horaire de début de la rotation.
- les Game Cards sont initialisées avec :
  - un titre "Game #number".
  - une TeamCard A et une TeamCard B.
  - un input dans chaque TeamCard pour la saisie des scores à la fin de la rotation. Ces inputs sont initialement cachés et disabled.
- Initialiser les Court Cards de cette rotation à partir de location.courtCount.
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

## États proposés pour une session

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


## Plan proposé

### Étape 0 — Stabilisation commune

1. [x] Corriger l’initialisation globale des données.
2. [x] Corriger le problème des joueurs invisibles.
3. [x] Définir les modèles minimaux et les règles d’identifiants.
4. [x] Introduire Pinia et un service de persistance clairement séparé.
5. [==>] Ajouter les tests unitaires minimaux des stores et modèles.

La migration Pinia est architecturale : je te présenterai son fonctionnement et demanderai ton accord avant de modifier le projet.

### Étape 1 — Home et Locations

1. [ ] Adapter définitivement le modèle `Location`.
2. [ ] Créer un store Pinia dédié aux Locations.
3. [ ] Extraire une modale réutilisable.
4. [ ] Créer `LocationCard` et la carte spéciale de création.
5. [ ] Afficher et sélectionner les Locations.
6. [ ] Implémenter création et édition.
7. [ ] Définir puis implémenter la suppression d’une Location référencée.
8. [ ] Afficher « Start / Manage Session » sur la Location sélectionnée.
9. [ ] Retrouver la Session active ou en créer une nouvelle avec `order = max + 1`.
10. [ ] Naviguer vers `/manage/:locationId/:sessionId`.
11. [ ] Tester accès direct, rechargement, lint et build.

Chaque point fera l’objet d’une modification limitée.

### Étape 2 — Manage Players

1. [ ] Garantir le chargement des joueurs.
2. [ ] Extraire `PlayerCard`.
3. [ ] Construire la grille et la carte « Créer Player ».
4. [ ] Réutiliser le composant modal créé à l’étape 1.
5. [ ] Déplacer la création dans la modale.
6. [ ] Déplacer l’édition dans la même modale.
7. [ ] Définir la politique de suppression des joueurs référencés dans l’historique.
8. [ ] Implémenter la suppression réelle.
9. [ ] Ajouter les validations et tests.

### Étape 3 — Modèle et structure de Manage Session

1. [ ] Ajouter `RotationStatus`.
2. [ ] Compléter `Rotation` avec statut et horaires.
3. [ ] Compléter `Game` avec son numéro dans la Session.
4. [ ] Ajouter les opérations métier de numérotation des Sessions, Rotations et Games.
5. [ ] Définir les invariants et transitions autorisées.
6. [ ] Charger et valider Location et Session depuis la route.
7. [ ] Traiter une Session inexistante, incohérente ou terminée.
8. [ ] Afficher `Location.name # Session.order`.
9. [ ] Extraire `RotationCard`, `CourtCard`, `GameCard`, `TeamCard` et `OffCourtPlayers`.
10. [ ] Construire un Game par Court.
11. [ ] Garantir la persistance et la restauration du graphe complet.

### Étape 4 — Préparation et lancement d’une Rotation

1. [ ] Implémenter « New Rotation ».
2. [ ] Créer la Rotation en statut `CREATED`.
3. [ ] Initialiser Courts, Games, Teams et joueurs disponibles.
4. [ ] Implémenter les affectations manuelles par drag-and-drop.
5. [ ] Gérer les échanges Team ↔ Team et Team ↔ OffCourtPlayers.
6. [ ] Créer le minuteur paramétrable.
7. [ ] Implémenter « Start Rotation ».
8. [ ] Passer à `IN_PROGRESS` et figer toutes les affectations.
9. [ ] Afficher Available Players ou Waiting Players selon le statut.
10. [ ] Restaurer correctement une rotation après navigation ou rechargement.

### Étape 5 — Scoring et fin de Session

1. [ ] Passer automatiquement à `SCORING` lorsque le minuteur atteint zéro.
2. [ ] Afficher et activer les scores uniquement en `SCORING`.
3. [ ] Valider les entiers de 0 à 100.
4. [ ] Exiger tous les scores.
5. [ ] Déterminer gagnant et perdant.
6. [ ] Gérer manuellement les égalités avec « WINNER ? ».
7. [ ] Enregistrer équipes, scores, joueurs en attente et horaire de fin.
8. [ ] Implémenter « End Session ».
9. [ ] Terminer Rotation et Session.
10. [ ] Proposer « New Session » depuis une Session terminée.

### Étape 6 — Calcul de la rotation suivante

1. [ ] Formaliser l’ordre des courts et les mouvements gagnants/perdants.
2. [ ] Définir les cas limites : équipe incomplète, nombre impair de joueurs, aucun joueur en attente et plusieurs remplaçants.
3. [ ] Écrire des tests unitaires de l’algorithme avant son intégration UI.
4. [ ] Faire monter les gagnants et descendre les perdants.
5. [ ] Séparer les anciens partenaires entre Team A et Team B.
6. [ ] Insérer les joueurs en attente depuis le dernier Court vers le premier.
7. [ ] Ajouter les joueurs remplacés à la fin de `OffCourtPlayers`.
8. [ ] Créer la Rotation suivante en statut `CREATED`.
9. [ ] Afficher et autoriser les ajustements manuels.
10. [ ] Tester plusieurs nombres de Courts et de joueurs.

### Étape 7 — SQLite

1. [ ] Choisir l’architecture : backend Node, application de bureau ou SQLite/WASM.
2. [ ] Définir le schéma relationnel.
3. [ ] Implémenter un service SQLite.
4. [ ] Migrer les données du localStorage.
5. [ ] Conserver les stores et composants indépendants du mécanisme de persistance.
