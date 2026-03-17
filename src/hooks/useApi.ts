// Lightweight API client for Nivå

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
}

// ── Session API ────────────────────────────────────

export function getSession(): Promise<{ user: UserData | null }> {
    return request("/session");
}

export function deleteSession(): Promise<{ ok: boolean }> {
    return request("/session", { method: "DELETE" });
}

// ── User API ────────────────────────────────────────

export interface UserData {
    id: number;
    email: string | null;
    name: string;
    income: number;
    savings: number;
    loan_promise: number;
    debts: number;
    household_type: "solo" | "together";
    partner_invite_code: string | null;
    partner_id: number | null;
    created_at: string;
}

export function createUser(data: {
    name: string;
    income: number;
    savings: number;
    loan_promise: number;
    debts?: number;
    household_type: "solo" | "together";
}): Promise<UserData> {
    return request("/users", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function getUser(id: number): Promise<UserData> {
    return request(`/users/${id}`);
}

export function updateUser(id: number, data: Partial<UserData>): Promise<UserData> {
    return request(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

// ── Household API ────────────────────────────────────

export interface HouseholdInfo {
    user: UserData;
    partner: UserData | null;
    combined_income: number;
    combined_savings: number;
    combined_loan_promise: number;
    combined_debts: number;
}

export function generateInviteCode(userId: number): Promise<{ invite_code: string }> {
    return request("/households/invite", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
    });
}

export function acceptInvite(userId: number, code: string): Promise<{ partner: UserData }> {
    return request("/households/accept", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, code }),
    });
}

export function getHouseholdInfo(userId: number): Promise<HouseholdInfo> {
    return request(`/households/${userId}`);
}

// ── Analysis API ────────────────────────────────────

export interface AnalysisData {
    id: number;
    user_id: number;
    property_id: number;
    payment_status: "free" | "paid";
    margin_result: number | null;
    grade: string | null;
    ai_questions_json: string | null;
    paid_at: string | null;
    address: string;
    area: string | null;
    asking_price: number;
    sqm: number | null;
    fee: number | null;
    rooms: number | null;
    built_year: number | null;
    fair_value: number | null;
    brf_loan_per_sqm: number | null;
    brf_savings_per_sqm: number | null;
    brf_analysis_json: string | null;
    image_url: string | null;
    booli_url: string | null;
    broker_url: string | null;
    created_at: string;
}

export interface BrokerDocument {
    name: string;
    url: string;
    type: "annual_report" | "bylaws" | "energy_declaration" | "economic_plan" | "other" | "unknown";
}

export function listAnalyses(): Promise<AnalysisData[]> {
    return request("/analyses");
}

export function getAnalysis(id: number): Promise<AnalysisData> {
    return request(`/analyses/${id}`);
}

export function getBrokerDocuments(propertyId: number): Promise<{ documents: BrokerDocument[] }> {
    return request(`/properties/${propertyId}/documents`);
}

export function analyzePdf(propertyId: number, data: { pdf_url?: string; pdf_base64?: string }): Promise<any> {
    return request(`/properties/${propertyId}/analyze-pdf`, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ── Booli Scraper API ────────────────────────────────

export function scrapeBooliListing(url: string): Promise<{ analysis_id: number }> {
    return request("/scrape-booli", {
        method: "POST",
        body: JSON.stringify({ url }),
    });
}

export function refreshAnalysis(analysisId: number): Promise<AnalysisData> {
    return request(`/analyses/${analysisId}/refresh`, { method: "POST" });
}

export function unlockAnalysis(analysisId: number): Promise<{ ok: boolean; payment_status: string }> {
    return request(`/analyses/${analysisId}/payment`, { method: "POST" });
}

// ── Bids API ────────────────────────────────────────

export interface BidData {
    id: number;
    analysis_id: number;
    amount: number;
    margin: number | null;
    grade: "green" | "yellow" | "red" | null;
    created_at: string;
}

export function createBid(data: {
    analysis_id: number;
    amount: number;
    margin?: number;
    grade?: "green" | "yellow" | "red";
}): Promise<BidData> {
    return request("/bids", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export function listBids(analysisId: number): Promise<BidData[]> {
    return request(`/bids?analysis_id=${analysisId}`);
}

// ── Bid Sessions API ────────────────────────────────

export interface BidSessionData {
    id: number;
    analysis_id: number;
    status: "active" | "won" | "lost";
    max_bid: number | null;
    started_at: string;
    ended_at: string | null;
}

export function createBidSession(analysisId: number): Promise<BidSessionData> {
    return request("/bid-sessions", {
        method: "POST",
        body: JSON.stringify({ analysis_id: analysisId }),
    });
}

export function updateBidSession(id: number, status: "won" | "lost", maxBid?: number): Promise<BidSessionData> {
    return request(`/bid-sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status, max_bid: maxBid }),
    });
}

// ── KALP Calculator API ────────────────────────────

export interface KALPResult {
    margin: number;
    grade: "green" | "yellow" | "red";
    gradeColor: string;
    loanAmount: number;
    ltv: number;
    interestCost: number;
    ränteavdrag: number;
    amortization: number;
    amortizationRate: number;
    livingCost: number;
    items: { label: string; amount: number; type: string }[];
}

export function calculateKALP(data: {
    monthlyIncome: number;
    bidPrice: number;
    ownFinancing: number;
    interestRate: number;
    brfFee: number;
    existingDebts?: number;
    livingCost?: number;
    householdType: "solo" | "together";
    grossAnnualIncome?: number;
}): Promise<KALPResult> {
    return request("/calculate", {
        method: "POST",
        body: JSON.stringify(data),
    });
}

// ── Chat API ────────────────────────────────────────

export async function chatWithAI(propertyId: string, messages: { role: string, content: string }[]): Promise<{ message: string }> {
    return request(`/properties/${propertyId}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages })
    });
}
