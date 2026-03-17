import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../App";
import {
    getAnalysis,
    createBid,
    listBids,
    createBidSession,
    updateBidSession,
    calculateKALP,
    type AnalysisData,
    type BidData,
    type BidSessionData,
    type KALPResult,
} from "../hooks/useApi";

function formatCurrency(n: number): string {
    return n.toLocaleString("sv-SE") + " kr";
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

const TRAFFIC_COLORS: Record<string, string> = {
    green: "#3D7A3A",
    yellow: "#C49520",
    red: "#A93226",
};

export function NivaLiveScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();

    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [session, setSession] = useState<BidSessionData | null>(null);
    const [bids, setBids] = useState<BidData[]>([]);
    const [currentBid, setCurrentBid] = useState("");
    const [kalpResult, setKalpResult] = useState<KALPResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load analysis data and start session
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const a = await getAnalysis(parseInt(id));
                setAnalysis(a);
                setCurrentBid(a.asking_price.toString());

                const s = await createBidSession(a.id);
                setSession(s);

                const b = await listBids(a.id);
                setBids(b);

                // Initial KALP calculation
                if (user) {
                    const result = await calculateKALP({
                        monthlyIncome: user.income,
                        bidPrice: a.asking_price,
                        ownFinancing: user.savings,
                        interestRate: 0.04,
                        brfFee: a.fee || 4000,
                        existingDebts: user.debts,
                        householdType: user.household_type,
                    });
                    setKalpResult(result);
                }
            } catch (err) {
                console.error("Failed to load:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, user]);

    // Recalculate KALP when bid changes
    const recalculate = useCallback(async (bidAmount: number) => {
        if (!user || !analysis) return;
        try {
            const result = await calculateKALP({
                monthlyIncome: user.income,
                bidPrice: bidAmount,
                ownFinancing: user.savings,
                interestRate: 0.04,
                brfFee: analysis.fee || 4000,
                existingDebts: user.debts,
                householdType: user.household_type,
            });
            setKalpResult(result);
        } catch { }
    }, [user, analysis]);

    // Debounced bid recalculation
    useEffect(() => {
        const parsed = parseInt(currentBid.replace(/\s/g, ""));
        if (!parsed || parsed <= 0) return;
        const timer = setTimeout(() => recalculate(parsed), 300);
        return () => clearTimeout(timer);
    }, [currentBid, recalculate]);

    async function handlePlaceBid() {
        const amount = parseInt(currentBid.replace(/\s/g, ""));
        if (!amount || !analysis || !kalpResult || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const bid = await createBid({
                analysis_id: analysis.id,
                amount,
                margin: kalpResult.margin,
                grade: kalpResult.grade,
            });
            setBids(prev => [bid, ...prev]);
        } catch (err) {
            console.error("Failed to place bid:", err);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleEndSession(result: "won" | "lost") {
        if (!session) return;
        const maxBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : undefined;
        try {
            await updateBidSession(session.id, result, maxBid);
            navigate(`/analys/${id}/resultat?status=${result}`);
        } catch (err) {
            console.error("Failed to end session:", err);
        }
    }

    if (loading) {
        return (
            <div style={{
                height: "var(--device-height)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1A1F24",
                color: "white",
                fontFamily: "var(--font-body)",
            }}>
                Startar Nivå Live...
            </div>
        );
    }

    if (!analysis) return null;

    const grade = kalpResult?.grade || "yellow";
    const trafficColor = TRAFFIC_COLORS[grade];

    // Calculate max affordable bid (where margin ~ 0)
    const maxBidEstimate = user
        ? Math.round((user.income * 12 * 4.5) * 0.85)
        : analysis.asking_price * 1.1;

    return (
        <div style={{
            height: "var(--device-height)",
            display: "flex",
            flexDirection: "column",
            background: "#1A1F24",
            color: "white",
            overflow: "hidden",
        }}>
            {/* Dark TopBar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}>
                <button
                    onClick={() => navigate(`/analys/${id}`)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: "var(--font-size-sm)",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Tillbaka
                </button>
                <span style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.4)",
                }}>
                    Nivå Live
                </span>
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#3D7A3A",
                    boxShadow: "0 0 6px #3D7A3A",
                    animation: "pulse 2s infinite",
                }} />
            </div>

            {/* Property info */}
            <div style={{
                padding: "var(--space-4) var(--space-5)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
                <div style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    marginBottom: 2,
                }}>
                    {analysis.address}
                </div>
                <div style={{
                    fontSize: "var(--font-size-xs)",
                    color: "rgba(255,255,255,0.4)",
                }}>
                    {analysis.area} &middot; Utgångspris {formatCurrency(analysis.asking_price)}
                </div>
            </div>

            {/* Main bidding area */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--space-5)",
                gap: "var(--space-5)",
            }}>
                {/* Traffic Light */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "var(--space-3)",
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        background: trafficColor,
                        boxShadow: `0 0 40px ${trafficColor}60, 0 0 80px ${trafficColor}30`,
                        transition: "all 0.5s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <span style={{
                            fontSize: "var(--font-size-lg)",
                            fontWeight: 700,
                        }}>
                            {grade === "green" ? "OK" : grade === "yellow" ? "!" : "X"}
                        </span>
                    </div>
                    <div style={{
                        fontSize: "var(--font-size-xs)",
                        color: "rgba(255,255,255,0.4)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                    }}>
                        {grade === "green" ? "Inom budget" : grade === "yellow" ? "Nära gräns" : "Överbudget"}
                    </div>
                </div>

                {/* Current bid input */}
                <div style={{
                    width: "100%",
                    textAlign: "center",
                }}>
                    <label style={{
                        display: "block",
                        fontSize: "var(--font-size-xs)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "rgba(255,255,255,0.3)",
                        marginBottom: "var(--space-2)",
                    }}>
                        Nuvarande bud
                    </label>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={currentBid}
                        onChange={(e) => setCurrentBid(e.target.value.replace(/[^\d\s]/g, ""))}
                        style={{
                            width: "100%",
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-4) var(--space-5)",
                            fontSize: "32px",
                            fontFamily: "var(--font-editorial)",
                            fontWeight: 400,
                            color: "white",
                            textAlign: "center",
                            outline: "none",
                            fontVariantNumeric: "tabular-nums",
                            transition: "border-color 0.2s ease",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "rgba(255,255,255,0.3)"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
                    />
                </div>

                {/* Margin display */}
                {kalpResult && (
                    <div style={{
                        display: "flex",
                        gap: "var(--space-5)",
                        justifyContent: "center",
                    }}>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "var(--font-size-xs)",
                                color: "rgba(255,255,255,0.3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: 4,
                            }}>
                                Kvar i plånboken
                            </div>
                            <div style={{
                                fontSize: "var(--font-size-xl)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                                fontVariantNumeric: "tabular-nums",
                                color: trafficColor,
                            }}>
                                {formatCurrency(kalpResult.margin)}
                            </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <div style={{
                                fontSize: "var(--font-size-xs)",
                                color: "rgba(255,255,255,0.3)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: 4,
                            }}>
                                Ditt takpris
                            </div>
                            <div style={{
                                fontSize: "var(--font-size-xl)",
                                fontWeight: 700,
                                fontFamily: "var(--font-body)",
                                fontVariantNumeric: "tabular-nums",
                                color: "white",
                            }}>
                                {formatCurrency(maxBidEstimate)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Place bid button */}
                <button
                    onClick={handlePlaceBid}
                    disabled={isSubmitting}
                    style={{
                        width: "100%",
                        padding: "var(--space-4)",
                        background: "white",
                        color: "#1A1F24",
                        border: "none",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 700,
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                        opacity: isSubmitting ? 0.6 : 1,
                        transition: "opacity 0.2s ease",
                    }}
                >
                    {isSubmitting ? "Registrerar..." : "Lägg bud"}
                </button>
            </div>

            {/* Bidding History (Budgivningslogg) */}
            <div style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                maxHeight: 180,
                overflow: "auto",
            }}>
                <div style={{
                    padding: "var(--space-3) var(--space-5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}>
                    <span style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "rgba(255,255,255,0.4)",
                    }}>
                        Budgivningslogg
                    </span>
                    <span style={{
                        fontSize: "var(--font-size-xs)",
                        color: "rgba(255,255,255,0.25)",
                    }}>
                        {bids.length} bud
                    </span>
                </div>

                {bids.length === 0 ? (
                    <div style={{
                        padding: "var(--space-3) var(--space-5) var(--space-4)",
                        fontSize: "var(--font-size-xs)",
                        color: "rgba(255,255,255,0.2)",
                        textAlign: "center",
                    }}>
                        Inga bud registrerade
                    </div>
                ) : (
                    <div style={{ padding: "0 var(--space-5) var(--space-4)" }}>
                        {bids.map((bid, i) => (
                            <div key={bid.id} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                                padding: "var(--space-2) 0",
                                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                            }}>
                                {/* Timeline dot */}
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: bid.grade ? TRAFFIC_COLORS[bid.grade] : "rgba(255,255,255,0.2)",
                                    flexShrink: 0,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        fontSize: "var(--font-size-sm)",
                                        fontWeight: 600,
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {formatCurrency(bid.amount)}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: "var(--font-size-xs)",
                                    color: "rgba(255,255,255,0.3)",
                                    fontVariantNumeric: "tabular-nums",
                                }}>
                                    {bid.margin !== null && (
                                        <span style={{ color: bid.grade ? TRAFFIC_COLORS[bid.grade] : undefined, marginRight: 8 }}>
                                            {bid.margin > 0 ? "+" : ""}{formatCurrency(bid.margin)}
                                        </span>
                                    )}
                                    {formatTime(bid.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* End session buttons */}
            <div style={{
                padding: "var(--space-3) var(--space-5) var(--space-5)",
                display: "flex",
                gap: "var(--space-3)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
            }}>
                <button
                    onClick={() => handleEndSession("won")}
                    style={{
                        flex: 1,
                        padding: "var(--space-3)",
                        background: "rgba(61, 122, 58, 0.15)",
                        color: "#3D7A3A",
                        border: "1px solid rgba(61, 122, 58, 0.3)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Vunnen
                </button>
                <button
                    onClick={() => handleEndSession("lost")}
                    style={{
                        flex: 1,
                        padding: "var(--space-3)",
                        background: "rgba(169, 50, 38, 0.15)",
                        color: "#A93226",
                        border: "1px solid rgba(169, 50, 38, 0.3)",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                    }}
                >
                    Förlorad
                </button>
            </div>
        </div>
    );
}
