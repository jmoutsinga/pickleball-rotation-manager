# Instructions pour Codex

## Objectif

Aider à terminer cette application Vue.js tout en expliquant progressivement
les concepts Vue.js utilisés.

## Profil du développeur

Le développeur possède une forte expérience en Java, Spring et architecture
logicielle, mais approfondit actuellement Vue.js.

## Règles de travail

- Analyser avant de modifier.
- Expliquer les concepts Vue.js avant chaque implémentation.
- Privilégier des changements petits et vérifiables.
- Ne pas modifier plusieurs fonctionnalités majeures en même temps.
- Expliquer les composants, props, événements, slots, composables, stores,
  routes, hooks de cycle de vie et mécanismes de réactivité utilisés.
- Comparer avec Java ou Spring lorsque cette analogie facilite la compréhension.
- Montrer et expliquer les différences avant validation.
- Vérifier le lint, les tests et le build après les changements significatifs.
- Signaler les hypothèses et les incertitudes.
- Ne jamais modifier les fichiers de secrets ou les fichiers .env sans autorisation explicite.

## Plan de développement persistant

Le fichier `PLAN.md` à la racine du projet constitue la source de vérité
pour l'état courant, la feuille de route et la prochaine action. Le détail de
chaque étape se trouve dans `docs/plan/`.

- Lire intégralement `PLAN.md` avant de commencer toute nouvelle tâche.
- Lire ensuite intégralement uniquement le fichier de l'étape active indiqué par `PLAN.md`.
- Ne pas charger automatiquement les fichiers des étapes terminées ou futures.
- Consulter `docs/ATTENDU_FONCTIONNEL.md` seulement pour les sections nécessaires à la tâche en cours.
- Rechercher dans `docs/DECISIONS_TECHNIQUES.md` uniquement les décisions liées à l'étape, au composant ou au concept traité ; ne pas lire tout l'historique sans nécessité.
- Lorsqu'un plan de développement est établi ou modifié dans une conversation, l'enregistrer dans `PLAN.md` avant de commencer l'implémentation.
- Ne pas considérer le contenu de la conversation comme la seule source du plan de développement.
- Maintenir le fichier détaillé de l'étape active au fur et à mesure de l'avancement, puis reporter dans `PLAN.md` uniquement le résumé, l'état et la prochaine action.
- Marquer explicitement les étapes terminées et celles restant à réaliser.
- Enregistrer en tête de `docs/DECISIONS_TECHNIQUES.md` les décisions techniques durables, de la plus récente à la plus ancienne, avec la date-heure-min-sec, le contexte, la décision, sa justification et ses conséquences.
- Ne pas enregistrer les simples commandes exécutées, nombres de tests ou validations intermédiaires dans le registre des décisions ; conserver uniquement la dernière validation significative dans le fichier de l'étape active.
- En cas de contradiction entre `PLAN.md` et une instruction explicite donnée par l'utilisateur dans la conversation courante,
  l'instruction explicite la plus récente de l'utilisateur prévaut ; présenter la contradiction à l'utilisateur pour valider l'intention
  puis mettre à jour `PLAN.md` pour refléter cette décision.
- Après chaque étape significative, mettre à jour d'abord le fichier de l'étape active, puis `PLAN.md`, avant de passer à l'étape suivante.
