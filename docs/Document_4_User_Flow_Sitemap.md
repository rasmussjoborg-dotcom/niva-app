Document 4: User Flow & Sitemap
Version: 5.0
Status: Updated — Premium UI Refinements

---

1. Onboarding (Single Screen)
"Välkommen till Nivå" → Combined single-screen flow with card-per-field layout:
- Household type: "Köpa själv" or "Köpa ihop" (stacked buttons)
- Name input
- Financial inputs: Nettoinkomst, Sparkapital, Lånelöfte
- If "Ihop" selected: inline partner invite hint (no separate screen)
- CTA: "Börja analysera"

2. Dashboard (Main Screen)
- Greeting row: "God kväll, [Name]" left-aligned, profile avatar right-aligned on same row
- Search card: "Analysera bostad" with Booli URL input (integrated search icon, contextual submit button)
- Quick stats: Lånelöfte, Sparkapital cards
- List of saved analyses ("Dina analyser")

3. Object Analysis Flow
- TopBar: Back button (left) + title (center) + refresh icon action (right)
- Hero image (property photo)
- Address header (Instrument Serif) + area subtitle (left) aligned with Begärt pris (right, formatCompact e.g. "9,895 milj")
- Price Insight Card ("Prisanalys"): semantic colored card analyzing the asking price against a ±5% "Prisintervall". Shows "HÖGT", "LÅGT", or "INOM SPANN".
- BRF ScoreCard (FREE): 56px grade circle + "Föreningsbetyg" label + auto-generated one-liner verdict + gold "Lås upp fullständig analys" hook
- Om bostaden (FREE): data rows with geometric icons (Storlek, Rum, Månadsavgift, Byggår, Pris per kvm, Marginal)
- Premium Showcase Card: Gold-tinted card with editorial title, Premium badge, text-only feature list (Föreningens ekonomi, Frågor till mäklaren, Bud-Simulator), gold CTA "Lås upp — 99 kr"
- When premium is unlocked:
  - Föreningens ekonomi: AI-extracted BRF data with health indicators
  - Bud-Simulator (merged inline): Quick bid buttons, sliders (max bid capped to user's lånelöfte), KALP delta, expandable breakdown, simulation history
  - Frågor till mäklaren: AI-filtered due diligence questions missing from the listing, displayed in cards with a prominent bordered "Fråga mäklaren" button and speech bubble icon.
  - AI-Chat: Conversational interface for deep-diving into property and BRF data.
- Contact Action Bar (persistent bottom): "Boka visning" · "Visa intresse" · "Kopiera bud-text"

3.1 Paywall Bottom Sheet Flow
User taps "Lås upp — 99 kr" → Bottom sheet slides up (within app column) →
- Confirmation: "Djupanalys" title, property address, feature checklist (white card, gold checkmarks), "99 kr · engångsköp" →
- Payment: Gold gradient Apple Pay (primary) or white bordered Swish (secondary) →
- Processing spinner → Success checkmark → Sheet dismisses →
- Analysis Loading Card (in-app card with gold progress, address context, step labels) → Premium content reveals

4. Flow 4: Beslut (Simulation & Communication)
User unlocks premium → Uses inline Bud-Simulator → Simulates a bid ("Nästa tänkta bud") → Reviews "Konsekvensanalys" delta → Adjusts bid → When satisfied → Taps "Kopiera bud-text" to generate professional Swedish SMS/Email → Contacts realtor externally.
- The app does NOT place bids — it provides the analytical foundation and communication tools
- In Hushållsläge: shared "Hushållskalkyl" updates for both partners
- AI Question Bank helps user prepare informed due diligence questions

5. Navigation
- No bottom navigation bar
- Root screen (Dashboard only): profile accessed via avatar in greeting row, no TopBar
- Detail screens (incl. Profil): TopBar with back button + centered title
- Profile screen accessed from avatar tap on dashboard
- Contact Action Bar visible on Object Detail screen