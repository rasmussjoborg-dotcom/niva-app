// AI Question Generator — Context-specific due diligence questions via Gemini
// Falls back to rule-based generation if no API key is available

import { generateMäklarQuestions, type MäklarQuestion } from "./mäklarKontakt";

interface QuestionContext {
    address: string;
    area: string;
    asking_price: number;
    sqm: number | null;
    rooms: number | null;
    fee: number | null;
    built_year: number | null;
    fair_value: number | null;
    brf_loan_per_sqm: number | null;
    brf_savings_per_sqm: number | null;
    brf_summary: string | null;
}

const QUESTION_PROMPT = `Du är en senior bostadsanalytiker i Sverige. Baserat på följande bostads- och föreningsdata, generera 4-5 professionella frågor som en köpare bör ställa till mäklaren.

Frågorna ska vara:
- Specifika för denna bostad och förening (inte generiska).
- Fokuserade PÅ SÅDANT SOM INTE STÅR I ÅRSREDOVISNINGEN. Eftersom köparen redan har en AI-assistent för föreningens ekonomi, ska du UNDVIKA generella frågor om räntekänslighet, lån per kvm eller sparande.
- Inrikta frågorna på: lägenhetens specifika fysiska skick (t.ex. badrumscertifikat, stambyte i just denna stam), dolda fel, budgivningsläget, säljarens motivation, exakta tillträdesdatum, eller brister som upptäckts vid visning.
- Baserade på potentiella risker eller svagheter i den specifika bostadsdatan.
- Formulerade på professionell svenska, formella men inte stela.

**Bostadsdata:**
{PROPERTY_DATA}

**Svara i detta exakta JSON-format (inga markdown-taggar, bara ren JSON):**

[
  {
    "question": "<frågan på svenska>",
    "category": "<ekonomi|underhåll|risk>",
    "source": "<kort förklaring av varför frågan är relevant>"
  }
]`;

/**
 * Generate context-specific due diligence questions.
 * Uses Gemini if API key is available, otherwise falls back to rule-based generation.
 */
export async function generateAIQuestions(context: QuestionContext): Promise<MäklarQuestion[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback to rule-based if no API key
    if (!apiKey || apiKey === "YOUR_KEY_HERE") {
        return generateMäklarQuestions({
            brf_loan_per_sqm: context.brf_loan_per_sqm,
            brf_savings_per_sqm: context.brf_savings_per_sqm,
            brf_analysis_json: null,
        });
    }

    try {
        const propertyDataStr = [
            `Adress: ${context.address}, ${context.area}`,
            `Pris: ${context.asking_price.toLocaleString("sv-SE")} kr`,
            context.sqm ? `Storlek: ${context.sqm} kvm` : null,
            context.rooms ? `Rum: ${context.rooms}` : null,
            context.fee ? `Avgift: ${context.fee.toLocaleString("sv-SE")} kr/mån` : null,
            context.built_year ? `Byggår: ${context.built_year}` : null,
            context.fair_value ? `Marknadsvärde (estimat): ${context.fair_value.toLocaleString("sv-SE")} kr` : null,
            context.brf_loan_per_sqm ? `Föreningens skuld: ${context.brf_loan_per_sqm.toLocaleString("sv-SE")} kr/kvm` : null,
            context.brf_savings_per_sqm ? `Föreningens sparande: ${context.brf_savings_per_sqm.toLocaleString("sv-SE")} kr/kvm/år` : null,
            context.brf_summary ? `BRF-analys: ${context.brf_summary}` : null,
        ].filter(Boolean).join("\n");

        const prompt = QUESTION_PROMPT.replace("{PROPERTY_DATA}", propertyDataStr);

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey,
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 4096,
                    },
                }),
            }
        );

        if (!response.ok) {
            console.warn("Gemini API error for questions, falling back to rule-based");
            return generateMäklarQuestions({
                brf_loan_per_sqm: context.brf_loan_per_sqm,
                brf_savings_per_sqm: context.brf_savings_per_sqm,
                brf_analysis_json: null,
            });
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("No response from Gemini");
        }

        // Parse JSON from response
        const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const questions: MäklarQuestion[] = JSON.parse(jsonStr);

        // Validate and limit to 5
        return questions
            .filter(q => q.question && q.category && q.source)
            .slice(0, 5);

    } catch (err) {
        console.warn("AI question generation failed, using rule-based fallback:", err);
        return generateMäklarQuestions({
            brf_loan_per_sqm: context.brf_loan_per_sqm,
            brf_savings_per_sqm: context.brf_savings_per_sqm,
            brf_analysis_json: null,
        });
    }
}
