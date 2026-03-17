import React, { useState, useEffect } from "react";
import { useUser } from "../App";
import { TopBar } from "../components/TopBar";
import {
    generateInviteCode as apiGenerateInviteCode,
    acceptInvite as apiAcceptInvite,
    getHouseholdInfo,
    updateUser as apiUpdateUser,
    type HouseholdInfo,
} from "../hooks/useApi";

function formatSEK(amount: number): string {
    return new Intl.NumberFormat("sv-SE").format(amount) + " kr";
}

export function ProfileScreen() {
    const { user, setUser } = useUser();
    const [household, setHousehold] = useState<HouseholdInfo | null>(null);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState("");
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [saveToast, setSaveToast] = useState(false);

    useEffect(() => {
        if (!user) return;
        getHouseholdInfo(user.id)
            .then(setHousehold)
            .catch(() => { });
    }, [user]);

    if (!user) return null;

    const hasPartner = household?.partner != null;

    async function handleGenerateCode() {
        setLoading(true);
        setError(null);
        try {
            const result = await apiGenerateInviteCode(user!.id);
            setInviteCode(result.invite_code);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleAcceptCode() {
        if (!inputCode.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await apiAcceptInvite(user!.id, inputCode.trim().toUpperCase());
            // Refresh household info
            const info = await getHouseholdInfo(user!.id);
            setHousehold(info);
            setShowCodeInput(false);
            setInputCode("");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function startEditing(field: string, currentValue: number) {
        setEditingField(field);
        setEditValue(String(currentValue));
    }

    async function saveField(field: string) {
        const numValue = parseInt(editValue.replace(/\D/g, "")) || 0;

        // Validate critical fields
        if ((field === "income" || field === "loan_promise") && numValue <= 0) {
            setError(field === "income" ? "Inkomst måste vara större än 0" : "Lånelöfte måste vara större än 0");
            setEditingField(null);
            return;
        }

        setEditingField(null);
        try {
            const updated = await apiUpdateUser(user!.id, { [field]: numValue });
            setUser(updated);
            setSaveToast(true);
            setTimeout(() => setSaveToast(false), 2000);
        } catch (err: any) {
            setError(err.message);
        }
    }

    const labelStyle: React.CSSProperties = {
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--color-text-muted)",
        marginBottom: "var(--space-3)",
        display: "block",
    };

    return (
        <div className="screen">
            <TopBar title="Profil" />

            <div className="container">
                {/* Header */}
                <div style={{ marginBottom: "var(--space-5)" }}>
                    <h1 style={{
                        fontFamily: "var(--font-editorial)",
                        fontSize: "var(--font-size-2xl)",
                        fontWeight: 400,
                    }}>
                        Din profil
                    </h1>
                </div>

                {/* Avatar + name card */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    marginBottom: "var(--space-4)",
                }}>
                    <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-stone)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--font-size-xl)",
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        flexShrink: 0,
                    }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: "var(--font-size-lg)" }}>{user.name}</div>
                        <span className="badge">
                            {user.household_type === "solo" ? "Köper själv" : "Köper ihop"}
                        </span>
                    </div>
                </div>

                {/* Financial data card */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    marginBottom: "var(--space-4)",
                }}>
                    <span style={labelStyle}>Ekonomi</span>
                    {[
                        { label: "Nettoinkomst", field: "income", value: user.income, suffix: "/mån" },
                        { label: "Sparkapital", field: "savings", value: user.savings, suffix: "" },
                        { label: "Lånelöfte", field: "loan_promise", value: user.loan_promise, suffix: "" },
                        { label: "Skulder", field: "debts", value: user.debts, suffix: "" },
                    ].map((row) => (
                        <div key={row.label} className="data-row" style={{ cursor: "pointer" }}
                            onClick={() => editingField !== row.field && startEditing(row.field, row.value)}>
                            <span className="data-row-label">{row.label}</span>
                            {editingField === row.field ? (
                                <input
                                    autoFocus
                                    type="text"
                                    inputMode="numeric"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => saveField(row.field)}
                                    onKeyDown={(e) => e.key === "Enter" && saveField(row.field)}
                                    style={{
                                        background: "var(--color-bg)",
                                        border: "1.5px solid var(--color-gold)",
                                        borderRadius: "var(--radius-sm)",
                                        padding: "var(--space-1) var(--space-2)",
                                        fontSize: "var(--font-size-sm)",
                                        fontWeight: 600,
                                        fontFamily: "var(--font-body)",
                                        fontVariantNumeric: "tabular-nums",
                                        textAlign: "right",
                                        width: 120,
                                        outline: "none",
                                    }}
                                />
                            ) : (
                                <span className="data-row-value" style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                                    {formatSEK(row.value)}{row.suffix}
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                                        <path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                    </svg>
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Hushållsläge — Partner section */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                    marginBottom: "var(--space-4)",
                }}>
                    <span style={labelStyle}>Hushållsläge</span>

                    {hasPartner ? (
                        /* Connected partner */
                        <div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--space-3)",
                                marginBottom: "var(--space-4)",
                            }}>
                                <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "var(--radius-full)",
                                    background: "rgba(61, 122, 58, 0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "var(--font-size-sm)",
                                    fontWeight: 600,
                                    color: "#3D7A3A",
                                    flexShrink: 0,
                                }}>
                                    {household!.partner!.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
                                        {household!.partner!.name}
                                    </div>
                                    <div style={{ fontSize: "var(--font-size-xs)", color: "#3D7A3A" }}>
                                        Kopplad
                                    </div>
                                </div>
                            </div>

                            {/* Hushållskalkyl — combined */}
                            <div style={{
                                background: "var(--color-bg)",
                                borderRadius: "var(--radius-md)",
                                padding: "var(--space-4)",
                            }}>
                                <div style={{
                                    fontSize: "var(--font-size-xs)",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    color: "var(--color-text-muted)",
                                    marginBottom: "var(--space-2)",
                                }}>
                                    Hushållskalkyl
                                </div>
                                {[
                                    { label: "Gemensam inkomst", value: formatSEK(household!.combined_income) + "/mån" },
                                    { label: "Gemensamt sparande", value: formatSEK(household!.combined_savings) },
                                    { label: "Gemensamt lånelöfte", value: formatSEK(household!.combined_loan_promise) },
                                    { label: "Gemensamma skulder", value: formatSEK(household!.combined_debts) + "/mån" },
                                ].map((row) => (
                                    <div key={row.label} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "var(--space-1) 0",
                                    }}>
                                        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>{row.label}</span>
                                        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* No partner yet */
                        <div>
                            {inviteCode ? (
                                <div>
                                    <div style={{
                                        fontSize: "var(--font-size-xs)",
                                        color: "var(--color-text-muted)",
                                        marginBottom: "var(--space-2)",
                                    }}>
                                        Dela denna kod med din partner:
                                    </div>
                                    <div style={{
                                        background: "var(--color-bg)",
                                        borderRadius: "var(--radius-md)",
                                        padding: "var(--space-4)",
                                        textAlign: "center",
                                        fontSize: "var(--font-size-xl)",
                                        fontWeight: 700,
                                        letterSpacing: "0.2em",
                                        fontFamily: "var(--font-body)",
                                        color: "var(--color-text-primary)",
                                        fontVariantNumeric: "tabular-nums",
                                        marginBottom: "var(--space-3)",
                                    }}>
                                        {inviteCode}
                                    </div>
                                </div>
                            ) : showCodeInput ? (
                                <div>
                                    <div style={{
                                        fontSize: "var(--font-size-xs)",
                                        color: "var(--color-text-muted)",
                                        marginBottom: "var(--space-2)",
                                    }}>
                                        Ange partnerns inbjudningskod:
                                    </div>
                                    <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            placeholder="ABCDEF"
                                            value={inputCode}
                                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                            style={{
                                                flex: 1,
                                                background: "white",
                                                border: "1.5px solid var(--color-border)",
                                                borderRadius: "var(--radius-md)",
                                                padding: "var(--space-3) var(--space-4)",
                                                fontSize: "var(--font-size-sm)",
                                                fontFamily: "var(--font-body)",
                                                letterSpacing: "0.15em",
                                                textAlign: "center",
                                                outline: "none",
                                                textTransform: "uppercase",
                                            }}
                                        />
                                        <button
                                            onClick={handleAcceptCode}
                                            disabled={loading || inputCode.length < 6}
                                            style={{
                                                padding: "var(--space-3) var(--space-4)",
                                                background: "var(--color-midnight)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "var(--radius-md)",
                                                fontSize: "var(--font-size-xs)",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                fontFamily: "var(--font-body)",
                                                opacity: loading || inputCode.length < 6 ? 0.5 : 1,
                                            }}
                                        >
                                            Koppla
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={loading}
                                        style={{
                                            width: "100%",
                                            padding: "var(--space-3)",
                                            background: "var(--color-midnight)",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "var(--radius-md)",
                                            fontSize: "var(--font-size-sm)",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            fontFamily: "var(--font-body)",
                                            opacity: loading ? 0.6 : 1,
                                        }}
                                    >
                                        Bjud in partner
                                    </button>
                                    <button
                                        onClick={() => setShowCodeInput(true)}
                                        style={{
                                            width: "100%",
                                            padding: "var(--space-3)",
                                            background: "transparent",
                                            border: "1px solid var(--color-border)",
                                            borderRadius: "var(--radius-md)",
                                            fontSize: "var(--font-size-sm)",
                                            fontWeight: 500,
                                            color: "var(--color-text-secondary)",
                                            cursor: "pointer",
                                            fontFamily: "var(--font-body)",
                                        }}
                                    >
                                        Ange inbjudningskod
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div style={{
                                    marginTop: "var(--space-2)",
                                    padding: "var(--space-2) var(--space-3)",
                                    background: "rgba(169, 50, 38, 0.06)",
                                    color: "#A93226",
                                    borderRadius: "var(--radius-md)",
                                    fontSize: "var(--font-size-xs)",
                                }}>
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Notifications card */}
                <div style={{
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-5)",
                }}>
                    <span style={labelStyle}>Aviseringar</span>
                    {[
                        { label: "Prisförändringar", enabled: true },
                        { label: "Nya resultat", enabled: true },
                    ].map((item, i) => (
                        <div key={i} className="data-row">
                            <span className="data-row-label">{item.label}</span>
                            <div style={{
                                width: 40,
                                height: 22,
                                borderRadius: "var(--radius-full)",
                                background: item.enabled ? "var(--color-midnight)" : "var(--color-border)",
                                position: "relative",
                                cursor: "pointer",
                                transition: "background var(--transition-fast)",
                            }}>
                                <div style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: "var(--radius-full)",
                                    background: "white",
                                    position: "absolute",
                                    top: 3,
                                    left: item.enabled ? 21 : 3,
                                    transition: "left var(--transition-fast)",
                                    boxShadow: "var(--shadow-sm)",
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save toast */}
            {saveToast && (
                <div style={{
                    position: "fixed",
                    bottom: 40,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--color-midnight)",
                    color: "white",
                    padding: "var(--space-2) var(--space-4)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    boxShadow: "var(--shadow-lg)",
                    animation: "fadeIn 0.2s ease",
                    zIndex: 100,
                }}>
                    Sparat ✓
                </div>
            )}
        </div>
    );
}
