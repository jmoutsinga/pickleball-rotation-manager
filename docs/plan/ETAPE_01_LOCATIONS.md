# Étape 1 — Home et Locations

- État : **Terminée**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).

## Plan canonique


1. [x] Confirmer le modèle actuel `Location` avec `id`, `name`, `description` et `nbCourts`.
2. [x] Créer un store Pinia dédié aux Locations et charger les données persistées.
3. [x] `LocationBuilder`, ajout et édition persistante terminés.
4. [x] Introduire `LocationStatus`, puis implémenter la suppression logique persistante par passage de `ACTIVE` à `DELETED`.
5. [x] Extraire d'abord `CardGrid`, puis `CreateEntityCard` et `BaseModal` comme composants structurels réutilisables.
6. [x] Créer `LocationForm` pour la création et l'édition.
7. [x] Créer `LocationCard` avec sélection, édition et suppression.
8. [x] Afficher dans Home la carte de création en premier, puis la grille des Locations actives.
9. [x] Afficher visuellement la sélection et l'action de session uniquement sur la Location sélectionnée, avec désélection extérieure sur toute la hauteur disponible.
10. [x] Afficher « Start New Session » ou « Manage Current Session » selon l'unique Session `STARTED` liée.
11. [x] Créer la nouvelle Session avec `order = max + 1` lorsque nécessaire.
12. [x] Naviguer vers `/manage/:locationId/:sessionId` et charger le graphe identifié par la route.
13. [x] Intégrer dans `HomeView` la création d'une Location avec `CreateEntityCard`, `BaseModal` et `LocationForm`, puis couvrir le parcours d'ouverture, de fermeture et de soumission.
14. [x] Intégrer dans `HomeView` l'édition d'une Location avec `LocationCard`, `BaseModal` et `LocationForm`, puis couvrir la sélection de la cible, le préremplissage, la fermeture et la soumission.
15. [x] Finaliser les pictogrammes Edit/Delete : rail horizontal rentré de 3 px sous la bordure supérieure et rendu uniquement sur la Location sélectionnée.
16. [x] Aligner l'action de Session sur le bouton Create de `ManagePlayers`, avec Start en vert et Manage en orange `#FFAA1F`.
17. [x] Connecter Delete à une confirmation avec `BaseModal`, puis à la suppression logique existante dans `useLocationStore`.
18. [x] Interdire la modification de `nbCourts` lorsqu'au moins une Session de la Location est `STARTED`, dans le formulaire et dans l'action du store.
19. [x] Tester composants, stores, création, édition et suppression en modale, styles Start/Manage, règle de `nbCourts`, accès direct, rechargement, lint et build.
20. [x] Transformer les actions Start/Manage en pictogrammes Play/Fast Forward de 52 px, positionnés à 4 px du coin supérieur droit, avec les libellés Start/Continue et sans déplacer les éléments centrés.
21. [x] Empêcher les clics de Create Location et des modales de remonter jusqu'à la désélection de `HomeView`, tout en conservant la désélection extérieure.
22. [x] Après une création réussie, sélectionner la nouvelle Location et désélectionner automatiquement celle qui l'était auparavant.
23. [x] Ajouter un bouton « Initialize sample data » au-dessus du titre, conditionné par un flag persistant, et créer une fois cinq Locations ainsi que cinquante Players de démonstration sans écraser les données existantes.
Chaque point fera l’objet d’une modification limitée.


## Découpage détaillé historique

Ce découpage conserve les sous-tranches élaborées pendant l’implémentation.

### Home et Locations — étape 1

1. [x] Confirmer le modèle actuel `Location { id, name, description, nbCourts }` sans modifier son contrat.
2. [x] Créer `useLocationStore`, charger les Locations depuis `localStorage` et couvrir le store par des tests unitaires.
3. [x] Introduire `LocationBuilder` avec les invariants du modèle, puis ajouter au store la création et l'édition d'une Location en tranches testées séparément.
   - [x] Builder, normalisation, bornes et restauration JSON.
   - [x] Création réactive et persistante avec ajout unitaire délégué au service de stockage.
   - [x] Édition réactive et persistante en conservant l'identifiant, avec erreur explicite pour un identifiant inexistant.
