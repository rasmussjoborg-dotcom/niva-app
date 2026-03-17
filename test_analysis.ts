import { findBrokerPdfs } from "./src/utils/brokerScraper.ts";
import { analyzeBrfPdf } from "./src/utils/pdfAnalyzer.ts";
const brokerUrl = "https://connect-resolve.maklare.vitec.net/Description/M10120/OBJ10120_2096426930/Booli";

console.log("Testing with broker:", brokerUrl);
const docs = await findBrokerPdfs(brokerUrl);
const pdf = docs.find(d => d.type === 'annual_report');
if (pdf) {
    console.log("Found Annual Report:", pdf.url);
    try {
        const res = await analyzeBrfPdf(pdf.url);
        console.log("Analysis Result:", res);
    } catch(e) {
        console.error("Analysis Error:", e);
    }
} else {
    console.log("No annual report found");
}
