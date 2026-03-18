import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../App";
import { getAnalysis, listBids, type AnalysisData, type BidData } from "../hooks/useApi";

function formatCurrency(n: number): string {
    return n.toLocaleString("sv-SE") + " kr";
}

export function AuctionResultScreen() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useUser();

    const status = searchParams.get("status") as "won" | "lost" | null;
    const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
    const [bids, setBids] = useState<BidData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const a = await getAnalysis(parseInt(id));
                setAnalysis(a);
                const b = await listBids(a.id);
                setBids(b);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

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
                Laddar...
            </div>
        );
    }

    if (!analysis) return null;

    const maxBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : analysis.asking_price;
    const isWon = status === "won";

    return (
        <div style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-bg)",
            overflow: "auto",
        }}>
            {/* Result header — large editorial */}
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "var(--space-6) var(--space-5)",
                textAlign: "center",
            }}>
                {/* Status icon */}
                <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: isWon ? "rgba(61, 122, 58, 0.1)" : "rgba(169, 50, 38, 0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "var(--space-5)",
                }}>
                    <span style={{
                        fontSize: "28px",
                        fontWeight: 700,
                        color: isWon ? "#3D7A3A" : "#A93226",
                    }}>
                        {isWon ? "V" : "X"}
                    </span>
                </div>

                <h1 style={{
                    fontFamily: "var(--font-editorial)",
                    fontSize: "var(--font-size-2xl)",
                    fontWeight: 400,
                    lineHeight: 1.15,
                    marginBottom: "var(--space-3)",
                    color: "var(--color-text-primary)",
                }}>
                    {isWon ? "Grattis!" : "Auktionen avslutad"}
                </h1>

                <p style={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-muted)",
                    maxWidth: 280,
                    lineHeight: 1.5,
                }}>
                    {isWon
                        ? `Du vann budgivningen för ${analysis.address}. Nästa steg är att kontakta banken.`
                        : `Budgivningen för ${analysis.address} är avslutad. Det finns fler möjligheter.`
                    }
                </p>
            </div>

            {/* Summary card */}
            <div style={{
                margin: "0 var(--space-5)",
                background: "white",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-5)",
                marginBottom: "var(--space-4)",
            }}>
                <div style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-4)",
                }}>
                    Sammanfattning
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    <SummaryRow label="Bostad" value={analysis.address} />
                    <SummaryRow label="Område" value={analysis.area || "-"} />
                    <SummaryRow label="Utgångspris" value={formatCurrency(analysis.asking_price)} />
                    <SummaryRow label="Högsta bud" value={formatCurrency(maxBid)} highlight />
                    <SummaryRow label="Antal bud" value={`${bids.length} st`} />
                    {isWon && analysis.fee && (
                        <SummaryRow label="Månadsavgift" value={formatCurrency(analysis.fee)} />
                    )}
                </div>
            </div>

            {/* Bid history card */}
            {bids.length > 0 && (
                <div style={{
                    margin: "0 var(--space-5)",
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    marginBottom: "var(--space-4)",
                }}>
                    <div style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--color-text-muted)",
                        marginBottom: "var(--space-3)",
                    }}>
                        Budgivningslogg
                    </div>

                    {bids.slice(0, 5).map((bid, i) => (
                        <div key={bid.id} style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            padding: "var(--space-2) 0",
                            borderTop: i > 0 ? "1px solid var(--color-border)" : "none",
                        }}>
                            {/* Timeline dot and line */}
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                                width: 12,
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: bid.grade
                                        ? bid.grade === "green" ? "#3D7A3A"
                                            : bid.grade === "yellow" ? "#C49520"
                                                : "#A93226"
                                        : "var(--color-border)",
                                }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontSize: "var(--font-size-sm)",
                                    fontWeight: 600,
                                    fontVariantNumeric: "tabular-nums",
                                    color: "var(--color-text-primary)",
                                }}>
                                    {formatCurrency(bid.amount)}
                                </span>
                            </div>
                            {bid.margin !== null && (
                                <span style={{
                                    fontSize: "var(--font-size-xs)",
                                    fontVariantNumeric: "tabular-nums",
                                    color: bid.grade === "green" ? "#3D7A3A"
                                        : bid.grade === "yellow" ? "#C49520"
                                            : "#A93226",
                                }}>
                                    {bid.margin > 0 ? "+" : ""}{formatCurrency(bid.margin)}/mån
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* CTAs */}
            <div style={{
                padding: "var(--space-3) var(--space-5) var(--space-8)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
            }}>
                {isWon ? (
                    <>
                        <button
                            className="btn btn-primary btn-lg btn-block"
                            onClick={() => {/* Coming soon — bank report export */}}
                            disabled
                            title="Kommer snart"
                        >
                            Exportera rapport till banken
                        </button>
                        <button
                            onClick={() => navigate("/")}
                            style={{
                                width: "100%",
                                padding: "var(--space-3)",
                                background: "transparent",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-lg)",
                                fontSize: "var(--font-size-sm)",
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            Tillbaka till dashboard
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className="btn btn-primary btn-lg btn-block"
                            onClick={() => navigate("/")}
                        >
                            Tillbaka till dashboard
                        </button>
                        <button
                            onClick={() => navigate(`/analys/${id}`)}
                            style={{
                                width: "100%",
                                padding: "var(--space-3)",
                                background: "transparent",
                                border: "1px solid var(--color-border)",
                                borderRadius: "var(--radius-lg)",
                                fontSize: "var(--font-size-sm)",
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                                cursor: "pointer",
                                fontFamily: "var(--font-body)",
                            }}
                        >
                            Visa analys
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        }}>
            <span style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-muted)",
            }}>
                {label}
            </span>
            <span style={{
                fontSize: "var(--font-size-sm)",
                fontWeight: highlight ? 700 : 500,
                fontVariantNumeric: "tabular-nums",
                color: highlight ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            }}>
                {value}
            </span>
        </div>
    );
}
