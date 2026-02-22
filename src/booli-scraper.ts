/**
 * Booli.se listing data extractor.
 *
 * Booli is not behind Cloudflare, so we can fetch pages directly.
 * We extract property details from HTML, OG meta tags, and JSON-LD.
 */

export interface BooliDocument {
    title: string;   // e.g. "Objektsbeskrivning", "Årsredovisning", "Planritning"
    url: string;     // Direct URL to the PDF
}

export interface BooliListing {
    address: string;
    area: string;
    price: string;
    priceRaw: number;
    avgift: string;
    rooms: string;
    sqm: string;
    floor: string;
    brfName: string;
    brfUrl: string;
    constructionYear: string;
    energyClass: string;
    imageUrl: string;
    booliUrl: string;
    propertyType: string;
    listingId: string;
    documents: BooliDocument[];
    confidence: 'high' | 'medium' | 'low';
    /* Booli's own market valuation */
    estimatePrice: number;     // e.g. 10000000
    estimateLow: number;       // e.g. 9540000
    estimateHigh: number;      // e.g. 10500000
    estimatePricePerSqm: number; // e.g. 109000
    estimateFormatted: string; // e.g. "10 000 000 kr"
}

/**
 * Scrape a Booli listing page and extract property data.
 */
export async function scrapeBooliListing(url: string): Promise<BooliListing> {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('booli.se')) {
        throw new Error('URL must be a booli.se listing');
    }

    // Extract listing ID from URL path: /bostad/{id}
    const idMatch = parsed.pathname.match(/\/bostad\/(\d+)/);
    if (!idMatch) {
        throw new Error('URL must be a Booli listing page (booli.se/bostad/...)');
    }
    const listingId = idMatch[1];

    // Fetch the page directly — Booli is not behind Cloudflare
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Booli listing: ${response.status}`);
    }

    const html = await response.text();

    const listing: BooliListing = {
        address: '',
        area: '',
        price: '',
        priceRaw: 0,
        avgift: '',
        rooms: '',
        sqm: '',
        floor: '',
        brfName: '',
        brfUrl: '',
        constructionYear: '',
        energyClass: '',
        imageUrl: '',
        booliUrl: url,
        propertyType: 'Lägenhet',
        listingId,
        documents: [],
        confidence: 'low',
        estimatePrice: 0,
        estimateLow: 0,
        estimateHigh: 0,
        estimatePricePerSqm: 0,
        estimateFormatted: '',
    };

    // --- Extract OG meta tags ---
    const ogImage = extractMeta(html, 'og:image');
    if (ogImage) listing.imageUrl = ogImage;

    const ogTitle = extractMeta(html, 'og:title');
    if (ogTitle) {
        // Format: "Lägenhet snart till salu på Kungsholmsgatan 20, Kungsholmen, Stockholm – Booli"
        // or: "Lägenhet till salu på Kungsholmsgatan 20, Kungsholmen, Stockholm – Booli"
        const titleMatch = ogTitle.match(/(?:snart till salu|till salu)\s+på\s+(.+?)\s*[–—\-]\s*Booli/i);
        if (titleMatch) {
            const parts = titleMatch[1].split(',').map(s => s.trim());
            listing.address = parts[0] || '';
            if (parts.length >= 3) {
                listing.area = `${parts[1]}, ${parts[2]}`;
            } else if (parts.length === 2) {
                listing.area = parts[1];
            }
        }
    }

    // --- Fallback: extract address from h1 heading ---
    if (!listing.address) {
        const h1Match = html.match(/<h1[^>]*>\s*([^<]+?)\s*<\/h1>/i);
        if (h1Match?.[1]) {
            listing.address = decodeHtmlEntities(h1Match[1].trim());
        }
    }

    const ogDesc = extractMeta(html, 'og:description');
    if (ogDesc) {
        // Format: "Lägenhet till salu på Kungsholmsgatan 20, 3 rum, 81 m², säljs av Widerlöv."
        const roomsMatch = ogDesc.match(/(\d+)\s*rum/);
        if (roomsMatch) listing.rooms = `${roomsMatch[1]} rum`;

        const sqmMatch = ogDesc.match(/(\d+)\s*m²/);
        if (sqmMatch) listing.sqm = `${sqmMatch[1]} m²`;

        // Detect property type from OG description
        if (ogDesc.toLowerCase().startsWith('villa')) listing.propertyType = 'Villa';
        else if (ogDesc.toLowerCase().startsWith('radhus')) listing.propertyType = 'Radhus';
        else if (ogDesc.toLowerCase().startsWith('lägenhet')) listing.propertyType = 'Lägenhet';
    }

    // --- Extract JSON-LD for BRF name ---
    const jsonLdBlocks = html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    for (const block of jsonLdBlocks) {
        try {
            const ld = JSON.parse(block[1]);

            // BreadcrumbList contains BRF as last item
            if (ld['@type'] === 'BreadcrumbList' && Array.isArray(ld.itemListElement)) {
                for (const item of ld.itemListElement) {
                    if (item.item && typeof item.item === 'string' && item.item.includes('bostadsrattsforening')) {
                        listing.brfName = item.name || '';
                        listing.brfUrl = item.item || '';
                    }
                }
            }

            // Product/RealEstateListing schema may have price
            if (ld.offers?.price) {
                listing.priceRaw = parseInt(String(ld.offers.price).replace(/\D/g, ''), 10) || 0;
                if (listing.priceRaw > 0) {
                    listing.price = `${listing.priceRaw.toLocaleString('sv-SE')} kr`;
                }
            }
        } catch { /* skip invalid JSON-LD */ }
    }

    // --- Extract Booli's market valuation (estimate) from embedded state ---
    // Booli embeds Apollo/Next.js state in script tags with estimate data
    try {
        // Look for the estimate object in the page's embedded JSON
        const estimatePattern = /"estimate"\s*:\s*\{[^}]*"price"\s*:\s*\{[^}]*"raw"\s*:\s*(\d+)[^}]*\}[^}]*\}/;
        const estimateMatch = html.match(estimatePattern);

        if (estimateMatch) {
            // Found the estimate section — extract the full block
            const rawPrice = parseInt(estimateMatch[1], 10);
            if (rawPrice > 0) {
                listing.estimatePrice = rawPrice;

                // Extract formatted price
                const formattedMatch = html.match(/"estimate"[\s\S]{0,500}?"formatted"\s*:\s*"([^"]+)"/);
                if (formattedMatch) {
                    listing.estimateFormatted = formattedMatch[1];
                } else {
                    listing.estimateFormatted = `${rawPrice.toLocaleString('sv-SE')} kr`;
                }

                // Extract low estimate
                const lowMatch = html.match(/"estimate"[\s\S]{0,800}?"low"\s*:\s*\{[^}]*"value"\s*:\s*"([^"]+)"/);
                if (lowMatch) {
                    listing.estimateLow = parseInt(lowMatch[1].replace(/\s/g, ''), 10) || 0;
                }

                // Extract high estimate
                const highMatch = html.match(/"estimate"[\s\S]{0,800}?"high"\s*:\s*\{[^}]*"value"\s*:\s*"([^"]+)"/);
                if (!highMatch) {
                    // Try formatted
                    const highFmtMatch = html.match(/"estimate"[\s\S]{0,800}?"high"\s*:\s*\{[^}]*"formatted"\s*:\s*"([^"]+)"/);
                    if (highFmtMatch) {
                        listing.estimateHigh = parseInt(highFmtMatch[1].replace(/\D/g, ''), 10) || 0;
                    }
                } else {
                    listing.estimateHigh = parseInt(highMatch[1].replace(/\s/g, ''), 10) || 0;
                }
            }
        }

        // Fallback: try to extract from visible text patterns
        if (!listing.estimatePrice) {
            // Look for "Boolis värdering" or "Uppskattat värde" followed by price
            const valTextMatch = html.match(/(?:värdering|Uppskattat\s*värde)[\s\S]{0,200}?([\d\s]+)\s*kr/i);
            if (valTextMatch?.[1]) {
                const val = parseInt(valTextMatch[1].replace(/\s/g, ''), 10);
                if (val > 100000) {
                    listing.estimatePrice = val;
                    listing.estimateFormatted = `${val.toLocaleString('sv-SE')} kr`;
                }
            }
        }

        // Extract price per sqm for the area
        const sqmPriceMatch = html.match(/([\d\s]+)\s*kr\/m²/i);
        if (sqmPriceMatch?.[1]) {
            listing.estimatePricePerSqm = parseInt(sqmPriceMatch[1].replace(/\s/g, ''), 10) || 0;
        }
    } catch { /* estimate extraction is best-effort */ }

    // --- Extract price from HTML ---
    if (!listing.priceRaw) {
        // Booli uses "Utropspris" or "Slutpris" or patterns with kr
        const pricePatterns = [
            /Utropspris[\s\S]*?([\d\s]+)\s*kr/i,
            /Begärt pris[\s\S]*?([\d\s]+)\s*kr/i,
            /Slutpris[\s\S]*?([\d\s]+)\s*kr/i,
            /Pris[\s\S]{0,80}?([\d\s]{5,})\s*kr/i,
        ];
        for (const pattern of pricePatterns) {
            const match = html.match(pattern);
            if (match?.[1]) {
                const price = parseInt(match[1].replace(/\s/g, ''), 10);
                if (price > 100000) { // sanity check
                    listing.priceRaw = price;
                    listing.price = `${price.toLocaleString('sv-SE')} kr`;
                    break;
                }
            }
        }
    }

    // --- Extract avgift ---
    const avgiftMatch = html.match(/Avgift[\s\S]{0,60}?([\d\s]+)\s*kr\/mån/i)
        || html.match(/avgift[^>]*>([\d\s]+)\s*kr/i);
    if (avgiftMatch?.[1]) {
        listing.avgift = avgiftMatch[1].trim().replace(/\s/g, ' ') + ' kr/mån';
    }

    // --- Extract sqm (if not from OG) ---
    if (!listing.sqm) {
        const sqmMatch = html.match(/Boarea[\s\S]{0,40}?(\d+)\s*m²/i)
            || html.match(/(\d+)\s*m²/);
        if (sqmMatch?.[1]) {
            listing.sqm = `${sqmMatch[1]} m²`;
        }
    }

    // --- Extract rooms (if not from OG) ---
    if (!listing.rooms) {
        const roomsMatch = html.match(/Rum[\s\S]{0,40}?(\d+)\s*rum/i)
            || html.match(/(\d+)\s*rum/);
        if (roomsMatch?.[1]) {
            listing.rooms = `${roomsMatch[1]} rum`;
        }
    }

    // --- Extract byggår ---
    const yearMatch = html.match(/Byggår[\s\S]{0,40}?(\d{4})/i);
    if (yearMatch?.[1]) {
        listing.constructionYear = yearMatch[1];
    }

    // --- Extract floor ---
    const floorMatch = html.match(/våning\s*(\d+)\s*av\s*(\d+)/i);
    if (floorMatch) {
        listing.floor = `${floorMatch[1]} av ${floorMatch[2]}`;
    }

    // --- Extract energy class ---
    const energyMatch = html.match(/energiklass\s*([A-G])/i);
    if (energyMatch?.[1]) {
        listing.energyClass = energyMatch[1].toUpperCase();
    }

    // --- Extract PDF document links ---
    // Booli listings may have PDF links for objektsbeskrivning, årsredovisning, planritning, etc.
    const pdfPattern = /<a[^>]+href="([^"]*\.pdf[^"]*)"[^>]*>([^<]*)</gi;
    let pdfMatch;
    while ((pdfMatch = pdfPattern.exec(html)) !== null) {
        listing.documents.push({
            url: pdfMatch[1].startsWith('http') ? pdfMatch[1] : `https://www.booli.se${pdfMatch[1]}`,
            title: pdfMatch[2].trim() || 'Dokument',
        });
    }

    // Also look for document links with common Swedish property document names
    const docNames = ['Objektsbeskrivning', 'Årsredovisning', 'Planritning', 'Energideklaration', 'Stadgar'];
    for (const docName of docNames) {
        const docPattern = new RegExp(`<a[^>]+href="([^"]+)"[^>]*>[^<]*${docName}[^<]*</a>`, 'gi');
        let docMatch;
        while ((docMatch = docPattern.exec(html)) !== null) {
            const docUrl = docMatch[1].startsWith('http') ? docMatch[1] : `https://www.booli.se${docMatch[1]}`;
            // Avoid duplicates
            if (!listing.documents.some(d => d.url === docUrl)) {
                listing.documents.push({ url: docUrl, title: docName });
            }
        }
    }

    // Upgrade confidence based on data quality
    if (listing.imageUrl && listing.address) {
        listing.confidence = listing.priceRaw > 0 ? 'high' : 'medium';
    }

    return listing;
}

function extractMeta(html: string, property: string): string | null {
    const pattern1 = new RegExp(`<meta\\s+property="${property}"\\s+content="([^"]+)"`, 'i');
    const pattern2 = new RegExp(`<meta\\s+content="([^"]+)"\\s+property="${property}"`, 'i');
    // Also try name= attribute (some sites use name instead of property)
    const pattern3 = new RegExp(`<meta\\s+name="${property}"\\s+content="([^"]+)"`, 'i');
    const match = html.match(pattern1) || html.match(pattern2) || html.match(pattern3);
    return match?.[1] || null;
}

function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}
