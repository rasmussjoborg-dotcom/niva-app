import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Hemnet listing parser — Vercel serverless function.
 * POST /api/scrape  { url: "https://www.hemnet.se/bostad/..." }
 * 
 * Parses the URL slug for structured data since Hemnet is behind Cloudflare.
 * Enriches with OG metadata when available.
 */

interface HemnetListing {
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
    'lagenhet': 'Lägenhet', 'villa': 'Villa', 'radhus': 'Radhus',
    'fritidshus': 'Fritidshus', 'tomt': 'Tomt', 'par': 'Parhus',
    'kedjehus': 'Kedjehus', 'gard': 'Gård',
};

const MUNICIPALITIES: Record<string, string> = {
    'stockholms-kommun': 'Stockholm', 'goteborgs-kommun': 'Göteborg',
    'malmo-kommun': 'Malmö', 'uppsalas-kommun': 'Uppsala', 'vasteras-kommun': 'Västerås',
    'orebro-kommun': 'Örebro', 'linkopings-kommun': 'Linköping',
    'helsingborgs-kommun': 'Helsingborg', 'helsingborgs-stad': 'Helsingborg',
    'jonkopings-kommun': 'Jönköping', 'norrkopings-kommun': 'Norrköping',
    'lunds-kommun': 'Lund', 'umea-kommun': 'Umeå', 'gavle-kommun': 'Gävle',
    'boras-kommun': 'Borås', 'sodertalje-kommun': 'Södertälje',
    'eskilstuna-kommun': 'Eskilstuna', 'halmstads-kommun': 'Halmstad',
    'vaxjo-kommun': 'Växjö', 'karlstads-kommun': 'Karlstad',
    'sundsvalls-kommun': 'Sundsvall', 'nacka-kommun': 'Nacka',
    'solna-kommun': 'Solna', 'solna-stad': 'Solna',
    'sollentuna-kommun': 'Sollentuna', 'taby-kommun': 'Täby',
    'lidingo-kommun': 'Lidingö', 'danderyds-kommun': 'Danderyd',
    'huddinge-kommun': 'Huddinge', 'jarfalla-kommun': 'Järfälla',
    'haninge-kommun': 'Haninge', 'sundbybergs-kommun': 'Sundbyberg',
    'sundbybergs-stad': 'Sundbyberg', 'varmdo-kommun': 'Värmdö',
};

function parseHemnetUrl(url: string): HemnetListing {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('hemnet.se')) {
        throw new Error('URL must be a hemnet.se listing');
    }
    const path = parsed.pathname;
    if (!path.startsWith('/bostad/')) {
        throw new Error('URL must be a Hemnet listing page');
    }

    const slug = path.replace('/bostad/', '');
    const idMatch = slug.match(/-(\d+)$/);
    const listingId = idMatch?.[1] || '';
    const slugWithoutId = idMatch ? slug.slice(0, -idMatch[0].length) : slug;

    let propertyType = '';
    let remaining = slugWithoutId;
    for (const [key, value] of Object.entries(PROPERTY_TYPES)) {
        if (remaining.startsWith(key + '-')) {
            propertyType = value;
            remaining = remaining.slice(key.length + 1);
            break;
        }
    }

    let rooms = '';
    const roomMatch = remaining.match(/^(\d+(?:,\d+)?)\s*rum-/i);
    if (roomMatch) {
        rooms = `${roomMatch[1]} rum`;
        remaining = remaining.slice(roomMatch[0].length);
    }

    let municipality = '';
    let area = '';
    for (const [key, value] of Object.entries(MUNICIPALITIES)) {
        const idx = remaining.indexOf(key);
        if (idx !== -1) {
            area = remaining.slice(0, idx).replace(/-$/, '');
            municipality = value;
            remaining = remaining.slice(idx + key.length).replace(/^-/, '');
            break;
        }
    }
    if (!municipality) {
        const munMatch = remaining.match(/^(.*?)-([\w-]+-(?:kommun|stad))-(.*)$/);
        if (munMatch) {
            area = munMatch[1];
            municipality = munMatch[2].replace(/-kommun$/, '').replace(/-stad$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            remaining = munMatch[3];
        }
    }

    area = area.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    const streetAddress = remaining.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    const displayArea = [area, municipality].filter(Boolean).join(', ');

    return {
        address: streetAddress || 'Okänd adress',
        area: displayArea,
        price: '', priceRaw: 0, avgift: '', rooms, sqm: '', floor: '',
        brfName: '', constructionYear: '', imageUrl: '',
        hemnetUrl: url, propertyType, listingId,
        confidence: streetAddress && municipality ? 'medium' : 'low',
    };
}

