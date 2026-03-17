import React, { useState, useEffect } from "react";

type PaywallStep = "confirm" | "processing" | "success";

interface PaywallSheetProps {
    isOpen: boolean;
    address: string;
    onClose: () => void;
    onPaymentComplete: () => void;
}

export function PaywallSheet({ isOpen, address, onClose, onPaymentComplete }: PaywallSheetProps) {
    const [step, setStep] = useState<PaywallStep>("confirm");

    // Reset step when sheet opens
    useEffect(() => {
        if (isOpen) setStep("confirm");
    }, [isOpen]);

    function handlePay(method: "apple" | "swish") {
        setStep("processing");

        // Simulated payment — 2s "processing" → success → 1s → close & unlock
        setTimeout(() => {
            setStep("success");
            setTimeout(() => {
                onClose();
                onPaymentComplete();
            }, 1000);
        }, 2000);
    }

    return (
        <>
            {/* Overlay */}
            <div
                className={`sheet-overlay ${isOpen ? "open" : ""}`}
                onClick={() => step === "confirm" && onClose()}
            />

            {/* Panel */}
            <div className={`sheet-panel ${isOpen ? "open" : ""}`}>
                <div className="sheet-handle" />
                <div className="sheet-body">

                    {step === "confirm" && (
                        <>
                            <div className="paywall-title">Djupanalys</div>
                            <div className="paywall-address">{address}</div>

                            <div className="paywall-features">
                                {[
                                    "Föreningens ekonomi",
                                    "Frågor till mäklaren",
                                    "Bud-Simulator",
                                ].map((f) => (
                                    <div key={f} className="paywall-feature-item">
                                        <span className="paywall-feature-check">✓</span>
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="paywall-price-line">
                                <span className="paywall-price-amount">99 kr</span> · engångsköp för denna bostad
                            </div>

                            <button
                                className="paywall-btn paywall-btn-primary"
                                onClick={() => handlePay("apple")}
                            >
                                <span className="btn-icon"></span>
                                Betala med Apple Pay
                            </button>

                            <button
                                className="paywall-btn paywall-btn-secondary"
                                onClick={() => handlePay("swish")}
                            >
                                Betala med Swish
                            </button>

                            <div className="paywall-trust">
                                Pengarna tillbaka om analysen inte kan genomföras.
                            </div>
                        </>
                    )}

                    {step === "processing" && (
                        <div className="paywall-processing">
                            <div className="paywall-spinner" />
                            <div className="paywall-processing-label">Verifierar betalning...</div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="paywall-success">
                            <div className="paywall-success-check">✓</div>
                            <div className="paywall-success-label">Betalning genomförd</div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
