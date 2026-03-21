import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../App";
import { listAnalyses, submitPropertyLink, type AnalysisData } from "../hooks/useApi";
import { TopBar } from "../components/TopBar";

function formatSEK(amount: number): string {
    return new Intl.NumberFormat("sv-SE").format(amount) + " kr";
}

function formatCompact(amount: number): string {
    if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace(".", ",") + " mkr";
    if (amount >= 1_000) return Math.round(amount / 1_000) + " tkr";
    return String(amount);
}

function gradeClass(grade: string | null): string {
    if (!grade) return "";
    const letter = grade.charAt(0).toLowerCase();
    if (letter === "a") return "grade-a";
    if (letter === "b") return "grade-b";
    if (letter === "c") return "grade-c";
    if (letter === "d") return "grade-d";
    return "grade-f";
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 10) return "God morgon";
    if (hour < 17) return "Hej";
    return "God kväll";
}

export function DashboardScreen() {
    const navigate = useNavigate();
    const { user } = useUser();
    const [searchValue, setSearchValue] = useState("");
    const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showGuidance, setShowGuidance] = useState(true);
    const [clipboardHint, setClipboardHint] = useState<string | null>(null);
    const [scraping, setScraping] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const guidanceTimer = useRef<any>(null);

    useEffect(() => {
        if (!user) return;
        listAnalyses()
            .then(setAnalyses)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user?.id]);

    // Auto-dismiss guidance tooltip after 8s
    useEffect(() => {
        guidanceTimer.current = setTimeout(() => setShowGuidance(false), 8000);
        return () => clearTimeout(guidanceTimer.current);
    }, []);

    // Paste detection — check clipboard for URLs on search focus
    async function handleSearchFocus() {
        setShowGuidance(false);
        clearTimeout(guidanceTimer.current);
        try {
            const text = await navigator.clipboard.readText();
            if (text && (text.startsWith("http://") || text.startsWith("https://")) && !searchValue) {
                setClipboardHint(text.trim());
            }
        } catch { /* clipboard permission denied — ignore */ }
    }

    function applyClipboard() {
        if (clipboardHint) {
            setSearchValue(clipboardHint);
            setClipboardHint(null);
        }
    }

    return (
        <>
            <TopBar />
            <div className="screen">
                <div className="container">
                    {/* Greeting */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "var(--space-6)",
                    }}>
                        <div>
                            <div style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--color-text-muted)",
                                marginBottom: "var(--space-2)",
                            }}>
                                {new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
                            </div>
                            <h1 style={{
                                fontFamily: "var(--font-editorial)",
                                fontSize: "var(--font-size-2xl)",
                                fontWeight: 400,
                                lineHeight: 1.2,
                            }}>
                                {getGreeting()}, {user?.name || "du"}
                            </h1>
                        </div>
                        <button
                            onClick={() => navigate("/profil")}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                minHeight: 44,
                                minWidth: 44,
                                padding: 0,
                                flexShrink: 0,
                            }}
                        >
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: "var(--radius-full)",
                                background: "var(--color-stone)",
                                color: "var(--color-text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: "var(--font-body)",
                                border: "1.5px solid var(--color-border-strong)",
                            }}>
                                {user?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                        </button>
                    </div>

                    {/* Property search — primary action */}
                    <div className="card" style={{
                        marginBottom: "var(--space-6)",
                        background: "white",
                        padding: "var(--space-5)",
                    }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            marginBottom: "var(--space-4)",
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" strokeWidth="2" strokeLinecap="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <div>
                                <div style={{
                                    fontSize: "var(--font-size-sm)",
                                    fontWeight: 600,
                                    color: "var(--color-text-primary)",
                                    lineHeight: 1.2,
                                }}>
                                    Analysera bostad
                                </div>
                                <div style={{
                                    fontSize: "var(--font-size-xs)",
                                    color: "var(--color-text-muted)",
                                    lineHeight: 1.3,
                                    marginTop: 2,
                                }}>
                                    Klistra in en mäklarlänk
                                </div>
                            </div>
                        </div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-2)",
                            background: "var(--color-bg)",
                            border: "1.5px solid var(--color-border)",
                            borderRadius: "var(--radius-md)",
                            padding: "var(--space-3) var(--space-4)",
                            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        }}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="t.ex. hemnet.se/bostad/..."
                                value={searchValue}
                                onChange={(e) => { setSearchValue(e.target.value); setClipboardHint(null); }}
                                onFocus={handleSearchFocus}
                                style={{
                                    flex: 1,
                                    background: "none",
                                    border: "none",
                                    outline: "none",
                                    color: "var(--color-text-primary)",
                                    fontFamily: "var(--font-body)",
                                    fontSize: "var(--font-size-sm)",
                                    lineHeight: 1.5,
                                    minHeight: 24,
                                }}
                            />
                            {searchValue && (
                                <button
                                    onClick={async () => {
                                        if (!user || scraping) return;
                                        setScraping(true);
                                        setSearchError(null);
                                        try {
                                            const result = await submitPropertyLink(searchValue);
                                            navigate(`/analys/${result.analysis_id}`);
                                        } catch (err: any) {
                                            setSearchError(err.message);
                                        } finally {
                                            setScraping(false);
                                        }
                                    }}
                                    disabled={scraping}
                                    style={{
                                        background: scraping ? "var(--color-text-muted)" : "var(--color-midnight)",
                                        border: "none",
                                        borderRadius: "var(--radius-full)",
                                        width: 32,
                                        height: 32,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: scraping ? "wait" : "pointer",
                                        flexShrink: 0,
                                        transition: "transform 0.15s ease",
                                    }}
                                >
                                    {scraping ? (
                                        <div style={{
                                            width: 14, height: 14, borderRadius: "50%",
                                            border: "2px solid rgba(255,255,255,0.3)",
                                            borderTopColor: "white",
                                            animation: "spin 0.6s linear infinite",
                                        }} />
                                    ) : (
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </div>
                        {/* Clipboard paste hint */}
                        {clipboardHint && (
                            <button
                                onClick={applyClipboard}
                                style={{
                                    marginTop: "var(--space-2)",
                                    padding: "var(--space-2) var(--space-3)",
                                    background: "rgba(193, 163, 104, 0.08)",
                                    border: "1px solid rgba(193, 163, 104, 0.2)",
                                    borderRadius: "var(--radius-md)",
                                    fontSize: "var(--font-size-xs)",
                                    color: "var(--color-gold)",
                                    fontWeight: 500,
                                    fontFamily: "var(--font-body)",
                                    cursor: "pointer",
                                    width: "100%",
                                    textAlign: "left",
                                    transition: "background 0.15s ease",
                                }}
                            >
                                📋 Klistra in från urklipp
                            </button>
                        )}
                        {/* Search error */}
                        {searchError && (
                            <div style={{
                                marginTop: "var(--space-2)",
                                padding: "var(--space-2) var(--space-3)",
                                background: "rgba(169, 50, 38, 0.06)",
                                border: "1px solid rgba(169, 50, 38, 0.15)",
                                borderRadius: "var(--radius-md)",
                                fontSize: "var(--font-size-xs)",
                                color: "#A93226",
                                lineHeight: 1.5,
                            }}>
                                {searchError}
                            </div>
                        )}
                    </div>

                    {/* Onboarding guidance tooltip */}
                    {showGuidance && analyses.length === 0 && (
                        <div style={{
                            padding: "var(--space-3) var(--space-4)",
                            background: "rgba(193, 163, 104, 0.06)",
                            border: "1px solid rgba(193, 163, 104, 0.15)",
                            borderRadius: "var(--radius-md)",
                            marginBottom: "var(--space-4)",
                            fontSize: "var(--font-size-xs)",
                            color: "var(--color-text-secondary)",
                            lineHeight: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            animation: "fadeIn 0.4s ease",
                        }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                            <span>Hitta en bostad hos din mäklare, kopiera länken och klistra in den ovan för att starta din analys.</span>
                        </div>
                    )}

                    {/* Quick stats — elevated */}
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-8)",
                    }}>
                        <div
                            className="card"
                            onClick={() => { if (!user?.loan_promise) navigate("/profil"); }}
                            style={{
                                padding: "var(--space-4)",
                                background: "white",
                                cursor: !user?.loan_promise ? "pointer" : "default",
                            }}
                        >
                            <div style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--color-text-muted)",
                                marginBottom: "var(--space-2)",
                            }}>Lånelöfte</div>
                            {user && user.loan_promise > 0 ? (
                                <div style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "var(--font-size-xl)",
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                    color: "var(--color-text-primary)",
                                    lineHeight: 1.1,
                                }}>
                                    {formatCompact(user.loan_promise)}
                                </div>
                            ) : (
                                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                                    Fyll i din profil →
                                </div>
                            )}
                        </div>
                        <div
                            className="card"
                            onClick={() => { if (!user?.savings) navigate("/profil"); }}
                            style={{
                                padding: "var(--space-4)",
                                background: "white",
                                cursor: !user?.savings ? "pointer" : "default",
                            }}
                        >
                            <div style={{
                                fontSize: "11px",
                                fontWeight: 500,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                color: "var(--color-text-muted)",
                                marginBottom: "var(--space-2)",
                            }}>Sparkapital</div>
                            {user && user.savings > 0 ? (
                                <div style={{
                                    fontFamily: "var(--font-body)",
                                    fontSize: "var(--font-size-xl)",
                                    fontWeight: 700,
                                    fontVariantNumeric: "tabular-nums",
                                    color: "var(--color-text-primary)",
                                    lineHeight: 1.1,
                                }}>
                                    {formatCompact(user.savings)}
                                </div>
                            ) : (
                                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                                    Fyll i din profil →
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Property cards */}
                    <div>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "var(--space-4)",
                        }}>
                            <h2 className="heading-2">Dina bostäder</h2>
                            {analyses.length > 0 && (
                                <span style={{
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    color: "var(--color-text-muted)",
                                    padding: "var(--space-1) var(--space-3)",
                                    background: "rgba(0,0,0,0.04)",
                                    borderRadius: "var(--radius-full)",
                                }}>
                                    {analyses.length} {analyses.length === 1 ? "objekt" : "objekt"}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "var(--space-3)",
                                }}>
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: "50%",
                                        border: "2px solid var(--color-border)",
                                        borderTopColor: "var(--color-midnight)",
                                        animation: "spin 0.8s linear infinite",
                                    }} />
                                    <p className="body-sm">Hämtar bostadsdata...</p>
                                </div>
                            </div>
                        ) : analyses.length === 0 ? (
                            <div className="card" style={{
                                textAlign: "center",
                                padding: "var(--space-10) var(--space-5)",
                                borderStyle: "dashed",
                            }}>
                                <div style={{ fontSize: 28, marginBottom: "var(--space-3)", opacity: 0.5 }}>🏡</div>
                                <p style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginBottom: "var(--space-1)" }}>
                                    Lägg till din första bostad
                                </p>
                                <p className="body-sm">Klistra in en mäklarlänk ovan och vi sköter resten</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                                {analyses.map((item, i) => (
                                    <div
                                        key={item.id}
                                        className="property-card"
                                        onClick={() => navigate(`/analys/${item.id}`)}
                                        style={{
                                            animation: `slideUp 0.4s ease ${i * 0.1}s both`,
                                        }}
                                    >
                                        {/* Hero image */}
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.address}
                                                className="property-card-image"
                                            />
                                        ) : (
                                            <div className="property-card-image" style={{
                                                background: "var(--color-stone)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}>
                                                <span style={{
                                                    color: "var(--color-text-muted)",
                                                    fontSize: "var(--font-size-sm)",
                                                }}>
                                                    Ingen bild
                                                </span>
                                            </div>
                                        )}

                                        <div className="property-card-body">
                                            <div className="property-card-address">{item.address}</div>
                                            <div className="property-card-meta">
                                                {item.area && <span>{item.area}</span>}
                                                {item.sqm && <><span className="dot" /><span>{item.sqm} kvm</span></>}
                                                {item.fee && <><span className="dot" /><span>{formatSEK(item.fee)}/mån</span></>}
                                            </div>
                                            <div style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginTop: "var(--space-3)",
                                                paddingTop: "var(--space-3)",
                                                borderTop: "1px solid var(--color-border)",
                                            }}>
                                                <div>
                                                    {item.asking_price > 0 ? (
                                                        <>
                                                            <span style={{
                                                                fontFamily: "var(--font-body)",
                                                                fontWeight: 700,
                                                                fontSize: "var(--font-size-base)",
                                                                fontVariantNumeric: "tabular-nums",
                                                                color: "var(--color-text-primary)",
                                                            }}>
                                                                {new Intl.NumberFormat("sv-SE").format(item.asking_price)}
                                                            </span>
                                                            <span style={{
                                                                fontSize: "var(--font-size-xs)",
                                                                fontWeight: 400,
                                                                color: "var(--color-text-muted)",
                                                                marginLeft: "3px",
                                                            }}>kr</span>
                                                        </>
                                                    ) : (
                                                        <span style={{
                                                            fontFamily: "var(--font-body)",
                                                            fontWeight: 500,
                                                            fontSize: "var(--font-size-sm)",
                                                            color: "var(--color-text-muted)",
                                                            fontStyle: "italic",
                                                        }}>
                                                            Ej satt
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                                                    {/* KALP margin badge */}
                                                    {item.margin_result != null && (
                                                        <span style={{
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            fontVariantNumeric: "tabular-nums",
                                                            padding: "2px 8px",
                                                            borderRadius: "var(--radius-full)",
                                                            background: item.grade === "green" ? "rgba(61, 122, 58, 0.08)"
                                                                : item.grade === "yellow" ? "rgba(196, 149, 32, 0.08)"
                                                                    : item.grade === "red" ? "rgba(169, 50, 38, 0.08)"
                                                                        : "var(--color-stone)",
                                                            color: item.grade === "green" ? "#3D7A3A"
                                                                : item.grade === "yellow" ? "#C49520"
                                                                    : item.grade === "red" ? "#A93226"
                                                                        : "var(--color-text-muted)",
                                                        }}>
                                                            Kvar {new Intl.NumberFormat("sv-SE").format(item.margin_result)} kr
                                                        </span>
                                                    )}
                                                    {/* Letter grade badge (for demo data) */}
                                                    {item.grade && !["green", "yellow", "red"].includes(item.grade) && (
                                                        <div className={`grade ${gradeClass(item.grade)}`}>
                                                            {item.grade}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
