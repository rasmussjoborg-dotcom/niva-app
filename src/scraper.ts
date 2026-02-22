/**
 * Hemnet listing data extractor.
 * 
 * Since Hemnet is behind Cloudflare JS challenge, direct server-side scraping
 * isn't possible. Instead we:
 * 1. Parse the URL slug to extract structured data (type, rooms, area, address)
 * 2. Try fetching via a metadata proxy for OG image
 * 3. Return best-effort data with fields the user can edit
 */

export interface HemnetListing {
    address: string;
    area: string;
    price: string;
    priceRaw: number;
    avgift: string;
    rooms: string;
    sqm: string;
    floor: string;
    brfName: string;
    constructionYear: string;
    imageUrl: string;
    hemnetUrl: string;
    propertyType: string;
    listingId: string;
    confidence: 'high' | 'medium' | 'low';
}

const PROPERTY_TYPES: Record<string, string> = {
    'lagenhet': 'Lägenhet',
    'villa': 'Villa',
    'radhus': 'Radhus',
    'fritidshus': 'Fritidshus',
    'tomt': 'Tomt',
    'par': 'Parhus',
    'kedjehus': 'Kedjehus',
    'gard': 'Gård',
};

const MUNICIPALITIES: Record<string, string> = {
    'stockholms-kommun': 'Stockholm',
    'goteborgs-kommun': 'Göteborg',
    'goteborgs-stad': 'Göteborg',
    'malmo-kommun': 'Malmö',
    'malmo-stad': 'Malmö',
    'uppsalas-kommun': 'Uppsala',
    'uppsala-kommun': 'Uppsala',
    'vasteras-kommun': 'Västerås',
    'vasteras-stad': 'Västerås',
    'orebro-kommun': 'Örebro',
    'linkopings-kommun': 'Linköping',
    'helsingborgs-kommun': 'Helsingborg',
    'helsingborgs-stad': 'Helsingborg',
    'jonkopings-kommun': 'Jönköping',
    'norrkopings-kommun': 'Norrköping',
    'lunds-kommun': 'Lund',
    'umea-kommun': 'Umeå',
    'gavle-kommun': 'Gävle',
    'boras-kommun': 'Borås',
    'boras-stad': 'Borås',
    'sodertalje-kommun': 'Södertälje',
    'eskilstuna-kommun': 'Eskilstuna',
    'halmstads-kommun': 'Halmstad',
    'vaxjo-kommun': 'Växjö',
    'karlstads-kommun': 'Karlstad',
    'sundsvalls-kommun': 'Sundsvall',
    'trollhattans-kommun': 'Trollhättan',
    'ostersunds-kommun': 'Östersund',
    'kalmar-kommun': 'Kalmar',
    'faluns-kommun': 'Falun',
    'nacka-kommun': 'Nacka',
    'solna-kommun': 'Solna',
    'solna-stad': 'Solna',
    'sollentuna-kommun': 'Sollentuna',
    'taby-kommun': 'Täby',
    'lidingo-kommun': 'Lidingö',
    'lidingo-stad': 'Lidingö',
    'danderyds-kommun': 'Danderyd',
    'huddinge-kommun': 'Huddinge',
    'jarfalla-kommun': 'Järfälla',
    'haninge-kommun': 'Haninge',
    'botkyrka-kommun': 'Botkyrka',
    'tyreso-kommun': 'Tyresö',
    'sundbybergs-kommun': 'Sundbyberg',
    'sundbybergs-stad': 'Sundbyberg',
    'vallentuna-kommun': 'Vallentuna',
    'varmdo-kommun': 'Värmdö',
    'osterakers-kommun': 'Österåker',
    'salems-kommun': 'Salem',
    'upplands-vasby-kommun': 'Upplands Väsby',
    'norrtälje-kommun': 'Norrtälje',
    'sigtuna-kommun': 'Sigtuna',
};

