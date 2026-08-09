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
pour le plan de développement en cours.

- Lire intégralement `PLAN.md` avant de commencer toute nouvelle tâche.
- Lorsqu'un plan de développement est établi ou modifié dans une conversation, l'enregistrer dans `PLAN.md` avant de commencer l'implémentation.
- Ne pas considérer le contenu de la conversation comme la seule source du plan de développement.
- Maintenir `PLAN.md` à jour au fur et à mesure de l'avancement.
- Marquer explicitement les étapes terminées et celles restant à réaliser.
- Enregistrer dans `PLAN.md` toutes les décisions techniques prises pendant le développement et leur justification en ajoutant la date-heure-min-sec à laquelle la décision a été prise (journal / log des décisions).
- En cas de contradiction entre `PLAN.md` et une instruction explicite donnée par l'utilisateur dans la conversation courante, 
  l'instruction explicite la plus récente de l'utilisateur prévaut ; présenter la contradiction à l'utilisateur pour valider l'intention
  puis mettre à jour `PLAN.md` pour refléter cette décision.
- Après chaque étape significative, mettre à jour `PLAN.md` avant de passer à l'étape suivante.