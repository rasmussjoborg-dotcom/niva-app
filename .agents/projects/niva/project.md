# Nivå — Project Context

> **Tagline:** Förstå vad ditt nästa hem verkligen kostar.

## Product Identity

**Nivå** is a Swedish apartment analysis app for first-time homebuyers. Users paste a broker listing URL and receive an AI-powered BRF analysis, personal KALP calculation, and an overall grade (A–F).

### Positioning
- Hemnet shows listings → Nivå tells you if you can **afford** it
- Banks calculate KALP → Nivå applies it to **specific properties**
- No one does AI PDF analysis of årsredovisningar → Nivå's **unique moat**

### What Nivå Is NOT
- ❌ Not a listing aggregator (we analyze, we don't list)
- ❌ Not a bank app (warm and approachable, not corporate)
- ❌ Not a tech startup (no neon, no dark mode default)

## Target Audience

### Primary: Lisa (First-time Buyer)
```
Age: 28, Marketing Coordinator, Stockholm
Budget: 3.0–3.5M SEK
Goals: Find safe BRF, understand what she's buying
Frustrations: Financial jargon, hidden costs, pressure at viewings
Tech: iPhone 14, uses Hemnet daily, trusts apps over banks
Quote: "Jag vill bara veta om jag har råd och om det är en bra förening"
```

### Secondary: Marcus (Upgrader)
```
Age: 35, Software Developer, Gothenburg
Budget: 5.0–6.0M SEK
Goals: Upgrade from 1BR, optimize finances, move quickly
Tech: iPhone 15 Pro, data-driven, wants raw numbers
Quote: "Ge mig datan, jag kan räkna själv"
```

### Tertiary: Anna & Erik (Couple)
```
Ages: 30 & 32, Malmö
Budget: 4.0–4.5M SEK (combined)
Goals: First shared apartment, both need to understand finances
Quote: "Vi måste kunna visa varandra att det funkar"
```

## User Journey

```
STAGE:     DISCOVER    PASTE URL    SEE GRADE    UNLOCK    DEEP DIVE
Action:    Hears about  Copies       Sees BRF     Pays      Reads full
           Nivå         Hemnet link  grade (B+)   99 kr     analysis
Touchpoint: App Store   Dashboard    Analysis     Paywall   Premium view
Emotion:   Curious      Hopeful      Excited      Hesitant  Confident
```

## Team & Workflow

- **Team:** Rasmus + AI agents (no enterprise ceremony)
- **Tools:** Linear (issues), GitHub (code), Railway (deploy)
- **Cadence:** Ship weekly, structured momentum

### Milestone Structure
```
v1.0 — MVP Web App          ✅ DONE
v1.1 — Production Hardening 🔄 IN PROGRESS
v2.0 — Expo Native App      📋 PLANNED
```

## Competitive Landscape

| Feature              | Nivå | Hemnet | Booli | Bank App |
|---------------------|------|--------|-------|----------|
| BRF grade            | ✅   | ❌     | ❌    | ❌       |
| Personal KALP        | ✅   | ❌     | ❌    | ✅       |
| AI document analysis | ✅   | ❌     | ❌    | ❌       |
| Bid simulator        | ✅   | ❌     | ❌    | ❌       |
| Price: Premium       | 99kr | N/A    | 299kr | Free     |

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Apple Developer enrollment takes >48h | Medium | High | Start enrollment early |
| Broker scraping breaks (HTML changes) | High | Medium | Generic fallback adapter |
| Gemini API rate limits / outages | Medium | High | Cache results, graceful degradation |
| Scope creep delays App Store release | High | High | Strict milestone scope, defer to v2.1 |
