import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "../App";
import { TopBar } from "../components/TopBar";
import { calculateKALP } from "../utils/kalp";
import { getAnalysis, type AnalysisData } from "../hooks/useApi";

function formatSEK(amount: number): string {
    return amount.toLocaleString("sv-SE") + " kr";
}

function formatCompact(amount: number): string {
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace(".0", "") + " mkr";
    if (amount >= 1_000) return Math.round(amount / 1_000) + " tkr";
    return amount.toString();
}

export function CalculatorScreen() {
    const navigate = useNavigate();
    const { user } = useUser();
    const { id } = useParams<{ id: string }>();
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

    useEffect(() => {
        if (id) getAnalysis(Number(id)).then(setAnalysis).catch(console.error);
    }, [id]);

    // Slider state — seed from property when loaded
    const [bid, setBid] = useState(3_000_000);
    const [ownFinancing, setOwnFinancing] = useState(500_000);
    const [interestRate, setInterestRate] = useState(4.0);
    const [seeded, setSeeded] = useState(false);

    useEffect(() => {
        if (analysis && !seeded) {
            setBid(analysis.asking_price || 3_000_000);
            setOwnFinancing(Math.min(user?.savings || 500_000, analysis.asking_price || 3_000_000));
            setSeeded(true);
        }
    }, [analysis, seeded]);

    // Fixed values from user profile + property
    const monthlyIncome = user?.income || 35_000;
    const brfFee = analysis?.fee || 4_500;
    const householdType = user?.household_type || "solo";
    const grossAnnualIncome = monthlyIncome * 14; // Approximate gross from net

    const result = useMemo(() => calculateKALP({
        monthlyIncome,
        bidPrice: bid,
        ownFinancing,
        interestRate: interestRate / 100,
        brfFee,
        existingDebts: user?.debts || 0,
        householdType,
        grossAnnualIncome,
    }), [bid, ownFinancing, interestRate, monthlyIncome, brfFee, householdType, grossAnnualIncome]);

    return (
        <div className="screen">
            <TopBar title={analysis?.address || "Budgetkalkyl"} />

            <div className="container" style={{ paddingBottom: "var(--space-10)" }}>
                {/* Header */}
                <div style={{ marginBottom: "var(--space-6)" }}>
                    {analysis && (
                        <div style={{
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            fontWeight: 500,
                            marginBottom: "var(--space-1)",
                        }}>
                            {analysis.address}{analysis.area ? `, ${analysis.area}` : ""}
                        </div>
                    )}
                    <h1 style={{
                        fontFamily: "var(--font-editorial)",
                        fontSize: "var(--font-size-2xl)",
                        fontWeight: 400,
                        lineHeight: 1.2,
                        marginBottom: "var(--space-1)",
                    }}>
                        Budgetkalkyl
                    </h1>
                    <p style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.4,
                    }}>
                        Justera bud, insats och ränta
                    </p>
                </div>

                {/* ═══ Result Hero ═══ */}
                <div style={{
                    background: "white",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-6) var(--space-5)",
                    textAlign: "center",
                    marginBottom: "var(--space-6)",
                }}>
                    <div style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 500,
                        marginBottom: "var(--space-2)",
                    }}>
                        Kvar i plånboken
                    </div>
                    <div style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "2.5rem",
                        fontWeight: 700,
                        color: result.gradeColor,
                        lineHeight: 1,
                        marginBottom: "var(--space-2)",
                        transition: "color 0.3s ease",
                    }}>
                        {result.margin >= 0 ? "+" : ""}{formatSEK(result.margin)}
                    </div>
                    <div style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                    }}>
                        per månad
                    </div>
                </div>

                {/* ═══ Sliders ═══ */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-5)",
                    marginBottom: "var(--space-6)",
                }}>
                    {/* Ditt bud */}
                    <SliderControl
                        label="Ditt bud"
                        value={bid}
                        min={1_000_000}
                        max={8_000_000}
                        step={50_000}
                        format={formatCompact}
                        onChange={setBid}
                    />

                    {/* Egen finansiering */}
                    <SliderControl
                        label="Egen finansiering"
                        value={ownFinancing}
                        min={0}
                        max={Math.min(bid, user?.savings || 2_000_000)}
                        step={25_000}
                        format={formatCompact}
                        onChange={setOwnFinancing}
                    />

                    {/* Ränta */}
                    <SliderControl
                        label="Förväntad ränta"
                        value={interestRate}
                        min={1.0}
                        max={8.0}
                        step={0.1}
                        format={(v) => v.toFixed(1) + " %"}
                        onChange={setInterestRate}
                    />
                </div>

                {/* ═══ Breakdown ═══ */}
                <div style={{
                    background: "white",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                }}>
                    <div style={{
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        marginBottom: "var(--space-4)",
                    }}>
                        Månadsöversikt
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                        {result.items.map((item, i) => (
                            <div key={i} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "var(--font-size-sm)",
                            }}>
                                <span style={{
                                    color: item.type === "income" ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                                    fontWeight: item.type === "income" ? 600 : 400,
                                }}>
                                    {item.label}
                                </span>
                                <span style={{
                                    fontWeight: 500,
                                    fontVariantNumeric: "tabular-nums",
                                    color: item.type === "deduction"
                                        ? "var(--color-green)"
                                        : item.type === "income"
                                            ? "var(--color-text-primary)"
                                            : "var(--color-text-secondary)",
                                }}>
                                    {item.amount >= 0 ? "+" : ""}{formatSEK(item.amount)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Divider */}
                    <div style={{
                        borderTop: "1px solid var(--color-border)",
                        margin: "var(--space-4) 0",
                    }} />

                    {/* Loan info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-secondary)",
                        }}>
                            <span>Lånebelopp</span>
                            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatSEK(result.loanAmount)}</span>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-secondary)",
                        }}>
                            <span>Belåningsgrad</span>
                            <span>{Math.round(result.ltv * 100)} %</span>
                        </div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-secondary)",
                        }}>
                            <span>Amorteringskrav</span>
                            <span>{result.amortizationRate} %</span>
                        </div>
                    </div>

                    {/* ═══ Result: Kvar i plånboken ═══ */}
                    <div style={{
                        borderTop: "2px solid var(--color-border)",
                        marginTop: "var(--space-4)",
                        paddingTop: "var(--space-4)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}>
                        <span style={{
                            fontSize: "var(--font-size-sm)",
                            fontWeight: 600,
                            color: "var(--color-text-primary)",
                        }}>
                            Kvar i plånboken
                        </span>
                        <span style={{
                            fontSize: "var(--font-size-xl)",
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            color: result.gradeColor,
                            transition: "color 0.3s ease",
                        }}>
                            {result.margin >= 0 ? "+" : ""}{formatSEK(result.margin)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══ Slider Component ═══════════════════════════════════
interface SliderControlProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    format: (v: number) => string;
    onChange: (v: number) => void;
}

function SliderControl({ label, value, min, max, step, format, onChange }: SliderControlProps) {
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

    return (
        <div>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "var(--space-2)",
            }}>
                <span style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                }}>
                    {label}
                </span>
                <span style={{
                    fontSize: "var(--font-size-base)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    fontVariantNumeric: "tabular-nums",
                }}>
                    {format(value)}
                </span>
            </div>
            <div style={{ position: "relative" }}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        width: "100%",
                        height: 6,
                        appearance: "none",
                        WebkitAppearance: "none",
                        borderRadius: "var(--radius-full)",
                        outline: "none",
                        cursor: "pointer",
                        background: `linear-gradient(to right, var(--color-midnight) 0%, var(--color-midnight) ${pct}%, var(--color-stone) ${pct}%, var(--color-stone) 100%)`,
                    }}
                />
            </div>
        </div>
    );
}
