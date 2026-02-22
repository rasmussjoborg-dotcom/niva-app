export interface PropertyDocument {
    title: string;
    url: string;
}

export interface AnalysisData {
    address: string;
    area: string;
    price: string;
    valuation: string;
    brf: string;
    marginal: string;
    imageUrl: string;
    unlocked: boolean;
    /* Extended fields from scrape */
    priceRaw?: number;
    avgift?: string;
    rooms?: string;
    sqm?: string;
    floor?: string;
    brfName?: string;
    constructionYear?: string;
    energyClass?: string;
    hemnetUrl?: string;       // Hemnet source URL
    booliUrl?: string;        // Booli source URL
    sourceUrl?: string;       // Generic source URL (either Hemnet or Booli)
    source?: 'hemnet' | 'booli';
    documents?: PropertyDocument[];
    /* Booli market valuation */
    estimatePrice?: number;
    estimateLow?: number;
    estimateHigh?: number;
    estimatePricePerSqm?: number;
}
