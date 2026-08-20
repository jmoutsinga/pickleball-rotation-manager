# Étape 2 — Manage Players

- État : **Terminée**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).

## Plan canonique


1. [x] Remplacer `PlayerStatus.ACTIVE` par `PLAYING` et formaliser `AVAILABLE` avant/après Rotation, puis `PLAYING`/`WAITING` pendant une Rotation démarrée.
2. [x] Introduire et sérialiser `RotationStatus`, avec restauration des anciennes Rotations en `CREATED`.
3. [x] Créer `usePlayerStore`, charger tous les Players et découpler `/manage-players` de l'initialisation d'une Session.
4. [x] Implémenter la création persistante et l'unicité globale des noms.
5. [x] Implémenter l'édition persistante du nom en conservant identifiant et statut.
6. [x] Implémenter Delete logique, Restore vers `AVAILABLE` et le refus de Delete si une Session `STARTED` référence le Player.
7. [x] Exclure les Players supprimés des nouvelles Rotations et conserver `AVAILABLE` pendant leur préparation.
8. [x] Créer `PlayerForm`.
9. [x] Créer `PlayerCard`, son rendu supprimé et sa sélection accessible.
10. [x] Ajouter les pictogrammes Edit/Delete et Restore selon le statut et la sélection.
11. [x] Construire la grille avec Create Player en première position et la sélection locale.
12. [x] Ajouter la recherche dynamique et le toggle « Show Deleted Players ».
13. [x] Intégrer la création en modale et sélectionner le Player créé.
14. [x] Intégrer l'édition dans la même modale.
15. [x] Intégrer la confirmation Delete et l'action Restore avec les règles de sélection validées.
16. [x] Valider modèles, stores, composants, E2E, accès direct, type-check, lint et build.
17. [x] Transformer « Show Deleted Players » en switch natif accessible et stylé, sans dépendance externe ni changement du comportement de filtrage.


## Découpage détaillé historique

Ce découpage conserve les sous-tranches élaborées pendant l’implémentation.

### Manage Players — étape 2

1. [x] Clarifier le cycle de vie du Player : `AVAILABLE` avant/après une Rotation, `PLAYING` sur un Court après démarrage, `WAITING` hors Court pendant la Rotation et `DELETED` pour la suppression logique ; remplacer `ACTIVE` par `PLAYING` et migrer les données historiques `ACTIVE`.
2. [x] Introduire `RotationStatus { CREATED, IN_PROGRESS, SCORING, FINISHED }`, persister ce statut et restaurer les anciennes Rotations sans statut en `CREATED` ; conserver les transitions d'interface détaillées dans les étapes 4 et 5.
3. [x] Créer `usePlayerStore`, charger tous les Players persistés sans initialiser de Session et découpler `/manage-players` du garde `ensureSessionGuard`.
4. [x] Implémenter en TDD la création persistante d'un Player `AVAILABLE`, avec normalisation, unicité du nom parmi tous les statuts, rechargement réactif et retour de l'instance créée.
5. [x] Implémenter en TDD l'édition persistante du seul nom, en conservant l'identifiant et le statut et en refusant les identifiants inconnus ainsi que les doublons.
6. [x] Implémenter en TDD la suppression logique vers `DELETED` et la restauration vers `AVAILABLE`; interdire la suppression lorsqu'une Rotation rattachée à une Session `STARTED` référence le Player dans une Team ou sa waiting list.
7. [x] Adapter `useSessionStore` et la persistance afin qu'un Player `DELETED` ne soit jamais réintroduit dans une nouvelle Rotation, que les déplacements avant démarrage conservent `AVAILABLE` et que les anciens statuts `ACTIVE` soient restaurés en `PLAYING`.
8. [x] Créer `PlayerForm`, limité au nom pour l'instant, avec un brouillon local réactif, les modes création/édition, une validation accessible et l'émission d'un DTO sans dépendance au store.
9. [x] Créer `PlayerCard` avec le rendu du nom/statut, une surface de sélection accessible, un état selected contrôlé par prop et un fond gris pour `DELETED`.
10. [x] Ajouter à `PlayerCard` les commandes SVG accessibles : Edit/Delete uniquement pour un Player sélectionné non supprimé, et Restore uniquement pour un Player supprimé sélectionné, centré en haut et entièrement contenu dans la carte.
11. [x] Remplacer la table de `ManagePlayers` par `CardGrid`, placer `CreateEntityCard` en première position, rendre une `PlayerCard` par Player visible et conserver une sélection locale unique avec désélection extérieure.
12. [x] Ajouter sous le titre la recherche dynamique par sous-chaîne contiguë, insensible à la casse et aux accents, puis le toggle accessible « Show Deleted Players », désactivé par défaut ; effacer toute sélection devenue invisible.
13. [x] Intégrer la création dans `BaseModal` avec `PlayerForm`, fermer uniquement après succès et sélectionner automatiquement le Player créé.
14. [x] Intégrer l'édition dans la même modale, préremplir le nom, préserver identifiant/statut/sélection et maintenir la modale ouverte en cas d'échec.
15. [x] Intégrer la confirmation de suppression logique dans `BaseModal` et l'action Restore directe ; si Show Deleted Players est actif, conserver la carte supprimée sélectionnée, sinon la masquer et effacer la sélection, puis conserver la sélection après restauration.
16. [x] Couvrir les modèles, la persistance, les stores, les composants, les filtres, les modales, les références de Session, l'accès direct et le rechargement par Vitest/Cypress, puis valider type-check, lint, `git diff --check` et build Vite.
17. [x] Transformer « Show Deleted Players » en switch natif moderne : conserver `input[type="checkbox"]`, `v-model`, `role="switch"`, le clavier et le libellé, puis dessiner piste, curseur, états checked, hover et focus sans dépendance externe.
