# Étape 3 — Modèle, participants et structure de Manage Session

- État : **En cours — ajustement prioritaire 3.21.13 terminé ; tranche 3.22 à reprendre**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).
- Dernière validation significative : **2026-08-21 02:16:26** — type-check, lint incluant Cypress, 326 tests Vitest, 19 scénarios Cypress et build Vite réussis après validation du fieldset de score compact sur viewport portrait.

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
21. [x] Construire un Game par Court.
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
- [x] Introduire `RotationService.planNextRotation(currentGames)`; son premier incrément a d’abord retourné une liste vide, contrat remplacé par la structure complète de 3.21.8.
- [x] Faire appeler `Rotation.finish()` par l’action Pinia afin de refuser toute Game non résolue et de dater la fin avant le calcul.
- [x] Persister la Rotation terminée, puis créer la suivante en `CREATED`, avec l’ordre séquentiel, les Games retournées par le service et tous les participants dans `waitingPlayers`.
- [x] Autoriser initialement le placeholder structurel « ordre supérieur à 1, `CREATED`, zéro Game, tous les participants en attente » dans `validateSessionGraph()` et empêcher la migration de le remplir automatiquement ; cette exception est supprimée par 3.21.8.
- [x] Couvrir le service, le store, l’invariant, la migration, les composants et le parcours navigateur, puis reprendre 3.21.

### Ajustement 3.20.7 — composition complète avant démarrage d’une Rotation

- [x] Définir un prédicat de graphe exigeant au moins une Game et exactement deux Players dans chacune de ses deux Teams.
- [x] Exposer ce prédicat par un getter Pinia réactif et l’utiliser dans `startRotation()` pour protéger les appels directs.
- [x] Ajouter à `RotationCard` une prop d’éligibilité et désactiver `Start Rotation` tant que la composition n’est pas complète.
- [x] Conserver `RotationCard` indépendant de Pinia : le composant affiche la décision et émet toujours l’intention, tandis que le store porte l’invariant.
- [x] Couvrir composition partielle, composition complète, retrait d’un Player et transition refusée/acceptée par Vitest et Cypress, puis reprendre 3.21.

### Tranche 3.21 — construire un Game par Court utilisable

- [x] Confirmer que la première Rotation et toute reconfiguration construisent exactement une Game pour chacun des premiers Courts utilisables, dans l’ordre croissant de leur numéro.
- [x] Numéroter les Games sans trou à l’échelle de la Session, dans l’ordre Rotation puis Court, en conservant l’historique des Rotations précédentes.
- [x] Conserver les Courts physiques excédentaires pour l’affichage, sans leur associer de Game ni de Team.
- [x] Restaurer et migrer les graphes historiques en créant les Games manquantes, supprimant les Games excédentaires et renumérotant le résultat de manière idempotente avant validation.
- [x] Consolider les comportements anticipés par 3.20.2 et 3.20.3 avec 82 tests ciblés, puis valider la chaîne applicative complète avant de passer à 3.22.

### Ajustement prioritaire 3.21.1 — saisie et validation des scores dans GameCard

- [x] Afficher `Game N°{{ game.number }}` en `<h4>` en haut à gauche et reprendre en haut à droite la coche SVG verte de `SessionPlayerCard` lorsque la Game est résolue.
- [x] Afficher sous les titres Team A et Team B deux inputs numériques uniquement pendant `SCORING`, après l’action `Stop Rotation`.
- [x] Afficher `WINNER ?` entre les titres lorsque les scores sont à égalité et permettre la désignation du gagnant par clic sur une TeamCard.
- [x] Placer sous `VS` un bouton icône central `OK`, puis `KO` après validation ; l’ancien comportement destructif de KO est remplacé par 3.21.2.
- [x] Livrer les premiers états visuels de validation, ensuite remplacés par les couleurs définitives de 3.21.2.
- [x] Garder `Next Rotation` désactivé tant que toutes les Games ne sont pas résolues et validées, y compris après réouverture d’un score.
- [x] Couvrir composants, événements, domaine, store, persistance et parcours navigateur avant de reprendre 3.22.

### Ajustement prioritaire 3.21.2 — édition non destructive et couleurs de résultat

- [x] Faire de KO une ouverture d’édition locale qui conserve les deux scores persistés et préremplit les inputs devenus saisissables.
- [x] Garder `Next Rotation` désactivé tant qu’au moins une Game résolue est rouverte en édition, sans effacer son dernier résultat persistant avant un nouvel OK.
- [x] Afficher une Game résolue sur fond vert clair et revenir au fond orange uniquement pendant son édition ouverte.
- [x] Afficher initialement la Team gagnante avec une bordure bleue de `6px` et la Team perdante avec une bordure grise de `2px` ; retirer ces variantes pendant l’édition. Le contrat gagnant est remplacé par 3.21.3.
- [x] Adapter les contrats composants, supprimer la commande métier destructive devenue inutile et couvrir le cycle par Vitest ainsi que Cypress avant de reprendre 3.22.

