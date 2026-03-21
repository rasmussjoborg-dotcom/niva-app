# Nivå — Brand & Visual Identity

> **Personality:** Nordic trust + Financial authority + Warm approachability.
> Scandinavian editorial meets financial authority.

## Brand Traits

| Trait | Expression |
|-------|-----------|
| **Trustworthy** | Muted palette, no gimmicks, data-forward |
| **Warm** | Soft backgrounds, rounded shapes, friendly tone |
| **Authoritative** | Serif headlines, structured layouts, grade system |
| **Swedish** | Scandinavian editorial aesthetic, local context |

## Color System

### Primary Palette
```
Warm Linen         #F5F0EB     Background, cards
Midnight           #1A1A2E     Primary text, headers
Stone              #EDE8E3     Card surfaces, borders
Gold               #C1A368     CTAs, premium, badges
Gold Light         #D4B87A     Hover states
```

### Semantic Colors
```
Grade Green        #3D7A3A     Good / "Inom budget"
Grade Yellow       #C49520     Warning / "Nära gräns"
Grade Red          #A93226     Alert / "Överbudget"
```

### Text Colors
```
Primary            #1A1A2E     Headlines, body
Secondary          #6B6560     Supporting text
Muted              #9E9A95     Captions, metadata
```

### Rules
- Gold on Midnight = primary CTA pattern
- Warm Linen backgrounds ALWAYS — never pure white
- No gradients in brand materials
- Green/Yellow/Red used ONLY for grade semantics, never decoratively

## Typography

```
Headlines:   "Instrument Serif" — italic for editorial feel
Body:        "DM Sans" — clean, modern, highly legible
Numbers:     "DM Sans" tabular-nums — financial data alignment

Scale (mobile):
  Hero:      28px / Instrument Serif
  H1:        24px / Instrument Serif
  H2:        20px / DM Sans 600
  H3:        17px / DM Sans 600
  Body:      15px / DM Sans 400
  Caption:   13px / DM Sans 400
  Label:     11px / DM Sans 500 UPPERCASE tracking +0.5px
```

## Spacing & Layout

```
Grid:         8px base unit
Spacing:      4, 8, 12, 16, 20, 24, 32, 40, 48
Radius:       sm=8, md=12, lg=16, full=9999
Card padding: 16px (compact) / 20px (spacious)
Screen edges: 20px horizontal padding
```

## Component Patterns

### Grade Display
- **Large** (analysis hero): 80px circle, scale-in + color fill animation
- **Small** (card inline): 32px circle
- Colors: Green (#3D7A3A), Yellow (#C49520), Red (#A93226)
- Always the most prominent element on screen

### Property Cards
- Variants: Compact (dashboard list), Expanded (search result)
- Content: Image, address, price, sqm, rooms, fee
- States: Default, Loading (skeleton), Error

### PaywallSheet
- Bottom sheet from @gorhom/bottom-sheet
- Content: 3 premium features + price (99 kr) + CTA
- CTA: Gold (#C1A368) background, "Lås upp" label

## Logo & App Icon

### Logo: "Nivå" in Instrument Serif italic
### App Icon: 1024×1024, Midnight bg or Gold bg, no text (Apple rejects)
### Clear space: Height of the "å" in Nivå

## App Store Screenshots
```
6 screens per device size (6.7" + 6.1"):
1. Hero: Grade circle + property → "Kolla bostaden"
2. KALP calculator → "Har du råd?"
3. AI analysis → "Vi läser årsredovisningen"
4. Broker questions → "Ställ rätt frågor"
5. Bid simulator → "Simulera budgivning"
6. Dashboard → "Alla dina analyser"
```

## Anti-Patterns
- ❌ Generic blue/tech startup → ✅ Warm Linen + Midnight + Gold
- ❌ Spinners → ✅ Skeleton screens
- ❌ Decorative illustrations → ✅ Data and typography as visual elements
- ❌ Emojis in financial data → ✅ Health indicator dots only
- ❌ 5+ tab navigation → ✅ 2 tabs max (Home + Profile)