4. [x] Introduire `LocationStatus`, puis implémenter la suppression logique en passant la Location de `ACTIVE` à `DELETED` sans la retirer de l'historique persistant.
5. [x] Créer `CardGrid`, composant de mise en page générique exposant un slot par défaut.
6. [x] Créer `CreateEntityCard`, composant générique paramétré par son libellé et émettant un événement d'activation.
7. [x] Créer `BaseModal`, composant générique contrôlé par props et événements, avec slots pour son contenu et ses actions.
8. [x] Créer `LocationForm`, formulaire spécifique à `Location`, utilisable en création et en édition dans `BaseModal`.
9. [x] Créer `LocationCard`, recevant une Location par prop et émettant les événements de sélection, édition et suppression.
10. [x] Remplacer le contenu de `HomeView` par la grille : carte de création en première position, puis Locations actives issues du store.
11. [x] Conserver `selectedLocationId` comme état local de `HomeView`, rendre la sélection visible, permettre la désélection extérieure sur toute la hauteur disponible et afficher l'action de session uniquement sur la carte sélectionnée.
12. [x] Déterminer les Sessions `STARTED` de la Location sélectionnée et traiter explicitement les cardinalités zéro, une et plusieurs.
13. [x] Créer une Session avec `order = max + 1` lorsqu'aucune Session `STARTED` n'existe, puis naviguer vers `/manage/:locationId/:sessionId`.
    - [x] Centraliser la création, la persistance, le rechargement et la numérotation par Location dans `createSessionForLocation()`.
    - [x] Naviguer vers la route identifiée avec la Location et la Session créées.
14. [x] Réutiliser l'unique Session `STARTED` existante et naviguer vers `/manage/:locationId/:sessionId` avec « Manage Current Session ».
15. [x] Adapter le routeur et le chargement de `ManageSession` aux paramètres `locationId` et `sessionId`, en conservant temporairement une compatibilité contrôlée avec `/manage` si nécessaire.
    - [x] Étendre `ensureSession()` avec un couple optionnel `locationId`/`sessionId` : sans identifiants, conserver l'initialisation historique ; avec les deux identifiants, charger et valider exactement le graphe demandé.
    - [x] Rendre `saveSessionGraph()` non destructif pour les graphes des autres Locations et Sessions.
    - [x] Brancher la route `manageSession` sur un garde transmettant ses deux paramètres, tout en laissant `/manage` et `/manage-players` utiliser le chemin historique.
16. [x] Intégrer dans `HomeView` la création d'une Location au moyen de `CreateEntityCard`, `BaseModal` et `LocationForm`.
    - [x] Écouter l'événement `activate` de `CreateEntityCard` et conserver l'état d'ouverture de la modale dans un `ref` local à `HomeView`.
    - [x] Monter `BaseModal` depuis `HomeView`, placer `LocationForm` dans son slot par défaut et exposer les actions Cancel/Create dans son slot `actions`.
    - [x] Fermer la modale depuis l'événement `close` de `BaseModal` et depuis l'action Cancel.
    - [x] À la soumission de `LocationForm`, appeler `locationStore.createLocation()` avec le DTO émis, puis fermer la modale uniquement après une création réussie.
    - [x] Couvrir dans `HomeView.spec.js` l'ouverture, l'annulation, la fermeture et la création persistante déclenchée par la soumission du formulaire.
17. [x] Intégrer dans `HomeView` l'édition d'une Location dans `BaseModal` en réutilisant `LocationCard` et `LocationForm`.
    - [x] Écouter l'événement `edit` de `LocationCard`, retrouver la Location par son identifiant et la conserver comme cible d'édition dans un état local à `HomeView`.
    - [x] Ouvrir `BaseModal` avec un titre et des actions propres à l'édition, puis transmettre la Location ciblée à `LocationForm` afin d'initialiser son brouillon.
    - [x] Fermer la modale et réinitialiser la cible d'édition depuis l'événement `close` de `BaseModal` et depuis l'action Cancel.
    - [x] À la soumission de `LocationForm`, appeler `locationStore.updateLocation()` avec l'identifiant conservé et le DTO émis, puis fermer la modale uniquement après une mise à jour réussie.
    - [x] Couvrir dans `HomeView.spec.js` l'ouverture depuis la bonne carte, le préremplissage, l'annulation, la fermeture et la mise à jour déclenchée par la soumission.
