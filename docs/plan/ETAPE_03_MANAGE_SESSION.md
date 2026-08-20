# Étape 3 — Modèle, participants et structure de Manage Session

- État : **En cours — tranche 3.21 à démarrer**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).
- Dernière validation significative : **2026-08-20 22:54:20** — type-check, lint incluant Cypress, 302 tests Vitest, 19 scénarios Cypress, `git diff --check` et build Vite réussis après protection du démarrage par la composition complète de chaque Game.

## Plan canonique


1. [x] Ajouter `SessionStatus.CREATED` et les transitions `CREATED → STARTED → FINISHED`.
2. [x] Ajouter `Session.attendingPlayers`, rendre `startTime` nullable avant démarrage et couvrir sérialisation ainsi que compatibilité historique.
3. [x] Créer les Sessions en `CREATED`, sans Rotation, et garantir une seule Session `CREATED` ou `STARTED` par Location.
4. [x] Adapter Home pour créer ou reprendre la Session ouverte appropriée.
5. [x] Charger une Session `CREATED` depuis la route sans initialiser l'organisation d'une Rotation.
6. [x] Créer la carte de sélection accessible des participants.
7. [x] Créer `SessionForm` avec grille responsive et sélection persistée pendant `CREATED`, limitée aux Players `AVAILABLE`; rendre l’identité et l’action sticky dans le parent `ManageSession`.
8. [x] Exiger au moins quatre participants puis implémenter atomiquement « Start Session » : figer `attendingPlayers`, dater le démarrage, passer à `STARTED` et créer la première Rotation à partir de ces seuls Players.
9. [x] Afficher `SessionForm` en `CREATED` et l'organisation de Rotation uniquement en `STARTED`.
10. [x] Interdire toute modification de l'appartenance à `attendingPlayers` après démarrage et limiter les graphes courants à cette liste.
11. [x] Interdire Delete pour tout Player participant à une Session `STARTED`.
11.1. [x] Rendre la grille de sélection de `SessionForm` responsive en réutilisant `CardGrid` et vérifier l'absence de débordement horizontal sur écran étroit.
11.2. [x] Supprimer le scroll interne de `SessionForm`, conserver uniquement l'ascenseur de la page et maintenir son en-tête visible au-dessus de la grille.
12. [x] Finaliser l'intégration de `RotationStatus` anticipée à l'étape 2 et ses transitions autorisées.
13. [x] Compléter `Rotation` avec horaires et verrouillage de toute mutation après `FINISHED`.
14. [x] Compléter `Game` avec son numéro dans la Session.
15. [x] Ajouter les opérations métier de numérotation des Sessions, Rotations et Games.
16. [x] Définir les invariants et transitions autorisées.
17. [x] Charger et valider Location et Session depuis la route.
18. [x] Traiter une Session inexistante, incohérente ou terminée.
19. [x] Afficher le titre de page « Training Session Manager » et l’identité `Location.name # Session order` pendant la préparation et la phase démarrée.
20. [x] Extraire `RotationCard`, `CourtCard`, `GameCard`, `TeamCard` et `OffCourtPlayers`.
21. [ ] Construire un Game par Court.
22. [ ] Garantir la persistance et la restauration du graphe complet.
23. [ ] Valider l'ensemble de l'étape par TDD, Cypress et la chaîne de build ; les miroirs Playwright restent planifiés en 6.12.

### Tranche 3.18 — traitement des routes invalides

- [x] Ajouter une route catch-all et une page 404 avec un lien nommé vers `HomeView`.
- [x] Rediriger vers la page 404 lorsqu’une Location ou une Session identifiée est absente, incohérente ou rattachée à une autre Location.
- [x] Refuser explicitement le chargement d’une Session `FINISHED` et rediriger vers la page 404.
- [x] Couvrir la vue, le routeur, le store et le parcours navigateur par des tests ciblés.

### Ajustement 3.18.1 — intégrer Cypress au lint du build

- [x] Installer une version d’`eslint-plugin-cypress` compatible avec ESLint 8 et configurer son environnement uniquement pour `cypress/**/*.js`.
- [x] Retirer les déclarations globales locales devenues redondantes de `routes.cy.js`.
- [x] Étendre `npm run lint` au dossier `cypress` afin que `prebuild` et `build` analysent les tests E2E.
- [x] Vérifier le lint isolé de `routes.cy.js`, puis la chaîne complète de build.

