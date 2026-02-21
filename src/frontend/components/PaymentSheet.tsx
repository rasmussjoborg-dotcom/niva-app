import React, { useState, useEffect } from 'react';
import { haptic } from '../utils/haptics';

type PaymentStep = 'summary' | 'processing' | 'success';

interface PaymentSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    address: string;
}

export const PaymentSheet = ({ isOpen, onClose, onSuccess, address }: PaymentSheetProps) => {
    const [step, setStep] = useState<PaymentStep>('summary');
    const [visible, setVisible] = useState(false);

    // Animate in/out
    useEffect(() => {
        if (isOpen) {
            setStep('summary');
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
        }
    }, [isOpen]);

    const handlePay = () => {
        haptic('success');
        setStep('processing');
        // Simulate payment processing
        setTimeout(() => {
            setStep('success');
            haptic('success');
        }, 1800);
    };

    const handleDone = () => {
        haptic('success');
        setVisible(false);
        setTimeout(() => {
            onSuccess();
            onClose();
        }, 300);
    };

    const handleBackdropClick = () => {
        if (step === 'summary') {
            setVisible(false);
            setTimeout(onClose, 300);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <div
                onClick={handleBackdropClick}
                className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Sheet */}
            <div className={`relative w-full max-w-[500px] bg-page-bg-light dark:bg-page-bg-dark rounded-t-3xl transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-black/10 dark:bg-white/20" />
                </div>

                <div className="px-6 pb-safe-bottom">
                    {step === 'summary' && (
                        <div className="space-y-6 pb-6">
                            {/* Header */}
                            <div className="text-center pt-2">
                                <h2 className="text-[20px] font-display">Lås upp Premium</h2>
                                <p className="text-[13px] text-text-muted mt-1">Engångsköp · ingen prenumeration</p>
                            </div>

                            {/* Order summary */}
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-soft dark:bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-[20px]">home</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold truncate">{address}</p>
                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">Fullständig analys</p>
                                    </div>
                                    <span className="text-[17px] font-semibold tabular-nums">99 kr</span>
                                </div>

                                <hr className="border-border-light dark:border-border-dark" />

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                                        <span className="text-[13px] text-text-secondary">Strategisk analys med alla insikter</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                                        <span className="text-[13px] text-text-secondary">Interaktiv boendekalkyl</span>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <span className="material-symbols-outlined text-primary text-[16px]">check_circle</span>
                                        <span className="text-[13px] text-text-secondary">Obegränsad AI-rådgivning</span>
                                    </div>
                                </div>

                                <hr className="border-border-light dark:border-border-dark" />

                                <div className="flex justify-between items-baseline">
                                    <span className="text-[13px] text-text-muted font-medium">Totalt</span>
                                    <span className="text-[22px] font-display tabular-nums">99 kr</span>
                                </div>
                            </div>

                            {/* Apple Pay / Primary CTA */}
                            <button
                                onClick={handlePay}
                                className="w-full h-[52px] bg-black dark:bg-white text-white dark:text-black font-semibold text-[15px] rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M17.72 7.45c-.17.13-1.67.96-1.67 2.95 0 2.3 2.02 3.11 2.08 3.14-.01.06-.32 1.12-1.07 2.21-.65.94-1.33 1.88-2.4 1.88s-1.32-.62-2.53-.62c-1.18 0-1.6.64-2.59.64s-1.63-.87-2.4-1.94C6.09 14.22 5.31 12.3 5.31 10.5c0-2.9 1.88-4.44 3.74-4.44 .99 0 1.81.65 2.43.65.59 0 1.52-.69 2.64-.69.43 0 1.95.04 2.96 1.47l.64-.04zM14.44 4.29c.5-.59.85-1.42.85-2.24 0-.12-.01-.23-.03-.33-.82.03-1.78.54-2.36 1.21-.43.49-.85 1.32-.85 2.16 0 .13.02.26.03.3.05.01.14.02.22.02.73 0 1.64-.49 2.14-1.12z" />
                                </svg>
                                <span>Betala med Apple Pay</span>
                            </button>

                            {/* Or card */}
                            <button
                                onClick={handlePay}
                                className="w-full h-[48px] bg-surface-input dark:bg-white/5 text-text-main dark:text-white font-medium text-[14px] rounded-2xl flex items-center justify-center gap-2 border border-border-light dark:border-border-dark active:scale-[0.98] transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">credit_card</span>
                                <span>Betala med kort</span>
                            </button>

                            <p className="text-[11px] text-text-muted text-center leading-relaxed">
                                Genom att betala godkänner du våra <span className="underline">villkor</span>. Ingen prenumeration — du betalar bara en gång per objekt.
                            </p>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-5">
                            {/* Spinner */}
                            <div className="w-14 h-14 rounded-full border-[3px] border-border-light dark:border-border-dark border-t-primary animate-spin" />
                            <p className="text-[15px] font-semibold">Behandlar betalning...</p>
                            <p className="text-[13px] text-text-muted">Vänta medan vi bekräftar ditt köp</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-5">
                            {/* Success checkmark */}
                            <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[36px]">check_circle</span>
                            </div>
                            <div className="text-center space-y-1">
                                <h3 className="text-[18px] font-semibold">Betalning genomförd!</h3>
                                <p className="text-[13px] text-text-muted">Din fullständiga analys är nu upplåst</p>
                            </div>
                            <button
                                onClick={handleDone}
                                className="w-full h-[52px] bg-primary text-white font-semibold text-[15px] rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-4"
                            >
                                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                                Visa fullständig analys
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
