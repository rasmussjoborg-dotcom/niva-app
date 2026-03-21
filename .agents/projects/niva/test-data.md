# Nivå — Test Data & Scenarios

## Critical Flows (MUST PASS)

### 1. Onboarding Flow
```
Steps:
  - Open app → Welcome screen appears
  - Tap "Analysera din första bostad" → Onboarding form
  - Fill: name, income (35 000), savings (500 000), loan promise (3 000 000)
  - Select household type (Själv/Ihop)
  - Submit → Dashboard appears with greeting
Edge cases:
  - Empty fields → validation error
  - Negative income → rejection
  - Very high numbers (999 999 999) → formatting ok?
  - Swedish characters in name (Ångström) → handled?
```

### 2. Property Analysis
```
Steps:
  - On Dashboard, paste a broker URL
  - Wait for scraping + analysis (30-90s)
  - Verify: address, price, sqm, rooms, fee displayed
  - Verify: BRF grade circle shows A-F
  - Verify: KALP calculation runs correctly
Edge cases:
  - Invalid URL → clear error message
  - Broker site down → timeout + retry option
  - Already analyzed property → uses cached data
  - Non-BRF property → handles gracefully
```

### 3. KALP Calculator
```
Steps:
  - Open calculator from analysis
  - Adjust: bid amount, own financing, interest rate
  - Verify: margin updates in real-time
  - Verify: grade color changes (green→yellow→red)
Edge cases:
  - Extreme values (0, max)
  - Rapid input changes → no lag
  - Result matches backend calculation
```

## Broker Coverage Test URLs

```
- hemnet.se listing
- bjurfors.se listing
- svenskfast.se listing
- bosthlm.se listing
- notar.se listing
- erikolsson.se listing
Verify each returns: address, price, rooms, sqm, fee
```

## ScoutQA Commands

```bash
# Smoke test after deployment
scoutqa --url "https://niva-app-production.up.railway.app" --prompt "
  Smoke test: verify homepage loads, onboarding flow works,
  and property analysis can be triggered by pasting a Hemnet URL.
"

# Post-deployment verification
scoutqa --url "https://niva-app-production.up.railway.app" --prompt "
  Verify critical user flows after deployment: onboarding,
  property analysis, KALP calculation, and profile editing.
"
```

## Platform Checks

### iOS
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Keyboard doesn't cover input fields
- [ ] Back swipe gesture works
- [ ] Text scales with Dynamic Type settings

### API
- [ ] All endpoints return JSON (never HTML errors)
- [ ] Auth required endpoints reject unauthenticated
- [ ] Scraping handles timeouts gracefully
- [ ] Gemini failures don't crash the server
- [ ] SQL queries are parameterized