### Tranche 3.19 — identité de la Location et de la Session

- [x] Afficher « Training Session Manager » comme titre `<h1>` stable de `ManageSession`.
- [x] Afficher l’identité `<h2>` au format `Location.name # Session order` dans `SessionForm` pendant `CREATED`, puis directement dans `ManageSession` pendant `STARTED`.
- [x] Transmettre `locationName` à `SessionForm` par une prop explicite et couvrir cette frontière avec le stub du test parent.
- [x] Couvrir les deux états par les tests de composant et vérifier dans Cypress le titre ainsi que l’identité avant et après « Start Session ».

### Tranche 3.20 — extraction des composants de Rotation

- [x] Définir les frontières de présentation sans déplacer les actions Pinia ni modifier le graphe persistant.
- [x] Extraire `TeamCard` et `OffCourtPlayers` pour rendre les Players et émettre drag, drop et suppression.
- [x] Extraire `GameCard` comme composition Team A versus Team B, sans anticiper le scoring.
- [x] Extraire `CourtCard` pour le titre du Court et sa `GameCard`.
- [x] Extraire `RotationCard` pour l’identité de Session, la configuration des Courts, leur grille et l’état éphémère du drag-and-drop.
- [x] Réduire `ManageSession` à l’orchestration de `SessionForm`/`RotationCard` et aux actions du store.
- [x] Couvrir chaque composant par son contrat DOM, ses props et événements, puis valider le parcours navigateur existant sans changement métier.

### Ajustement 3.20.1 — en-tête sticky de RotationCard

- [x] Aligner la structure et le comportement sticky du `<h2>` de `RotationCard` sur l’en-tête de `SessionForm`.
- [x] Couvrir le contrat de classes dans Vitest et la position calculée dans Cypress après démarrage.

### Ajustement 3.20.2 — Courts utilisables selon les participants

- [x] Calculer le nombre de Courts utilisables avec `min(Location.nbCourts, floor(Session.attendingPlayers.length / 4))` ; les paliers sont donc 4–7 → 1, 8–11 → 2, 12–15 → 3, puis ainsi de suite.
- [x] Pour chaque Rotation de la Session, créer une Game uniquement sur les Courts utilisables, en prenant toujours les numéros depuis 1 dans l’ordre croissant.
- [x] Conserver et afficher tous les Courts physiques de la Location ; rendre les Courts excédentaires gris, marqués « Inutilisé » et dépourvus de Game, Team et zone de drag & drop.
- [x] Faire appliquer le même invariant par le store, la restauration et `validateSessionGraph()` afin qu’une commande directe ne puisse pas utiliser un Court excédentaire.
- [x] Couvrir les paliers, le plafond physique, l’ordre des Courts, le rendu désactivé et le parcours navigateur avant de reprendre 3.21.

### Ajustement 3.20.3 — migration historique et erreur interne corrélée

- [x] Introduire une migration idempotente des Sessions `STARTED` historiques : garantir les Courts physiques `1..Location.nbCourts`, conserver ou créer exactement une Game sur chaque Court utilisable et supprimer les Games excédentaires.
- [x] Replacer sans doublon dans `Rotation.waitingPlayers` les participants provenant des Teams supprimées, nettoyer leurs Teams devenues orphelines et renuméroter les Games conservées dans l’ordre Rotation/Court.
- [x] Valider le graphe réparé en mémoire avant toute écriture, puis utiliser le résultat migré lors de la restauration Pinia.
- [x] Classifier les erreurs de chargement : ressources ou relation invalides vers 404 ; migration, graphe invalide et erreurs inattendues vers 500 avec `codeErreur` stable et `uuidErreur` généré puis journalisé.
- [x] Créer une page 500 accessible affichant le message corrélé, un bouton de copie avec icône SVG, une notification `message copié` éphémère et un lien `Back to Home` identique à celui de la 404.
- [x] Couvrir les contrats par Vitest et Cypress, puis reprendre la tranche 3.21.

### Ajustement 3.20.4 — propriété de l’en-tête de Session