18. [x] Finaliser les commandes Edit/Delete de `LocationCard` avec des pictogrammes accessibles, visibles uniquement lorsque la carte est sélectionnée et contenus sous sa bordure supérieure.
    - [x] Remplacer les libellés visibles par des SVG intégrés au composant, sans dépendance ni fichier bitmap externe.
    - [x] Dessiner Edit comme un crayon moderne dans un bouton circulaire et Delete comme une poubelle au couvercle légèrement ouvert dans un petit cercle.
    - [x] Conserver les boutons natifs, leurs `aria-label`, des SVG décoratifs `aria-hidden` et des états de focus clavier visibles.
    - [x] Disposer les deux boutons côte à côte, Edit à gauche de Delete, dans un rail horizontal centré au-dessus du titre.
    - [x] Rentrer entièrement les boutons dans la carte en conservant exactement 3 px entre la bordure supérieure et leur bord externe.
    - [x] Rendre le rail uniquement lorsque `isSelected` vaut `true`, sans conserver de commandes masquées dans l'ordre de tabulation lorsque la carte n'est pas sélectionnée.
    - [x] Ajuster le padding supérieur pour éviter tout chevauchement avec le titre, y compris sur une carte étroite ou sélectionnée.
    - [x] Adapter les tests de composant et Cypress pour vérifier l'absence du rail hors sélection, son apparition après sélection, son retrait supérieur de 3 px, son centrage horizontal et l'absence de chevauchement avec le titre.
19. [x] Aligner le bouton d'action de Session de `LocationCard` sur le style du bouton Create de `ManagePlayers` et différencier ses deux états.
    - [x] Reprendre le contrat visuel du bouton Create : padding `8px 16px`, rayon `4px`, absence de bordure, texte gras et curseur d'action.
    - [x] Afficher « Start New Session » avec un fond vert `#42b983` et un texte blanc.
    - [x] Afficher « Manage Current Session » avec un fond orange `#FFAA1F` et un texte foncé suffisamment contrasté.
    - [x] Conserver un focus clavier visible et couvrir les deux variantes par les tests de `LocationCard`.
20. [x] Connecter la commande Delete de `LocationCard` à une confirmation puis à la suppression logique existante.
    - [x] Écouter l'événement `delete` dans `HomeView`, retrouver la Location demandée et la conserver comme cible de suppression dans un état local.
    - [x] Réutiliser `BaseModal` pour afficher une confirmation nommant explicitement la Location, avec les actions Cancel et Delete.
    - [x] Fermer la confirmation et réinitialiser la cible depuis la croix ou Cancel sans appeler le store.
    - [x] À la confirmation, appeler `locationStore.deleteLocation(locationId)` afin de passer la Location à `DELETED`, recharger les Locations actives et fermer la modale uniquement après succès.
    - [x] Réinitialiser `selectedLocationId` lorsque la Location supprimée était sélectionnée et ne rien ouvrir pour un identifiant inconnu.
    - [x] Couvrir l'ouverture sur la bonne Location, l'annulation, la fermeture, la confirmation, l'appel au store, la disparition de la grille active et la conservation dans l'historique persistant.
21. [x] Interdire la modification de `Location.nbCourts` lorsqu'au moins une Session de cette Location possède le statut `STARTED`.
    - [x] Formaliser la règle comme « aucune Session `STARTED` » : autoriser une Location sans Session et une Location dont toutes les Sessions sont `FINISHED`, sans se limiter à la dernière Session.
    - [x] Ajouter au store de Sessions une lecture explicite permettant à l'interface de déterminer si le nombre de courts est modifiable pour une Location.
    - [x] Désactiver uniquement le champ `nbCourts` de `LocationForm` pendant l'édition d'une Location ayant une Session `STARTED`, tout en laissant le nom et la description modifiables et en expliquant la raison dans le formulaire.
    - [x] Protéger également `updateLocation()` dans le store de Locations en comparant la valeur persistée et en refusant tout changement de `nbCourts` lorsqu'une Session `STARTED` existe ; une mise à jour du nom ou de la description conservant le même nombre reste autorisée.
    - [x] Réévaluer la règle lors de la soumission afin qu'une Session démarrée pendant l'ouverture de la modale ne permette pas de contourner la protection ; en cas de refus, conserver la modale ouverte.
    - [x] Tester les cas sans Session, toutes `FINISHED`, une `STARTED`, plusieurs Sessions incohérentes dont une ancienne `STARTED`, valeur de courts inchangée et tentative directe d'appeler le store.