/**
 * Parse a Hemnet URL slug into structured listing data.
 * URL format: /bostad/{type}-{rooms}rum-{area}-{municipality}-{street-address}-{listingId}
 */
export function parseHemnetUrl(url: string): HemnetListing {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('hemnet.se')) {
        throw new Error('URL must be a hemnet.se listing');
    }

    const path = parsed.pathname;

    // Must be a /bostad/ listing page
    if (!path.startsWith('/bostad/')) {
        throw new Error('URL must be a Hemnet listing page (hemnet.se/bostad/...)');
    }

    const slug = path.replace('/bostad/', '');

    // Extract listing ID (last number in the URL)
    const idMatch = slug.match(/-(\d+)$/);
    const listingId = idMatch?.[1] || '';
    const slugWithoutId = idMatch ? slug.slice(0, -idMatch[0].length) : slug;

    // Extract property type
    let propertyType = '';
    let remaining = slugWithoutId;
    for (const [key, value] of Object.entries(PROPERTY_TYPES)) {
        if (remaining.startsWith(key + '-')) {
            propertyType = value;
            remaining = remaining.slice(key.length + 1);
            break;
        }
    }

    // Extract rooms (e.g., "3rum" or "2,5rum")
    let rooms = '';
    const roomMatch = remaining.match(/^(\d+(?:,\d+)?)\s*rum-/i);
    if (roomMatch) {
        rooms = `${roomMatch[1]} rum`;
        remaining = remaining.slice(roomMatch[0].length);
    }
    // Also try half-rooms like "1,5rum"
    if (!rooms) {
        const halfRoomMatch = remaining.match(/^(\d+halft)\s*rum-/i);
        if (halfRoomMatch) {
            rooms = halfRoomMatch[1].replace('halft', ',5') + ' rum';
            remaining = remaining.slice(halfRoomMatch[0].length);
        }
    }

    // Try to find municipality
    let municipality = '';
    let area = '';
    for (const [key, value] of Object.entries(MUNICIPALITIES)) {
        const idx = remaining.indexOf(key);
        if (idx !== -1) {
            // Everything before the municipality is the area/neighborhood
            area = remaining.slice(0, idx).replace(/-$/, '');
            municipality = value;
            remaining = remaining.slice(idx + key.length).replace(/^-/, '');
            break;
        }
    }

    // If no known municipality found, try to split on "-kommun" or "-stad"
    if (!municipality) {
        const munMatch = remaining.match(/^(.*?)-([\w-]+-(?:kommun|stad))-(.*)$/);
        if (munMatch) {
            area = munMatch[1];
            municipality = munMatch[2]
                .replace(/-kommun$/, '')
                .replace(/-stad$/, '')
                .replace(/-/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase());
            remaining = munMatch[3];
        }
    }

    // Cleanup area name
    area = area
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();

    // What's left is the street address
    const streetAddress = remaining
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();

    // Build display location
    const displayArea = [area, municipality].filter(Boolean).join(', ');

    return {
        address: streetAddress || 'Okänd adress',
        area: displayArea,
        price: '',  // Can't get from URL
        priceRaw: 0,
        avgift: '',
        rooms,
        sqm: '',
        floor: '',
        brfName: '',
        constructionYear: '',
        imageUrl: '',
        hemnetUrl: url,
        propertyType,
        listingId,
        confidence: streetAddress && municipality ? 'medium' : 'low',
    };
}

/**
 * Fetch the real Hemnet listing page via allorigins.win proxy (bypasses Cloudflare)
 * and extract OG image, price, and other data from the HTML.
 */
