import index from "./index.html";
import {
    createUser,
    getUser,
    updateUser,
    createProperty,
    getProperty,
    findPropertyByBooliUrl,
    createAnalysis,
    getAnalysis,
    listAnalysesByUser,
    seedDemoData,
    updatePropertyBrfAnalysis,
    updateAnalysisGrade,
    updateAnalysisQuestions,
    updateAnalysisPaymentStatus,
    updatePropertyData,
    generateInviteCode,
    acceptInvite,
    getHouseholdInfo,
    createBid,
    listBids,
    createBidSession,
    getActiveBidSession,
    getBidSession,
    updateBidSessionStatus,
} from "./src/db/queries";
import { calculateKALP } from "./src/utils/kalp";
import { analyzeBrfPdf, getDemoResult } from "./src/utils/pdfAnalyzer";
import { fetchBooliListing } from "./src/utils/booliScraper";
import { findBrokerPdfs } from "./src/utils/brokerScraper";
import { generateAIQuestions } from "./src/utils/questionGenerator";
import { generateChatResponse } from "./src/utils/aiChat";

// JSON response helper
function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
    });
}

// Session cookie helpers
function setSessionCookie(userId: number): string {
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    return `niva_session=${userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function getSessionUserId(req: Request): number | null {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/niva_session=(\d+)/);
    return match ? parseInt(match[1]) : null;
}

// Parse JSON body helper
async function parseBody<T>(req: Request): Promise<T> {
    return req.json() as Promise<T>;
}

// Auth helper — returns user or 401 response
function requireAuth(req: Request): { user: import("./src/db/schema").User } | { error: Response } {
    const userId = getSessionUserId(req);
    if (!userId) return { error: json({ error: "Unauthorized" }, 401) };
    const user = getUser(userId);
    if (!user) return { error: json({ error: "Unauthorized" }, 401) };
    return { user };
}

const PORT = parseInt(process.env.PORT || "3002");

Bun.serve({
    port: PORT,
    hostname: "0.0.0.0", // Required for Docker/Railway — bind to all interfaces
    idleTimeout: 120, // BRF analysis can take 30-90s (PDF download + Gemini)
    routes: {
        // SPA entry
        "/": index,

        // ── User API ──────────────────────────────────────
        "/api/users": {
            POST: async (req) => {
                try {
                    const body = await parseBody<{
                        name: string;
                        email?: string;
                        income: number;
                        savings: number;
                        loan_promise: number;
                        debts?: number;
                        household_type: "solo" | "together";
                    }>(req);

                    const user = createUser(body);

                    // Seed demo data for new users
                    seedDemoData(user.id);

                    // Set session cookie
                    return json(user, 201, { "Set-Cookie": setSessionCookie(user.id) });
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        "/api/users/:id": {
            GET: (req) => {
                const id = parseInt(req.params.id);
                const user = getUser(id);
                if (!user) return json({ error: "User not found" }, 404);
                return json(user);
            },

            PUT: async (req) => {
                try {
                    const auth = requireAuth(req);
                    if ("error" in auth) return auth.error;

                    const id = parseInt(req.params.id);
                    // Users can only edit themselves
                    if (auth.user.id !== id) return json({ error: "Forbidden" }, 403);

                    const body = await parseBody<Partial<{
                        name: string;
                        income: number;
                        savings: number;
                        loan_promise: number;
                        debts: number;
                        household_type: "solo" | "together";
                    }>>(req);

                    const user = updateUser(id, body);
                    if (!user) return json({ error: "User not found" }, 404);
                    return json(user);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        // ── Session API ──────────────────────────────────────
        "/api/session": {
            GET: (req) => {
                const userId = getSessionUserId(req);
                if (!userId) return json({ user: null });
                const user = getUser(userId);
                if (!user) return json({ user: null });
                return json({ user });
            },

            DELETE: (_req) => {
                return json({ ok: true }, 200, {
                    "Set-Cookie": "niva_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
                });
            },
        },

        // ── Household API ─────────────────────────────────
        "/api/households/invite": {
            POST: async (req) => {
                try {
                    const { user_id } = await parseBody<{ user_id: number }>(req);
                    const code = generateInviteCode(user_id);
                    if (!code) return json({ error: "User not found" }, 404);
                    return json({ invite_code: code });
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        "/api/households/accept": {
            POST: async (req) => {
                try {
                    const { user_id, code } = await parseBody<{ user_id: number; code: string }>(req);
                    const result = acceptInvite(user_id, code);
                    if (!result.success) return json({ error: result.error }, 400);
                    return json({ partner: result.partner });
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        // ── Properties API ────────────────────────────────
        "/api/properties": {
            POST: async (req) => {
                try {
                    const body = await parseBody<{
                        address: string;
                        booli_url?: string;
                        area?: string;
                        asking_price: number;
                        sqm?: number;
                        fee?: number;
                        rooms?: number;
                        built_year?: number;
                        fair_value?: number;
                        brf_loan_per_sqm?: number;
                        brf_savings_per_sqm?: number;
                    }>(req);

                    const property = createProperty(body);
                    return json(property, 201);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        "/api/properties/:id": {
            GET: (req) => {
                const id = parseInt(req.params.id);
                const property = getProperty(id);
                if (!property) return json({ error: "Property not found" }, 404);
                return json(property);
            },
        },

        // ── Analyses API ──────────────────────────────────
        "/api/analyses": {
            GET: (req) => {
                const auth = requireAuth(req);
                if ("error" in auth) return auth.error;

                const analyses = listAnalysesByUser(auth.user.id);
                return json(analyses);
            },

            POST: async (req) => {
                try {
                    const body = await parseBody<{
                        user_id: number;
                        property_id: number;
                        payment_status?: "free" | "paid";
                        margin_result?: number;
                        grade?: string;
                    }>(req);

                    const analysis = createAnalysis(body);
                    return json(analysis, 201);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        "/api/analyses/:id": {
            GET: (req) => {
                const id = parseInt(req.params.id);
                const analysis = getAnalysis(id);
                if (!analysis) return json({ error: "Analysis not found" }, 404);
                return json(analysis);
            },
        },

        // ── Bids API ──────────────────────────────────────
        "/api/bids": {
            GET: (req) => {
                const url = new URL(req.url);
                const analysisId = parseInt(url.searchParams.get("analysis_id") || "0");
                if (!analysisId) return json({ error: "analysis_id query param required" }, 400);
                return json(listBids(analysisId));
            },

            POST: async (req) => {
                try {
                    const body = await parseBody<{
                        analysis_id: number;
                        amount: number;
                        margin?: number;
                        grade?: "green" | "yellow" | "red";
                    }>(req);
                    const bid = createBid(body);
                    return json(bid, 201);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        // ── Bid Sessions API ──────────────────────────────
        "/api/bid-sessions": {
            POST: async (req) => {
                try {
                    const { analysis_id } = await parseBody<{ analysis_id: number }>(req);
                    // Check for existing active session
                    const existing = getActiveBidSession(analysis_id);
                    if (existing) return json(existing);
                    const session = createBidSession(analysis_id);
                    return json(session, 201);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        "/api/bid-sessions/:id": {
            GET: (req) => {
                const id = parseInt(req.params.id);
                const session = getBidSession(id);
                if (!session) return json({ error: "Session not found" }, 404);
                return json(session);
            },

            PUT: async (req) => {
                try {
                    const id = parseInt(req.params.id);
                    const { status, max_bid } = await parseBody<{
                        status: "won" | "lost";
                        max_bid?: number;
                    }>(req);
                    const session = updateBidSessionStatus(id, status, max_bid);
                    if (!session) return json({ error: "Session not found" }, 404);
                    return json(session);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },

        // ── KALP Calculator API ──────────────────────────────
        "/api/calculate": {
            POST: async (req) => {
                try {
                    const body = await parseBody<{
                        monthlyIncome: number;
                        bidPrice: number;
                        ownFinancing: number;
                        interestRate: number;
                        brfFee: number;
                        existingDebts?: number;
                        livingCost?: number;
                        householdType: "solo" | "together";
                        grossAnnualIncome?: number;
                    }>(req);

                    const result = calculateKALP(body);
                    return json(result);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            },
        },
    },

    // SPA fallback — serve index.html for all non-API routes
    fetch(req) {
        const url = new URL(req.url);

        // ── Scrape Booli listing endpoint ──
        if (url.pathname === "/api/scrape-booli" && req.method === "POST") {
            const auth = requireAuth(req);
            if ("error" in auth) return auth.error;

            return (async () => {
                try {
                    const { url: booliUrl } = await parseBody<{ url: string }>(req);

                    if (!booliUrl) return json({ error: "Ange en Booli-länk" }, 400);
                    const user_id = auth.user.id;

                    // Scrape the listing
                    const listing = await fetchBooliListing(booliUrl);

                    // Note: asking_price may be 0 for listings published without a price ("Pris saknas")

                    // Reuse existing property or create new
                    const existing = listing.booli_url ? findPropertyByBooliUrl(listing.booli_url) : null;
                    const property = existing ?? createProperty({
                        booli_url: listing.booli_url,
                        broker_url: listing.broker_url || undefined,
                        address: listing.address,
                        area: listing.area,
                        asking_price: listing.asking_price,
                        sqm: listing.sqm ?? undefined,
                        fee: listing.fee ?? undefined,
                        rooms: listing.rooms ?? undefined,
                        built_year: listing.built_year ?? undefined,
                        fair_value: listing.fair_value ?? undefined,
                        image_url: listing.image_url ?? undefined,
                    });

                    // If reusing, update data in case listing changed
                    if (existing) {
                        updatePropertyData(existing.id, {
                            broker_url: listing.broker_url || undefined,
                            address: listing.address,
                            area: listing.area,
                            asking_price: listing.asking_price,
                            sqm: listing.sqm ?? undefined,
                            fee: listing.fee ?? undefined,
                            rooms: listing.rooms ?? undefined,
                            built_year: listing.built_year ?? undefined,
                            fair_value: listing.fair_value ?? undefined,
                            image_url: listing.image_url ?? undefined,
                        });
                    }

                    // Create analysis record
                    const analysis = createAnalysis({
                        user_id,
                        property_id: property.id,
                    });

                    // ── Auto-pipeline: BRF analysis + KALP (fire-and-forget, don't block response) ──
                    (async () => {
                        try {
                            // 1. Run BRF analysis
                            let brfResult;
                            try {
                                console.log("AUTO-PIPELINE TRIGGERED. Broker URL:", property.broker_url);
                                const docs = await findBrokerPdfs(property.broker_url || "");
                                console.log("Documents found in auto-pipeline:", docs.map(d => d.type));
                                const annualReport = docs.find(d => d.type === "annual_report");
                                if (annualReport) {
                                    console.log("Found annual_report, sending to Gemini:", annualReport.url);
                                    brfResult = await analyzeBrfPdf(annualReport.url);
                                } else {
                                    console.log("No annual_report found, falling back to demo");
                                    brfResult = getDemoResult(); // Fallback if no PDF found
                                }
                            } catch (e) {
                                console.error("Error analyzing PDF, falling back to demo data:", e);
                                brfResult = getDemoResult();
                            }

                            const loanPerSqm = typeof brfResult.brf_loan_per_sqm.value === "number"
                                ? brfResult.brf_loan_per_sqm.value : 0;
                            const savingsPerSqm = typeof brfResult.brf_savings_per_sqm.value === "number"
                                ? brfResult.brf_savings_per_sqm.value : 0;

                            updatePropertyBrfAnalysis(property.id, {
                                brf_loan_per_sqm: loanPerSqm,
                                brf_savings_per_sqm: savingsPerSqm,
                                brf_analysis_json: JSON.stringify(brfResult),
                            });

                            // 2. Compute KALP grade
                            const user = getUser(user_id);
                            if (user) {
                                const householdInfo = getHouseholdInfo(user_id);
                                const hasPartner = householdInfo?.partner != null;
                                const monthlyIncome = hasPartner ? householdInfo!.combined_income : (user.income ?? 35_000);
                                const debts = hasPartner ? householdInfo!.combined_debts : (user.debts ?? 0);
                                const kalpResult = calculateKALP({
                                    monthlyIncome,
                                    bidPrice: listing.asking_price,
                                    ownFinancing: Math.min(user.savings ?? 500_000, listing.asking_price),
                                    interestRate: 0.04,
                                    brfFee: listing.fee ?? 4_500,
                                    existingDebts: debts,
                                    householdType: hasPartner ? "together" : (user.household_type ?? "solo"),
                                    grossAnnualIncome: monthlyIncome * 14,
                                });

                                updateAnalysisGrade(analysis.id, kalpResult.grade, Math.round(kalpResult.margin));
                            }

                            // 3. Generate AI questions
                            const questions = await generateAIQuestions({
                                address: listing.address,
                                area: listing.area,
                                asking_price: listing.asking_price,
                                sqm: listing.sqm,
                                rooms: listing.rooms,
                                fee: listing.fee,
                                built_year: listing.built_year,
                                fair_value: listing.fair_value,
                                brf_loan_per_sqm: loanPerSqm,
                                brf_savings_per_sqm: savingsPerSqm,
                                brf_summary: brfResult.summary,
                            });
                            updateAnalysisQuestions(analysis.id, JSON.stringify(questions));
                        } catch (err) {
                            console.error("Auto-pipeline error:", err);
                        }
                    })();

                    return json({ analysis_id: analysis.id, property, analysis });
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            })();
        }

        // ── Update analysis payment status ──
        const paymentMatch = url.pathname.match(/^\/api\/analyses\/(\d+)\/payment$/);
        if (paymentMatch && req.method === "POST") {
            const auth = requireAuth(req);
            if ("error" in auth) return auth.error;

            const analysisId = parseInt(paymentMatch[1]);
            try {
                const analysis = getAnalysis(analysisId);
                if (!analysis) return json({ error: "Analysis not found" }, 404);
                if (analysis.user_id !== auth.user.id) return json({ error: "Forbidden" }, 403);

                updateAnalysisPaymentStatus(analysisId, "paid");
                return json({ ok: true, payment_status: "paid" });
            } catch (err: any) {
                return json({ error: err.message }, 400);
            }
        }

        // ── Refresh analysis endpoint (re-scrape + re-analyze) ──
        const refreshMatch = url.pathname.match(/^\/api\/analyses\/(\d+)\/refresh$/);
        if (refreshMatch && req.method === "POST") {
            const auth = requireAuth(req);
            if ("error" in auth) return auth.error;

            const analysisId = parseInt(refreshMatch[1]);
            return (async () => {
                try {
                    const analysis = getAnalysis(analysisId);
                    if (!analysis) return json({ error: "Analysis not found" }, 404);
                    if (analysis.user_id !== auth.user.id) return json({ error: "Forbidden" }, 403);

                    const booliUrl = analysis.booli_url;
                    if (!booliUrl) return json({ error: "Ingen Booli-länk att uppdatera" }, 400);

                    // Re-scrape
                    const listing = await fetchBooliListing(booliUrl);

                    // Update property data
                    updatePropertyData(analysis.property_id, {
                        address: listing.address,
                        area: listing.area,
                        asking_price: listing.asking_price,
                        sqm: listing.sqm ?? undefined,
                        fee: listing.fee ?? undefined,
                        rooms: listing.rooms ?? undefined,
                        built_year: listing.built_year ?? undefined,
                        fair_value: listing.fair_value ?? undefined,
                        image_url: listing.image_url ?? undefined,
                    });

                    // Re-run BRF analysis
                    let brfResult;
                    try {
                        console.log("REFRESH TRIGGERED for analysis", analysisId, "Broker URL:", listing.broker_url || analysis.broker_url);
                        const docs = await findBrokerPdfs(listing.broker_url || analysis.broker_url || "");
                        console.log("Documents found:", docs.map(d => d.type));
                        const annualReport = docs.find(d => d.type === "annual_report");
                        if (annualReport) {
                            console.log("Found annual_report, sending to Gemini:", annualReport.url);
                            brfResult = await analyzeBrfPdf(annualReport.url);
                        } else {
                            console.log("No annual_report found, falling back to demo");
                            brfResult = getDemoResult();
                        }
                    } catch (e) {
                        console.error("Error analyzing PDF during refresh, falling back to demo data:", e);
                        brfResult = getDemoResult();
                    }
                    const loanPerSqm = typeof brfResult.brf_loan_per_sqm.value === "number"
                        ? brfResult.brf_loan_per_sqm.value : 0;
                    const savingsPerSqm = typeof brfResult.brf_savings_per_sqm.value === "number"
                        ? brfResult.brf_savings_per_sqm.value : 0;

                    updatePropertyBrfAnalysis(analysis.property_id, {
                        brf_loan_per_sqm: loanPerSqm,
                        brf_savings_per_sqm: savingsPerSqm,
                        brf_analysis_json: JSON.stringify(brfResult),
                    });

                    // Re-compute KALP
                    const user = getUser(analysis.user_id);
                    if (user) {
                        const householdInfo = getHouseholdInfo(analysis.user_id);
                        const hasPartner = householdInfo?.partner != null;
                        const monthlyIncome = hasPartner ? householdInfo!.combined_income : (user.income ?? 35_000);
                        const debts = hasPartner ? householdInfo!.combined_debts : (user.debts ?? 0);
                        const kalpResult = calculateKALP({
                            monthlyIncome,
                            bidPrice: listing.asking_price,
                            ownFinancing: Math.min(user.savings ?? 500_000, listing.asking_price),
                            interestRate: 0.04,
                            brfFee: listing.fee ?? 4_500,
                            existingDebts: debts,
                            householdType: hasPartner ? "together" : (user.household_type ?? "solo"),
                            grossAnnualIncome: monthlyIncome * 14,
                        });
                        updateAnalysisGrade(analysisId, kalpResult.grade, Math.round(kalpResult.margin));
                    }

                    // Re-generate questions
                    const questions = await generateAIQuestions({
                        address: listing.address,
                        area: listing.area,
                        asking_price: listing.asking_price,
                        sqm: listing.sqm,
                        rooms: listing.rooms,
                        fee: listing.fee,
                        built_year: listing.built_year,
                        fair_value: listing.fair_value,
                        brf_loan_per_sqm: loanPerSqm,
                        brf_savings_per_sqm: savingsPerSqm,
                        brf_summary: brfResult.summary,
                    });
                    updateAnalysisQuestions(analysisId, JSON.stringify(questions));

                    // Return fresh analysis
                    const updated = getAnalysis(analysisId);
                    return json(updated);
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            })();
        }

        // ── Chat endpoint ──
        const chatMatch = url.pathname.match(/^\/api\/properties\/(\d+)\/chat$/);
        if (chatMatch && req.method === "POST") {
            const auth = requireAuth(req);
            if ("error" in auth) return auth.error;

            const id = parseInt(chatMatch[1]);
            return (async () => {
                try {
                    const analysis = getAnalysis(id);
                    if (!analysis) return json({ error: "Analysis not found" }, 404);
                    if (analysis.user_id !== auth.user.id) return json({ error: "Forbidden" }, 403);

                    const body = await parseBody(req) as any;
                    const messages = body.messages || [];

                    const brfData = analysis.brf_analysis_json ? JSON.parse(analysis.brf_analysis_json) : null;

                    const propertyContext = {
                        address: analysis.address,
                        asking_price: analysis.asking_price,
                        rooms: analysis.rooms,
                        sqm: analysis.sqm,
                        fee: analysis.fee,
                        brf_analysis: brfData
                    };

                    const response = await generateChatResponse(propertyContext, messages);

                    return json({ message: response });
                } catch (err: any) {
                    return json({ error: err.message }, 400);
                }
            })();
        }

        // ── Get broker documents ──
        const docsMatch = url.pathname.match(/^\/api\/properties\/(\d+)\/documents$/);
        if (docsMatch && req.method === "GET") {
            const id = parseInt(docsMatch[1]);
            const property = getProperty(id);
            if (!property) return json({ error: "Property not found" }, 404);

            return (async () => {
                if (!property.broker_url) {
                    return json({ documents: [] });
                }
                const docs = await findBrokerPdfs(property.broker_url);
                return json({ documents: docs });
            })();
        }

        // ── Analyze BRF endpoint (manual or auto URL) ──
        const brfMatch = url.pathname.match(/^\/api\/properties\/(\d+)\/analyze-pdf$/);
        if (brfMatch && req.method === "POST") {
            const auth = requireAuth(req);
            if ("error" in auth) return auth.error;

            const id = parseInt(brfMatch[1]);
            return (async () => {
                try {
                    const property = getProperty(id);
                    if (!property) return json({ error: "Property not found" }, 404);

                    let body: { pdf_url?: string; pdf_base64?: string } = {};
                    try { body = await parseBody(req); } catch { }

                    let result;
                    if (body.pdf_url) {
                        result = await analyzeBrfPdf(body.pdf_url); // We'll update pdfAnalyzer to handle URLs
                    } else if (body.pdf_base64) {
                        result = await analyzeBrfPdf(body.pdf_base64); // or Base64
                    } else {
                        // Demo fallback
                        result = getDemoResult();
                    }

                    const loanPerSqm = typeof result.brf_loan_per_sqm?.value === "number"
                        ? result.brf_loan_per_sqm.value : 0;
                    const savingsPerSqm = typeof result.brf_savings_per_sqm?.value === "number"
                        ? result.brf_savings_per_sqm.value : 0;

                    updatePropertyBrfAnalysis(id, {
                        brf_loan_per_sqm: loanPerSqm,
                        brf_savings_per_sqm: savingsPerSqm,
                        brf_analysis_json: JSON.stringify(result),
                    });

                    // Re-calculate KALP and Questions since BRF numbers changed
                    const analysis = listAnalysesByUser(auth.user.id).find(a => a.property_id === id);
                    if (analysis) {
                        const user = getUser(analysis.user_id);
                        if (user) {
                            const householdInfo = getHouseholdInfo(analysis.user_id);
                            const hasPartner = householdInfo?.partner != null;
                            const monthlyIncome = hasPartner ? householdInfo!.combined_income : (user.income ?? 35_000);
                            const debts = hasPartner ? householdInfo!.combined_debts : (user.debts ?? 0);
                            const kalpResult = calculateKALP({
                                monthlyIncome,
                                bidPrice: property.asking_price,
                                ownFinancing: Math.min(user.savings ?? 500_000, property.asking_price),
                                interestRate: 0.04,
                                brfFee: property.fee ?? 4_500,
                                existingDebts: debts,
                                householdType: hasPartner ? "together" : (user.household_type ?? "solo"),
                                grossAnnualIncome: monthlyIncome * 14,
                            });
                            updateAnalysisGrade(analysis.id, kalpResult.grade, Math.round(kalpResult.margin));

                            // Re-generate questions with new real data
                            const questions = await generateAIQuestions({
                                address: property.address,
                                area: property.area || "",
                                asking_price: property.asking_price,
                                sqm: property.sqm || null,
                                rooms: property.rooms || null,
                                fee: property.fee || null,
                                built_year: property.built_year || null,
                                fair_value: property.fair_value || null,
                                brf_loan_per_sqm: loanPerSqm,
                                brf_savings_per_sqm: savingsPerSqm,
                                brf_summary: result.summary,
                            });
                            updateAnalysisQuestions(analysis.id, JSON.stringify(questions));
                        }
                    }

                    return json(result);
                } catch (err: any) {
                    return json({ error: err.message }, 500);
                }
            })();
        }

        // ── Household info endpoint ──
        const householdMatch = url.pathname.match(/^\/api\/households\/(\d+)$/);
        if (householdMatch && req.method === "GET") {
            const userId = parseInt(householdMatch[1]);
            const info = getHouseholdInfo(userId);
            if (!info) return json({ error: "User not found" }, 404);
            return json(info);
        }

        if (url.pathname.startsWith("/api/")) {
            return json({ error: "Not found" }, 404);
        }
        // Serve static files from public/
        if (url.pathname.startsWith("/properties/")) {
            const filePath = `./public${url.pathname}`;
            const file = Bun.file(filePath);
            return new Response(file);
        }
        // Fall through to index.html for client-side routing
        return new Response(Bun.file("index.html"), {
            headers: { "Content-Type": "text/html" },
        });
    },

    development: {
        hmr: true,
        console: true,
    },
});

console.log(`Nivå server running at http://localhost:${PORT}`);
console.log("Database: data/niva.db");
