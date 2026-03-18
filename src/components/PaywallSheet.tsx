import React, { useState, useEffect, useRef } from "react";

type PaywallStep = "confirm" | "processing" | "success";

interface PaywallSheetProps {
    isOpen: boolean;
    address: string;
    onClose: () => void;
    onPaymentComplete: () => void;
}

export function PaywallSheet({ isOpen, address, onClose, onPaymentComplete }: PaywallSheetProps) {
    const [step, setStep] = useState<PaywallStep>("confirm");
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const panelRef = useRef<HTMLDivElement>(null);

    // Reset step and drag when sheet opens
    useEffect(() => {
        if (isOpen) {
            setStep("confirm");
            setDragY(0);
        }
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

    // ── Swipe-to-dismiss handlers ──
    function onTouchStart(e: React.TouchEvent) {
        if (step !== "confirm") return; // Only allow dismiss on confirm step
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
    }

    function onTouchMove(e: React.TouchEvent) {
        if (!isDragging) return;
        const delta = e.touches[0].clientY - startY.current;
        // Only allow dragging downward (positive delta)
        setDragY(Math.max(0, delta));
    }

    function onTouchEnd() {
        if (!isDragging) return;
        setIsDragging(false);
        // If dragged more than 100px down, dismiss
        if (dragY > 100) {
            onClose();
        }
        setDragY(0);
    }

    const panelStyle: React.CSSProperties = dragY > 0
        ? { transform: `translateY(${dragY}px)`, transition: isDragging ? "none" : "transform 0.3s ease" }
        : {};

    return (
        <>
            {/* Overlay */}
            <div
                className={`sheet-overlay ${isOpen ? "open" : ""}`}
                onClick={() => step === "confirm" && onClose()}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`sheet-panel ${isOpen ? "open" : ""}`}
                style={panelStyle}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
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
