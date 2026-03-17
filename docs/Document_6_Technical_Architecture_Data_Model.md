Document 6: Technical Architecture & Data Model
Description: Technical specifications for development.
1. Tech Stack
* Frontend: React / Vite (SPA)
* Backend: Bun.js (`Bun.serve()`)
* Database: SQLite (`bun:sqlite`)
* AI: Gemini 2.5 Flash API for PDF shredding and AI Question Generation.

2. Database Entities
* User: id, name, email, income, savings, loan_promise, debts, household_type.
* Household: id, created_at
* Household Member: user_id, household_id
* Property: id, broker_url, address, asking_price, fee, sqm, rooms, built_year, fair_value, brf_loan_per_sqm, brf_savings_per_sqm, brf_analysis_json.
* Analysis: id, user_id, property_id, payment_status, margin_result, grade, ai_questions_json, paid_at.

3. API Integrations
* Booli Scraper: Hybrid scraper (Apollo __NEXT_DATA__, JSON-LD, Meta fallbacks).
* Vitec/Fasad Brokers: Direct PDF download scraping.
* Payment Simulation: Apple Pay / Swish UI mockups.