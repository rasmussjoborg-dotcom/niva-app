#!/usr/bin/env bun
/**
 * scripts/audit-brokers.ts
 *
 * Broker compatibility audit for Swedish mäklare platforms.
 *
 * Usage:
 *   bun run scripts/audit-brokers.ts
 *
 * Fetches each URL in BROKER_URLS, attempts to extract standard property
 * fields (address, price, rooms, sqm, fee) via Cheerio, detects whether
 * the page is client-side rendered (CSR/empty HTML), and calls the
 * existing findBrokerPdfs() to check document discovery.
 *
 * Outputs a Markdown compatibility matrix to stdout.  Pipe to a file:
 *   bun run scripts/audit-brokers.ts > docs/broker-compatibility.md
 *
 * ── Updating test URLs ────────────────────────────────────────────────
 * Replace the `url` values in BROKER_URLS with live listing pages before
 * running.  The placeholder URLs will result in HTTP errors, which are
 * recorded in the matrix so you can track which platforms still need a
 * real test URL.
 * ─────────────────────────────────────────────────────────────────────
 */

import * as cheerio from "cheerio";
import { findBrokerPdfs } from "../src/utils/brokerScraper";

// ── Configuration ────────────────────────────────────────────────────

const TIMEOUT_MS = 15_000;

const USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ACCEPT_HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "sv,en-US;q=0.9,en;q=0.8",
};

// ── Broker test URLs ──────────────────────────────────────────────────
// Replace the `url` values with real live listing pages before running.
// Keep one URL per platform — ideally a bostadsrätt (apartment) listing
// so that fee/BRF data is present.

interface BrokerEntry {
    /** Human-readable brand name */
    name: string;
    /** Primary domain (used as key in the output table) */
    domain: string;
    /** Full URL to a live listing page */
    url: string;
    /** Pre-known limitations documented in the issue */
    knownIssues?: string;
}

const BROKER_URLS: BrokerEntry[] = [
    // ── Big Three ──────────────────────────────────────────────────
    {
        name: "Fastighetsbyrån",
        domain: "fastighetsbyran.se",
        url: "https://www.fastighetsbyran.se/bostad/sverige/objekt?objektid=placeholder",
    },
    {
        name: "Svensk Fastighetsförmedling",
        domain: "svenskfast.se",
        url: "https://www.svenskfast.se/bostad/placeholder/",
        knownIssues: "CSR - Next.js renders client-side; __NEXT_DATA__ may expose documents",
    },
    {
        name: "Bjurfors",
        domain: "bjurfors.se",
        url: "https://www.bjurfors.se/objekt/stockholm/placeholder/",
        knownIssues: "Has dedicated adapter",
    },

    // ── Tier 2 (national chains) ────────────────────────────────────
    {
        name: "Länsförsäkringar Fastighetsförmedling",
        domain: "lansfast.se",
        url: "https://www.lansfast.se/bostad/placeholder/",
        knownIssues: "Known: no docs",
    },
    {
        name: "Mäklarhuset",
        domain: "maklarhuset.se",
        url: "https://www.maklarhuset.se/bostad/placeholder/",
        knownIssues: "Known: no price",
    },
    {
        name: "HusmanHagberg",
        domain: "husmanhagberg.se",
        url: "https://www.husmanhagberg.se/fastigheter/placeholder/",
    },
    {
        name: "SkandiaMäklarna",
        domain: "skandiamaklarna.se",
        url: "https://www.skandiamaklarna.se/bostad/placeholder/",
    },
    {
        name: "Erik Olsson",
        domain: "erikolsson.se",
        url: "https://www.erikolsson.se/objekt/placeholder/",
        knownIssues: "Known CSR issue",
    },
    {
        name: "Notar",
        domain: "notar.se",
        url: "https://www.notar.se/objekt/placeholder/",
        knownIssues: "Known CSR issue",
    },
    {
        name: "Mäklarringen",
        domain: "maklarringen.se",
        url: "https://www.maklarringen.se/objekt/placeholder/",
        knownIssues: "Known: no docs/price",
    },

    // ── Stockholm / premium niche ────────────────────────────────────
    {
        name: "BOSTHLM / Fasad",
        domain: "bfrast.se",
        url: "https://www.bfrast.se/objekt/placeholder/",
        knownIssues: "Has dedicated adapter",
    },
    {
        name: "Alexander White",
        domain: "alexanderwhite.se",
        url: "https://www.alexanderwhite.se/objekt/placeholder/",
    },
    {
        name: "Wrede Fastighetsförmedling",
        domain: "wredefastighetsmakleri.se",
        url: "https://www.wredefastighetsmakleri.se/objekt/placeholder/",
    },
    {
        name: "Per Jansson",
        domain: "perjansson.se",
        url: "https://www.perjansson.se/objekt/placeholder/",
    },
    {
        name: "Fantastic Frank",
        domain: "fantasticfrank.se",
        url: "https://www.fantasticfrank.se/listing/placeholder/",
    },
    {
        name: "Eklund Stockholm New York",
        domain: "esny.se",
        url: "https://www.esny.se/objekt/placeholder/",
    },
    {
        name: "Residence",
        domain: "residencefastighetsmakleri.se",
        url: "https://www.residencefastighetsmakleri.se/objekt/placeholder/",
    },

    // ── Regional chains ──────────────────────────────────────────────
    {
        name: "Ludvig & Co",
        domain: "ludvigfast.se",
        url: "https://www.ludvigfast.se/bostad/placeholder/",
    },
    {
        name: "Stadshem",
        domain: "stadshem.se",
        url: "https://www.stadshem.se/annons/placeholder/",
    },
    {
        name: "Alvhem",
        domain: "alvhem.com",
        url: "https://www.alvhem.com/objekt/placeholder/",
    },
];

