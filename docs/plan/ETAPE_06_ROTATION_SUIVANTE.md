# Étape 6 — Calcul de la rotation suivante

- État : **À faire**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).

## Plan canonique


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
11. [ ] Inventorier puis migrer tout l'outillage du projet vers ses versions stables courantes respectives — notamment ESLint et sa configuration plate, plugins ESLint, TypeScript, Vite, Vitest, Vue Test Utils, Cypress et utilitaires de build/test — par lots compatibles et vérifiables.
    - [ ] Centraliser l'indentation et les règles de base dans un fichier `.editorconfig` versionné et reconnu par IntelliJ IDEA ainsi que par les autres éditeurs compatibles.
    - [ ] Installer localement un formateur déterministe compatible avec les SFC Vue, verrouiller sa version et versionner sa configuration commune.
    - [ ] Aligner ESLint et le formateur afin que les règles de qualité Vue/TypeScript et les règles de présentation ne se contredisent pas.
    - [ ] Ajouter des scripts npm `format` et `format:check`, puis intégrer la vérification du formatage à la chaîne automatisée sans mutation des fichiers.
    - [ ] Documenter l'activation du formateur partagé dans IntelliJ IDEA et les commandes indépendantes de l'IDE.
    - [ ] Une fois la configuration centralisée validée, appliquer le formatage à tout le code du projet dans un lot mécanique distinct, puis vérifier le type-check, le lint, tous les tests et le build.
12. [ ] Introduire Playwright et créer un test Playwright miroir pour chaque test Cypress après stabilisation de l'outillage modernisé, sans retirer la suite Cypress.
    - [ ] Réinventorier tous les fichiers et scénarios Cypress à cette date, compter les cas réellement générés par les tests paramétrés et établir une matrice de correspondance Cypress ↔ Playwright exhaustive ; le référentiel actuel contient 17 scénarios dans `cypress/e2e/routes.cy.js`.
    - [ ] Installer `@playwright/test` et les navigateurs strictement nécessaires, puis créer une configuration utilisant le même serveur Vite de test, la même `baseURL`, un viewport et des délais explicitement alignés autant que possible avec Cypress, ainsi que des traces/captures conservées en cas d'échec.
    - [ ] Ajouter des fixtures Playwright pour initialiser et nettoyer `localStorage`, détecter les erreurs JavaScript de page et collecter les réponses HTTP en erreur avec le même niveau de protection que la suite Cypress.
    - [ ] Créer les équivalents Playwright des quatre cas paramétrés d'accès direct et de rechargement de route, puis du scénario de redirection d'une route identifiée invalide.
    - [ ] Créer les équivalents Playwright de tous les parcours Home, y compris désélection extérieure, largeur des cartes, initialisation persistante des données de démonstration, géométrie des commandes, suppression logique, verrouillage du nombre de Courts, conservation de la sélection dans les modales et sélection après création.
    - [ ] Créer les équivalents Playwright de tous les parcours Manage Players : chargement et filtre sans Session implicite, cycle Create/Edit/Delete/Restore et refus de Delete pour un Player lié à une Session `STARTED`.
    - [ ] Créer l'équivalent Playwright du parcours Manage Session couvrant la sélection persistante d'au moins quatre participants `AVAILABLE`, le rechargement du brouillon et le démarrage différé de la Session.
    - [ ] Conserver pour chaque paire les mêmes données initiales, étapes utilisateur et résultats observables ; autoriser des locators idiomatiques propres à chaque runner lorsque leur intention fonctionnelle reste équivalente.
    - [ ] Maintenir une correspondance nominative ou documentée entre chaque test Cypress et son miroir Playwright, et ajouter le miroir Playwright de tout nouveau test Cypress créé pendant la période de comparaison.
    - [ ] Ne supprimer, désactiver ni réduire aucun test Cypress dans cette étape ; les deux suites constituent volontairement deux implémentations parallèles du même contrat E2E.
    - [ ] Exposer des scripts npm distincts `test:e2e:cypress` et `test:e2e:playwright`, conserver un agrégat `test:e2e` exécutant les deux suites et les intégrer toutes deux à la chaîne de validation.
    - [ ] Comparer les deux runners dans des conditions aussi proches que possible — famille de navigateur, viewport, serveur, données et mode headless — puis relever séparément durée, éventuels échecs intermittents, qualité des diagnostics et facilité de maintenance sans imposer prématurément un vainqueur.
    - [ ] Exécuter Playwright au minimum sur Chromium pour la comparaison initiale ; décider explicitement après cette comparaison si Firefox et WebKit doivent fournir une couverture supplémentaire sans équivalent Cypress direct.
    - [ ] Documenter les commandes d'exécution et modes UI, l'inspection des traces, la stratégie de locators et la méthode de lecture du rapport comparatif Cypress/Playwright.
    - [ ] Valider type-check, lint, Vitest, l'intégralité de Cypress, le même nombre de scénarios Playwright, `git diff --check` et build Vite avant de clôturer l'étape ; tout écart de cardinalité doit être justifié par une différence de paramétrage explicite.