### Ajustement prioritaire 3.21.3 — dimensions des scores et marqueurs W/L

- [x] Centrer la valeur des inputs numériques et limiter leur largeur visuelle à celle de trois chiffres.
- [x] Remplacer la bordure de la Team gagnante par une bordure `4px solid #ff4600`, sans modifier la bordure perdante grise de `2px`.
- [x] Afficher dans chaque TeamCard résolue un marqueur rond W ou L de la couleur de sa bordure, toujours en haut à droite pour Team A et en haut à gauche pour Team B.
- [x] Masquer les marqueurs pendant la réouverture KO en cohérence avec les bordures de résultat, puis couvrir les contrats composants et le parcours navigateur avant de reprendre 3.22.

### Ajustement prioritaire 3.21.4 — recentrage des titres Team A et Team B

- [x] Retirer les paddings directionnels qui décalent les titres depuis l’ajout des marqueurs W/L.
- [x] Centrer les deux titres sur toute la largeur de leur TeamCard, les marqueurs restant superposés dans leur angle fixe.
- [x] Couvrir le centrage calculé dans le navigateur et valider la chaîne applicative avant de reprendre 3.22.

### Ajustement prioritaire 3.21.5 — commandes −/+ des scores

- [x] Entourer chaque input de score visible par deux boutons accessibles − et +, tout en conservant la saisie numérique directe.
- [x] Faire émettre à TeamCard la nouvelle valeur sans muter sa prop, initialiser une valeur absente à 0 lors du premier incrément et borner les commandes entre 0 et 100.
- [x] Désactiver simultanément l’input et ses commandes après OK, puis les réactiver avec leur valeur lors de KO.
- [x] Couvrir les interactions, les bornes et le parcours navigateur avant de reprendre 3.22.

### Ajustement prioritaire 3.21.6 — redemander le gagnant après KO sur égalité

- [x] Conserver sans écriture destructive le dernier score égal et son résultat pendant l’édition ouverte par KO.
- [x] Faire de toute nouvelle soumission OK de scores égaux une invalidation du choix manuel précédent, y compris lorsque les valeurs sont inchangées.
- [x] Réafficher `WINNER ?`, maintenir la Game et Next Rotation non résolus jusqu’à la nouvelle désignation, puis persister ce nouveau choix.
- [x] Couvrir le cycle complet par les tests du domaine, des composants, du store et du navigateur avant de reprendre 3.22.

### Ajustement prioritaire 3.21.7 — surbrillance du choix du gagnant

- [x] Mettre en surbrillance grise la TeamCard survolée uniquement lorsqu’elle est sélectionnable pendant `WINNER ?`.
- [x] Retirer l’état visuel à la sortie du pointeur et automatiquement lorsque le choix du gagnant rend la carte non sélectionnable.
- [x] Préserver le rendu des TeamCards ordinaires, en édition et résolues, puis couvrir les transitions de survol par Vitest et Cypress avant de reprendre 3.22.

### Ajustement prioritaire 3.21.8 — structure vide de la Rotation suivante

- [x] Remplacer le placeholder `CREATED` sans Game décidé en 3.20.6 par une Game vide et deux Teams vides pour chacun des Courts utilisables de la Session.
- [x] Continuer la numérotation des Games à l’échelle de la Session, ne préplacer aucun Player dans les Teams et placer tous les participants dans `waitingPlayers`.
- [x] Faire retourner cette structure par `RotationService`, l’installer dans le store et la persister atomiquement avec la Rotation suivante.
- [x] Supprimer l’exception de validation autorisant zéro Game et faire normaliser par la migration les anciens placeholders persistés.
- [x] Couvrir service, invariant, migration, store, rechargement et navigateur ; conserver Start Rotation désactivé jusqu’à la composition complète avant de reprendre 3.22.

### Ajustement prioritaire 3.21.9 — drag & drop tactile

Objectif : rendre l’affectation manuelle des Players utilisable sur smartphone sans remplacer le chemin HTML5 déjà employé à la souris.

