Document 5: Stitch Implementation Guide (English)
Version: 5.0
Status: Updated — Premium UI Refinements
Description: Full set of English prompts used to generate the wireframe prototype, with Swedish UI text.

---

1. Global Context
- Initialize warm credibility design mode (not grayscale)
- Navigation: No bottom nav bar. Profile avatar on dashboard greeting row only
- Root screen (Dashboard): No TopBar, avatar inline with greeting
- Detail screens (incl. Profil): TopBar with back button + center title (no avatar)

2. Onboarding (Single Screen)
Title: "Välkommen till Nivå"
Subtitle: "Berätta om dig och din ekonomi så anpassar vi analysen"
Layout: Stacked cards (one card per input field) on warm linen background (#FAF8F5)
Fields:
- "Hur köper du?" — Själv / Ihop (stacked toggle buttons inside card)
- "Namn" — text input inside card
- "Nettoinkomst" — numeric input inside card
- "Sparkapital" — numeric input inside card
- "Lånelöfte" — numeric input inside card
- If "Ihop" selected: inline partner hint card
CTA: "Börja analysera" (full-width, bottom-pinned)

3. Dashboard
- Greeting: "God kväll, [Name]" + date, with profile avatar right-aligned on same row
- Search card: "Analysera bostad" with gold search icon, description "Klistra in en Booli-länk", input field with contextual arrow submit button
- Quick stats: Lånelöfte + Sparkapital as bordered white cards
- "Dina analyser" list with property cards

4. AI Loading
Card-based loading component (NOT full-screen takeover), constrained to app layout:
- TopBar with "Analyserar" title and back button
- White card with property address context
- Spinning gold arc around N mark
- Current step label in editorial font (Instrument Serif)
- Gold progress bar and step indicator dots
- Labels: "Hämtar bostadsdata…", "Analyserar föreningens ekonomi…", "Sammanställer resultat…"

5. Object Detail (Premium View)
TopBar: ← Tillbaka | [Address]
Sections:
- Om bostaden: property metadata table
- Föreningens finanser: AI-extracted BRF data with health indicators
- Frågor till mäklaren: AI-generated due diligence questions (from BRF red flags)
- Budgetkalkylator: compact inline calculator (result "Kvar i månaden" at bottom)
- AI-Sammanfattning: editorial analysis text
- CTA: "Öppna Bud-Simulator" (full-width, dark button)
- Contact Action Bar: persistent bottom bar

6. Budget Calculator
Inline within object view. Sliders for "Ditt bud" (max capped to user's lånelöfte), "Egen finansiering", "Förväntad ränta".
Result label: "Kvar i månaden". Compact layout — top section removed.

7. Profile & Settings
Accessed via avatar tap. Partner sync status, notification toggles.
Hushållsläge section: invite partner, accept code, view "Hushållskalkyl" when linked.

8. Splash Screen
Clean warm linen background. No background shapes or patterns.
Logo and value proposition text only.

9. Bud-Simulator (Scenario Comparison)
Background: #FAF8F5 (warm credibility — NOT dark mode)
TopBar: ← Tillbaka | "Bud-Simulator"
Concept: A calm decision-companion. Does NOT place bids.

Layout: Scenario Comparison (Current State vs Simulated State)
- LEFT column: "Nuvarande bud" (current market price / asking price)
  - Shows current KALP margin at this price
  - Label: "Nuvarande marginal"
- RIGHT column: "Nästa tänkta bud" (user's simulated price)
  - Large editable input field (DM Sans Bold, tabular-nums)
  - Shows simulated KALP margin at this new price
  - Label: "Simulerad marginal"

Delta Display:
- "Konsekvensanalys": exact SEK difference in monthly margin
- Traffic light indicator based on simulated grade (green/yellow/red)
- Format: "−1 450 kr/mån" (red) or "+500 kr/mån" (green)

Hushållsläge: Combined household financials used for all calculations.
Contact Action Bar: visible at bottom of simulator screen.

10. Simulation History
Vertical timeline within the Simulator showing previously simulated scenarios:
- Simulated amount, resulting margin, traffic light color
- Label: "Simuleringshistorik"
- Purpose: compare scenarios, NOT log placed bids

11. AI Question Bank (Frågor till mäklaren)
Generated from BRF analysis red flags identified in Sprint 4.
Display as expandable card within Object Detail.
Content: 3-5 technical due diligence questions in Swedish, e.g.:
- "Finns det planer på stambyte och hur påverkar det avgiften?"
- "Hur ser föreningens räntekänslighet ut vid en höjning med 2 procentenheter?"
- "Vilka större renoveringar har genomförts de senaste 5 åren?"
Tone: Professional, Swedish market-appropriate. "Senior Analytiker" level.

12. Contact Action Bar (Mäklar-Kontakt)
Persistent bottom bar on Object Detail and Simulator screens.
Three buttons:
- "Boka visning" — opens default calendar/phone with realtor info
- "Visa intresse" — generates a polite Swedish interest declaration
- "Kopiera bud-text" — generates a professional Swedish bid communication based on the user's current simulated bid and copies to clipboard

Bid Script Template (Swedish):
"Hej [Mäklarnamn], Vi har med intresse följt [Adress] och efter noggrann analys av föreningen och vår ekonomi vill vi lägga ett bud på [Belopp] kr. Vi har bankens godkännande och kan tillträda flexibelt. Vänliga hälsningar, [Användarnamn]"

13. Styling Rules (v2.0 — Warm Credibility)
- Background: #FAF8F5
- Headers: Instrument Serif
- Financial figures: DM Sans Bold, tabular-nums
- Cards: white background, 1px solid var(--color-border), rounded
- No emojis — "Senior Analytiker" tone throughout
- All labels in Swedish