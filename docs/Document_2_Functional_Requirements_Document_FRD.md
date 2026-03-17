Document 2: Functional Requirements Document (FRD)

Version: 3.0
Status: Updated — Bud-Simulator + Professional Communication Suite

FR 1: Data Collection & Analysis

1.1 Booli Integration: The app must accept a Booli-URL and automatically fetch metadata (address, asking price, sqm, fee) and market valuation (Fair Value).

1.2 PDF Extraction (BRF-shredder): The system uses AI to read and extract key metrics from BRF annual reports: lån per kvm, sparande per kvm, räntekänslighet, and planerade renoveringar.

FR 2: User Profile & Collaboration

2.1 Economic Baseline: Input of nettoinkomst, sparkapital, lånelöfte, and befintliga skulder.

2.2 Hushållsläge: Ability to invite a partner to create a joint financial profile where both incomes and capital are combined.

FR 3: Strategic Decision Support

3.1 KALP Calculator: An interactive calculator showing "Kvar i plånboken" (Cash left in pocket) after all costs. Acts as the analytical baseline for bid simulation.

3.2 Bud-Simulator: A decision-companion for simulating bid impacts on personal affordability. The simulator does NOT place bids — it calculates the financial consequence of hypothetical bids by comparing "Nuvarande bud" (current market price) against "Nästa tänkta bud" (user-simulated price). Displays delta impact on monthly margin ("Konsekvensanalys") using the KALP engine. In Hushållsläge, shared financial impact updates in real-time for both partners.

3.3 Professional Communication Suite (Mäklar-Kontakt): AI-powered tools for communicating with the realtor:
- AI Question Bank: 3-5 technical due diligence questions generated from BRF red flags identified in the analysis (e.g., planned stambyte, räntekänslighet, deferred maintenance).
- Contact Action Bar: Persistent bottom bar with quick actions — "Boka visning", "Visa intresse", "Kopiera bud-text".
- Bid Scripting: One-tap generation of a professional Swedish SMS/Email to the realtor based on the user's current simulated bid. Uses a formal, market-appropriate tone.

FR 4: Business Model

4.1 Paywall (99 kr per property, engångsköp):

Free tier:
- Property metadata (address, sqm, rooms, built year, fee)
- Property Header (Address, Area, Begärt pris)
- Price Insight Card (Prisanalys) against a ±5% Prisintervall
- BRF ScoreCard (grade + one-liner verdict)
- Om bostaden data rows (Pris per kvm, Marginal, etc.)

Premium tier (unlocked via paywall bottom sheet — Apple Pay or Swish):
- Föreningens ekonomi (AI-analyserad årsredovisning with health indicators)
- AI-Chat: Conversational interface for deep-diving into property and BRF data
- Frågor till mäklaren (AI-filtered due diligence questions missed by the chat/listing)
- Bud-Simulator (inline konsekvensanalys with KALP delta comparison)