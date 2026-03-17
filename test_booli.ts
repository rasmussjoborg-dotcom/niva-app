import { fetchBooliListing } from "./src/utils/booliScraper.ts";

async function run() {
    try {
        const url = "https://www.booli.se/annons/5001229"; // Just a random active link
        const data = await fetchBooliListing(url);
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
