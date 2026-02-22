import index from "./frontend/index.html";
import path from "path";
import { parseHemnetUrl, enrichWithMetadata } from "./scraper";
import { scrapeBooliListing } from "./booli-scraper";

const server = Bun.serve({
    routes: {
        "/": index,
        "/images/*": async (req) => {
            const url = new URL(req.url);
            const filePath = path.join(import.meta.dir, "frontend", url.pathname);
            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file);
            }
            return new Response("Not found", { status: 404 });
        },
        "/api/scrape": {
            POST: async (req) => {
                try {
                    const body = await req.json() as { url?: string };
                    if (!body.url || typeof body.url !== 'string') {
                        return Response.json({ error: 'Missing or invalid "url" in request body' }, { status: 400 });
                    }

                    const parsedUrl = new URL(body.url);
                    const hostname = parsedUrl.hostname.replace('www.', '');

                    if (hostname === 'booli.se') {
                        // Booli: direct scrape (no Cloudflare)
                        const booliListing = await scrapeBooliListing(body.url);
                        // Normalize to common shape for frontend
                        return Response.json({
                            ...booliListing,
                            hemnetUrl: booliListing.booliUrl, // frontend uses hemnetUrl as the source URL
                            source: 'booli',
                        });
                    } else if (hostname === 'hemnet.se') {
                        // Hemnet: parse URL slug + enrich via proxy
                        let listing = parseHemnetUrl(body.url);
                        listing = await enrichWithMetadata(listing);
                        return Response.json({ ...listing, source: 'hemnet' });
                    } else {
                        return Response.json({ error: 'URL must be from hemnet.se or booli.se' }, { status: 400 });
                    }
                } catch (err: any) {
                    return Response.json({ error: err.message || 'Failed to parse listing' }, { status: 422 });
                }
            },
        },
    },
    development: {
        hmr: true,
    },
    port: 3000,
});

console.log(`Server running at ${server.url}`);
