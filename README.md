# Store Truth

**The tool that tells a small business what it actually made today.**

Store Truth replaces spreadsheet-and-trust chaos with one truth-first page per day per location: POS sales vs cash counted vs bank received, plus inventory and vendor checks.

## Who it is for

Small retail / service owners with 1+ locations who take cash, use a POS and a bank, and today rely on spreadsheets or one person's word.

Core question it answers: "Did we actually sell what the POS says? Where is the cash? What did we really make?"

## Current status: Step 1 — App shell

Empty Next.js shell with sidebar + top bar navigation, Today's Truth home, and placeholder pages for Locations, Exceptions, Sales, Cash, Bank, Inventory, Vendors, Imports, Reports, Audit, Settings. No auth, no database, no real logic yet.

## How to run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/layout.tsx` — root layout, mounts `AppShell`
- `app/page.tsx` — Today's Truth home
- `app/_components/AppShell.tsx` — sidebar + top bar + mobile nav (client component)
- `app/_components/PageHeader.tsx` — consistent title + plain-language explanation
- `app/_components/EmptyState.tsx` — consistent empty state + next step
- `app/[section]/page.tsx` — one folder per section (locations, sales, cash, ...)

## Next steps

1. Authentication + user account
2. Business + location model
3. Transaction, cash, bank models + manual entry
4. CSV import + review workflow
5. Daily truth + reconciliation engine
