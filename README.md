# Amplop

Amplop is a small, personal YNAB-style budgeting app built around envelope budgeting. The name comes from the Indonesian word for envelope: put money into jobs, track what leaves each envelope, and keep the month honest.

This app was originally built for my own finances with help from Claude Cowork and Gemini/AI Studio. It is tuned for Indonesian rupiah, mobile use, and the way I think about monthly budgeting.

## Use The App

An online version is available at [amplop.netlify.app](https://amplop.netlify.app/).

Amplop works locally in the browser by default. If you want to use it across multiple devices, you can configure Supabase-backed sync from the app's settings and use a passphrase so the synced budget data is encrypted before it leaves the browser.

## What It Does

- Tracks income as money that is ready to assign.
- Organizes spending into budget groups and categories.
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
```

`npm run lint` currently runs TypeScript checking with `tsc --noEmit`.

## Data And Privacy

Amplop is local-first. Budget data is saved in browser `localStorage` under the app's storage key, so clearing browser data can remove your budget unless you export a backup first.

Use the JSON export/import flow for backups. If Supabase sync is configured, the app derives an encryption key from the configured passphrase and uses browser crypto before syncing data between devices.

## Notes

This is a personal finance tool, not accounting software. It reflects one person's budgeting workflow and may change whenever that workflow changes.
