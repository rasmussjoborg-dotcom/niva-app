Document 8: Brand Identity & UI Design Language (v3.0)
Version: 4.0
Status: Updated — Premium UI Refinements
Design Philosophy: "Hardened Senior Analyst" – High authority through clinical precision and Scandinavian editorial warmth. Minimalist, text-only, no emojis, no icons except SVG.

---

1. Color Palette v2 (Warm Sand & Midnight)
We are moving from a cold fintech palette to a warmer, more sophisticated Nordic culture.

1.1 Foundation Colors
- Background: #FAF8F5 (Warm Linen)
- Surface: #FFFFFF (Pure White)
- Stone: #F0ECE6 (Warm Stone)
- Border: #E8E3DD (Soft Warm Border)

1.2 Text & Accents
- Text Primary: #1A1F24 (Midnight – softened black)
- Text Secondary: #6B6560 (Warm Grey)
- Text Muted: #A09A93 (Sand)
- Accent: #C5A059 (Gold – used sparingly)

1.3 Signal Colors (Softened)
- Green signal: #3D7A3A (Softened Forest Green)
- Yellow signal: #C49520 (Warm Amber)

---

2. Typography
A mix of modern sans-serif for utility and serif for editorial flair.
- Primary Typeface: DM Sans (Main UI/Interface)
- Headings: Instrument Serif (Used for large editorial headings)
- Financials: DM Sans Bold (Use tabular lining for numbers to ensure alignment).

---

3. Layout & Imagery
- Editorial Breathing Room: Abandon high-density layouts for generous whitespace to prioritize readability and calm.
- Hero Imagery: Use property photos with warm, natural lighting. This is essential for engagement in the Swedish home market.

---

4. Interaction & Trust
- Softened Animation Labels: While loading data, use warmer, less intimidating Swedish labels:
  - "Hämtar bostadsdata..." (Fetching home data...)
  - "Analyserar föreningens ekonomi..." (Analyzing the association's finances...)
- Strategic Friction: Keep the animations friendly and helpful rather than purely clinical.
- No emojis: The "Senior Analytiker" tone does not use emoji anywhere in the UI.

---

5. Implementation Instructions for Antigravity
1. Strict Color Usage: Use #FAF8F5 for background, #1A1A1A for text.
2. Typography Styling: Ensure all property values use DM Sans Bold.
3. Language Check: Ensure all UI copy follows the warm Nordic tone (e.g., use "Hämtar bostadsdata" for primary loading states).

---

6. Component Patterns

6.1 Card-Per-Field Pattern
All interactive content (inputs, data, cards) lives inside individual white cards with borders.
Headers and section titles stay directly on the warm linen background (#FAF8F5).
This creates contrast between structural elements and interactive content.

Card styling:
- Background: white
- Border: 1px solid var(--color-border) (#E8E3DD)
- Border radius: var(--radius-lg)
- Padding: var(--space-4) to var(--space-5)

6.2 Input Styling
All text inputs use consistent bordered styling:
- Background: white
- Border: 1.5px solid var(--color-border)
- Border radius: var(--radius-md)
- Padding: var(--space-3) var(--space-4)
- Font: DM Sans, var(--font-size-sm)
- Numeric inputs: fontVariantNumeric: tabular-nums

6.3 Toggle Buttons (e.g., Själv/Ihop)
- Stacked vertically (1×1 grid), not side-by-side
- Active state: var(--color-midnight) background, white text
- Inactive state: white background, 1.5px border
- Transition: 0.2s ease

6.4 Top Bar
Root screen (Dashboard only): No top bar. Profile avatar sits inline with the greeting row.
Detail screens (incl. Profil): Sticky top bar (64px height) with:
- Left: Back button "← Tillbaka"
- Center: Page title (absolute positioned)
- Right: Optional icon action (e.g. Refresh button "Uppdatera")
- Background: frosted glass effect (backdrop-filter blur)
- Border bottom: appears on scroll

6.4.1 Property Header
- Address (`h1`) and Area (`p`) stacked on the left.
- "Begärt pris" label and compact price (e.g. "9,895 milj") stacked on the right.
- Vertically aligned using center-alignment on the flex container, keeping line-heights tight (1.1).

6.5 Search Input (Dashboard)
Wrapped in a card with gold search icon and description header.
Input field inside: bordered, with a contextual dark circular submit button that appears only when text is entered.

6.6 Premium Showcase Card
Gold-tinted card acting as the sole premium gate in the object detail view:
- Background: linear-gradient with rgba(197, 160, 89, 0.05–0.10)
- Border: 1.5px solid rgba(197, 160, 89, 0.25)
- Content: Editorial title (Instrument Serif), "Premium" badge pill, text-only feature rows (label + description) inside a white container
- CTA: Gold gradient button "Lås upp — 99 kr"
- No blur teasers or frosted previews — single consolidated card

6.7 BRF ScoreCard (Free)
Placed after price metrics, before "Om bostaden":
- 56px grade circle (color-coded: green/amber/red background tint)
- "Föreningsbetyg" uppercase label
- Auto-generated one-liner verdict (from loan/sqm, savings/sqm, margin data)
- Gold "Lås upp fullständig analys" link (opens paywall sheet)

6.8 Paywall Bottom Sheet
Triggered by "Lås upp" actions, constrained to --max-width (390px):
- Overlay: Semi-transparent midnight, scoped to app column
- Panel: Slides up with cubic-bezier easing, max-height 85vh
- Feature list: White background with border (matches card pattern), gold checkmarks
- Confirmation: "99 kr · engångsköp" pricing line
- Primary CTA: Gold gradient (linear-gradient #C5A059 → #B8913E), white text, subtle shadow
- Secondary CTA: White background with border
- Processing: Gold-tinted spinner
- Success: Green checkmark circle → auto-dismiss
- Trust copy: "Pengarna tillbaka om analysen inte kan genomföras."

6.9 Price Insight Card ("Prisanalys")
Placed immediately below the Property Header:
- Semantic colored card (green/neutral/red bg tint + matching border based on price delta against a ±5% "Prisintervall").
- Header: colored status dot + "PRISANALYS" label + "HÖGT", "INOM SPANN", or "LÅGT" badge.
- Body: Natural-language insight comparing asking price against the interval limits.
- Footer: Price difference in kronor compared to the nearest boundary.
- Note: We never use a single "Marknadsvärde" absolute number as it can be legally/psychologically dangerous. We only assess against the span.

6.10 Analysis Loading Card
Shown during AI analysis, NOT a full-screen takeover:
- Rendered within the app layout with TopBar ("Analyserar" title, back button)
- White card with property address context (uppercase label)
- Spinning gold arc around N mark (brand continuity)
- Step label in editorial font (Instrument Serif), one at a time
- Gold progress bar and step dots
- Time estimate: "Detta tar vanligtvis 5–10 sekunder"