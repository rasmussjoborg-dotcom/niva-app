import * as cheerio from "cheerio";

export interface BrokerDocument {
    name: string;
    url: string;
    type: "annual_report" | "bylaws" | "energy_declaration" | "economic_plan" | "other" | "unknown";
}

/**
 * Ensures URL is absolute. If it's relative, prepends the broker baseUrl.
 */
function makeAbsoluteUrl(href: string, baseUrl: string): string {
    if (href.startsWith("http://") || href.startsWith("https://")) {
        return href;
    }
    if (href.startsWith("//")) {
        return `https:${href}`;
    }
    try {
        const base = new URL(baseUrl);
        if (href.startsWith("/")) {
            return `${base.origin}${href}`;
        }
        return `${base.origin}${base.pathname.replace(/\/[^/]*$/, "/")}${href}`;
    } catch {
        return href;
    }
}

/**
 * Attempts to categorize a document based on its link text or URL.
 */
function categorizeDocument(text: string, href: string): BrokerDocument["type"] {
    const combined = `${text} ${href}`.toLowerCase();

    if (combined.includes("årsredovisning") || combined.includes("arsredovisning") || combined.includes("annual")) {
        return "annual_report";
    }
    if (combined.includes("stadgar") || combined.includes("bylaws")) {
        return "bylaws";
    }
    if (combined.includes("energideklaration") || combined.includes("energy_declaration")) {
        return "energy_declaration";
    }
    if (combined.includes("ekonomisk plan") || combined.includes("ekonomisk_plan") || combined.includes("plan")) {
        return "economic_plan";
    }
    if (combined.includes("dokument") || combined.includes("bilaga") || href.includes(".pdf")) {
        return "other";
    }
    return "unknown";
}

/**
 * Scrapes a broker's property listing page to find PDF documents.
 * Employs generic DOM scanning with Cheerio and targeted Next.js data extraction.
 */
export async function findBrokerPdfs(brokerUrl: string): Promise<BrokerDocument[]> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(brokerUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                "Accept-Language": "sv,en-US;q=0.9,en;q=0.8"
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Failed to fetch broker URL: ${response.status} ${response.statusText}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const documents: BrokerDocument[] = [];
        const seenUrls = new Set<string>();

        const addDocument = (name: string, url: string) => {
            const absoluteUrl = makeAbsoluteUrl(url, brokerUrl);
            if (seenUrls.has(absoluteUrl)) return;
            seenUrls.add(absoluteUrl);

            // Clean up name (remove multiple spaces, tabs, newlines)
            const cleanName = name.replace(/\s+/g, " ").trim();

            documents.push({
                name: cleanName || "Dokument",
                url: absoluteUrl,
                type: categorizeDocument(cleanName, url),
            });
        };

        // Strategy 1: Check Next.js __NEXT_DATA__ (Svensk Fastighetsförmedling, etc)
        const nextDataScript = $("#__NEXT_DATA__").html();
        if (nextDataScript) {
            try {
                const nextData = JSON.parse(nextDataScript);

                // Deep search for any property named 'documents', 'files', or 'pdf'
                const findDocsInObject = (obj: any) => {
                    if (!obj || typeof obj !== 'object') return;

                    if (Array.isArray(obj)) {
                        obj.forEach(findDocsInObject);
                        return;
                    }

                    // Check common keys for documents
                    if (obj.documents && Array.isArray(obj.documents)) {
                        obj.documents.forEach((doc: any) => {
                            if (doc.url && doc.name) addDocument(doc.name, doc.url);
                        });
                    }
                    if (obj.files && Array.isArray(obj.files)) {
                        obj.files.forEach((file: any) => {
                            // SF pattern often looks like { Name: "Årsredovisning", Url: "/..." }
                            if (file.Url && file.Name) addDocument(file.Name, file.Url);
                            if (file.url && file.name) addDocument(file.name, file.url);
                        });
                    }
                    if (obj.documentUrl && obj.documentName) {
                        addDocument(obj.documentName, obj.documentUrl);
                    }

                    Object.values(obj).forEach(findDocsInObject);
                };

                findDocsInObject(nextData);
            } catch (e) {
                console.warn("Failed to parse Next.js data for PDFs", e);
            }
        }

        // Strategy 2: Check standard links in the DOM (Notar, Vitec, etc)
        // Find all links
        $("a").each((_, el) => {
            const $el = $(el);
            const href = $el.attr("href");
            if (!href) return;

            // Direct text of the link
            let text = $el.text().trim();

            // Notar puts the actual name in a preceding or parent element, and the link just says "Dokument"
            // Let's traverse up the tree to find text context if the link is generic
            if (text.toLowerCase() === "dokument" || text.toLowerCase() === "ladda ner" || text.toLowerCase() === "pdf" || text.toLowerCase() === "öppna" || !text) {
                // Try to find a heading in the same container, or text just before the link
                const parentText = $el.parent().text().trim();
                const precedingText = $el.prev().text().trim() || $el.parent().prev().text().trim();

                if (precedingText && precedingText !== text) {
                    text = precedingText.replace(/\(.*?\)/g, "").trim(); // Remove file sizes like (1.2 MB)
                } else if (parentText && parentText !== text) {
                    text = parentText.replace(text, "").replace(/\(.*?\)/g, "").trim() || text;
                }
            }

            const isPdf = href.toLowerCase().includes(".pdf");
            const isKnownDoc = /(årsredovisning|stadgar|energideklaration|ekonomisk plan)/i.test(text) || /(årsredovisning|stadgar|energideklaration|ekonomisk-plan)/i.test(href);

            if (isPdf || isKnownDoc) {
                addDocument(text, href);
            }
        });

        // Dedup by type (keep best match, especially for generic DOM vs JSON)
        // If we found JSON data, we usually don't need the DOM scraped ones as they might be duplicates with worse names

        return documents;
    } catch (err) {
        console.error("Error scraping broker PDFs:", err);
        return [];
    }
}
