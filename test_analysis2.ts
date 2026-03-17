import { findBrokerPdfs } from "./src/utils/brokerScraper.ts";
const brokerUrl = "https://connect-resolve.maklare.vitec.net/Description/M10120/OBJ10120_2096426930/Booli";

const docs = await findBrokerPdfs(brokerUrl);
const pdf = docs.find(d => d.type === 'annual_report');
const apiKey = process.env.GEMINI_API_KEY;

const bufRes = await fetch(pdf.url, {
    headers: { "User-Agent": "Mozilla/5.0" }
});
const arrayBuffer = await bufRes.arrayBuffer();
const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');

const EXTRACTION_PROMPT = `Du är en expert på att analysera årsredovisningar.`; // shortened for test
const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: EXTRACTION_PROMPT },
                    { inline_data: { mime_type: "application/pdf", data: pdfBase64 } }
                ]
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
    }
);
const result = await response.json();
console.log(JSON.stringify(result, null, 2));