- [x] Rendre dans `ManageSession` l’unique `<h2>` `Location.name # Session order`, dans un en-tête sticky commun aux phases `CREATED` et `STARTED`.
- [x] Déplacer `Start Session` dans cet en-tête parent, le rendre uniquement pendant `CREATED` et le désactiver tant que moins de quatre participants sont persistés.
- [x] Retirer de `SessionForm` le titre, le bouton, les props d’identité et l’événement `start`; conserver son brouillon local et `selection-change`.
- [x] Retirer de `RotationCard` le titre et les props d’identité ; conserver sa composition et son état éphémère de drag-and-drop.
- [x] Couvrir le nouveau propriétaire de l’en-tête et les contrats enfants simplifiés par Vitest et Cypress avant de reprendre 3.21.

### Ajustement 3.20.5 — en-tête et commandes manuelles de Rotation

- [x] Afficher le titre `Rotation N° {{ rotation.order }}` dans un `<h3>` de `1.5rem` et rendre son en-tête sticky immédiatement sous celui de la Session.
- [x] Aligner explicitement la taille du `<h2>` d’identité de Session sur celle du `<h1>` de page.
- [x] Rendre `Start Rotation` uniquement en `CREATED` et émettre une intention de démarrage vers `ManageSession`.
- [x] Remplacer cette commande par `Stop Rotation` en `IN_PROGRESS` et émettre une intention de passage manuel en `SCORING`; ne rendre aucun de ces boutons en `SCORING`.
- [x] Réutiliser les actions Pinia existantes `startRotation()` et `startRotationScoring()` afin que le domaine contrôle les transitions et que le graphe soit persisté.
- [x] Couvrir les trois statuts par Vitest et le parcours `CREATED → IN_PROGRESS → SCORING` par Cypress, puis reprendre 3.21.

### Ajustement 3.20.6 — validation et placeholder de Rotation suivante

- [x] Afficher `Next Rotation` uniquement lorsque la Rotation est en `SCORING` et déléguer l’intention à `ManageSession`.
- [x] Introduire `RotationService.planNextRotation(currentGames)`; son premier incrément accepte toutes les Games courantes et retourne une nouvelle liste vide.
- [x] Faire appeler `Rotation.finish()` par l’action Pinia afin de refuser toute Game non résolue et de dater la fin avant le calcul.
- [x] Persister la Rotation terminée, puis créer la suivante en `CREATED`, avec l’ordre séquentiel, les Games retournées par le service et tous les participants dans `waitingPlayers`.
- [x] Autoriser uniquement le placeholder structurel « ordre supérieur à 1, `CREATED`, zéro Game, tous les participants en attente » dans `validateSessionGraph()` et empêcher la migration de le remplir automatiquement.
- [x] Couvrir le service, le store, l’invariant, la migration, les composants et le parcours navigateur, puis reprendre 3.21.

### Ajustement 3.20.7 — composition complète avant démarrage d’une Rotation

- [x] Définir un prédicat de graphe exigeant au moins une Game et exactement deux Players dans chacune de ses deux Teams.
- [x] Exposer ce prédicat par un getter Pinia réactif et l’utiliser dans `startRotation()` pour protéger les appels directs.
- [x] Ajouter à `RotationCard` une prop d’éligibilité et désactiver `Start Rotation` tant que la composition n’est pas complète.
- [x] Conserver `RotationCard` indépendant de Pinia : le composant affiche la décision et émet toujours l’intention, tandis que le store porte l’invariant.
- [x] Couvrir composition partielle, composition complète, retrait d’un Player et transition refusée/acceptée par Vitest et Cypress, puis reprendre 3.21.


## Découpage détaillé historique

Ce découpage conserve les sous-tranches élaborées pendant l’implémentation.
Sa numérotation historique peut recouvrir celle du plan canonique ; le plan canonique ci-dessus détermine la prochaine action.

### Manage Session et sélection des participants — étape 3