// ── Types ─────────────────────────────────────────────────────────────

interface FieldResults {
    address: boolean;
    price: boolean;
    rooms: boolean;
    sqm: boolean;
    fee: boolean;
    documents: boolean;
}

type AuditStatus = "ok" | "partial" | "csr" | "error" | "timeout" | "placeholder";

interface AuditResult extends BrokerEntry {
    status: AuditStatus;
    httpStatus?: number;
    fields: FieldResults;
    docCount: number;
    /** True when page body contains almost no text (CSR / SPA shell) */
    isCsr: boolean;
    notes: string[];
}

// ── Field detection helpers ───────────────────────────────────────────

/**
 * Heuristic patterns for Swedish real estate field detection.
 * Returns true if the field appears to be present in the parsed HTML.
 */
function detectFields($: cheerio.CheerioAPI): FieldResults {
    const bodyText = $("body").text();

    // ── address ──────────────────────────────────────────────────────
    // H1 tags on listing pages almost always contain the street address.
    // Also check for elements with class names containing "address" / "adress".
    const h1Text = $("h1").first().text().trim();
    const addressEl =
        $("[class*='address' i], [class*='adress' i], [itemprop='streetAddress']").first().text().trim();
    const address = h1Text.length > 4 || addressEl.length > 4;

    // ── price ─────────────────────────────────────────────────────────
    // Prices on Swedish sites appear as "3 500 000 kr" or "3 500 000 SEK".
    // Look for number groups followed by "kr" or currency words.
    const pricePattern = /\d[\d\s]+\s*(kr|sek|:-)/i;
    const priceEl = $(
        "[class*='price' i], [class*='pris' i], [itemprop='price'], [class*='utgångspris' i]"
    )
        .first()
        .text();
    const price = pricePattern.test(priceEl) || pricePattern.test(bodyText.slice(0, 5000));

    // ── rooms ─────────────────────────────────────────────────────────
    // Patterns: "3 rok", "3 rum", "3 room", "3 r.o.k"
    const roomsPattern = /\d\s*(rok|rum\b|room)/i;
    const rooms = roomsPattern.test(bodyText.slice(0, 8000));

    // ── sqm ───────────────────────────────────────────────────────────
    // Patterns: "72 m²", "72 kvm", "72 m2"
    const sqmPattern = /\d+[\d,.]?\s*(m²|kvm|m2)/i;
    const sqm = sqmPattern.test(bodyText.slice(0, 8000));

    // ── fee ───────────────────────────────────────────────────────────
    // Monthly fee patterns: "4 500 kr/mån", "avgift", "månadsavgift"
    const feePattern = /(avgift|månadsavgift|kr\/mån|kr\s*\/\s*mån)/i;
    const fee = feePattern.test(bodyText.slice(0, 8000));

    // ── documents — evaluated separately via findBrokerPdfs ──────────
    // Placeholder; filled in later with actual doc count.
    const documents = false;

    return { address, price, rooms, sqm, fee, documents };
}

