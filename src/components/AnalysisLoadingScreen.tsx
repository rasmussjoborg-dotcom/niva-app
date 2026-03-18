import React, { useState, useEffect } from "react";

interface Step {
    label: string;
    delay: number;
}

const STEPS: Step[] = [
    { label: "Hämtar bostadsdata…", delay: 0 },
    { label: "Analyserar föreningens ekonomi…", delay: 2000 },
    { label: "Sammanställer resultat…", delay: 4500 },
];

interface Props {
    address?: string;
    onComplete?: () => void;
}

export function AnalysisLoadingScreen({ address, onComplete }: Props) {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        const timers = STEPS.map((step, i) => {
            if (i === 0) return null;
            return setTimeout(() => setActiveStep(i), step.delay);
        });

        return () => timers.forEach((t) => t && clearTimeout(t));
    }, []);

    // Overall progress 0→1
    const progress = (activeStep + 1) / STEPS.length;

    return (
        <div style={{ marginBottom: "var(--space-5)" }}>
            {/* Inline card — replaces the premium showcase card */}
            <div style={{
                background: "white",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-6) var(--space-5)",
                textAlign: "center",
            }}>
                {/* Address context */}
                {address && (
                    <div style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "var(--color-text-muted)",
                        marginBottom: "var(--space-5)",
                    }}>
                        {address}
                    </div>
                )}

                {/* Animated N mark */}
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto var(--space-5)",
                    position: "relative",
                }}>
                    {/* Spinning arc */}
                    <svg width="56" height="56" viewBox="0 0 56 56" style={{
                        position: "absolute",
                        inset: 0,
                        animation: "spin 1.6s linear infinite",
                    }}>
                        <circle
                            cx="28" cy="28" r="26"
                            fill="none"
                            stroke="var(--color-gold)"
                            strokeWidth="2"
                            strokeDasharray="40 124"
                            strokeLinecap="round"
                        />
                    </svg>
                    <span style={{
                        fontFamily: "var(--font-editorial)",
                        fontSize: "1.25rem",
                        color: "var(--color-midnight)",
                        position: "relative",
                    }}>N</span>
                </div>

                {/* Current step label */}
                <div style={{
                    fontFamily: "var(--font-editorial)",
                    fontSize: "var(--font-size-lg)",
                    fontWeight: 400,
                    color: "var(--color-text-primary)",
                    marginBottom: "var(--space-2)",
                }}>
                    {STEPS[activeStep].label}
                </div>

                {/* Subtitle */}
                <div style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-muted)",
                    marginBottom: "var(--space-5)",
                }}>
                    Detta tar vanligtvis 5–10 sekunder
                </div>

                {/* Progress bar */}
                <div style={{
                    height: 3,
                    background: "var(--color-stone)",
                    borderRadius: "var(--radius-full)",
                    overflow: "hidden",
                }}>
                    <div style={{
                        height: "100%",
                        width: `${progress * 100}%`,
                        background: "var(--color-gold)",
                        borderRadius: "var(--radius-full)",
                        transition: "width 0.6s ease",
                    }} />
                </div>

                {/* Step indicators */}
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "var(--space-2)",
                    marginTop: "var(--space-4)",
                }}>
                    {STEPS.map((_, i) => (
                        <div key={i} style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: i <= activeStep ? "var(--color-gold)" : "var(--color-stone)",
                            transition: "background 0.4s ease",
                        }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
