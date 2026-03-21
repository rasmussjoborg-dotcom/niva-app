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
| Testing | bun:test (built-in) |

## Project Structure

```
Nivå/
├── data/               # SQLite database (niva.db)
├── docs/               # Project documentation snapshots
├── tests/              # Test suite
│   ├── api.test.ts     # API integration tests
│   ├── db.test.ts      # Database CRUD tests
│   └── utils.test.ts   # Utility function tests
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

## Testing

### Running Tests
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test tests/db     # Run only DB tests
bun run typecheck     # Type check without emitting
```

### Test Requirements
- **Every PR must include tests** for new functionality
- **Run `bun test` before opening a PR** — CI will run them automatically and block merges on failure
- **Check CI status** on your PR — if tests fail, fix them before marking as ready

### How to Write Tests
Use `bun:test` (built-in, zero dependencies):

```typescript
import { describe, test, expect } from "bun:test";

describe("Feature Name", () => {
  test("should do the expected thing", () => {
    const result = myFunction(input);
    expect(result).toBe(expectedOutput);
  });
});
```

### Test Categories
| File | What it tests | How to extend |
|------|--------------|---------------|
| `tests/db.test.ts` | SQLite schema + CRUD | Add tests for new queries |
| `tests/utils.test.ts` | URL parsing, KALP, transforms | Add tests for new utilities |
| `tests/api.test.ts` | HTTP API endpoints | Add tests for new routes |

### Testing Patterns
- **DB tests**: Use in-memory SQLite (`new Database(":memory:")`) — no file I/O needed
- **API tests**: Server starts on port 3456 with `DB_PATH=":memory:"` — gracefully skip if unavailable
- **Utility tests**: Pure functions, no mocks needed — just input → output assertions

## CI Pipeline
GitHub Actions runs on every PR:
1. `bun run typecheck` — catches type errors
2. `bun test` — runs all tests

**If CI fails on your PR, you must fix the failing tests before the PR can be reviewed.**

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
7. **Don't skip tests** — every PR needs tests that pass
8. **Don't merge with failing CI** — fix tests first
