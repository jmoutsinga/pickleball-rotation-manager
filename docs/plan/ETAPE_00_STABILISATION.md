# Étape 0 — Stabilisation commune

- État : **Terminée**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).

## Plan canonique


1. [x] Corriger l’initialisation globale des données.
2. [x] Corriger le problème des joueurs invisibles.
3. [x] Définir les modèles minimaux et les règles d’identifiants.
4. [x] Introduire Pinia et un service de persistance clairement séparé.
5. [x] Remplacer Vue CLI par Vite.
6. [x] Introduire Vitest et ajouter les tests unitaires minimaux des stores, modèles et algorithmes.
7. [x] Introduire les tests de composants Vue avec Vitest et Vue Test Utils.
8. [x] Mettre ESLint à jour vers `8.57.0`, `@typescript-eslint` vers la version majeure 8 et `eslint-plugin-vue` vers la version majeure 9 afin de supprimer le warning de compatibilité TypeScript.

La migration Pinia est architecturale : je te présenterai son fonctionnement et demanderai ton accord avant de modifier le projet.


## Découpage détaillé historique

Ce découpage conserve les sous-tranches élaborées pendant l’implémentation.
Les points explicitement reportés vers une étape ultérieure ne remettent pas en cause l’état terminé de l’étape 0 ; leur suivi canonique appartient à l’étape de destination.

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
5. [x] Choisir Vitest comme runner des tests unitaires et des tests de composants Vue.
6. [x] Introduire Vitest pour les tests unitaires purs des modèles, stores et algorithmes.
7. [x] Introduire Vitest avec Vue Test Utils pour les tests de composants Vue.
8. [x] Conserver Cypress pour les parcours E2E exécutés dans un navigateur complet.
9. [ ] Après la modernisation globale de l'outillage en 6.11, introduire Playwright et créer une suite miroir couvrant chaque test Cypress du projet selon l'étape 6.12, afin de conserver et comparer durablement les deux runners.

### Migration Vue CLI → Vite

1. [x] Inventorier les scripts, configurations et usages applicatifs dépendant de Vue CLI ou Webpack.
2. [x] Ajouter Vite et le plugin officiel Vue, puis retirer les dépendances Vue CLI devenues inutiles.
3. [x] Déplacer et adapter le point d'entrée HTML à la convention Vite.
4. [x] Créer la configuration Vite et conserver l'alias `@` vers `src`.
5. [x] Remplacer les variables Vue CLI par leurs équivalents Vite.
6. [x] Adapter les scripts npm de développement, lint, test E2E et build.
7. [x] Vérifier le lint, les trois parcours E2E et le build de production.

### Introduction de Vitest — étape 0.6

1. [x] Inventorier les invariants métier et les actions Pinia à couvrir en priorité.
2. [x] Installer Vitest et `happy-dom`, puis partager la configuration de transformation avec Vite.
3. [x] Ajouter les scripts npm d'exécution unique et de surveillance des tests unitaires.
4. [x] Tester les invariants, transitions et sérialisations des modèles métier principaux.
5. [x] Tester le store avec une nouvelle instance Pinia et un stockage vide avant chaque test.
6. [x] Ajouter les tests unitaires au contrôle automatique exécuté avant le build.
7. [x] Vérifier les tests unitaires, le lint, les trois parcours E2E et le build de production.

### Tests de composants Vue — étape 0.7

1. [x] Inventorier les composants existants et sélectionner un rendu simple ainsi qu'une interaction dépendant de Pinia.
2. [x] Installer Vue Test Utils et `@pinia/testing`.
3. [x] Monter `HomeView` avec un `RouterLink` substitué et vérifier son rendu public.
4. [x] Monter `ManagePlayers` avec un Pinia de test et un état initial contrôlé.
5. [x] Simuler une saisie et un clic, puis vérifier l'action Pinia émise par le composant.
6. [x] Vérifier l'isolation entre les tests et le nettoyage des composants montés.
7. [x] Vérifier Vitest, le lint, les trois parcours E2E et le build de production.

### Modernisation progressive d'ESLint — étape 0.8

1. [x] Identifier le décalage entre TypeScript `5.9.3`, ESLint `7.32.0` et `@typescript-eslint` `5.62.0`.
2. [x] Mettre ESLint à jour vers `8.57.0`, aligner `@typescript-eslint/parser` et `@typescript-eslint/eslint-plugin` sur la version majeure 8 afin de prendre en charge TypeScript `5.9.3`, puis passer `eslint-plugin-vue` à la version majeure 9 requise pour interpréter correctement les macros TypeScript de `<script setup>`.
3. [x] Vérifier l'arbre des dépendances, l'absence du warning `typescript-estree`, le lint, les tests Vitest, le contrôle TypeScript et le build Vite, puis reprendre la validation de `CreateEntityCard`.
4. [x] Conserver provisoirement le format `.eslintrc.js` jusqu'à la migration globale de l'outillage planifiée en 6.11.

### Contrôle de types Vue — étape 0.9

1. [x] Confirmer que Vite transpile les fichiers TypeScript sans exécuter un contrôle de types complet et que `vue-tsc` n'est pas installé localement.
2. [x] Installer `vue-tsc` comme dépendance de développement et ajouter le script `type-check` avec `--noEmit`.
3. [x] Exécuter automatiquement `type-check` avant le build, puis vérifier le contrôle de types, le lint, les tests et le build.
