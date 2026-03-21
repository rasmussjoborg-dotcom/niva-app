# Nivå — Tech Stack

## Backend

| Layer | Choice | Non-negotiable |
|-------|--------|----------------|
| Runtime | **Bun** (latest) | ✅ |
| Server | `Bun.serve()` with route handlers | ✅ |
| Database | **SQLite** via `bun:sqlite` | ✅ |
| AI | **Google Gemini** (PDF analysis, chat) | ✅ |
| Hosting | **Railway** (Docker) | ✅ |
| Scraping | Custom `brokerScraper.ts` (fetch-based) | ✅ |
| Auth | Cookie-based sessions (`niva_session`) | Current (→ JWT later) |

### Backend Key Files
```
index.ts              — Bun.serve() HTTP server + all route handlers
src/db/schema.ts      — SQLite schema definitions
src/db/queries.ts     — Database query functions
src/utils/            — Utility modules
src/scraper/          — Broker scraping adapters
```

### SQLite Conventions
- WAL mode enabled
- `datetime('now')` for timestamps
- TEXT for enums with CHECK constraints
- JSON stored as TEXT, parsed in application layer
- No migrations framework — schema in `src/db/schema.ts`

### Gemini Integration
- Always set `idleTimeout: 120` on Bun.serve (PDF analysis takes 30-90s)
- Cache results in database — never re-analyze the same PDF
- Structured prompts requesting JSON output
- Environment variable: `GEMINI_API_KEY`

### Scraper Architecture
```ts
// Each broker gets an adapter OR falls back to generic
interface BrokerAdapter {
  match(url: string): boolean;
  extract(html: string, url: string): BrokerData;
}
const adapters = [bjurfors, bosthlm, husmanHagberg, ...];
const adapter = adapters.find(a => a.match(url)) || genericFallback;
```

## Frontend (Expo Mobile App)

| Layer | Choice | Non-negotiable |
|-------|--------|----------------|
| Framework | Expo SDK 54 (managed) | ✅ |
| Routing | Expo Router v4 (file-based) | ✅ |
| Styling | React Native StyleSheet | ✅ |
| State | Zustand | ✅ |
| Lists | FlashList (NOT FlatList) | ✅ |
| Bottom sheets | @gorhom/bottom-sheet | ✅ |
| Auth storage | expo-secure-store | ✅ |
| Haptics | expo-haptics | ✅ |

### Frontend Key Files
```
niva-app/
├── app/
│   ├── _layout.tsx           — Root layout, font loading, auth routing
│   ├── (auth)/               — Welcome + onboarding screens
│   ├── (tabs)/               — Home dashboard + profile
│   └── analysis/[id]/        — Analysis detail screen
├── components/ui/            — NivaButton, NivaCard, NivaChip, NivaInput, ScreenHeader
├── lib/
│   ├── api.ts                — API client (fetch to Railway backend)
│   ├── store.ts              — Zustand auth store
│   └── theme.ts              — Design tokens (Colors, Fonts, Spacing)
```

### API Configuration
```ts
const API_BASE = "https://niva-app-production.up.railway.app/api";
```

## Infrastructure

### Railway Backend
```
URL:            niva-app-production.up.railway.app
Deploy trigger: git push to main
Database:       SQLite on persistent volume
Env vars:       GEMINI_API_KEY
```

### Dockerfile
```dockerfile
FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production
COPY . .
EXPOSE 3000
CMD ["bun", "run", "index.ts"]
```

### EAS Build (Future)
```
Platform:       iOS via TestFlight → App Store
Build command:  eas build --platform ios --profile production
```
