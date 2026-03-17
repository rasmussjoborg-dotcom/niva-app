// Booli Listing Scraper
// Uses Puppeteer to bypass Booli's bot protection, then parses property data from HTML

import puppeteer, { type Browser } from "puppeteer";

export interface BooliListing {
    address: string;
    area: string;
    asking_price: number;
    sqm: number | null;
    rooms: number | null;
    fee: number | null;
    built_year: number | null;
    fair_value: number | null;
    image_url: string | null;
    booli_url: string;
    broker_url: string | null;
}

// Reuse a single browser instance across requests
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.connected) {
        return browserInstance;
    }
    browserInstance = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
    });
    return browserInstance;
}

/**
 * Validate and normalize a Booli URL
 */
export function parseBooliUrl(input: string): string {
    const trimmed = input.trim();

    // Match patterns: booli.se/annons/12345, booli.se/bostad/12345, www.booli.se/...
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?booli\.se\/(annons|bostad|lagenhet|villa|radhus)\/[^\s]+/i);
    if (!match) {
        throw new Error("Ogiltig Booli-länk. Klistra in en länk i formatet booli.se/bostad/...");
    }

    // Ensure https://
    if (trimmed.startsWith("http")) return trimmed;
    if (trimmed.startsWith("www.")) return `https://${trimmed}`;
    return `https://www.${trimmed}`;
}

/**
 * Extract a number from a Swedish formatted string like "3 950 000 kr"
 */
function parseSEK(str: string): number {
    return parseInt(str.replace(/[^\d]/g, "")) || 0;
}

/**
 * Fetch a Booli listing page using Puppeteer (headless browser)
 * This bypasses Cloudflare/bot protection that blocks server-side fetch
 */
async function fetchPageHtml(url: string): Promise<string> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
        // Set a realistic viewport and user agent
        await page.setViewport({ width: 1440, height: 900 });
        await page.setUserAgent(
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
        );

        // Navigate and wait for the page to fully load
        await page.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30_000,
        });

        // Wait a moment for any client-side rendering
        await new Promise((r) => setTimeout(r, 1000));

        return await page.content();
    } finally {
        await page.close();
    }
}

/**
 * Fetch and parse a Booli listing page
 */
export async function fetchBooliListing(url: string): Promise<BooliListing> {
    const normalizedUrl = parseBooliUrl(url);

    console.log(`[Booli] Fetching listing via Puppeteer: ${normalizedUrl}`);
    const html = await fetchPageHtml(normalizedUrl);
    console.log(`[Booli] Got ${html.length} bytes of HTML`);

    // Strategy 1: __NEXT_DATA__ Apollo state (most reliable, richest data)
    const nextData = extractFromApolloState(html);
    if (nextData) {
        // Apollo state doesn't always have image URLs — supplement from JSON-LD
        if (!nextData.image_url) {
            const jsonLdImage = extractImageFromJsonLd(html);
            if (jsonLdImage) nextData.image_url = jsonLdImage;
        }
        console.log(`[Booli] Parsed via Apollo state: ${nextData.address}`);
        return { ...nextData, booli_url: normalizedUrl };
    }

    // Strategy 2: JSON-LD Product structured data
    const jsonLd = extractFromJsonLd(html);
    if (jsonLd) {
        console.log(`[Booli] Parsed via JSON-LD: ${jsonLd.address}`);
        return { ...jsonLd, booli_url: normalizedUrl };
    }

    // Strategy 3: Fallback to meta tags + regex parsing
    const metaData = extractFromMetaAndRegex(html);
    if (metaData) {
        console.log(`[Booli] Parsed via meta/regex: ${metaData.address}`);
        return { ...metaData, booli_url: normalizedUrl };
    }

    throw new Error("Kunde inte tolka bostadsinformationen från Booli. Sidan kan ha ändrat format.");
}

/**
 * Extract image URL from JSON-LD Product block
 */
function extractImageFromJsonLd(html: string): string | null {
    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
        try {
            const data = JSON.parse(match[1]);
            if (data["@type"] === "Product" && data.image) {
                return Array.isArray(data.image) ? data.image[0] : data.image;
            }
        } catch { /* Skip invalid JSON */ }
    }
    return null;
}

/**
 * Strategy 1: Extract from __NEXT_DATA__ Apollo state
 * Booli uses Apollo GraphQL with Listing:ID keys in __APOLLO_STATE__
 */
function extractFromApolloState(html: string): Omit<BooliListing, "booli_url"> | null {
    const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return null;

    try {
        const nextData = JSON.parse(match[1]);
        const state = nextData?.props?.pageProps?.__APOLLO_STATE__;
        if (!state) return null;

        // Find the Listing:ID entry
        for (const [key, val] of Object.entries(state)) {
            if (!key.startsWith("Listing:")) continue;
            const listing = val as any;

            if (!listing.streetAddress && !listing.listPrice) continue;

            // Extract image URL from first Image reference
            // Booli Image objects only have an `id` — URLs are constructed as https://bcdn.se/images/cache/{id}_1440x0.jpg
            let imageUrl: string | null = null;
            if (listing.images && Array.isArray(listing.images)) {
                const firstImgRef = listing.images[0]?.__ref;
                if (firstImgRef && state[firstImgRef]) {
                    const img = state[firstImgRef] as any;
                    // Try direct URL properties first, fall back to constructing from ID
                    imageUrl = img.fullSize || img.url || img.thumbnail
                        || (img.id ? `https://bcdn.se/images/cache/${img.id}_1440x0.jpg` : null);
                }
            }

            // Find location data if available (sometimes it's in a separate ref)
            let location: any = null;
            if (listing.location?.__ref && state[listing.location.__ref]) {
                location = state[listing.location.__ref];
            }

            // Find primary image if available (sometimes it's in a separate ref)
            let primaryImage: string | null = imageUrl; // Fallback to imageUrl if primaryImage not found
            if (listing.primaryImage?.__ref && state[listing.primaryImage.__ref]) {
                const img = state[listing.primaryImage.__ref] as any;
                primaryImage = img.fullSize || img.url || img.thumbnail
                    || (img.id ? `https://bcdn.se/images/cache/${img.id}_1440x0.jpg` : null);
            }


            return {
                address: location?.address?.streetAddress || listing.streetAddress || "",
                area: location?.region?.municipalityName || listing.descriptiveAreaName || listing.primaryArea?.name || "",
                asking_price: listing.listPrice?.raw || 0,
                sqm: listing.livingArea?.raw || null,
                rooms: listing.rooms?.raw || null,
                fee: listing.rent?.raw || null,
                built_year: listing.constructionYear || null,
                fair_value: listing.estimate?.price?.raw || null,
                image_url: primaryImage || null,
                broker_url: listing.listingUrl || null,
            };
        }
    } catch { /* Invalid JSON */ }
    return null;
}

