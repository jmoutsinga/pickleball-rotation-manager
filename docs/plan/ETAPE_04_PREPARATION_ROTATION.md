# Étape 4 — Préparation et lancement d’une Rotation

- État : **À faire — affectations manuelles partiellement anticipées**.
- Attendu fonctionnel : [`ATTENDU_FONCTIONNEL.md`](../ATTENDU_FONCTIONNEL.md).
- Tableau de bord : [`PLAN.md`](../../PLAN.md).

## Plan canonique


1. [ ] Implémenter « New Rotation ».
2. [ ] Créer la Rotation en statut `CREATED`.
3. [ ] Initialiser Courts, Games, Teams et joueurs disponibles.
4. [ ] Implémenter les affectations manuelles par drag-and-drop.
5. [ ] Gérer les échanges Team ↔ Team et Team ↔ OffCourtPlayers.
6. [ ] Créer le minuteur paramétrable.
7. [ ] Implémenter « Start Rotation ».
8. [ ] Passer à `IN_PROGRESS`, affecter `PLAYING` aux Players des Teams et `WAITING` aux Players hors Court, puis figer toutes les affectations jusqu'à la fin de la Rotation.
9. [ ] Afficher Available Players ou Waiting Players selon le statut.
10. [ ] Restaurer correctement une rotation après navigation ou rechargement.
