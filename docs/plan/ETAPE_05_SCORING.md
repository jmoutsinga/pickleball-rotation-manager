# Étape 5 — Scoring et fin de Session

- État : **À faire**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).

## Plan canonique


1. [ ] Passer à `SCORING` lorsque le minuteur atteint zéro ou lorsque l'utilisateur clique sur « Matchs Results ».
2. [ ] Afficher et activer les scores uniquement en `SCORING`.
3. [ ] Valider les entiers de 0 à 100.
4. [ ] Exiger tous les scores.
5. [ ] Déterminer gagnant et perdant.
6. [ ] Gérer manuellement les égalités avec « WINNER ? ».
7. [ ] Enregistrer équipes, scores, joueurs en attente et horaire de fin.
8. [ ] Garder « Next Rotation » et « End Session » désactivés tant que tous les résultats ne sont pas enregistrés, puis implémenter leurs actions.
9. [ ] Passer la Rotation à `FINISHED`, remettre tous ses Players à `AVAILABLE` et terminer également la Session depuis « End Session ».
10. [ ] Proposer « New Session » depuis une Session terminée.