/**
 * Strategy 2: Extract from JSON-LD structured data
 * Booli uses @type: "Product" with offers.price
 */
function extractFromJsonLd(html: string): Omit<BooliListing, "booli_url"> | null {
    const jsonLdMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);

    let address = "";
    let area = "";
    let price = 0;
    let imageUrl: string | null = null;
    let brokerUrl: string | null = null;

    for (const match of jsonLdMatches) {
        try {
            const data = JSON.parse(match[1]);

            // Product type has the price and name
            if (data["@type"] === "Product") {
                address = data.name || address;
                price = data.offers?.price || price;
                imageUrl = (Array.isArray(data.image) ? data.image[0] : data.image) || imageUrl;
                brokerUrl = data.offers?.url || brokerUrl; // Extract broker URL from offers.url
            }

            // Place type has the full address
            if (data["@type"] === "Place" && data.address) {
                address = data.address?.streetAddress || address;
                area = data.address?.addressLocality?.replace(/ - .*/, "") || area;
            }
        } catch { /* Skip invalid JSON */ }
    }

    if (!price) return null;

    return {
        address,
        area,
        asking_price: price,
        sqm: null, // Not available in JSON-LD
        rooms: null,
        fee: null,
        built_year: null,
        fair_value: null,
        image_url: imageUrl,
        broker_url: brokerUrl,
    };
}

/**
 * Strategy 3: Fallback to meta tags and regex extraction
 */
function extractFromMetaAndRegex(html: string): Omit<BooliListing, "booli_url"> | null {
    const getMeta = (attr: string, value: string): string => {
        // Match both property="og:X" and name="X" patterns
        const pattern = new RegExp(`<meta[^>]+${attr}="${value}"[^>]+content="([^"]*)"`, "i");
        const altPattern = new RegExp(`<meta[^>]+content="([^"]*)"[^>]+${attr}="${value}"`, "i");
        return pattern.exec(html)?.[1] || altPattern.exec(html)?.[1] || "";
    };

    const title = getMeta("property", "og:title") || getMeta("name", "title");
    const image = getMeta("property", "og:image");
    const description = getMeta("property", "og:description") || getMeta("name", "description");

    if (!title && !description) return null;

    // Try to extract price from page content
    const priceMatch = html.match(/"price"\s*:\s*(\d+)/i)
        || html.match(/"listPrice"[^}]*"raw"\s*:\s*(\d+)/i)
        || html.match(/(?:Pris|Utgångspris|Begärt pris)[:\s]*(\d[\d\s]*)\s*kr/i);

    if (!priceMatch) return null;

    const price = parseSEK(priceMatch[1]);
    if (!price) return null;

    // Parse address from title: "Frejgatan 101 - Lägenhet till salu - Booli"
    const titleParts = title.split(/\s*[-–—|]\s*/);
    const address = titleParts[0]?.trim() || "";

    // Try to extract other fields from description or raw HTML
    const sqmMatch = html.match(/"livingArea"[^}]*"raw"\s*:\s*([\d.]+)/i)
        || description.match(/(\d+(?:[.,]\d)?)\s*(?:kvm|m²)/i);
    const roomsMatch = html.match(/"rooms"[^}]*"raw"\s*:\s*([\d.]+)/i)
        || description.match(/(\d+(?:[.,]\d)?)\s*rum/i);
    const feeMatch = html.match(/"rent"[^}]*"raw"\s*:\s*(\d+)/i)
        || description.match(/(?:Avgift|Månadsavgift)[:\s]*(\d[\d\s]*)\s*kr/i);
    const yearMatch = html.match(/"constructionYear"\s*:\s*(\d{4})/i);

    // Try to extract broker URL from "Till mäklarens annons" link
    let brokerUrl: string | null = null;
    const brokerLinkMatch = html.match(/href="([^"]+?)"[^>]*>Till mäklarens annons/i) ||
        html.match(/href="([^"]*vitec\.net[^"]*)"/i) ||
        html.match(/href="([^"]*fasad\.eu[^"]*)"/i);

    if (brokerLinkMatch) {
        // Clean HTML entities like &amp; 
        brokerUrl = brokerLinkMatch[1].replace(/&amp;/g, '&');
    }

    return {
        address,
        area: "",
        asking_price: price,
        sqm: sqmMatch ? parseFloat(sqmMatch[1].replace(",", ".")) : null,
        rooms: roomsMatch ? parseFloat(roomsMatch[1].replace(",", ".")) : null,
        fee: feeMatch ? parseSEK(feeMatch[1]) : null,
        built_year: yearMatch ? parseInt(yearMatch[1]) : null,
        fair_value: null,
        image_url: image || null,
        broker_url: brokerUrl,
    };
}
