# Sparta — Workout Tracker

Application web de suivi sportif construite avec Angular 19 et Angular Material.

## Fonctionnalités

- **Tableau de bord** — stats rapides (séances totales, ce mois-ci, dernière séance)
- **Bibliothèque d'exercices** — catalogue via l'API Wger avec GIFs animés, filtres par groupe musculaire
- **Logger une séance** — ajouter des exercices, configurer séries/reps/poids
- **Historique** — liste de toutes les séances passées avec détail
- **Progression** — graphiques d'évolution du poids max et de la fréquence hebdomadaire

## Stack technique

- Angular 19 (standalone components + Signals)
- Angular Material 19 (dark theme)
- Chart.js (graphiques de progression)
- IndexedDB via `idb` (stockage local, sans backend)
- API Wger (https://wger.de) — gratuite, sans clé API

## Développement local

```bash
npm install
ng serve
# → http://localhost:4200
```

## Build

```bash
ng build
```

## Déploiement GitHub Pages

1. Crée un repo GitHub appelé `sparta`
2. Initialise git dans ce dossier et push sur `main`
3. Adapte le `base-href` dans la commande de deploy si ton repo a un nom différent

```bash
# Déploiement (remplace /sparta/ par /nom-de-ton-repo/)
ng build --base-href=/sparta/
npx angular-cli-ghpages --dir=dist/sparta/browser

# Ou via le script npm
npm run deploy
```

Les données sont stockées localement dans le navigateur (IndexedDB). Aucun compte requis.
