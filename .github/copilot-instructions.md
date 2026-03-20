# Nivå — Copilot Instructions

You are working on **Nivå**, a premium property analysis tool for Swedish homebuyers. This document gives you the project context needed to make high-quality contributions.

## Project Overview

Nivå helps users evaluate bostadsrättsföreningar (BRFs) by pasting a broker URL and receiving a Senior Analyst-grade financial verdict. The app combines private banking authority with Scandinavian editorial design.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Frontend | React 19 |
| Router | React Router 7 (Library mode) |
| Database | bun:sqlite (SQLite with WAL mode) |
| Styling | Vanilla CSS with custom properties |
| AI | Google Gemini API (PDF analysis) |
| Deployment | Railway (Docker) |

## Project Structure

```
Nivå/
├── data/               # SQLite database (niva.db)
├── docs/               # Project documentation snapshots
├── src/
│   ├── components/     # Reusable UI components
│   ├── db/
│   │   ├── queries.ts  # CRUD with prepared statements
│   │   └── schema.ts   # SQLite table definitions
│   ├── hooks/          # Custom hooks (useApi.ts)
│   ├── screens/        # Main application screens
│   ├── styles/         # CSS design system (index.css)
│   ├── utils/          # Utilities (brokerScraper.ts, etc.)
│   ├── App.tsx         # Root component, UserContext, routing
│   └── main.tsx        # React mount
├── index.html
├── index.ts            # Bun.serve() server + API routes
├── Dockerfile          # Railway deployment
└── package.json
```

## Server Pattern

The app uses `Bun.serve()` with a `routes` object for simple API endpoints and a `fetch` fallback handler for:
1. Complex nested routes (regex matching, e.g. `/api/properties/:id/analyze-brf`)
2. SPA fallback (serves `index.html` for client-side routing)

## Database Schema

4 core tables: `users`, `households`, `properties`, `analyses`.

- **users**: Financial profile (income, savings, loan_promise, debts, household_type)
- **households**: Links two users for joint profiles
- **properties**: Cached property data (address, price, sqm, fee, BRF stats/analysis JSON)
- **analyses**: Links user → property with grade, KALP margin, payment status

All queries use **prepared statements** (`db.prepare()`). Foreign keys are enabled.

> **CRITICAL: Never modify the database schema (schema.ts) without explicit approval. Only modify query helpers in queries.ts.**

## API Client

Frontend uses `useApi.ts` — a lightweight typed fetch wrapper. All API calls go through `/api/*` paths.

## Design Language

### Identity: "Hardened Senior Analyst"
- **Fonts**: DM Sans (body) + Instrument Serif (headings/addresses)
- **Colors**: Warm Linen `#FAF8F5` background, Midnight `#1A1F24` text, Gold `#C5A059` accent
- **Signal colors**: Forest Green `#3D7A3A`, Warm Amber `#C49520`, Brick Red `#A93226`

### Rules
- **Language**: Code in English, UI copy in Swedish
- **No emojis** anywhere in the UI — use SVG icons or text-only labels
- **No bottom navigation** — top bar with brand wordmark (left) and profile avatar (right)
- **Data rows**: Label left (muted), value right (bold), using `tabular-nums`
- **Health indicators**: 8px colored dots before labels for financial signals
- **Section headers**: Instrument Serif, uppercase, small text (`.section-label` class)
- **Cards**: White background, `var(--radius-lg)` corners

### Interaction Rules ("The Trust Engine")
- Never show analytical results instantly — use AI Shredding animation
- Every grade/result must be drillable to show raw data
- Swedish technical loading labels: "Läser skuldebrev...", "Beräknar räntekänslighet..."

## What NOT to Do

1. **Don't modify DB schema** without explicit approval
2. **Don't add emojis** to the UI
3. **Don't change the design language** (fonts, colors, component patterns)
4. **Don't add new npm dependencies** without justification
5. **Don't break the SPA fallback** in index.ts — all non-API routes must serve index.html
6. **Don't use TailwindCSS** — the project uses vanilla CSS with custom properties
