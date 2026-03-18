import React from "react";

interface SplashScreenProps {
    onContinue: () => void;
}

export function SplashScreen({ onContinue }: SplashScreenProps) {
    return (
        <div style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            background: "var(--color-bg)",
            padding: "0 var(--space-5)",
            overflow: "hidden",
            position: "relative",
        }}>
            {/* Top spacer */}
            <div style={{ flex: 1.2 }} />

            {/* Brand block */}
            <div style={{ animation: "fadeIn 1s ease", position: "relative", zIndex: 1 }}>
                <h1 style={{
                    fontFamily: "var(--font-editorial)",
                    fontSize: "5.5rem",
                    fontWeight: 400,
                    letterSpacing: "-0.03em",
                    color: "var(--color-midnight)",
                    lineHeight: 0.9,
                    marginBottom: "var(--space-3)",
                }}>
                    Nivå
                </h1>
                <p style={{
                    fontSize: "var(--font-size-lg)",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.4,
                    maxWidth: 280,
                }}>
                    Förstå vad ditt nästa hem verkligen kostar
                </p>
            </div>

            {/* Spacer */}
            <div style={{ flex: 0.8 }} />

            {/* Feature pills — minimal, scannable */}
            <div style={{
                animation: "slideUp 0.8s ease 0.3s both",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
                position: "relative",
                zIndex: 1,
            }}>
                {[
                    { title: "Marknadsvärde", desc: "Jämför pris mot verifierad data" },
                    { title: "Föreningens hälsa", desc: "Vi läser årsredovisningen åt dig" },
                    { title: "Din budget", desc: "Se om kalkylen håller" },
                    { title: "Nivå-betyg", desc: "Sammanvägt betyg på varje bostad" },
                    { title: "Booli-koppling", desc: "Klistra in en länk, få full analys" },
                ].map((item, i) => (
                    <div key={i} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        padding: "var(--space-3) var(--space-4)",
                        background: "white",
                        borderRadius: "var(--radius-lg)",
                        animation: `slideUp 0.5s ease ${0.3 + i * 0.08}s both`,
                    }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                                fontWeight: 600,
                                fontSize: "var(--font-size-sm)",
                                color: "var(--color-text-primary)",
                            }}>
                                {item.title}
                            </span>
                            <span style={{
                                fontSize: "var(--font-size-xs)",
                                color: "var(--color-text-muted)",
                                marginLeft: "var(--space-2)",
                            }}>
                                {item.desc}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div style={{ flex: 0.5 }} />
            <div style={{
                animation: "slideUp 0.8s ease 0.7s both",
                paddingBottom: "var(--space-8)",
                position: "relative",
                zIndex: 1,
            }}>
                <button
                    className="btn btn-primary btn-lg btn-block"
                    onClick={onContinue}
                >
                    Analysera din första bostad
                </button>
            </div>
        </div>
    );
}
