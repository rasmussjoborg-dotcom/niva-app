import React, { useState } from "react";
import { createUser, type UserData } from "../hooks/useApi";


interface OnboardingScreenProps {
    onComplete: (user: UserData) => void;
}

type HouseholdType = null | "solo" | "together";

const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "var(--font-size-xs)",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "var(--color-text-muted)",
    marginBottom: "var(--space-2)",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "white",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)",
    fontSize: "var(--font-size-sm)",
    fontFamily: "var(--font-body)",
    color: "var(--color-text-primary)",
    outline: "none",
    transition: "border-color 0.2s ease",
    fontVariantNumeric: "tabular-nums",
    boxSizing: "border-box" as const,
};

const cardStyle: React.CSSProperties = {
    background: "white",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--color-border)",
    padding: "var(--space-4)",
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
    const [householdType, setHouseholdType] = useState<HouseholdType>(null);
    const [name, setName] = useState("");
    const [income, setIncome] = useState("");
    const [savings, setSavings] = useState("");
    const [loanPromise, setLoanPromise] = useState("");
    const [debts, setDebts] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function parseNumber(value: string): number {
        return parseInt(value.replace(/\s/g, "")) || 0;
    }

    function formatNumber(value: string): string {
        const digits = value.replace(/\D/g, "");
        if (!digits) return "";
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    // Validation — require income and lånelöfte at minimum
    const isValid = parseNumber(income) > 0 && parseNumber(loanPromise) > 0;

    async function handleSubmit() {
        if (!isValid) {
            setError("Fyll i nettoinkomst och lånelöfte för att fortsätta.");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const user = await createUser({
                name: name || "Användare",
                income: parseNumber(income),
                savings: parseNumber(savings),
                loan_promise: parseNumber(loanPromise),
                debts: parseNumber(debts),
                household_type: householdType || "solo",
            });
            onComplete(user);
        } catch (err: any) {
            setError(err.message || "Något gick fel");
            setIsSubmitting(false);
        }
    }

    return (
        <div style={{
            height: "var(--device-height)",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-bg)",
            padding: "0 var(--space-5)",
            overflow: "auto",
        }}>
            {/* Header — on bg for contrast */}
            <div style={{ paddingTop: "var(--space-6)", marginBottom: "var(--space-5)" }}>
                <h1 style={{
                    fontFamily: "var(--font-editorial)",
                    fontSize: "var(--font-size-2xl)",
                    fontWeight: 400,
                    lineHeight: 1.2,
                    marginBottom: "var(--space-2)",
                }}>
                    Välkommen till Nivå
                </h1>
                <p className="body-sm">
                    Berätta om dig och din ekonomi så anpassar vi analysen
                </p>
            </div>

            {/* Form fields — stacked cards */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
            }}>
                <div style={cardStyle}>
                    <label style={labelStyle}>Hur köper du?</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                        {([
                            { type: "solo" as const, label: "Själv" },
                            { type: "together" as const, label: "Ihop" },
                        ]).map((option) => (
                            <button
                                key={option.type}
                                onClick={() => setHouseholdType(option.type)}
                                style={{
                                    flex: 1,
                                    padding: "var(--space-2) var(--space-3)",
                                    background: householdType === option.type ? "var(--color-midnight)" : "white",
                                    color: householdType === option.type ? "white" : "var(--color-text-primary)",
                                    border: householdType === option.type
                                        ? "1.5px solid var(--color-midnight)"
                                        : "1.5px solid var(--color-border)",
                                    borderRadius: "var(--radius-md)",
                                    fontSize: "var(--font-size-xs)",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={cardStyle}>
                    <label style={labelStyle}>Namn</label>
                    <input
                        type="text"
                        placeholder="Ditt förnamn"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div style={cardStyle}>
                    <label style={labelStyle}>Nettoinkomst</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="35 000 kr"
                        value={income}
                        onChange={(e) => setIncome(formatNumber(e.target.value))}
                        style={inputStyle}
                    />
                </div>

                <div style={cardStyle}>
                    <label style={labelStyle}>Sparkapital</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="500 000 kr"
                        value={savings}
                        onChange={(e) => setSavings(formatNumber(e.target.value))}
                        style={inputStyle}
                    />
                </div>
                <div style={cardStyle}>
                    <label style={labelStyle}>Lånelöfte</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="3 000 000 kr"
                        value={loanPromise}
                        onChange={(e) => setLoanPromise(formatNumber(e.target.value))}
                        style={inputStyle}
                    />
                </div>
                <div style={cardStyle}>
                    <label style={labelStyle}>Skulder per månad <span style={{ fontWeight: 400, textTransform: "none" as const }}>(valfritt)</span></label>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
                        CSN, billån, övriga lån
                    </div>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0 kr/mån"
                        value={debts}
                        onChange={(e) => setDebts(formatNumber(e.target.value))}
                        style={inputStyle}
                    />
                </div>

                {householdType === "together" && (
                    <div style={{
                        ...cardStyle,
                        background: "rgba(193, 163, 104, 0.06)",
                        marginBottom: "var(--space-3)",
                    }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>Partners ekonomi</div>
                        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                            Bjud in din partner i nästa steg
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{
                        padding: "var(--space-3) var(--space-4)",
                        background: "rgba(169, 50, 38, 0.06)",
                        color: "#A93226",
                        borderRadius: "var(--radius-md)",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: 500,
                    }}>
                        {error}
                    </div>
                )}
            </div>

            <div style={{ marginTop: "auto", paddingTop: "var(--space-6)", paddingBottom: "var(--space-8)" }}>
                <button
                    className="btn btn-primary btn-lg btn-block"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isValid}
                    style={{ opacity: (isSubmitting || !isValid) ? 0.5 : 1 }}
                >
                    {isSubmitting ? "Skapar din profil..." : "Börja analysera"}
                </button>
            </div>
        </div>
    );
}
