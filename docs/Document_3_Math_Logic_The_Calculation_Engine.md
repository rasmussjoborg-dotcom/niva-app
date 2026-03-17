Document 3: Math & Logic (The Calculation Engine)
Description: Definition of the financial formulas governing the app's results.
1. Tax Rules (Sweden)
* Ränteavdrag: 30% of interest costs up to 100,000 SEK per person. Above 100,000 SEK, the deduction is 21%. For households with two applicants, the limit is doubled to 200,000 SEK.
2. Amortization Requirements
* Base: 1% of the loan amount if the loan-to-value ratio (LTV) is >50%.
* Addition: An additional 1% if the LTV is >70%.
* Debt-to-Income: An additional 1% if the loan exceeds 4.5 times the household's gross annual income.
3. Main Formula: Kvar i plånboken (Margin)
Resultat=Inkomstnetto​−(Kostnadra¨nta​−Ra¨nteavdrag+Amortering+BRFavgift​+Levnadskostnader+Skulderbefintliga​)
.
4. Traffic Light Logic
* Grön: Margin > User's set goal (e.g., +10,000 kr).
* Gul: Margin between 0 kr and the goal.
* Röd: Margin < 0 kr (negative cash flow).