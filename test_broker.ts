import { findBrokerPdfs } from "./src/utils/brokerScraper.ts";

async function run() {
    const urls = [
        "https://connect-resolve.maklare.vitec.net/Description/M10120/OBJ10120_2096426930/Booli",
        "http://nestorfastighetsmakleri.se/objekt/1931923",
        "https://connect-resolve.maklare.vitec.net/Description/S8437/CMBOLGH5MSIGBEJB3DQ6UAM/Booli",
        "https://vaxjo.bostad.dizparc.se/objekt/cmbolgh5msigbejb3dq6uam", // Just added a few variants
        "https://www.svenskfast.se/bostadsratt/stockholm/stockholm/stockholm/vasastan/storgatan-12/359954" // Made up standard URL
    ];

    for (const url of urls) {
        console.log(`\nTesting: ${url}`);
        try {
            const docs = await findBrokerPdfs(url);
            console.log(`Found ${docs.length} documents:`);
            console.dir(docs, { depth: null });
        } catch (e: any) {
            console.error(`Error: ${e.message}`);
        }
    }
}

run();
