# Plan de développement

## Attendu fonctionnel

L’application permet de gérer des lieux de pickleball, les joueurs, les Sessions et leurs Rotations,
depuis la sélection des participants jusqu’au scoring et au calcul de la Rotation suivante.

Le cahier des charges détaillé, y compris la machine à états Session/Rotation, se trouve dans
[`docs/ATTENDU_FONCTIONNEL.md`](docs/ATTENDU_FONCTIONNEL.md).

## Plan

### Situation actuelle

- Étape active : **3 — Modèle, participants et structure de Manage Session**.
- Tranche active : **3.22 — garantir la persistance et la restauration du graphe complet**.
- État de la tranche : **à reprendre après l’ajustement prioritaire 3.21.13 terminé**.
- Prochaine action : auditer puis compléter la persistance atomique et la restauration du graphe Session/Rotations/Courts/Games/Teams/Players, y compris après rechargement et migration historique.
- Dernière tranche terminée : **3.21.13 — neutraliser le rendu natif du fieldset de score**.
- Dernière validation applicative complète : **2026-08-21 02:16:26** — type-check, lint incluant Cypress, 326 tests Vitest, 19 scénarios Cypress et build Vite réussis après validation du fieldset de score compact sur viewport portrait.
- Éléments anticipés : la persistance/restauration du graphe de 3.22 et les affectations manuelles de 4.4 sont partiellement implémentées ; les points 5.8 et 5.9 sur Next Rotation et End Session sont terminés.
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

### Tranche active — 3.22

- [ ] Auditer les frontières actuelles entre store Pinia, repositories et `SessionGraphPersistenceService`.
- [ ] Garantir une écriture atomique du graphe complet sans collection indépendante de Games.
- [ ] Restaurer toutes les Rotations d’une Session et sélectionner la Rotation courante d’ordre maximal sans perdre Courts, Teams, Games ni Players.
- [ ] Couvrir les rechargements, migrations historiques et refus des graphes invalides avant la validation finale de l’étape 3.

### Politique documentaire

- `PLAN.md` contient uniquement l’état courant, la feuille de route et la tranche active.
- Le détail et les critères de chaque étape se trouvent dans [`docs/plan`](docs/plan).
- Les décisions durables sont ajoutées en tête de [`docs/DECISIONS_TECHNIQUES.md`](docs/DECISIONS_TECHNIQUES.md), avec date, heure, justification et conséquences.
- Les comptes rendus d’exécution historiques se trouvent dans [`docs/archive/JOURNAL_IMPLEMENTATION.md`](docs/archive/JOURNAL_IMPLEMENTATION.md).
- L’ancien plan complet est conservé dans [`docs/archive/PLAN_AVANT_REORGANISATION_2026-08-20.md`](docs/archive/PLAN_AVANT_REORGANISATION_2026-08-20.md).
- Après chaque étape significative, mettre à jour le fichier de l’étape avant le résumé de `PLAN.md`.

### Dernière maintenance du plan

- **2026-08-20 11:30:39** — restructuration terminée : cahier des charges, huit fichiers d’étape, décisions et journal d’implémentation séparés ; archive intégrale conservée et liens locaux vérifiés.
