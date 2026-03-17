# Nivå — Sprint Roadmap

> **Last updated:** 2026-03-09
> **Current status:** Sprint 9 complete ✅ — Sprint 10 ready to start

---

## Sprint History

| Sprint | Theme | Status |
|--------|-------|--------|
| 1 | **UI Skeleton** | ✅ Complete |
| 2 | **Database & API** | ✅ Complete |
| 3 | **KALP Calculator** | ✅ Complete |
| 4 | **AI PDF Shredder** | ✅ Complete |
| 5 | **Premium & Paywall** | ✅ Complete |
| 6 | **Real Data & Live Integrations** | ✅ Complete |
| 7 | **End-to-End Analysis Pipeline** | ✅ Complete |
| 8 | **Hushållsläge & Payments** | ✅ Complete (8.3 deferred) |
| 9 | **Real BRF Documents** | ✅ Complete |

---

## What's Been Built (Sprint 1–9)

### Sprint 1 — UI Skeleton
Splash screen, onboarding flow (name → financials → lånelöfte), dashboard with stat cards, analysis detail page, profile screen. Fully responsive mobile-first layout with Scandinavian design.

### Sprint 2 — Database & API
SQLite schema via `bun:sqlite`, `Bun.serve()` backend with RESTful API. CRUD for users, properties, and analyses. Demo data seeding.

### Sprint 3 — KALP Calculator
Swedish tax rules engine (kommunalskatt + statlig skatt), amortization tiers (70%/50% boundaries), "Kvar i plånboken" monthly margin calculation. Powers both the analysis page and the bid simulator.

### Sprint 4 — AI PDF Shredder
Gemini integration for extracting BRF annual report metrics (skuld/kvm, sparande/kvm, räntekänslighet). Health indicators with traffic-light grading. Demo fallback when no API key.

### Sprint 5 — Premium & Paywall
- Gold showcase card on analysis teaser (free → premium transition)
- Paywall bottom sheet with Apple Pay / Swish simulation
- BRF ScoreCard with letter grades (A–E)
- Merged Bud-Simulator with KALP delta comparison
- UX audit & polish: TopBar navigation, loading states, Prisanalys redesign

### Sprint 6 — Real Data & Live Integrations
- **Booli scraper** — 3-strategy extraction (Apollo `__NEXT_DATA__` → JSON-LD Product → regex fallback)
- **Session persistence** — HttpOnly cookies, 30-day expiry, auto-restore on page refresh
- **Profile editing** — Inline editable financial fields with auto-save and "Sparat ✓" toast
- **Dashboard search** — Paste a Booli URL → scrape → navigate to analysis

### Sprint 7 — End-to-End Analysis Pipeline
- **Auto-BRF on scrape** — Fire-and-forget pipeline populates BRF analysis and KALP grade in background
- **AI question generation** — `questionGenerator.ts` uses Gemini to create 4-5 context-specific Swedish due diligence questions (falls back to rule-based)
- **Dashboard KALP badges** — "Kvar X kr" affordability pill (green/yellow/red) + colored left border on cards
- **Re-scrape** — "Uppdatera" button + "Hämtad X" timestamp on analysis page; refreshes all data in-place

### Sprint 8 — Hushållsläge & Payments
- **Combined finances** — Partner household overview with combined income, savings, lånelöfte, and debts
- **Household KALP** — KALP calculator uses combined household data when partner is linked; "Enskild / Hushåll" segmented toggle to compare
- **Pipeline household awareness** — Auto-pipeline and refresh use combined data for KALP grade
- **Payment receipt** — `paid_at` timestamp stored; "Upplåst · [date]" badge replaces paywall CTA on unlocked analyses
- ~~Real payments~~ — Deferred to future sprint

### Sprint 9 — Real BRF Documents
- **Hybrid PDF Sourcing** — Auto-extract PDF links from broker websites via Booli listings, with a manual upload fallback
- **Real Gemini Analysis** — Process actual BRF annual report PDFs with Gemini to extract real metrics (skuld/kvm, sparande/kvm, räntekänslighet), replacing demo data
- **Analysis Refresh** — Re-analyze existing records with uploaded reports while preserving question history
- **Timeout Protection** — Added timeout safeguards for long-running PDF analysis tasks

---

## Upcoming Sprints

### Sprint 10 — Polish & Launch Prep

> Goal: Production-ready quality and deployment.
> **🛑 PRE-FLIGHT (Before starting Sprint 10):** Paste real `GEMINI_API_KEY` into `.env` to verify Sprint 9.2 API extraction formatting.

| Epic | Description | Complexity |
|------|-------------|------------|
| 10.1 Mobile Optimization | PWA manifest, touch interactions, safe area insets | Medium |
| 10.2 SEO & OG Tags | Meta tags, social sharing preview for analysis pages | Low |
| 10.3 Error Resilience | Offline states, API failure recovery, retry logic | Medium |
| 10.4 Analytics | Track key events (onboard, analysis, paywall conversion) | Low |
| 10.5 Deployment | Production build, domain setup, SSL, Vercel/Fly.io hosting | High |

---

## FRD Coverage

| Requirement | Status | Sprint |
|-------------|--------|--------|
| FR 1.1 Booli Integration | ✅ Complete | 6 |
| FR 1.2 PDF Extraction (BRF) | ✅ Complete — real upload & auto-fetch | 4, 9 |
| FR 2.1 Economic Baseline | ✅ Complete | 1, 6 |
| FR 2.2 Hushållsläge | 🔲 Backend ready, UI in Sprint 8 | 8 |
| FR 3.1 KALP Calculator | ✅ Complete | 3 |
| FR 3.2 Bud-Simulator | ✅ Complete | 5 |
| FR 3.3 Mäklar-Kontakt | ✅ Complete (AI + rule-based) | 4, 7 |
| FR 4.1 Paywall | 🟡 Simulated — real payments in Sprint 8 | 5, 8 |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-xx | Bun + SQLite stack | Simplicity, speed, no external DB dependency |
| 2026-02-xx | Simulated payments | Fast iteration; real payments deferred |
| 2026-03-08 | Gold gradient paywall CTA | Aligns paywall with premium brand identity |
| 2026-03-08 | Slider max = lånelöfte | User's financial reality should cap bid range |
| 2026-03-08 | Loading as in-app card | Full-screen takeover felt disconnected from app |
| 2026-03-08 | Booli scraper via Apollo state | Most reliable data — `__NEXT_DATA__` with `Listing:ID` keys |
| 2026-03-08 | Sprint 7 = pipeline, not payments | Completing the analysis pipeline is higher value than payments at MVP stage |
| 2026-03-08 | Fire-and-forget auto-pipeline | BRF + KALP + questions run async after scrape response — instant UX, data populates in background |
| 2026-03-08 | Hybrid PDF approach | Auto-fetch from broker site + manual upload fallback to handle missing documents |
| 2026-03-08 | Real Gemini analysis | Switched from demo data to real PDF processing with timeout protection |
