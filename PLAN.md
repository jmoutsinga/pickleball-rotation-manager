# Plan de développement

## Attendu fonctionnel

L’application permet de gérer des lieux de pickleball, les joueurs, les Sessions et leurs Rotations,
depuis la sélection des participants jusqu’au scoring et au calcul de la Rotation suivante.

Le cahier des charges détaillé, y compris la machine à états Session/Rotation, se trouve dans
[`docs/ATTENDU_FONCTIONNEL.md`](docs/ATTENDU_FONCTIONNEL.md).

## Plan

### Situation actuelle

- Étape active : **3 — Modèle, participants et structure de Manage Session**.
- Tranche active : **3.17 — Charger et valider Location et Session depuis la route**.
- État de la tranche : **à démarrer**.
- Prochaine action : lire `locationId` et `sessionId`, charger les entités persistées correspondantes et vérifier leur relation.
- Dernière tranche terminée : **3.20 — scoring du domaine et découpage de la persistance**.
- Dernière validation applicative complète : **2026-08-20 03:51:13** — type-check, lint, 249 tests Vitest, 17 scénarios Cypress, `git diff --check` et build Vite réussis.
- Éléments anticipés : la persistance/restauration du graphe de 3.22 et les affectations manuelles de 4.4 sont partiellement implémentées.
- Marqueurs : `[x]` terminée ; `[==>]` en cours ; `[ ]` à faire.

### Feuille de route

| Étape | Objectif | État | Détail |
|---|---|---|---|
| 0 | Stabilisation commune | Terminée | [Étape 0](docs/plan/ETAPE_00_STABILISATION.md) |
| 1 | Home et Locations | Terminée | [Étape 1](docs/plan/ETAPE_01_LOCATIONS.md) |
| 2 | Manage Players | Terminée | [Étape 2](docs/plan/ETAPE_02_PLAYERS.md) |
| 3 | Modèle, participants et structure de Manage Session | En cours | [Étape 3](docs/plan/ETAPE_03_MANAGE_SESSION.md) |
| 4 | Préparation et lancement d’une Rotation | À faire | [Étape 4](docs/plan/ETAPE_04_PREPARATION_ROTATION.md) |
| 5 | Scoring et fin de Session | À faire | [Étape 5](docs/plan/ETAPE_05_SCORING.md) |
| 6 | Calcul de la Rotation suivante et modernisation de l’outillage | À faire | [Étape 6](docs/plan/ETAPE_06_ROTATION_SUIVANTE.md) |
| 7 | SQLite | À faire | [Étape 7](docs/plan/ETAPE_07_SQLITE.md) |

### Tranche active — 3.17

- [ ] Charger la Location désignée par `locationId`.
- [ ] Charger la Session désignée par `sessionId`.
- [ ] Vérifier que la Session appartient à la Location demandée.
- [ ] Couvrir le chargement identifié et sa validation par des tests ciblés.

La gestion d’une Session inexistante, incohérente ou terminée appartient à la tranche suivante, **3.18**.

### Politique documentaire

- `PLAN.md` contient uniquement l’état courant, la feuille de route et la tranche active.
- Le détail et les critères de chaque étape se trouvent dans [`docs/plan`](docs/plan).
- Les décisions durables sont ajoutées en tête de [`docs/DECISIONS_TECHNIQUES.md`](docs/DECISIONS_TECHNIQUES.md), avec date, heure, justification et conséquences.
- Les comptes rendus d’exécution historiques se trouvent dans [`docs/archive/JOURNAL_IMPLEMENTATION.md`](docs/archive/JOURNAL_IMPLEMENTATION.md).
- L’ancien plan complet est conservé dans [`docs/archive/PLAN_AVANT_REORGANISATION_2026-08-20.md`](docs/archive/PLAN_AVANT_REORGANISATION_2026-08-20.md).
- Après chaque étape significative, mettre à jour le fichier de l’étape avant le résumé de `PLAN.md`.

### Dernière maintenance du plan

- **2026-08-20 11:30:39** — restructuration terminée : cahier des charges, huit fichiers d’étape, décisions et journal d’implémentation séparés ; archive intégrale conservée et liens locaux vérifiés.
