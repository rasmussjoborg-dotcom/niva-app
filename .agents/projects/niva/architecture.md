# Nivå — Architecture & Infrastructure

## Repository Structure

```
Nivå/
├── index.ts                    — Bun.serve() HTTP server
├── src/
│   ├── db/
│   │   ├── schema.ts           — SQLite schema
│   │   └── queries.ts          — Query functions
│   ├── scraper/
│   │   ├── brokerScraper.ts    — Main scraper entry
│   │   └── adapters/           — Per-broker adapters
│   └── utils/                  — Shared utilities
├── public/                     — Static assets (web)
├── Dockerfile                  — Railway deployment
├── niva-app/                   — Expo mobile app
│   ├── app/                    — File-based routing
│   ├── components/ui/          — Reusable UI components
│   └── lib/                    — API client, store, theme
```

## Database Schema (SQLite)

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  income INTEGER DEFAULT 0,
  savings INTEGER DEFAULT 0,
  loan_promise INTEGER DEFAULT 0,
  other_debts INTEGER DEFAULT 0,
  household_type TEXT DEFAULT 'solo',
  household_id INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Properties
```sql
CREATE TABLE properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT UNIQUE,
  address TEXT,
  price INTEGER,
  sqm REAL,
  rooms REAL,
  monthly_fee INTEGER,
  built_year INTEGER,
  brf_name TEXT,
  image_url TEXT,
  broker_firm TEXT,
  brf_analysis_json TEXT,    -- Cached Gemini PDF output
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Analyses
```sql
CREATE TABLE analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  property_id INTEGER REFERENCES properties(id),
  grade TEXT,                -- A, B+, C, etc.
  grade_color TEXT,          -- green, yellow, red
  monthly_cost INTEGER,
  risk_level TEXT,           -- low, medium, high
  is_premium INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
```

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users` | ❌ | Create user (onboarding) |
| PUT | `/api/users/:id` | ✅ | Update user profile |
| GET | `/api/users/:id` | ✅ | Get user data |
| POST | `/api/resolve-property` | ✅ | Paste URL → scrape + analyze |
| GET | `/api/analyses` | ✅ | List user's analyses |
| GET | `/api/analyses/:id` | ✅ | Get analysis detail |
| POST | `/api/invite-code` | ✅ | Generate household invite |
| POST | `/api/accept-invite` | ✅ | Join household |
| GET | `/api/households/:id` | ✅ | Get household info |

## Infrastructure Map

```
┌─────────────────────────────────────────┐
│              PRODUCTION                  │
│                                          │
│  ┌──────────┐     ┌──────────────────┐  │
│  │  Railway  │     │   App Store      │  │
│  │  Backend  │◄────│   (via EAS)      │  │
│  │  (Docker) │     │   TestFlight     │  │
│  └──────────┘     └──────────────────┘  │
│       │                    │             │
│  ┌────┴─────┐     ┌──────┴──────────┐  │
│  │ SQLite DB │     │  Expo Go (dev)  │  │
│  │ (volume)  │     │  localhost:8081  │  │
│  └──────────┘     └─────────────────┘  │
│       │                                  │
│  ┌────┴──────────┐                      │
│  │ Gemini API    │                      │
│  │ (Google Cloud)│                      │
│  └───────────────┘                      │
└─────────────────────────────────────────┘
```

## Deployment

### Railway Backend
- **URL:** `niva-app-production.up.railway.app`
- **Trigger:** `git push` to `main`
- **Env vars:** `GEMINI_API_KEY`
- **Health check:** `GET /api/health`

### Expo Mobile
- **Dev:** Expo Go, `npx expo start`
- **Build:** `eas build --platform ios --profile production`
- **Distribute:** TestFlight → App Store
