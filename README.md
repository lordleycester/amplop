# Amplop

Amplop is a small, personal YNAB-style budgeting app built around envelope budgeting. The name comes from the Indonesian word for envelope: put money into jobs, track what leaves each envelope, and keep the month honest.

This app was originally built for my own finances with help from Claude Cowork and Gemini/AI Studio. It is tuned for Indonesian rupiah, mobile use, and the way I think about monthly budgeting.

## Use The App

An online version is available at [amplop.netlify.app](https://amplop.netlify.app/).

Amplop works locally in the browser by default. If you want to use it across multiple devices, you can configure Supabase-backed sync from the app's settings and use a passphrase so the synced budget data is encrypted before it leaves the browser.

## What It Does

- Tracks income as money that is ready to assign.
- Builds starter budget categories from an onboarding survey.
- Organizes spending into budget groups and categories, including Needs, Wants, Subscriptions, Debt, and Savings Goals.
- Lets each category carry monthly assignments, targets, spending, and remaining available balance.
- Tracks budget accounts, cash, credit cards, and off-budget tracking accounts.
- Records expenses, income, and account transfers.
- Supports recurring income and expenses.
- Handles installment plans, including monthly obligations and payoff tracking.
- Shows transaction history, account balances, budget account totals, and net worth.
- Stores data locally in the browser.
- Exports backups as JSON and transactions as CSV.
- Includes optional encrypted sync configuration for keeping data portable.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- IndexedDB via Dexie
- lucide-react icons
- motion
- Gemini/AI Studio project roots

## Running Locally

Prerequisite: Node.js

```bash
npm install
npm run dev
```

The dev server runs on port `3000` by default.

## Other Commands

```bash
npm run build
npm run preview
npm run lint
npm test
```

`npm run lint` currently runs TypeScript checking with `tsc --noEmit`.

The budget math tests live in `src/utils/budgetMath.test.ts`.

## Data And Privacy

Amplop is local-first. Budget data is saved in browser IndexedDB through Dexie, with a one-time migration path from the older `localStorage` budget key. Clearing browser data can still remove your budget unless you export a backup first.

Use the JSON export/import flow for backups. If Supabase sync is configured, the app derives an encryption key from the configured passphrase and uses browser crypto before syncing data between devices. Sync configuration itself is small and remains in `localStorage`.

## Onboarding

The first-run guide introduces zero-based envelope budgeting, then starts a category survey. The survey asks about household, home, debt, transportation, regular spending, domestic services, subscriptions, irregular expenses, savings goals, and lifestyle spending.

Survey answers create a draft category plan that users can review before saving. After categories are created, Amplop guides the user through setting targets, adding accounts, and assigning money.

The survey plan lives in `docs/category-survey-plan.md`.

## Project Shape

The main app shell lives in `src/App.tsx`. Most bottom-sheet forms live under `src/components/sheets`, shared form setup lives in `src/hooks/useSheetFormState.ts`, sheet open/close orchestration lives in `src/hooks/useSheetController.ts`, and local persistence lives in `src/storage/budgetStorage.ts`.

## Notes

This is a personal finance tool, not accounting software. It reflects one person's budgeting workflow and may change whenever that workflow changes.