1. [x] Ajouter `SessionStatus.CREATED` et formaliser les transitions autorisées `CREATED → STARTED → FINISHED`, sans retour arrière.
2. [x] Adapter le modèle `Session` en TDD : une nouvelle Session est `CREATED`, son `startTime` reste `null` jusqu'au démarrage et `attendingPlayers` contient la liste des Players autorisés à participer aux Rotations.
3. [x] Exposer une opération métier atomique de démarrage qui vérifie que la Session est encore `CREATED`, exige au moins quatre `attendingPlayers` toujours `AVAILABLE`, fixe définitivement leur appartenance, initialise `startTime` et passe le statut à `STARTED`.
4. [x] Sérialiser et restaurer `attendingPlayers`, préserver les anciennes Sessions sans ce champ et appliquer leur règle de migration validée.
5. [x] Faire créer par `createSessionForLocation()` une Session `CREATED`, vide de participants et sans Rotation, et interdire plusieurs Sessions non terminées (`CREATED` ou `STARTED`) pour une même Location.
6. [x] Remplacer dans Home la seule notion de Session démarrée par celle de Session ouverte (`CREATED` ou `STARTED`) afin de réutiliser une préparation existante plutôt que créer plusieurs Sessions.
7. [x] Charger une Session `CREATED` depuis sa route sans créer ni afficher de Rotation, de Courts, de Games ou de Teams ; la création du premier graphe de Rotation est différée jusqu'à « Start Session ».
8. [x] Créer en TDD une carte de sélection de participant, indépendante de Pinia, affichant le nom centré, sélectionnable et désélectionnable au clic et au clavier, avec fond vert clair et pictogramme rond checked — coche verte asymétrique — en haut à droite lorsqu'elle est sélectionnée.
9. [x] Créer en TDD `SessionForm`, recevant l'ordre de Session, les Players `AVAILABLE` et la sélection persistée, conservant un brouillon local d'identifiants et émettant chaque modification ainsi que la commande de démarrage sans modifier directement le store.
10. [x] Afficher dans l'en-tête de `SessionForm` « Session #<order> » aligné à gauche et « Start Session » à côté, puis rendre cet en-tête sticky pendant le défilement vertical de la grille de Players.
11. [x] Afficher uniquement les Players encore `AVAILABLE`, rendre la grille scrollable et réévaluer leur éligibilité au moment de la soumission afin d'empêcher qu'un changement externe de statut soit ignoré.
12. [x] Dans `ManageSession`, rendre `SessionForm` uniquement pour une Session `CREATED`, puis afficher l'organisation de la Rotation uniquement après le passage réussi à `STARTED`.
13. [x] Implémenter en TDD `updateAttendingPlayers` pour persister chaque sélection/désélection pendant `CREATED`, puis `startSession` pour valider la liste persistée, enregistrer la transition et créer la première Rotation en `CREATED` dont la waiting list initiale contient exclusivement les `attendingPlayers`.
14. [x] Désactiver « Start Session » tant que moins de quatre participants sont sélectionnés et protéger la liste à deux niveaux : aucune commande d'interface après démarrage et refus métier/persistant de toute modification d'appartenance lorsque la Session n'est plus `CREATED`; les statuts individuels des mêmes instances de Player restent toutefois pilotés par les Rotations.
15. [x] Garantir que le chargement d'une Rotation existante et la création de la première Rotation utilisent exclusivement les `attendingPlayers`, sans réinjecter automatiquement les nouveaux Players du catalogue global ; conserver ce même invariant pour le futur calcul des Rotations suivantes.
16. [x] Étendre la règle de suppression logique d'un Player : toute présence dans `attendingPlayers` d'une Session `STARTED` interdit Delete, même si le Player n'est pas actuellement présent dans une Team ou une waiting list.
17. [x] Adapter `LocationCard` et `HomeView` aux états `CREATED` et `STARTED`, avec « Continue Setup » pour reprendre une sélection de participants inachevée.
18. [x] Couvrir en TDD modèle, migration, persistance, stores, cartes, `SessionForm`, affichage conditionnel, accès direct, rechargement et protections de concurrence par Vitest et Cypress ; la suite Playwright miroir sera créée ultérieurement à l'étape 6.12.
18.1. [x] Rendre la grille de `SessionForm` responsive en réutilisant le contrat de `CardGrid`, en supprimant les contraintes de largeur implicites du formulaire, du conteneur scrollable et de la vue `ManageSession`, puis vérifier les dispositions mono/multicolonnes sans débordement horizontal.
18.2. [x] Supprimer le défilement vertical interne de `SessionForm` : laisser sa hauteur suivre tout le contenu, confier l'unique ascenseur au document et conserver l'en-tête `h2`/« Start Session » en `position: sticky` au-dessus de la grille pendant le scroll de la page.
19. [x] Finaliser ensuite l'intégration de `RotationStatus`, les horaires de Rotation, la numérotation de Game et les invariants du graphe prévus initialement dans l'étape 3.
    - [x] 19.1 Encapsuler le statut de `Rotation` et couvrir en TDD les seules transitions autorisées `CREATED → IN_PROGRESS → SCORING → FINISHED`, sans modifier encore le store ni l'interface.
    - [x] 19.2 Ajouter `Rotation.startTime` et `Rotation.endTime`, leur sérialisation compatible avec les anciennes données et leur cohérence avec les transitions.
    - [x] 19.3 Remplacer dans le store les mutations directes du statut par les commandes métier de `Rotation` et préserver le verrouillage des affectations hors `CREATED`.
    - [x] 19.4 Ajouter le numéro séquentiel de `Game` à l'échelle de la Session et les opérations de numérotation des Rotations et Games.
    - [x] 19.5 Valider les références, unicités et cardinalités du graphe Session/Rotation/Court/Game/Team/Player, puis couvrir sa restauration persistante.