- [x] Ajouter aux PlayerCards et aux zones de dépôt des attributs DOM stables consommés uniquement par l’adaptateur tactile de RotationCard.
- [x] Écouter les Pointer Events touch/stylet à la racine de RotationCard, capturer le pointeur lorsque le navigateur le permet et déterminer la cible au relâchement avec `elementFromPoint()`.
- [x] Réutiliser `handlePlayerDrop()` et l’événement `move-player` afin de conserver l’unique règle d’affectation portée par le store.
- [x] Ignorer les départs depuis les contrôles interactifs, gérer `pointercancel` et empêcher le navigateur d’interpréter le geste comme un scroll sur la PlayerCard déplacée.
- [x] Vérifier par Vitest les dépôts Team/waiting list et l’annulation, puis exécuter un déplacement tactile dans Cypress sur un viewport smartphone.

La tranche 3.22 redevient la tranche active après validation de cet ajustement.

### Ajustement prioritaire 3.21.10 — réinitialisation de la saisie des nouvelles Games

Objectif : empêcher qu’une `GameCard` réutilisée par Vue sur le même Court conserve l’état d’édition fermé de la Game résolue de la Rotation précédente.

- [x] Reproduire dans le test composant le remplacement d’une Game résolue par une nouvelle Game sans score avec conservation de l’instance Vue.
- [x] Lors du changement de `game.id`, resynchroniser les deux scores locaux et initialiser `isEditing` depuis `game.hasRecordedScore`.
- [x] Conserver l’édition locale lors des mises à jour de score de la même Game et le comportement KO non destructif.
- [x] Vérifier dans Cypress le cycle Rotation suivante, composition, Start Rotation, Stop Rotation et saisie immédiate de tous les scores.

La tranche 3.22 redevient la tranche active après validation de ce correctif.

### Ajustement prioritaire 3.21.11 — terminer la Session depuis son en-tête

Objectif : anticiper la commande End Session prévue à l’étape 5 et rendre ses deux issues persistantes explicites.

- [x] Afficher End Session à droite de `Location # Session X` uniquement pour une Session `STARTED`.
- [x] Activer la commande si la Rotation courante est `CREATED`, ou si elle est `SCORING`, entièrement résolue et sans Game rouverte en édition locale.
- [x] Faire remonter l’état `score-editing-change` de RotationCard afin qu’End Session partage exactement l’éligibilité effective de Next Rotation.
- [x] Pour une Rotation `SCORING`, appeler `Rotation.finish()`, conserver ses scores et son historique, puis appeler `Session.finish()` avec le même instant.
- [x] Pour une Rotation `CREATED`, la supprimer de la collection persistée ainsi que ses Teams devenues orphelines avant de terminer la Session.
- [x] Remettre les Players à `AVAILABLE`, persister le graphe avant toute redirection puis naviguer vers Home.
- [x] Protéger l’action Pinia contre `IN_PROGRESS`, un scoring incomplet et toute Session non démarrée ; couvrir service de graphe, store, composants et navigateur.

Cette tranche anticipe les points 8 et 9 de l’étape 5. La tranche 3.22 redevient la tranche active après validation.

### Ajustement prioritaire 3.21.12 — échange de Players par drag & drop

Objectif : pendant une Rotation `CREATED`, permettre à un dépôt effectué directement sur une autre PlayerCard d’intervertir les deux positions sans modifier les autres affectations.

- [x] Distinguer l’intention `swap-player` du déplacement existant vers une Team ou la waiting list et empêcher la propagation du drop vers la zone parente.
- [x] Conserver les slots exacts `player1`/`player2` lors d’un échange Team↔Team, ainsi que l’indice exact dans `waitingPlayers` lors d’un échange impliquant la waiting list.
- [x] Refuser toute mutation hors du statut `CREATED`, valider les deux Players avant mutation et persister le graphe atomiquement après l’échange.
- [x] Résoudre en priorité la PlayerCard survolée dans le chemin Pointer Events afin que le même contrat fonctionne à la souris, au doigt et au stylet.
- [x] Couvrir le domaine, le store, la remontée des événements Vue et les parcours navigateur souris/tactile avant de reprendre 3.22.

La tranche 3.22 redevient la tranche active après validation de cet ajustement.

### Ajustement prioritaire 3.21.13 — rendu compact du fieldset de score

Objectif : conserver le regroupement sémantique des commandes de score avec un `fieldset` sans subir sa bordure, son padding ni sa largeur minimale natifs sur smartphone.

- [x] Réinitialiser uniquement les styles structurels propres au `fieldset.team__score-control` afin de retrouver le rendu flex de l’ancien `div`.
- [x] Conserver le centrage, les espacements et les dimensions existantes des boutons −/+, ainsi que la largeur de trois chiffres de l’input.
- [x] Vérifier le composant et le rendu calculé sur viewport portrait, puis reprendre 3.22.

La tranche 3.22 redevient la tranche active après validation de cet ajustement.


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