export async function enrichWithMetadata(listing: HemnetListing): Promise<HemnetListing> {
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(listing.hemnetUrl)}`;
        const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) return listing;

        const html = await response.text();

        // Check if we got the real page (not a 404 or error page)
        if (html.includes('Sidan hittades inte') || html.includes('Page not found')) {
            return listing;
        }

        const enriched = { ...listing };

        // --- Extract OG image ---
        const ogImageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
        if (ogImageMatch?.[1] && !ogImageMatch[1].includes('fallback')) {
            enriched.imageUrl = ogImageMatch[1];
        }

        // --- Extract OG title (usually "Address - Area | Hemnet") ---
        const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
        if (ogTitleMatch?.[1] && !ogTitleMatch[1].includes('hittades inte')) {
            const titleParts = ogTitleMatch[1].split(' - ');
            if (titleParts[0]) {
                enriched.address = decodeHtmlEntities(titleParts[0].trim());
            }
        }

        // --- Extract price (look for JSON-LD first, then HTML patterns) ---
        const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (jsonLdMatch?.[1]) {
            try {
                const ld = JSON.parse(jsonLdMatch[1]);
                // Hemnet uses RealEstateListing or Product schema
                const offer = ld.offers || ld;
                if (offer.price || offer.priceCurrency) {
                    enriched.priceRaw = parseInt(String(offer.price).replace(/\D/g, ''), 10) || 0;
                    if (enriched.priceRaw > 0) {
                        enriched.price = `${enriched.priceRaw.toLocaleString('sv-SE')} kr`;
                    }
                }
                if (ld.name && !ld.name.includes('hittades inte')) {
                    enriched.address = decodeHtmlEntities(ld.name.split(',')[0].trim());
                }
                if (ld.image) {
                    const imgSrc = Array.isArray(ld.image) ? ld.image[0] : ld.image;
                    if (typeof imgSrc === 'string' && imgSrc.startsWith('http')) {
                        enriched.imageUrl = imgSrc;
                    }
                }
            } catch { /* JSON-LD parsing failed, continue */ }
        }

        // --- Fallback: extract price from HTML ---
        if (!enriched.priceRaw) {
            const priceMatch = html.match(/Begärt pris[\s\S]*?([\d\s]+)\s*kr/i)
                || html.match(/Pris[\s\S]{0,50}?([\d\s]{5,})\s*kr/i)
                || html.match(/"price":\s*"?([\d\s]+)"?/i);
            if (priceMatch?.[1]) {
                enriched.priceRaw = parseInt(priceMatch[1].replace(/\s/g, ''), 10) || 0;
                if (enriched.priceRaw > 0) {
                    enriched.price = `${enriched.priceRaw.toLocaleString('sv-SE')} kr`;
                }
            }
        }

        // --- Extract avgift ---
        if (!enriched.avgift) {
            const avgiftMatch = html.match(/Avgift[\s\S]{0,50}?([\d\s]+)\s*kr/i);
            if (avgiftMatch?.[1]) {
                enriched.avgift = avgiftMatch[1].trim() + ' kr/mån';
            }
        }

        // --- Extract sqm ---
        if (!enriched.sqm) {
            const sqmMatch = html.match(/([\d,]+)\s*m²/);
            if (sqmMatch?.[1]) {
                enriched.sqm = sqmMatch[1] + ' m²';
            }
        }

        // --- Extract rooms (if not already from URL) ---
        if (!enriched.rooms) {
            const roomsMatch = html.match(/([\d,]+)\s*rum/);
            if (roomsMatch?.[1]) {
                enriched.rooms = roomsMatch[1] + ' rum';
            }
        }

        // --- Fallback: look for listing images in the HTML ---
        if (!enriched.imageUrl) {
            // Hemnet uses Next.js Image component, look for listing image URLs
            const imgMatch = html.match(/https:\/\/bilder\.hemnet\.se\/[^"'\s]+/);
            if (imgMatch?.[0]) {
                enriched.imageUrl = imgMatch[0];
            }
        }

        // Upgrade confidence if we got useful data
        if (enriched.imageUrl || enriched.priceRaw > 0) {
            enriched.confidence = 'high';
        }

        return enriched;
    } catch {
        // Enrichment is best-effort, don't fail
    }
    return listing;
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
