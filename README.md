# Capsule — Budget & congés

Pilotez vos congés, vos emplois et votre épargne au même endroit.

Application Next.js 100 % côté client : toutes les données sont stockées dans le `localStorage` du navigateur (aucune base de données, aucun backend).

## Démarrer

```sh
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — sert le build de production
- `npm run lint` — ESLint

## Structure

```
app/                  Routes Next.js (une page = un dossier)
  page.tsx            /          Vue d’ensemble
  conges/             /conges    Calendrier, récapitulatif et calculs
  budget/             /budget    Budget mensuel et projection sur 12 mois
  emplois/            /emplois   Emplois et règles de décompte
  layout.tsx          Enveloppe commune (menu, dialogues globaux)

components/
  app/                Enveloppe de l’app : navigation, contexte partagé, sauvegarde
  overview/ leaves/ budget/ jobs/   Composants de chaque page
  shared/             Petits composants réutilisés partout
  ui/                 Composants shadcn/ui

lib/                  Logique métier, sans React
  types.ts            Modèle de données (emplois, congés, budget)
  store.ts            Lecture / écriture dans le localStorage
  state.ts            Données de démo et migration des anciennes sauvegardes
  leave-rules.ts      Décompte des jours (ouvrés, ouvrables, temps partiel)
  ledger.ts           Simulation des soldes N−1 / N dans le temps
  holidays.ts         Jours fériés français
  budget.ts           Calculs du budget et de la projection
  format.ts           Formatage des dates, montants et jours
```

`vendor/` contient le CSS de base shadcn/Tailwind importé par `app/globals.css`.