/**
 * Detects whether a page is effectively CSR-empty:
 * - Body text is very short (< 300 visible chars after whitespace collapse), OR
 * - Common SPA root markers are empty (#app, #__next, #root with no children)
 */
function detectCsr($: cheerio.CheerioAPI): boolean {
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    if (bodyText.length < 300) return true;

    // SPA shell markers with no meaningful content
    const spaRoots = ["#__next", "#app", "#root", "[id='app']"];
    for (const selector of spaRoots) {
        const el = $(selector);
        if (el.length > 0 && el.text().replace(/\s+/g, " ").trim().length < 100) {
            return true;
        }
    }

    return false;
}

// ── Main audit logic ──────────────────────────────────────────────────

async function auditBroker(entry: BrokerEntry): Promise<AuditResult> {
    const base: AuditResult = {
        ...entry,
        status: "placeholder",
        fields: { address: false, price: false, rooms: false, sqm: false, fee: false, documents: false },
        docCount: 0,
        isCsr: false,
        notes: [],
    };

    // Skip placeholder URLs
    if (entry.url.includes("placeholder")) {
        base.notes.push("No live URL configured — update BROKER_URLS with a real listing");
        return base;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const response = await fetch(entry.url, {
            headers: ACCEPT_HEADERS,
            signal: controller.signal,
            redirect: "follow",
        });

        clearTimeout(timeoutId);
        base.httpStatus = response.status;

        if (!response.ok) {
            base.status = "error";
            base.notes.push(`HTTP ${response.status} ${response.statusText}`);
            return base;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        base.isCsr = detectCsr($);
        if (base.isCsr) {
            base.status = "csr";
            base.notes.push("CSR detected — page requires headless browser for field extraction");
        }

        // Extract fields from whatever HTML is available (even CSR shells
        // may embed JSON in <script> tags that contain some data).
        const fields = detectFields($);

        // Documents — use the existing scraper
        const docs = await findBrokerPdfs(entry.url);
        base.docCount = docs.length;
        fields.documents = docs.length > 0;

        base.fields = fields;

        if (!base.isCsr) {
            const missing = Object.entries(fields)
                .filter(([, v]) => !v)
                .map(([k]) => k);

            base.status = missing.length === 0 ? "ok" : "partial";
            if (missing.length > 0) {
                base.notes.push(`Missing fields: ${missing.join(", ")}`);
            }
        }
    } catch (err: unknown) {
        clearTimeout(timeoutId);
        if (err instanceof Error && err.name === "AbortError") {
            base.status = "timeout";
            base.notes.push(`Timed out after ${TIMEOUT_MS / 1000}s`);
        } else {
            base.status = "error";
            base.notes.push(err instanceof Error ? err.message : String(err));
        }
    }

    return base;
}

// ── Markdown output ───────────────────────────────────────────────────

function tick(v: boolean): string {
    return v ? "✓" : "✗";
}

function statusBadge(r: AuditResult): string {
    switch (r.status) {
        case "ok":          return "✅ OK";
        case "partial":     return "🟡 Partial";
        case "csr":         return "⚠️ CSR";
        case "error":       return "❌ Error";
        case "timeout":     return "⏱ Timeout";
        case "placeholder": return "🔲 No URL";
    }
}

function buildMarkdown(results: AuditResult[]): string {
    const now = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

    const lines: string[] = [
        "# Swedish Broker Compatibility Matrix",
        "",
        `> Generated: ${now}  `,
        `> Script: \`scripts/audit-brokers.ts\`  `,
        `> Platforms tested: ${results.length}`,
        "",
        "## Legend",
        "",
        "| Symbol | Meaning |",
        "|--------|---------|",
        "| ✅ OK | Generic scraper works — all fields found |",
        "| 🟡 Partial | Generic scraper works but some fields are missing |",
        "| ⚠️ CSR | Client-side rendered — headless browser needed |",
        "| ❌ Error | HTTP error or network failure |",
        "| ⏱ Timeout | Request exceeded 15 s |",
        "| 🔲 No URL | Placeholder URL — needs a real listing URL |",
        "| ✓ | Field detected |",
        "| ✗ | Field not found |",
        "",
        "## Compatibility Matrix",
        "",
        "| Platform | Domain | Status | Address | Price | Rooms | SQM | Fee | Docs | Notes |",
        "|----------|--------|--------|---------|-------|-------|-----|-----|------|-------|",
    ];

    for (const r of results) {
        const notes = [
            ...(r.knownIssues ? [`⚠️ ${r.knownIssues}`] : []),
            ...r.notes,
        ].join("; ") || "—";

        lines.push(
            `| ${r.name} | \`${r.domain}\` | ${statusBadge(r)} | ${tick(r.fields.address)} | ${tick(r.fields.price)} | ${tick(r.fields.rooms)} | ${tick(r.fields.sqm)} | ${tick(r.fields.fee)} | ${tick(r.fields.documents)} (${r.docCount}) | ${notes} |`
        );
    }

    // ── Summary section ──────────────────────────────────────────────
    const ok         = results.filter(r => r.status === "ok").length;
    const partial    = results.filter(r => r.status === "partial").length;
    const csr         = results.filter(r => r.status === "csr").length;
    const errors      = results.filter(r => r.status === "error" || r.status === "timeout").length;
    const noUrl       = results.filter(r => r.status === "placeholder").length;

    lines.push(
        "",
        "## Summary",
        "",
        `| Category | Count |`,
        `|----------|-------|`,
        `| ✅ Generic adapter works (all fields) | ${ok} |`,
        `| 🟡 Generic adapter works (some fields missing) | ${partial} |`,
        `| ⚠️ CSR — needs headless browser | ${csr} |`,
        `| ❌ Errors / timeouts | ${errors} |`,
        `| 🔲 No live URL configured | ${noUrl} |`,
        `| **Total** | **${results.length}** |`,
        "",
        "## Recommended Next Steps",
        "",
        "1. **CSR platforms** — Add Puppeteer / Playwright adapter or proxy through a headless render service.",
        "2. **Missing-field platforms** — Add a dedicated adapter in `src/utils/adapters/<domain>.ts`",
        "   that uses platform-specific CSS selectors / JSON endpoints.",
        "3. **Error platforms** — Re-test with a fresh live URL; some errors may be rate-limiting.",
        "4. **Placeholder rows** — Update `BROKER_URLS` in `scripts/audit-brokers.ts` with",
        "   real listing URLs and re-run the script.",
        "",
        "## Estimated Adapter Effort",
        "",
        "| Adapter type | Estimated effort |",
        "|--------------|-----------------|",
        "| Dedicated static-HTML adapter (known selectors) | 2–4 h |",
        "| Next.js `__NEXT_DATA__` extraction adapter | 1–2 h |",
        "| Headless-browser (Puppeteer) adapter | 4–8 h |",
        "| CSR platform + custom JSON API | 4–12 h |",
    );

    return lines.join("\n");
}

// ── Entry point ───────────────────────────────────────────────────────

async function main() {
    console.error(`Auditing ${BROKER_URLS.length} Swedish broker platforms…`);
    console.error("(progress logged to stderr; Markdown report written to stdout)\n");

    const results: AuditResult[] = [];

    for (const entry of BROKER_URLS) {
        process.stderr.write(`  → ${entry.name} (${entry.domain}) … `);
        const result = await auditBroker(entry);
        results.push(result);
        process.stderr.write(`${result.status}\n`);
    }

    console.error("\nDone. Writing Markdown report…\n");
    process.stdout.write(buildMarkdown(results) + "\n");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