async function enrichWithMetadata(listing: HemnetListing): Promise<HemnetListing> {
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(listing.hemnetUrl)}`;
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) return listing;

        const html = await response.text();
        if (html.includes('Sidan hittades inte') || html.includes('Page not found')) return listing;

        const enriched = { ...listing };

        // OG image
        const ogImg = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+content="([^"]+)"\s+property="og:image"/i);
        if (ogImg?.[1] && !ogImg[1].includes('fallback')) enriched.imageUrl = ogImg[1];

        // OG title
        const ogTitle = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
            || html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
        if (ogTitle?.[1] && !ogTitle[1].includes('hittades inte')) {
            const parts = ogTitle[1].split(' - ');
            if (parts[0]) enriched.address = parts[0].trim().replace(/&amp;/g, '&');
        }

        // JSON-LD
        const jsonLd = html.match(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (jsonLd?.[1]) {
            try {
                const ld = JSON.parse(jsonLd[1]);
                const offer = ld.offers || ld;
                if (offer.price) {
                    enriched.priceRaw = parseInt(String(offer.price).replace(/\D/g, ''), 10) || 0;
                    if (enriched.priceRaw > 0) enriched.price = `${enriched.priceRaw.toLocaleString('sv-SE')} kr`;
                }
                if (ld.image) {
                    const img = Array.isArray(ld.image) ? ld.image[0] : ld.image;
                    if (typeof img === 'string' && img.startsWith('http')) enriched.imageUrl = img;
                }
            } catch { /* ignore */ }
        }

        // Fallback price
        if (!enriched.priceRaw) {
            const pm = html.match(/Begärt pris[\s\S]*?([\d\s]+)\s*kr/i) || html.match(/Pris[\s\S]{0,50}?([\d\s]{5,})\s*kr/i);
            if (pm?.[1]) {
                enriched.priceRaw = parseInt(pm[1].replace(/\s/g, ''), 10) || 0;
                if (enriched.priceRaw > 0) enriched.price = `${enriched.priceRaw.toLocaleString('sv-SE')} kr`;
            }
        }

        // Avgift
        if (!enriched.avgift) {
            const am = html.match(/Avgift[\s\S]{0,50}?([\d\s]+)\s*kr/i);
            if (am?.[1]) enriched.avgift = am[1].trim() + ' kr/mån';
        }

        // Sqm
        if (!enriched.sqm) {
            const sm = html.match(/([\d,]+)\s*m²/);
            if (sm?.[1]) enriched.sqm = sm[1] + ' m²';
        }

        // Fallback image from bilder.hemnet.se
        if (!enriched.imageUrl) {
            const im = html.match(/https:\/\/bilder\.hemnet\.se\/[^"'\s]+/);
            if (im?.[0]) enriched.imageUrl = im[0];
        }

        if (enriched.imageUrl || enriched.priceRaw > 0) enriched.confidence = 'high';
        return enriched;
    } catch { /* best-effort */ }
    return listing;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "url"' });
    }

    try {
        let listing = parseHemnetUrl(url);
        listing = await enrichWithMetadata(listing);
        return res.status(200).json(listing);
    } catch (err: any) {
        return res.status(422).json({ error: err.message || 'Failed to parse listing' });
    }
}
