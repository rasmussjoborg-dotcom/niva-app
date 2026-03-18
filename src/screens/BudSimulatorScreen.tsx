import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../App";
import { TopBar } from "../components/TopBar";
import { ContactActionBar } from "../components/ContactActionBar";
import {
    getAnalysis,
    createBid,
    listBids,
    getHouseholdInfo,
    calculateKALP,
    type AnalysisData,
    type BidData,
    type KALPResult,
    type HouseholdInfo,
} from "../hooks/useApi";

function formatCurrency(n: number): string {
    return n.toLocaleString("sv-SE") + " kr";
}

function formatDelta(n: number): string {
    const prefix = n > 0 ? "+" : "";
    return prefix + n.toLocaleString("sv-SE") + " kr/mån";
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

const TRAFFIC_LABELS: Record<string, string> = {
    green: "Inom budget",
    yellow: "Nära gräns",
    red: "Överbudget",
};

export function BudSimulatorScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useUser();

    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [household, setHousehold] = useState<HouseholdInfo | null>(null);
    const [simulations, setSimulations] = useState<BidData[]>([]);
    const [simulatedBid, setSimulatedBid] = useState("");
    const [currentResult, setCurrentResult] = useState<KALPResult | null>(null);
    const [simulatedResult, setSimulatedResult] = useState<KALPResult | null>(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Determine financial basis (solo or household)
    const income = household?.combined_income ?? user?.income ?? 0;
    const savings = household?.combined_savings ?? user?.savings ?? 0;
    const householdType = user?.household_type ?? "solo";

    // Load analysis and household data
    useEffect(() => {
        if (!id || !user) return;
        (async () => {
            try {
                const a = await getAnalysis(parseInt(id));
                setAnalysis(a);
                setSimulatedBid(a.asking_price.toString());

                // Load household info if "Ihop"
                if (user.household_type === "together") {
                    const h = await getHouseholdInfo(user.id);
                    setHousehold(h);
                }

                // Load past simulations
                const b = await listBids(a.id);
                setSimulations(b);
            } catch (err) {
                console.error("Failed to load:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, user]);

    // Calculate current state (at asking price)
    useEffect(() => {
        if (!analysis || !user) return;
        (async () => {
            try {
                const result = await calculateKALP({
                    monthlyIncome: income,
                    bidPrice: analysis.asking_price,
                    ownFinancing: savings,
                    interestRate: 0.04,
                    brfFee: analysis.fee || 4000,
                    existingDebts: user.debts,
                    householdType,
                });
                setCurrentResult(result);
            } catch { }
        })();
    }, [analysis, user, income, savings, householdType]);

    // Recalculate simulated state when bid changes
    const recalculate = useCallback(async (bidAmount: number) => {
        if (!user || !analysis) return;
        try {
            const result = await calculateKALP({
                monthlyIncome: income,
                bidPrice: bidAmount,
                ownFinancing: savings,
                interestRate: 0.04,
                brfFee: analysis.fee || 4000,
                existingDebts: user.debts,
                householdType,
            });
            setSimulatedResult(result);
        } catch { }
    }, [user, analysis, income, savings, householdType]);

    // Debounced recalculation
    useEffect(() => {
        const parsed = parseInt(simulatedBid.replace(/\s/g, ""));
        if (!parsed || parsed <= 0) return;
        const timer = setTimeout(() => recalculate(parsed), 300);
        return () => clearTimeout(timer);
    }, [simulatedBid, recalculate]);

    // Save simulation to history
    async function handleSaveSimulation() {
        const amount = parseInt(simulatedBid.replace(/\s/g, ""));
        if (!amount || !analysis || !simulatedResult || isSimulating) return;

        setIsSimulating(true);
        try {
            const sim = await createBid({
                analysis_id: analysis.id,
                amount,
                margin: simulatedResult.margin,
                grade: simulatedResult.grade,
            });
            setSimulations(prev => [sim, ...prev]);
        } catch (err) {
            console.error("Failed to save simulation:", err);
        } finally {
            setIsSimulating(false);
        }
    }

    if (loading) {
        return (
            <div style={{
                minHeight: "100dvh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--color-bg)",
                fontFamily: "var(--font-body)",
                color: "var(--color-text-muted)",
            }}>
                Laddar simulator...
            </div>
        );
    }

    if (!analysis) return null;

    const delta = currentResult && simulatedResult
        ? simulatedResult.margin - currentResult.margin
        : 0;

    const simGrade = simulatedResult?.grade ?? "yellow";
    const simColor = TRAFFIC_COLORS[simGrade];

    const labelStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-text-muted)",
        marginBottom: "var(--space-2)",
        display: "block",
    };

    const valueStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xl)",
        fontWeight: 700,
        fontFamily: "var(--font-body)",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1.2,
    };

    return (
        <div className="screen" style={{ background: "var(--color-bg)" }}>
            <TopBar title="Bud-Simulator" />

            <div className="container" style={{ paddingTop: "var(--space-4)" }}>
                {/* Property context */}
                <div style={{ marginBottom: "var(--space-5)" }}>
                    <h1 style={{
                        fontFamily: "var(--font-editorial)",
                        fontSize: "var(--font-size-xl)",
                        fontWeight: 400,
                        lineHeight: 1.2,
                        marginBottom: 4,
                    }}>
                        {analysis.address}
                    </h1>
                    <div style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                    }}>
                        {analysis.area} &middot; Utgångspris {formatCurrency(analysis.asking_price)}
                        {household?.partner && (
                            <span> &middot; Hushållskalkyl</span>
                        )}
                    </div>
                </div>

                {/* ═══ Current State ═══ */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4) var(--space-5)",
                    marginBottom: "var(--space-3)",
                }}>
                    <span style={labelStyle}>Nuvarande bud</span>
                    <div style={{
                        ...valueStyle,
                        color: "var(--color-text-primary)",
                        marginBottom: "var(--space-3)",
                    }}>
                        {formatCurrency(analysis.asking_price)}
                    </div>
                    <span style={labelStyle}>Nuvarande marginal</span>
                    <div style={{
                        fontSize: "var(--font-size-lg)",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: currentResult ? TRAFFIC_COLORS[currentResult.grade] : "var(--color-text-secondary)",
                    }}>
                        {currentResult ? formatCurrency(currentResult.margin) + "/mån" : "..."}
                    </div>
                </div>

                {/* ═══ Simulated State ═══ */}
                <div style={{
                    background: "white",
                    border: `1.5px solid ${simColor}40`,
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-4) var(--space-5)",
                    marginBottom: "var(--space-3)",
                }}>
                    <span style={labelStyle}>Nästa tänkta bud</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={simulatedBid}
                        onChange={(e) => setSimulatedBid(e.target.value.replace(/[^\d\s]/g, ""))}
                        style={{
                            width: "100%",
                            background: "var(--color-bg)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-2) var(--space-3)",
                            fontSize: "var(--font-size-lg)",
                            fontWeight: 700,
                            fontFamily: "var(--font-body)",
                            fontVariantNumeric: "tabular-nums",
                            color: "var(--color-text-primary)",
                            outline: "none",
                            boxSizing: "border-box",
                            marginBottom: "var(--space-3)",
                        }}
                    />

                    {/* Quick increment buttons */}
                    <div style={{
                        display: "flex",
                        gap: "var(--space-2)",
                        marginBottom: "var(--space-4)",
                    }}>
                        {[
                            { label: "+5 %", factor: 1.05 },
                            { label: "+10 %", factor: 1.10 },
                            { label: "+15 %", factor: 1.15 },
                            { label: "+20 %", factor: 1.20 },
                        ].map(({ label, factor }) => {
                            const newAmount = Math.round(analysis.asking_price * factor);
                            const isActive = simulatedBid.replace(/\s/g, "") === newAmount.toString();
                            return (
                                <button
                                    key={label}
                                    onClick={() => setSimulatedBid(newAmount.toString())}
                                    style={{
                                        flex: 1,
                                        padding: "var(--space-2) 0",
                                        background: isActive ? "var(--color-midnight)" : "var(--color-bg)",
                                        color: isActive ? "white" : "var(--color-text-secondary)",
                                        border: isActive ? "1px solid var(--color-midnight)" : "1px solid var(--color-border)",
                                        borderRadius: "var(--radius-md)",
                                        fontSize: "var(--font-size-xs)",
                                        fontWeight: 600,
                                        fontFamily: "var(--font-body)",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <span style={labelStyle}>Simulerad marginal</span>
                    <div style={{
                        fontSize: "var(--font-size-lg)",
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                        color: simColor,
                    }}>
                        {simulatedResult ? formatCurrency(simulatedResult.margin) + "/mån" : "..."}
                    </div>
                </div>

                {/* ═══ Delta / Konsekvens ═══ */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    marginBottom: "var(--space-4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                }}>
                    {/* Traffic light */}
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: `${simColor}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: simColor,
                            boxShadow: `0 0 8px ${simColor}40`,
                            transition: "all 0.4s ease",
                        }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: "var(--font-size-xs)",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "var(--color-text-muted)",
                            marginBottom: 4,
                        }}>
                            Konsekvensanalys
                        </div>
                        <div style={{
                            fontSize: "var(--font-size-xl)",
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            color: delta >= 0 ? "#3D7A3A" : "#A93226",
                            transition: "color 0.3s ease",
                        }}>
                            {formatDelta(delta)}
                        </div>
                    </div>

                    <div style={{
                        fontSize: "var(--font-size-xs)",
                        color: simColor,
                        fontWeight: 600,
                        textAlign: "right",
                    }}>
                        {TRAFFIC_LABELS[simGrade]}
                    </div>
                </div>

                {/* Save simulation */}
                <button
                    onClick={handleSaveSimulation}
                    disabled={isSimulating}
                    style={{
                        width: "100%",
                        padding: "var(--space-4)",
                        background: "var(--color-midnight)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 700,
                        fontFamily: "var(--font-body)",
                        cursor: "pointer",
                        opacity: isSimulating ? 0.6 : 1,
                        transition: "opacity 0.2s ease",
                        marginBottom: "var(--space-5)",
                    }}
                >
                    {isSimulating ? "Sparar..." : "Spara simulering"}
                </button>

                {/* ═══ Simulation History ═══ */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    marginBottom: "calc(var(--space-8) + 70px)",
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-3)",
                    }}>
                        <span style={labelStyle}>Simuleringshistorik</span>
                        <span style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                        }}>
                            {simulations.length} scenarier
                        </span>
                    </div>

                    {simulations.length === 0 ? (
                        <div style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                            paddingTop: "var(--space-2)",
                            paddingBottom: "var(--space-2)",
                        }}>
                            Inga simuleringar sparade
                        </div>
                    ) : (
                        <div>
                            {simulations.map((sim, i) => (
                                <div key={sim.id} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "var(--space-3)",
                                    padding: "var(--space-3) 0",
                                    borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                                }}>
                                    {/* Timeline dot */}
                                    <div style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: "50%",
                                        background: sim.grade ? TRAFFIC_COLORS[sim.grade] : "var(--color-border)",
                                        flexShrink: 0,
                                    }} />

                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: "var(--font-size-sm)",
                                            fontWeight: 600,
                                            fontVariantNumeric: "tabular-nums",
                                            color: "var(--color-text-primary)",
                                        }}>
                                            {formatCurrency(sim.amount)}
                                        </div>
                                    </div>

                                    {sim.margin !== null && (
                                        <span style={{
                                            fontSize: "var(--font-size-xs)",
                                            fontVariantNumeric: "tabular-nums",
                                            fontWeight: 600,
                                            color: sim.grade ? TRAFFIC_COLORS[sim.grade] : "var(--color-text-muted)",
                                        }}>
                                            {sim.margin > 0 ? "+" : ""}{formatCurrency(sim.margin)}/mån
                                        </span>
                                    )}

                                    <span style={{
                                        fontSize: "var(--font-size-xs)",
                                        color: "var(--color-text-muted)",
                                        fontVariantNumeric: "tabular-nums",
                                    }}>
                                        {formatTime(sim.created_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact Action Bar */}
            <ContactActionBar />
        </div>
    );
}
