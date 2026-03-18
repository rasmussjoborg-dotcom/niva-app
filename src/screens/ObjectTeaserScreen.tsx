import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnalysis, analyzePdf, getBrokerDocuments, type BrokerDocument, refreshAnalysis as apiRefreshAnalysis, unlockAnalysis, createBid, listBids, getHouseholdInfo, type AnalysisData, type BidData, type HouseholdInfo } from "../hooks/useApi";
import { TopBar } from "../components/TopBar";
import { AnalysisLoadingScreen } from "../components/AnalysisLoadingScreen";
import { PaywallSheet } from "../components/PaywallSheet";
import { useUser } from "../App";
import { calculateKALP } from "../utils/kalp";
import { generateMäklarQuestions, type MäklarQuestion } from "../utils/mäklarKontakt";


function formatSEK(amount: number): string {
    return new Intl.NumberFormat("sv-SE").format(amount) + " kr";
}

function formatCompact(amount: number): string {
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace(".0", "") + " mkr";
    if (amount >= 1_000) return Math.round(amount / 1_000) + " tkr";
    return amount.toString();
}

function formatNumber(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function gradeClass(grade: string | null): string {
    if (!grade) return "";
    if (grade === "green") return "grade-b";
    if (grade === "yellow") return "grade-c";
    if (grade === "red") return "grade-d";
    const letter = grade.charAt(0).toLowerCase();
    if (letter === "a" || letter === "b") return "grade-b";
    if (letter === "c") return "grade-c";
    return "grade-d";
}

interface BrfField {
    value: number | string;
    page: number;
    context: string;
}

interface BrfAnalysis {
    brf_loan_per_sqm: BrfField;
    brf_savings_per_sqm: BrfField;
    rate_sensitivity: BrfField;
    summary: string;
    analyzed_at: string;
}

const TRAFFIC_COLORS: Record<string, string> = {
    green: "#3D7A3A",
    yellow: "#C49520",
    red: "#A93226",
};

const TRAFFIC_LABELS: Record<string, string> = {
    green: "Inom budget",
    yellow: "Nära gräns",
    red: "Överbudget",
};

function generateVerdict(analysis: AnalysisData): string {
    const g = analysis.grade;
    // Traffic-light grades from auto-pipeline
    if (g === "green") return "Föreningen visar starka nyckeltal och du har god marginal.";
    if (g === "yellow") return "Bostaden ligger nära din budget — värt att räkna noga.";
    if (g === "red") return "Bostaden kan bli en ekonomisk utmaning. Granska noggrant.";
    // Letter grades from demo/manual
    const l = g?.charAt(0).toUpperCase();
    if (l === "A") return "Föreningen visar starka nyckeltal. Lås upp för full genomgång.";
    if (l === "B") return "Övervägande positiva signaler. Se hela bilden i analysen.";
    if (l === "C") return "Blandade signaler — värt att titta närmare.";
    if (l === "D") return "Några flaggor att vara uppmärksam på.";
    return "Föreningen kräver extra granskning.";
}

export function ObjectTeaserScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [brfData, setBrfData] = useState<BrfAnalysis | null>(null);

    // Premium state — initialized from DB payment_status
    const [isPremium, setIsPremium] = useState<boolean>(false);

    // PDF Document State
    const [documents, setDocuments] = useState<BrokerDocument[]>([]);
    const [isFetchingDocs, setIsFetchingDocs] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState<{ url?: string; base64?: string } | null>(null);
    const [uploadError, setUploadError] = useState("");
    const [showPaywall, setShowPaywall] = useState(false);

    // Household state — combined KALP
    const [household, setHousehold] = useState<HouseholdInfo | null>(null);
    const [useHousehold, setUseHousehold] = useState(true); // default to household when partner exists

    // Merged Bud-Simulator state
    const [bid, setBid] = useState(3_000_000);
    const [ownFinancing, setOwnFinancing] = useState(500_000);
    const [interestRate, setInterestRate] = useState(4.0);
    const [calcSeeded, setCalcSeeded] = useState(false);
    const [simulations, setSimulations] = useState<BidData[]>([]);
    const [isSavingSim, setIsSavingSim] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [savedToast, setSavedToast] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!id) return;
        getAnalysis(parseInt(id))
            .then((data) => {
                setAnalysis(data);
                if (data.brf_analysis_json) {
                    try { setBrfData(JSON.parse(data.brf_analysis_json)); } catch { }
                }
                // Restore premium state from DB
                if (data.payment_status === "paid") {
                    setIsPremium(true);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    // Fetch household info
    useEffect(() => {
        if (!analysis?.user_id) return;
        getHouseholdInfo(analysis.user_id)
            .then((info) => {
                setHousehold(info);
                // Default to household mode if partner exists
                setUseHousehold(!!info?.partner);
            })
            .catch(() => { });
    }, [analysis?.user_id]);

    useEffect(() => {
        console.log("Checking fetching docs:", { propertyId: analysis?.property_id, brokerUrl: analysis?.broker_url, isPremium });
        if (analysis?.property_id && analysis?.broker_url) {
            console.log("Fetching docs from backend for property", analysis.property_id);
            setIsFetchingDocs(true);
            getBrokerDocuments(analysis.property_id)
                .then(res => {
                    console.log("Found docs:", res.documents);
                    setDocuments(res.documents || []);
                })
                .catch(err => console.error("Error fetching docs", err))
                .finally(() => setIsFetchingDocs(false));
        }
    }, [analysis?.property_id, analysis?.broker_url, isPremium]);

    // Load simulation history
    useEffect(() => {
        if (analysis) {
            listBids(analysis.id).then(setSimulations).catch(console.error);
        }
    }, [analysis]);

    // Seed calculator values from property data
    useEffect(() => {
        if (analysis && !calcSeeded) {
            setBid(analysis.asking_price || 3_000_000);
            setOwnFinancing(Math.min(user?.savings || 500_000, analysis.asking_price || 3_000_000));
            setCalcSeeded(true);
        }
    }, [analysis, calcSeeded]);

    // KALP calculation — at current bid
    const hasPartner = household?.partner != null;
    const monthlyIncome = (hasPartner && useHousehold) ? (household!.combined_income) : (user?.income ?? 35_000);
    const existingDebts = (hasPartner && useHousehold) ? (household!.combined_debts) : (user?.debts ?? 0);
    const brfFee = analysis?.fee ?? 4_500;
    const householdType = (hasPartner && useHousehold) ? "together" as const : (user?.household_type ?? "solo");
    const grossAnnualIncome = monthlyIncome * 14;

    const result = useMemo(() => calculateKALP({
        monthlyIncome,
        bidPrice: bid,
        ownFinancing,
        interestRate: interestRate / 100,
        brfFee,
        existingDebts,
        householdType,
        grossAnnualIncome,
    }), [bid, ownFinancing, interestRate, monthlyIncome, brfFee, existingDebts, householdType, grossAnnualIncome]);

    // KALP calculation — at asking price (for delta comparison)
    const baseResult = useMemo(() => calculateKALP({
        monthlyIncome,
        bidPrice: analysis?.asking_price || bid,
        ownFinancing,
        interestRate: interestRate / 100,
        brfFee,
        existingDebts,
        householdType,
        grossAnnualIncome,
    }), [analysis?.asking_price, ownFinancing, interestRate, monthlyIncome, brfFee, existingDebts, householdType, grossAnnualIncome]);

    const delta = result.margin - baseResult.margin;

    async function handleAnalyzeBrf() {
        if (!analysis) return;
        setAnalyzing(true);
        try {
            // Always persist payment status first — this must succeed
            await unlockAnalysis(analysis.id);
            const updated = await getAnalysis(analysis.id);
            setAnalysis(updated);
            setIsPremium(true);

            // Then attempt BRF analysis (optional — may fail if no PDF)
            try {
                if (!brfData || selectedPdf) {
                    const result = await analyzePdf(analysis.property_id, {
                        pdf_url: selectedPdf?.url,
                        pdf_base64: selectedPdf?.base64,
                    });
                    setBrfData(result);
                }
            } catch (pdfErr) {
                console.warn("BRF analysis skipped or failed:", pdfErr);
                // Premium is already unlocked — just no BRF data yet
            }
        } catch (err) {
            console.error("Payment unlock failed:", err);
            setUploadError("Betalningen kunde inte genomföras. Försök igen.");
        } finally {
            setTimeout(() => setAnalyzing(false), 1500);
        }
    }

    async function handleRefresh() {
        if (!analysis || refreshing) return;
        setRefreshing(true);
        try {
            const updated = await apiRefreshAnalysis(analysis.id);
            setAnalysis(updated);
            if (updated.brf_analysis_json) {
                try { setBrfData(JSON.parse(updated.brf_analysis_json)); } catch { }
            }
            setCalcSeeded(false); // Re-seed with new prices
        } catch (err) {
            console.error("Refresh failed:", err);
        } finally {
            setRefreshing(false);
        }
    }

    async function handleSaveSimulation() {
        if (!analysis || isSavingSim) return;
        setIsSavingSim(true);
        try {
            const sim = await createBid({
                analysis_id: analysis.id,
                amount: bid,
                margin: result.margin,
                grade: result.grade,
            });
            setSimulations(prev => [sim, ...prev]);
            setSavedToast(true);
            setTimeout(() => setSavedToast(false), 2500);
        } catch (err) {
            console.error("Failed to save simulation:", err);
        } finally {
            setIsSavingSim(false);
        }
    }

    if (loading) {
        return (
            <div className="screen">
                <div className="container" style={{ textAlign: "center", paddingTop: "var(--space-16)" }}>
                    <p className="body-sm" style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
                        Hämtar bostadsdata...
                    </p>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="screen">
                <div className="container">
                    <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Tillbaka</button>
                    <p style={{ marginTop: "var(--space-4)" }}>Analysen hittades inte.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="screen" style={{ background: "var(--color-bg)" }}>
                <TopBar
                    title={analysis.address}
                    rightAction={
                        (analysis as any).booli_url ? (
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                style={{
                                    background: "none",
                                    border: "none",
                                    padding: "var(--space-2)",
                                    marginRight: "-8px",
                                    color: refreshing ? "var(--color-text-muted)" : "var(--color-text-secondary)",
                                    cursor: refreshing ? "wait" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {refreshing ? (
                                    <div style={{
                                        width: 16, height: 16, borderRadius: "50%",
                                        border: "2px solid var(--color-border)",
                                        borderTopColor: "var(--color-gold)",
                                        animation: "spin 0.6s linear infinite",
                                    }} />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M1 4v6h6M23 20v-6h-6" />
                                        <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
                                    </svg>
                                )}
                            </button>
                        ) : undefined
                    }
                />

                {analyzing && <AnalysisLoadingScreen address={analysis.address} />}

                {analysis.image_url && (
                    <div style={{ position: "relative" }}>
                        <img
                            src={analysis.image_url}
                            alt={analysis.address}
                            style={{
                                width: "100%",
                                height: 260,
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                )}

                <div className="container" style={{ paddingTop: analysis.image_url ? "var(--space-5)" : "var(--space-4)" }}>

                    {/* Header */}
                    <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <h1 style={{
                                fontFamily: "var(--font-editorial)",
                                fontSize: "var(--font-size-2xl)",
                                fontWeight: 400,
                                lineHeight: 1.1,
                                margin: 0,
                                paddingBottom: analysis.area ? "4px" : "0"
                            }}>
                                {analysis.address}
                            </h1>
                            {analysis.area && <p className="body-sm" style={{ margin: 0, lineHeight: 1 }}>{analysis.area}</p>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0, paddingLeft: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <div style={{
                                fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                                letterSpacing: "0.06em", color: "var(--color-text-muted)",
                                marginBottom: "4px",
                            }}>Begärt pris</div>
                            <div style={{
                                fontFamily: "var(--font-body)", fontSize: "var(--font-size-lg)",
                                fontWeight: 700, fontVariantNumeric: "tabular-nums",
                                color: analysis.asking_price > 0 ? "var(--color-text-primary)" : "var(--color-text-muted)",
                                lineHeight: 1,
                            }}>
                                {analysis.asking_price > 0
                                    ? (analysis.asking_price >= 1_000_000
                                        ? (analysis.asking_price / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 3 }) + " milj"
                                        : new Intl.NumberFormat("sv-SE").format(analysis.asking_price) + " kr")
                                    : "Ej satt"}
                            </div>
                        </div>
                    </div>

                    {/* Price Insight Card — falls back to Booli estimate when no asking price */}
                    {analysis.fair_value && (() => {
                        const hasPrice = analysis.asking_price > 0;
                        const priceToCompare = hasPrice ? analysis.asking_price : 0;
                        const lowerBound = analysis.fair_value * 0.95;
                        const upperBound = analysis.fair_value * 1.05;

                        // When no asking price, show the estimate as a standalone card
                        if (!hasPrice) {
                            const estimateFormatted = analysis.fair_value >= 1_000_000
                                ? (analysis.fair_value / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 2 }) + " mkr"
                                : new Intl.NumberFormat("sv-SE").format(analysis.fair_value) + " kr";
                            const lowFormatted = new Intl.NumberFormat("sv-SE").format(Math.round(lowerBound)) + " kr";
                            const highFormatted = new Intl.NumberFormat("sv-SE").format(Math.round(upperBound)) + " kr";
                            return (
                                <div style={{
                                    background: "rgba(0,0,0,0.02)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-lg)",
                                    padding: "var(--space-4)",
                                    marginTop: 0,
                                    marginBottom: "var(--space-5)",
                                }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        marginBottom: "var(--space-3)",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-text-muted)", flexShrink: 0 }} />
                                            <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>Boolis värdering</span>
                                        </div>
                                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)", letterSpacing: "0.02em" }}>ESTIMAT</span>
                                    </div>
                                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", fontWeight: 500, lineHeight: 1.5, marginBottom: "var(--space-2)" }}>
                                        Booli värderar denna bostad till <strong>{estimateFormatted}</strong>
                                    </div>
                                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                                        Intervall: {lowFormatted} – {highFormatted}
                                    </div>
                                </div>
                            );
                        }

                        const isUnder = priceToCompare < lowerBound;
                        const isOver = priceToCompare > upperBound;
                        const isWithin = !isUnder && !isOver;

                        // Semantic color system
                        const tier = isWithin ? "neutral" : isUnder ? "good" : "warn";
                        const colors = {
                            good: { bg: "rgba(61, 122, 58, 0.05)", border: "rgba(61, 122, 58, 0.12)", text: "#3D7A3A", dot: "#3D7A3A" },
                            warn: { bg: "rgba(169, 50, 38, 0.05)", border: "rgba(169, 50, 38, 0.12)", text: "#A93226", dot: "#A93226" },
                            neutral: { bg: "rgba(0,0,0,0.02)", border: "var(--color-border)", text: "var(--color-text-secondary)", dot: "var(--color-text-muted)" },
                        }[tier];

                        const label = isOver
                            ? "Begärt pris ligger över estimerat intervall"
                            : isUnder
                                ? "Begärt pris ligger under estimerat intervall"
                                : "Begärt pris ligger inom estimerat intervall";

                        const diffText = isOver
                            ? `+${new Intl.NumberFormat("sv-SE").format(Math.round(priceToCompare - upperBound))} kr över övre gränsen`
                            : isUnder
                                ? `-${new Intl.NumberFormat("sv-SE").format(Math.round(lowerBound - priceToCompare))} kr under undre gränsen`
                                : "I linje med marknadssnittet";

                        return (
                            <div style={{
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: "var(--radius-lg)",
                                padding: "var(--space-4)",
                                marginTop: 0,
                                marginBottom: "var(--space-5)",
                            }}>
                                {/* Header row */}
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    marginBottom: "var(--space-3)",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                        <div style={{
                                            width: 8, height: 8, borderRadius: "50%",
                                            background: colors.dot, flexShrink: 0,
                                        }} />
                                        <span style={{
                                            fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                                            letterSpacing: "0.06em", color: "var(--color-text-muted)",
                                        }}>Prisanalys</span>
                                    </div>
                                    <span style={{
                                        fontSize: "11px", fontWeight: 700,
                                        color: colors.text,
                                        fontVariantNumeric: "tabular-nums",
                                        letterSpacing: "0.02em"
                                    }}>
                                        {isOver ? "HÖGT" : isUnder ? "LÅGT" : "INOM SPANN"}
                                    </span>
                                </div>

                                {/* Insight text */}
                                <div style={{
                                    fontSize: "var(--font-size-sm)",
                                    color: "var(--color-text-primary)",
                                    fontWeight: 500,
                                    lineHeight: 1.5,
                                    marginBottom: "var(--space-2)",
                                }}>
                                    {label}
                                </div>

                                {/* Price difference */}
                                <div style={{
                                    fontSize: "var(--font-size-xs)",
                                    color: "var(--color-text-muted)",
                                }}>
                                    {diffText}
                                </div>
                            </div>
                        );
                    })()}

                    {/* BRF ScoreCard — FREE */}
                    {analysis.grade && (
                        <div style={{
                            background: "white",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-5)",
                            marginBottom: "var(--space-5)",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-5)",
                        }}>
                            {/* Grade circle */}
                            {["green", "yellow", "red"].includes(analysis.grade || "") ? (
                                /* Traffic-light: colored dot */
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: analysis.grade === "green" ? "rgba(61, 122, 58, 0.1)"
                                        : analysis.grade === "yellow" ? "rgba(196, 149, 32, 0.1)"
                                            : "rgba(169, 50, 38, 0.1)",
                                }}>
                                    <div style={{
                                        width: 14, height: 14, borderRadius: "50%",
                                        background: analysis.grade === "green" ? "#3D7A3A"
                                            : analysis.grade === "yellow" ? "#C49520" : "#A93226",
                                    }} />
                                </div>
                            ) : (
                                /* Letter grade badge */
                                <div style={{
                                    width: 44, height: 44, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)",
                                    background: (() => {
                                        const l = analysis.grade?.charAt(0).toLowerCase();
                                        if (l === "a" || l === "b") return "rgba(61, 122, 58, 0.1)";
                                        if (l === "c") return "rgba(196, 149, 32, 0.1)";
                                        return "rgba(169, 50, 38, 0.1)";
                                    })(),
                                    color: (() => {
                                        const l = analysis.grade?.charAt(0).toLowerCase();
                                        if (l === "a" || l === "b") return "#3D7A3A";
                                        if (l === "c") return "#C49520";
                                        return "#A93226";
                                    })(),
                                }}>
                                    {analysis.grade}
                                </div>
                            )}

                            {/* Verdict + grade context */}
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: "var(--font-size-xs)",
                                    fontWeight: 600,
                                    textTransform: "uppercase" as const,
                                    letterSpacing: "0.06em",
                                    color: "var(--color-text-muted)",
                                    marginBottom: "var(--space-1)",
                                }}>
                                    Föreningsbetyg · {(() => {
                                        const g = analysis.grade;
                                        if (g === "green") return "Inom budget";
                                        if (g === "yellow") return "Nära gräns";
                                        if (g === "red") return "Över budget";
                                        const l = g?.charAt(0).toLowerCase();
                                        if (l === "a" || l === "b") return "Över genomsnittet";
                                        if (l === "c") return "Genomsnittlig";
                                        return "Under genomsnittet";
                                    })()}
                                </div>
                                <div style={{
                                    fontSize: "var(--font-size-sm)",
                                    color: "var(--color-text-secondary)",
                                    lineHeight: 1.5,
                                }}>
                                    {generateVerdict(analysis)}
                                </div>
                                {!isPremium ? (
                                    <div
                                        style={{
                                            fontSize: "var(--font-size-xs)",
                                            color: "var(--color-gold)",
                                            marginTop: "var(--space-2)",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => setShowPaywall(true)}
                                    >
                                        Lås upp fullständig analys
                                    </div>
                                ) : (
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "var(--space-2)",
                                        marginTop: "var(--space-2)",
                                        fontSize: "var(--font-size-xs)",
                                        color: "#3D7A3A",
                                        fontWeight: 500,
                                    }}>
                                        <span>✓</span>
                                        <span>Upplåst{analysis.paid_at ? ` · ${new Date(analysis.paid_at).toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric" })}` : ""}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Details — Om bostaden — FREE */}
                    <div className="card" style={{ marginBottom: "var(--space-5)" }}>
                        <div className="section-label">Om bostaden</div>
                        {(() => {
                            const icons: Record<string, string> = {
                                "Storlek": "◻", "Rum": "⊞", "Månadsavgift": "↻",
                                "Byggår": "⌂", "Pris per kvm": "▤", "Marginal": "△",
                            };
                            const rows = [
                                analysis.sqm ? { label: "Storlek", value: `${analysis.sqm}`, unit: "kvm" } : null,
                                analysis.rooms ? { label: "Rum", value: `${analysis.rooms}`, unit: "rum" } : null,
                                analysis.fee ? { label: "Månadsavgift", value: new Intl.NumberFormat("sv-SE").format(analysis.fee), unit: "kr/mån" } : null,
                                analysis.built_year ? { label: "Byggår", value: String(analysis.built_year), unit: "" } : null,
                                (analysis.sqm && analysis.asking_price > 0) ? { label: "Pris per kvm", value: new Intl.NumberFormat("sv-SE").format(Math.round(analysis.asking_price / analysis.sqm)), unit: "kr/kvm" } : null,
                                analysis.margin_result != null ? { label: "Marginal", value: new Intl.NumberFormat("sv-SE").format(analysis.margin_result), unit: "kr" } : null,
                            ].filter((x): x is { label: string; value: string; unit: string } => x !== null);

                            return rows.map((row) => (
                                <div key={row.label} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)", width: 16, textAlign: "center", opacity: 0.6 }}>{icons[row.label] || "·"}</span>
                                        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>{row.label}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                        <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--font-size-sm)", fontVariantNumeric: "tabular-nums", color: "var(--color-text-primary)" }}>{row.value}</span>
                                        {row.unit && <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 400 }}>{row.unit}</span>}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* ═══════════════════════════════════════════════════════
                    DOCUMENT SOURCING — Hybrid UI
                   ═══════════════════════════════════════════════════════ */}
                    <div className="card" style={{ marginBottom: "var(--space-5)" }}>
                        <div className="section-label">Källdata för analys</div>
                        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)", lineHeight: 1.5 }}>
                            Nivås AI drar sina slutsatser och identifierar risker baserat exklusivt på föreningens årsredovisning.
                        </p>

                        {isFetchingDocs ? (
                            <div style={{
                                fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", padding: "var(--space-4)",
                                textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)",
                                background: "var(--color-surface)", borderRadius: "var(--radius-md)"
                            }}>
                                <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-gold)", animation: "spin 0.6s linear infinite" }} />
                                Söker efter dokument hos mäklaren...
                            </div>
                        ) : (
                            <div style={{
                                display: "flex", flexDirection: "column", gap: "var(--space-2)",
                                marginBottom: "var(--space-4)"
                            }}>
                                {[
                                    { type: "annual_report", label: "Årsredovisning", isPrimary: true },
                                    { type: "bylaws", label: "Stadgar", isPrimary: false },
                                    { type: "energy_declaration", label: "Energideklaration", isPrimary: false },
                                ].map((targetDoc, i) => {
                                    const foundDoc = documents.find(d => d.type === targetDoc.type);
                                    const isFound = !!foundDoc;
                                    // Primary interaction is for annual_report to trigger paywall/pdf select
                                    const isPressable = targetDoc.type === "annual_report";

                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                padding: "var(--space-3)",
                                                width: "100%",
                                                background: isFound ? "rgba(61, 122, 58, 0.05)" : "rgba(0,0,0,0.02)",
                                                border: "1px solid",
                                                borderColor: isFound ? "rgba(61, 122, 58, 0.12)" : "var(--color-border)",
                                                borderRadius: "var(--radius-md)",
                                                opacity: 1, // Keep high opacity to read the missing state
                                            }}>
                                            <div style={{ marginRight: "var(--space-3)", opacity: isFound ? 0.7 : 0.4, display: "flex", alignItems: "center" }}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <path d="M14 2v6h6"></path>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <line x1="10" y1="9" x2="8" y2="9"></line>
                                                </svg>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, opacity: isFound ? 1 : 0.6 }}>
                                                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--color-text-primary)" }}>
                                                    {isFound ? foundDoc.name : targetDoc.label}
                                                </span>
                                            </div>
                                            {isFound ? (
                                                <div style={{
                                                    marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center",
                                                    width: 24, height: 24, borderRadius: "50%", background: "rgba(61, 122, 58, 0.1)", color: "#3D7A3A"
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    marginLeft: "auto", display: "flex", alignItems: "center", justifyContent: "center",
                                                    padding: "2px 8px", borderRadius: "12px", background: "rgba(0,0,0,0.05)", color: "var(--color-text-secondary)",
                                                    fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em"
                                                }}>
                                                    Saknas
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Checklist badges to clearly show what we got */}


                        {/* Manual upload fallback conditionally hidden when we have all standard docs */}
                        {(!documents.some(d => d.type === "annual_report") || !documents.some(d => d.type === "bylaws") || !documents.some(d => d.type === "energy_declaration")) && !isFetchingDocs && (
                            <div style={{
                                border: "1px dashed var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                padding: "var(--space-4)",
                                textAlign: "center",
                                background: "rgba(0,0,0,0.02)"
                            }}>
                                <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 500, marginBottom: "var(--space-2)" }}>
                                    {documents.filter(d => d.type === "annual_report").length > 0 ? "Saknas föreningsdokument?" : "Kunde inte hitta årsredovisningen"}
                                </div>
                                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-3)" }}>
                                    Ladda upp en årsredovisning manuellt för att starta AI-analysen.
                                </div>
                                <label className="btn btn-secondary" style={{ cursor: "pointer", display: "inline-flex" }}>
                                    Välj PDF-fil
                                    <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.type !== "application/pdf") {
                                            setUploadError("Endast PDF-filer stöds.");
                                            return;
                                        }
                                        setUploadError("");
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const base64 = (reader.result as string).split(',')[1];
                                            setSelectedPdf({ base64 });
                                            setShowPaywall(true);
                                        };
                                        reader.readAsDataURL(file);
                                    }} />
                                </label>
                                {uploadError && <div style={{ color: "var(--color-red)", fontSize: "var(--font-size-xs)", marginTop: "var(--space-2)" }}>{uploadError}</div>}
                            </div>
                        )}
                    </div>
                    {/* ═══════════════════════════════════════════════════════
                    PREMIUM GATE — Showcase + Frosted Teasers
                   ═══════════════════════════════════════════════════════ */}
                    {!isPremium ? (
                        <>
                            {/* Premium Showcase Card */}
                            <div className="premium-showcase" style={{ marginBottom: "var(--space-5)" }}>
                                <div className="premium-showcase-header">
                                    <div className="premium-showcase-title">Lås upp djupanalys</div>
                                    <div className="premium-badge">Premium</div>
                                </div>
                                <div className="premium-showcase-subtitle">
                                    Tre AI-drivna verktyg som ger dig ett strategiskt övertag i bostadsaffären.
                                </div>

                                <div className="premium-feature-list">
                                    {[
                                        { label: "Föreningens ekonomi", desc: "AI-analyserad årsredovisning" },
                                        { label: "Frågor till mäklaren", desc: "Riskbaserade kontrollfrågor" },
                                        { label: "Bud-Simulator", desc: "Konsekvensanalys i realtid" },
                                    ].map((f) => (
                                        <div key={f.label} className="premium-feature-item">
                                            <span className="premium-feature-label">{f.label}</span>
                                            <span className="premium-feature-desc">{f.desc}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    className="btn-unlock"
                                    onClick={() => setShowPaywall(true)}
                                    style={{ width: "100%", minHeight: 48 }}
                                >
                                    Lås upp — 99 kr
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* ═══ PREMIUM UNLOCKED: Föreningens ekonomi ═══ */}
                            {brfData && (
                                <div className="card" style={{ marginBottom: "var(--space-5)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                                        <div className="section-label" style={{ margin: 0 }}>
                                            {((brfData as any).brf_name || "Föreningens ekonomi").toUpperCase()}
                                        </div>
                                        <span className="premium-badge">✦ AI-analys</span>
                                    </div>

                                    {(() => {
                                        const loanVal = typeof brfData.brf_loan_per_sqm.value === "number" ? brfData.brf_loan_per_sqm.value : 0;
                                        const saveVal = typeof brfData.brf_savings_per_sqm.value === "number" ? brfData.brf_savings_per_sqm.value : 0;
                                        const metrics = [
                                            { label: "Skuldsättning", value: loanVal ? new Intl.NumberFormat("sv-SE").format(loanVal) : String(brfData.brf_loan_per_sqm.value), unit: "kr/kvm", health: loanVal <= 5000 ? "good" : loanVal <= 10000 ? "ok" : "warn" },
                                            { label: "Sparande", value: saveVal ? new Intl.NumberFormat("sv-SE").format(saveVal) : String(brfData.brf_savings_per_sqm.value), unit: "kr/kvm/år", health: saveVal >= 1500 ? "good" : saveVal >= 800 ? "ok" : "warn" },
                                            {
                                                label: "Räntekänslighet",
                                                value: String(brfData.rate_sensitivity?.value || "0").match(/\d+/)?.[0] || "0",
                                                unit: "kr/kvm vid +1%",
                                                health: (() => {
                                                    const parsed = parseInt(String(brfData.rate_sensitivity?.value || "0").replace(/[^0-9]/g, "") || "0");
                                                    return parsed <= 200 ? "good" : parsed <= 500 ? "ok" : "warn";
                                                })(),
                                            },
                                        ];
                                        const healthColors: Record<string, string> = { good: "#3D7A3A", ok: "#C49520", warn: "#A93226" };

                                        return metrics.map((m) => (
                                            <div key={m.label} style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: healthColors[m.health], flexShrink: 0, opacity: 0.85 }} />
                                                    <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>{m.label}</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--font-size-sm)", fontVariantNumeric: "tabular-nums", color: "var(--color-text-primary)" }}>{m.value}</span>
                                                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontWeight: 400 }}>{m.unit}</span>
                                                </div>
                                            </div>
                                        ));
                                    })()}

                                    {brfData.summary && (
                                        <div style={{ marginTop: "var(--space-4)", padding: "var(--space-3) var(--space-4)", background: "rgba(193, 163, 104, 0.06)", borderRadius: "var(--radius-md)" }}>
                                            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", lineHeight: 1.55, margin: 0 }}>
                                                {brfData.summary}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        style={{
                                            width: "100%",
                                            marginTop: "var(--space-4)",
                                            minHeight: 48,
                                            background: "rgba(197, 160, 89, 0.12)",
                                            color: "var(--color-gold)",
                                            border: "none",
                                            borderRadius: "var(--radius-full)",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.08em",
                                            fontWeight: 600,
                                            fontSize: "var(--font-size-sm)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "4px"
                                        }}
                                        onClick={() => navigate(`/analys/${id}/chat`)}
                                    >
                                        ✦ Fråga AI-experten
                                    </button>
                                </div>
                            )}

                            {/* ═══ PREMIUM UNLOCKED: Frågor till mäklaren ═══ */}
                            {brfData && <QuestionBank analysis={analysis} />}

                            {/* ═══ PREMIUM UNLOCKED: Merged Bud-Simulator ═══ */}
                            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                                    <div className="section-label" style={{ margin: 0 }}>Bud-Simulator</div>
                                    <span className="premium-badge">✦ Interaktiv</span>
                                </div>

                                {/* ① HERO RESULT — Kvar i plånboken (top of card) */}
                                <div style={{
                                    padding: "var(--space-4) var(--space-5)",
                                    borderRadius: "var(--radius-md)",
                                    background: "var(--color-bg)",
                                    border: "1px solid var(--color-border)",
                                    marginBottom: "var(--space-4)",
                                    textAlign: "center",
                                }}>
                                    <div style={{
                                        fontSize: "var(--font-size-xs)", fontWeight: 600,
                                        textTransform: "uppercase", letterSpacing: "0.06em",
                                        color: "var(--color-text-muted)", marginBottom: "var(--space-2)",
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
                                    }}>
                                        Kvar i plånboken
                                        {hasPartner && useHousehold && (
                                            <span style={{
                                                fontSize: "9px",
                                                fontWeight: 700,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.08em",
                                                color: "#3D7A3A",
                                                background: "rgba(61, 122, 58, 0.1)",
                                                padding: "2px 6px",
                                                borderRadius: "var(--radius-sm)",
                                            }}>Hushåll</span>
                                        )}
                                    </div>
                                    <div style={{
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-2)",
                                    }}>
                                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: result.gradeColor, flexShrink: 0, boxShadow: `0 0 6px ${result.gradeColor}30` }} />
                                        <span style={{
                                            fontSize: "28px", fontWeight: 700,
                                            fontVariantNumeric: "tabular-nums", color: result.gradeColor,
                                            fontFamily: "var(--font-body)",
                                            transition: "color 0.3s ease",
                                        }}>
                                            {result.margin >= 0 ? "+" : ""}{formatSEK(result.margin)}
                                        </span>
                                    </div>
                                    {/* Inline delta when bidding above asking */}
                                    {bid !== analysis.asking_price && (
                                        <div style={{
                                            fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)",
                                            marginTop: "var(--space-2)",
                                        }}>
                                            {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}{new Intl.NumberFormat("sv-SE").format(delta)} kr vs utgångspris
                                            <span style={{ marginLeft: "var(--space-2)", fontWeight: 600, color: result.gradeColor }}>
                                                {TRAFFIC_LABELS[result.grade] || ""}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Household toggle (only when partner linked) */}
                                {hasPartner && (
                                    <div style={{
                                        display: "flex",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid var(--color-border)",
                                        overflow: "hidden",
                                        marginBottom: "var(--space-4)",
                                    }}>
                                        {(["solo", "household"] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => setUseHousehold(mode === "household")}
                                                style={{
                                                    flex: 1,
                                                    padding: "var(--space-2) var(--space-3)",
                                                    fontSize: "var(--font-size-xs)",
                                                    fontWeight: 600,
                                                    border: "none",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    background: (mode === "household" ? useHousehold : !useHousehold)
                                                        ? "var(--color-text)" : "transparent",
                                                    color: (mode === "household" ? useHousehold : !useHousehold)
                                                        ? "white" : "var(--color-text-muted)",
                                                }}
                                            >
                                                {mode === "solo" ? "Enskild" : "Hushåll"}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* ② PRIMARY INPUT — Bid controls */}
                                <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                                    {/* Reset to asking price */}
                                    <button
                                        onClick={() => setBid(analysis.asking_price)}
                                        style={{
                                            width: 40, height: 40, flexShrink: 0,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            background: bid === analysis.asking_price ? "var(--color-midnight)" : "var(--color-bg)",
                                            color: bid === analysis.asking_price ? "white" : "var(--color-text-secondary)",
                                            border: bid === analysis.asking_price ? "1px solid var(--color-midnight)" : "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-full)",
                                            fontSize: "16px", cursor: "pointer", transition: "all 0.15s ease",
                                        }}
                                        title="Återställ till utgångspris"
                                    >
                                        ↺
                                    </button>
                                    {[
                                        { label: "+5 %", amount: Math.round(analysis.asking_price * 1.05) },
                                        { label: "+10 %", amount: Math.round(analysis.asking_price * 1.10) },
                                        { label: "+15 %", amount: Math.round(analysis.asking_price * 1.15) },
                                    ].map(({ label, amount }) => {
                                        const isActive = bid === amount;
                                        return (
                                            <button
                                                key={label}
                                                onClick={() => setBid(amount)}
                                                style={{
                                                    flex: 1, padding: "var(--space-2) 0",
                                                    background: isActive ? "var(--color-midnight)" : "var(--color-bg)",
                                                    color: isActive ? "white" : "var(--color-text-secondary)",
                                                    border: isActive ? "1px solid var(--color-midnight)" : "1px solid var(--color-border)",
                                                    borderRadius: "var(--radius-full)",
                                                    fontSize: "var(--font-size-xs)", fontWeight: 600, fontFamily: "var(--font-body)",
                                                    cursor: "pointer", transition: "all 0.15s ease",
                                                }}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                <CompactSlider label="Ditt bud" value={bid} min={1_000_000} max={user?.loan_promise || 8_000_000} step={50_000} format={formatCompact} onChange={setBid} />

                                {/* ③ SUB-CARD: Justera ränta & finansiering */}
                                <div style={{
                                    marginTop: "var(--space-4)",
                                    background: "var(--color-bg)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-lg)",
                                    overflow: "hidden",
                                }}>
                                    <button
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                        style={{
                                            width: "100%", padding: "var(--space-3) var(--space-4)",
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            fontSize: "var(--font-size-xs)", fontWeight: 600,
                                            color: "var(--color-text-muted)", textTransform: "uppercase",
                                            letterSpacing: "0.06em",
                                            cursor: "pointer",
                                            background: "none", border: "none", fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        <span>Justera ränta & finansiering</span>
                                        <span style={{
                                            transition: "transform 0.2s ease",
                                            transform: showAdvanced ? "rotate(180deg)" : "rotate(0)",
                                            fontSize: "10px",
                                        }}>▼</span>
                                    </button>

                                    {showAdvanced && (
                                        <div style={{
                                            display: "flex", flexDirection: "column", gap: "var(--space-4)",
                                            padding: "0 var(--space-4) var(--space-4)",
                                        }}>
                                            <CompactSlider label="Egen finansiering" value={ownFinancing} min={0} max={Math.min(bid, user?.savings || 2_000_000)} step={25_000} format={formatCompact} onChange={setOwnFinancing} />
                                            <CompactSlider label="Förväntad ränta" value={interestRate} min={1.0} max={8.0} step={0.1} format={(v) => v.toFixed(1) + " %"} onChange={setInterestRate} />
                                        </div>
                                    )}
                                </div>

                                {/* ④ SUB-CARD: Månadsöversikt */}
                                <div style={{
                                    marginTop: "var(--space-3)",
                                    background: "var(--color-bg)",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-lg)",
                                    overflow: "hidden",
                                }}>
                                    <button
                                        onClick={() => setShowBreakdown(!showBreakdown)}
                                        style={{
                                            width: "100%", padding: "var(--space-3) var(--space-4)",
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            fontSize: "var(--font-size-xs)", fontWeight: 600,
                                            color: "var(--color-text-muted)", textTransform: "uppercase",
                                            letterSpacing: "0.06em", cursor: "pointer",
                                            background: "none", border: "none", fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        <span>Månadsöversikt</span>
                                        <span style={{ transition: "transform 0.2s ease", transform: showBreakdown ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                                    </button>

                                    {showBreakdown && (
                                        <div style={{ padding: "0 var(--space-4) var(--space-4)" }}>
                                            {result.items.map((item, i) => (
                                                <div key={i} style={{
                                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                                    padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)",
                                                }}>
                                                    <span style={{
                                                        fontSize: "var(--font-size-sm)",
                                                        fontWeight: item.type === "income" ? 600 : 400,
                                                        color: item.type === "income" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                                                    }}>{item.label}</span>
                                                    <span style={{
                                                        fontSize: "var(--font-size-sm)", fontWeight: 600, fontVariantNumeric: "tabular-nums",
                                                        color: item.type === "deduction" ? "var(--color-green)" : item.type === "income" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                                                    }}>
                                                        {item.amount >= 0 ? "+" : ""}{formatSEK(item.amount)}
                                                    </span>
                                                </div>
                                            ))}

                                            {/* Loan info */}
                                            <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                                {[
                                                    { label: "Lånebelopp", value: formatSEK(result.loanAmount) },
                                                    { label: "Belåningsgrad", value: Math.round(result.ltv * 100) + " %" },
                                                    { label: "Amorteringskrav", value: result.amortizationRate + " %" },
                                                ].map((row) => (
                                                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                                                        <span>{row.label}</span>
                                                        <span style={{ fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ⑤ SAVE — Spara simulering */}
                                <button
                                    onClick={handleSaveSimulation}
                                    disabled={isSavingSim}
                                    style={{
                                        width: "100%", padding: "var(--space-3)",
                                        marginTop: "var(--space-4)",
                                        background: "var(--color-midnight)", color: "white",
                                        border: "none", borderRadius: "var(--radius-md)",
                                        fontSize: "var(--font-size-sm)", fontWeight: 700, fontFamily: "var(--font-body)",
                                        cursor: "pointer", opacity: isSavingSim ? 0.6 : 1,
                                        transition: "opacity 0.2s ease",
                                    }}
                                >
                                    {savedToast ? "✓ Sparad!" : isSavingSim ? "Sparar..." : "Spara till mina scenarier"}
                                </button>

                                {/* Simulation History */}
                                {simulations.length > 0 && (
                                    <div style={{ marginTop: "var(--space-5)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-4)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
                                            <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-muted)" }}>Simuleringshistorik</span>
                                            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{simulations.length} scenarier</span>
                                        </div>
                                        {simulations.map((sim, i) => (
                                            <div key={sim.id} style={{
                                                display: "flex", alignItems: "center", gap: "var(--space-3)",
                                                padding: "var(--space-3) 0",
                                                borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                                            }}>
                                                <div style={{
                                                    width: 10, height: 10, borderRadius: "50%",
                                                    background: sim.grade ? TRAFFIC_COLORS[sim.grade] : "var(--color-border)", flexShrink: 0,
                                                }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "var(--color-text-primary)" }}>
                                                        {formatSEK(sim.amount)}
                                                    </div>
                                                </div>
                                                {sim.margin !== null && (
                                                    <span style={{
                                                        fontSize: "var(--font-size-xs)", fontVariantNumeric: "tabular-nums", fontWeight: 600,
                                                        color: sim.grade ? TRAFFIC_COLORS[sim.grade] : "var(--color-text-muted)",
                                                    }}>
                                                        {sim.margin > 0 ? "+" : ""}{formatSEK(sim.margin)}/mån
                                                    </span>
                                                )}
                                                <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontVariantNumeric: "tabular-nums" }}>
                                                    {new Date(sim.created_at).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {/* Kontakta mäklaren CTA */}
                    <button
                        onClick={() => window.open("tel:", "_self")}
                        style={{
                            width: "100%",
                            padding: "var(--space-3)",
                            marginTop: "var(--space-5)",
                            background: "white",
                            color: "var(--color-text-primary)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-lg)",
                            fontSize: "var(--font-size-sm)",
                            fontWeight: 600,
                            fontFamily: "var(--font-body)",
                            cursor: "pointer",
                        }}
                    >
                        Kontakta mäklaren
                    </button>
                </div>
            </div>

            {/* Paywall Bottom Sheet */}
            <PaywallSheet
                isOpen={showPaywall}
                address={analysis.address}
                onClose={() => setShowPaywall(false)}
                onPaymentComplete={handleAnalyzeBrf}
            />


        </>
    );
}

// ═══ Compact Slider ═══════════════════════════════════
interface CompactSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
    onChange: (v: number) => void;
}

function CompactSlider({ label, value, min, max, step, format, onChange }: CompactSliderProps) {
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

    return (
        <div>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
                marginBottom: "var(--space-1)",
            }}>
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>{label}</span>
                <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>{format(value)}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={{
                    width: "100%", height: 4, appearance: "none", WebkitAppearance: "none",
                    borderRadius: "var(--radius-full)", outline: "none", cursor: "pointer",
                    background: `linear-gradient(to right, var(--color-midnight) 0%, var(--color-midnight) ${pct}%, var(--color-stone) ${pct}%, var(--color-stone) 100%)`,
                }}
            />
            <div style={{
                display: "flex", justifyContent: "space-between",
                marginTop: "var(--space-1)",
            }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{format(min)}</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{format(max)}</span>
            </div>
        </div>
    );
}

// ═══ AI Question Bank ═══════════════════════════════════
function QuestionBank({ analysis }: { analysis: AnalysisData }) {
    const questions = useMemo(() => {
        // Prefer stored AI-generated questions
        if ((analysis as any).ai_questions_json) {
            try {
                const parsed = JSON.parse((analysis as any).ai_questions_json);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch { /* Fall through to rule-based */ }
        }
        // Fallback: rule-based generation
        return generateMäklarQuestions({
            brf_loan_per_sqm: analysis.brf_loan_per_sqm ?? null,
            brf_savings_per_sqm: analysis.brf_savings_per_sqm ?? null,
            brf_analysis_json: analysis.brf_analysis_json ?? null,
        });
    }, [analysis]);

    const [expanded, setExpanded] = useState(false);

    if (questions.length === 0) return null;

    const CATEGORY_COLORS: Record<string, string> = {
        ekonomi: "#C49520",
        underhåll: "#3D7A3A",
        risk: "#A93226",
    };

    const CATEGORY_LABELS: Record<string, string> = {
        ekonomi: "Ekonomi",
        underhåll: "Underhåll",
        risk: "Riskfaktor",
    };

    function openSmsWithQuestion(question: string) {
        const body = encodeURIComponent(`Hej, jag har en fråga angående ${analysis.address}:\n\n${question}`);
        window.open(`sms:?body=${body}`, "_self");
    }

    const visibleQuestions = expanded ? questions : questions.slice(0, 3);

    return (
        <div style={{
            background: "white",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: "var(--space-5)",
            padding: "var(--space-4) var(--space-5)",
        }}>
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginBottom: "var(--space-4)",
            }}>
                <div className="section-label" style={{ margin: 0 }}>Frågor till mäklaren</div>
                <span className="premium-badge">✦ AI-genererade</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {visibleQuestions.map((q, i) => (
                    <div
                        key={i}
                        style={{
                            display: "block", width: "100%", textAlign: "left",
                            padding: "var(--space-3) var(--space-4)",
                            background: "rgba(193, 163, 104, 0.06)",
                            border: "none", borderRadius: "var(--radius-md)",
                            fontFamily: "var(--font-body)",
                        }}
                    >
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            marginBottom: "var(--space-2)",
                        }}>
                            <span style={{
                                display: "inline-block", padding: "2px 8px", borderRadius: "var(--radius-full)",
                                background: "var(--color-text-primary)", color: "var(--color-surface)",
                                fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em",
                            }}>
                                {CATEGORY_LABELS[q.category] || "Övrigt"}
                            </span>
                        </div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", lineHeight: 1.55 }}>
                            {q.question}
                        </div>
                        <button
                            onClick={() => openSmsWithQuestion(q.question)}
                            style={{
                                marginTop: "var(--space-4)",
                                width: "100%",
                                minHeight: 44,
                                background: "transparent",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-md)",
                                fontSize: "var(--font-size-sm)",
                                fontWeight: 600,
                                color: "var(--color-text-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                            </svg>
                            Fråga mäklaren
                        </button>
                    </div>
                ))}
            </div>

            {questions.length > 3 && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{
                        width: "100%",
                        marginTop: "var(--space-3)",
                        background: "none",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                        padding: "var(--space-2)",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 500,
                        color: "var(--color-text-secondary)",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                    }}
                >
                    {expanded ? "Visa färre frågor" : `Visa fler frågor (${questions.length - 3})`}
                </button>
            )}
        </div>
    );
}