22. [x] Tester les stores, composants, états de sélection, création, édition et suppression en modale, styles Start/Manage, règle de `nbCourts`, navigation, accès direct et rechargement.
23. [x] Transformer l'action de Session sélectionnée en pictogramme rond positionné en haut à droite de `LocationCard`.
    - [x] Remplacer Start New Session par un SVG Play — triangle dans un cercle vert `#42b983` — accompagné du petit libellé « Start » sous le cercle.
    - [x] Remplacer Manage Current Session par un SVG Fast Forward — deux triangles dans un cercle orange `#FFAA1F` — accompagné du petit libellé « Continue » sous le cercle.
    - [x] Dimensionner chaque cercle à 52 px, soit exactement 1,3 fois le bouton circulaire Edit de 40 px, tout en conservant le nom accessible complet de l'action.
    - [x] Positionner le bord externe du cercle à 4 px des bordures supérieure et droite de la carte, sans déplacer le rail Edit/Delete centré horizontalement.
    - [x] Réserver l'espace vertical nécessaire et centrer explicitement le titre, `courtLabel` et la description sur l'axe de la carte sans chevauchement avec les commandes.
    - [x] Couvrir la structure SVG, les libellés Start/Continue, les couleurs, le rapport de taille, les retraits de 4 px et les centrages par les tests de composant et Cypress.
24. [x] Préserver `selectedLocationId` lorsqu'un utilisateur ouvre Create Location ou interagit avec une modale de `HomeView`.
    - [x] Faire échouer les tests lorsque le clic natif de `CreateEntityCard` remonte jusqu'au gestionnaire de désélection de `.home`.
    - [x] Faire échouer les tests lorsqu'un clic dans les formulaires Create/Edit ou les actions de `BaseModal` remonte jusqu'à `.home`.
    - [x] Arrêter la propagation du clic sur le bouton racine de `CreateEntityCard` tout en conservant l'émission `activate`.
    - [x] Arrêter la propagation à la racine de `BaseModal` afin d'isoler tous ses slots et actions, sans modifier son événement `close`.
    - [x] Vérifier que les clics réellement extérieurs aux cartes et aux modales continuent de désélectionner la Location.
    - [x] Couvrir le parcours complet par les tests de composants et Cypress, puis valider type-check, lint, Vitest, Cypress et build Vite.
25. [x] Sélectionner automatiquement la nouvelle Location après une création réussie.
    - [x] Faire retourner par `createLocation()` l'objet `Location` effectivement construit et persisté.
    - [x] Dans `HomeView`, remplacer `selectedLocationId` par l'identifiant retourné uniquement après le succès de la création, sans modifier la sélection lors d'une édition.
    - [x] Vérifier qu'une Location précédemment sélectionnée perd son état selected et que la nouvelle carte reçoit le rail de commandes ainsi que l'action de Session.
    - [x] Couvrir le contrat du store, le composant et le parcours Cypress, puis valider type-check, lint, Vitest, Cypress et build Vite.
27. [x] Ajouter au-dessus du `h1` de Home un bouton visible « Initialize sample data » permettant une initialisation locale unique et non destructive des données de démonstration.
    - [x] Créer un service applicatif indépendant de la vue qui construit cinq Locations actives — Le Grand Saconnex (4), Genève (2), Lancy (6), Carouge (2), Bellevue (8) — et cinquante Players `AVAILABLE` répartis exactement en 20 prénoms masculins, 15 féminins et 15 mixtes.
    - [x] Fusionner les exemples avec les collections existantes sans écrasement, ignorer les noms déjà présents et construire toutes les entités avant de commencer la persistance.
    - [x] Protéger le cas d'usage par le flag `pickleball_sample_data_initialized`, vérifié également dans le service, et ne l'écrire qu'après la sauvegarde réussie des deux collections.
    - [x] Afficher le bouton uniquement lorsque le flag est absent, le placer avant le titre, le rendre visuellement proéminent et le retirer immédiatement après le clic réussi.
    - [x] Recharger le store des Locations après initialisation ; les Players seront restaurés par `ManagePlayers` lors de son montage normal.
    - [x] Couvrir en TDD les quantités, valeurs, statuts, proportions de prénoms, fusion non destructive, idempotence, visibilité/ordre du bouton et persistance après rechargement.