20. [x] Préparer le scoring concurrent « dernier appel valide gagnant » et découper progressivement la persistance monolithique.
    - [x] 20.1 Encapsuler dans `Game` la saisie des deux scores, la déduction automatique du gagnant/perdant lorsque les scores diffèrent, la désignation manuelle du gagnant en cas d'égalité et l'état résolu ; introduire `GameScoreService` comme service applicatif limité à ces deux commandes.
    - [x] 20.2 Faire refuser atomiquement `Rotation.finish()` tant qu'au moins une Game n'est pas résolue, puis figer le dernier état valide des résultats lorsque la Rotation devient `FINISHED`.
    - [x] 20.3 Extraire l'accès JSON brut dans un adaptateur `LocalStorageGateway`, sans changer le format persistant ni les API consommées.
    - [x] 20.4 Extraire les repositories/services fins de Player, Location, Court, Session, Rotation et Team ; ne pas créer de collection persistante indépendante de Games, `Rotation.games` restant la source de vérité de leur composition.
        - [x] 20.4.1 Centraliser les clés persistantes puis extraire `PlayerRepository` et `LocationRepository` derrière la façade, sans modifier les stores.
        - [x] 20.4.2 Extraire `CourtRepository` et `TeamRepository` en préservant les identifiants historiques.
        - [x] 20.4.3 Extraire `RotationRepository` et `SessionRepository`, en laissant les migrations transverses au futur service de graphe.
        - [x] 20.4.4 Aligner la réhydratation de `Session.startTime` sur le contrat du modèle en préservant `null` pour une Session non démarrée, sans script de correction historique dans cette tranche.
    - [x] 20.5 Isoler les migrations historiques et `SessionGraphPersistenceService`, puis conserver `storageService` comme façade de compatibilité pendant la migration des stores.
        - [x] 20.5.1 Extraire les migrations idempotentes des participants de Session et des numéros de Games historiques, avec leurs tests directs.
        - [x] 20.5.2 Introduire `SessionPersistenceService` pour composer la migration de lecture et l'invariant d'unicité d'une Session `STARTED` par Location.
        - [x] 20.5.3 Extraire la fusion, la validation avant écriture et la persistance du graphe dans `SessionGraphPersistenceService`.
        - [x] 20.5.4 Réduire `storageService` à une façade de compatibilité qui délègue ces cas d'usage sans modifier les stores Pinia.
    - [x] 20.6 Valider chaque extraction par type-check, lint, Vitest, Cypress, `git diff --check` et build avant de supprimer éventuellement la façade.

#### Décisions validées pour l'implémentation de l'étape 3.1

- Nombre minimal : désactiver « Start Session » et refuser la transition métier tant que moins de quatre Players ne sont pas sélectionnés.
- Retour sur Home : traiter une Session `CREATED` comme l'unique Session ouverte de la Location et afficher une action orange « Continue Setup » qui rouvre le même `SessionForm`.
- Brouillon avant démarrage : persister chaque modification dans `Session.attendingPlayers` pendant `CREATED` afin de restaurer la sélection après rechargement ; interdire toute modification dès le passage à `STARTED`.
- Compatibilité historique : reconstruire `attendingPlayers` d'une ancienne Session `STARTED`/`FINISHED` depuis l'union des Players de ses Rotations, Teams et waiting lists ; en l'absence de graphe historique, reprendre les Players non supprimés comme comportement de compatibilité avec l'ancienne application.
