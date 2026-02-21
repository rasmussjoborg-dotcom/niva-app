import React, { useState, useEffect } from 'react';
import { BackButton } from './ui/BackButton';

const Step1 = ({ onFinish, onBack, hideHeader }: { onFinish: () => void, onBack: () => void, hideHeader?: boolean }) => {
    const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done'>('idle');

    const handleFetch = () => {
        setFetchState('loading');
        setTimeout(() => {
            setFetchState('done');
            onFinish();
        }, 2500);
    };

    return (
        <div className="flex-1 flex flex-col h-full min-h-0 bg-page-bg-light dark:bg-page-bg-dark">
            {!hideHeader && (
                <nav className="shrink-0 bg-page-bg-light/90 dark:bg-page-bg-dark/90 backdrop-blur-xl px-page-x h-14 flex items-center justify-between border-b border-border-light dark:border-border-dark pt-safe-top z-50">
                    <BackButton onClick={onBack} />
                    <h1 className="text-[15px] font-semibold tracking-tight text-text-main dark:text-white">Starta ny analys</h1>
                    <div className="w-10"></div>
                </nav>
            )}
            <main className="flex-1 overflow-y-auto hide-scrollbar px-page-x pt-6 pb-6 space-y-6">
                {/* Unified search card */}
                <section className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-soft dark:bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[20px]">link</span>
                        </div>
                        <div>
                            <h3 className="text-[15px] font-semibold text-text-main dark:text-white leading-tight">Hitta din bostad</h3>
                            <p className="text-[12px] text-text-muted leading-snug">Klistra in en mäklarlänk för att starta</p>
                        </div>
                    </div>
                    <div className="relative">
                        <input className="w-full h-[56px] bg-surface-input dark:bg-surface-dark rounded-2xl px-5 pr-14 text-[15px] text-text-main dark:text-white placeholder:text-text-placeholder focus:ring-2 focus:ring-primary/20 outline-none transition-all border border-border-light dark:border-border-dark" id="property-link" placeholder="Klistra in mäklarlänken..." type="text" />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[22px]">content_paste</span>
                        </button>
                    </div>
                    {fetchState === 'idle' && (
                        <button onClick={handleFetch} className="w-full h-[56px] bg-primary text-white font-semibold text-[15px] rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-[22px]">search</span>
                            <span>Hämta bostadsdata</span>
                        </button>
                    )}
                </section>

                {/* Loading indicator */}
                {fetchState === 'loading' && (
                    <section className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-5 animate-slide-up">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-soft dark:bg-primary/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[20px] animate-spin">sync</span>
                            </div>
                            <div>
                                <h3 className="text-[15px] font-semibold text-text-main dark:text-white">Hämtar bostadsdata…</h3>
                                <p className="text-[12px] text-text-muted">Sibyllegatan 14, Stockholm</p>
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

const Step2 = ({ onNext, onBack, hideHeader }: { onNext: () => void, onBack: () => void, hideHeader?: boolean }) => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full relative bg-page-bg-light dark:bg-page-bg-dark">
            {!hideHeader && (
                <header className="sticky top-0 z-50 bg-page-bg-light/90 dark:bg-page-bg-dark/90 backdrop-blur-xl px-page-x h-14 flex items-center border-b border-border-light dark:border-border-dark pt-safe-top">
                    <BackButton onClick={onBack} />
                    <h1 className="flex-1 text-center text-[15px] font-semibold tracking-tight text-text-main dark:text-white">Verifierar underlag</h1>
                    <div className="w-10"></div>
                </header>
            )}
            <main className="flex-1 px-page-x py-6 space-y-6 overflow-y-auto hide-scrollbar">
                <section>
                    <div className="relative">
                        <input className="w-full bg-surface-input dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl px-5 py-4 text-[13px] text-text-secondary dark:text-white/60 font-medium focus:ring-0 outline-none" readOnly type="text" value="https://www.hemnet.se/bostad/sibyllegatan-14..." />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                            <span className={`material-symbols-outlined text-[18px] text-text-muted ${loading ? 'animate-spin' : ''}`}>sync</span>
                        </div>
                    </div>
                </section>
                <section className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
                    <div className="p-5 space-y-6">
                        <div>
                            <h2 className="text-[20px] font-bold tracking-tight text-text-main dark:text-white leading-tight">Vi har hittat bostaden</h2>
                            <p className="text-[14px] text-text-secondary mt-1 font-medium">Sibyllegatan 14, Stockholm</p>
                        </div>
                        <div className="space-y-4">
                            {/* Årsredovisning */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`material-icons text-[20px] ${loading ? 'text-border-light dark:text-border-dark' : 'text-emerald-500'}`}>check_circle</span>
                                    <span className="text-[14px] font-medium text-text-main dark:text-white">Årsredovisning</span>
                                </div>
                                <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">{loading ? 'Söker...' : 'Hittad'}</span>
                            </div>
                            {/* Stadgar */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`material-icons text-[20px] ${loading ? 'text-border-light dark:text-border-dark' : 'text-emerald-500'}`}>check_circle</span>
                                    <span className="text-[14px] font-medium text-text-main dark:text-white">Stadgar</span>
                                </div>
                                <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">{loading ? 'Söker...' : 'Hittad'}</span>
                            </div>
                            {/* Energideklaration — highlighted as missing */}
                            <div className="flex items-center justify-between py-4 px-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl border border-amber-200/50 dark:border-amber-500/10">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">error</span>
                                    <span className="text-[14px] font-semibold text-text-main dark:text-white">Energideklaration</span>
                                </div>
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-widest bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">Saknas</span>
                            </div>
                        </div>
                        {/* Manual link input */}
                        <div className="pt-2 space-y-3">
                            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-widest px-1">Hittade vi inte allt?</label>
                            <div className="flex flex-col gap-3">
                                <input className="w-full bg-surface-input dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl px-5 py-4 text-[14px] text-text-main dark:text-white placeholder:text-text-placeholder focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Klistra in länk till PDF eller ladda upp..." type="text" />
                                <button className="bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-2xl text-[14px] font-semibold active:scale-[0.98] transition-all">
                                    Lägg till
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
                <p className="text-center text-[12px] text-text-muted px-8 leading-relaxed">
                    Vi skannar mäklarsidan efter underlag. Om något saknas kan du lägga till det manuellt.
                </p>
            </main>
            <footer className="sticky bottom-0 z-50 px-page-x pt-4 pb-8 bg-page-bg-light/95 dark:bg-page-bg-dark/95 backdrop-blur-xl border-t border-border-light dark:border-border-dark space-y-3">
                <button onClick={onNext} disabled={loading} className={`w-full font-semibold py-4 rounded-2xl text-[15px] tracking-tight transition-all ${loading ? 'bg-surface-input dark:bg-surface-dark text-text-muted cursor-not-allowed border border-border-light dark:border-border-dark' : 'bg-primary text-white active:scale-[0.98]'}`}>
                    {loading ? 'Hämtar underlag…' : 'Se din kostnadsfria priskoll'}
                </button>
                {loading && (
                    <p className="text-[10px] text-center text-text-muted uppercase tracking-widest font-medium">
                        Väntar på samtliga underlag
                    </p>
                )}
            </footer>
        </div>
    )
};

const Step3 = ({ onNext, onBack, hideHeader }: { onNext: () => void, onBack: () => void, hideHeader?: boolean }) => (
    <div className="flex-1 flex flex-col h-full relative bg-page-bg-light dark:bg-page-bg-dark">
        {!hideHeader && (
            <header className="sticky top-0 z-50 bg-page-bg-light/90 dark:bg-page-bg-dark/90 backdrop-blur-xl px-page-x h-14 flex items-center border-b border-border-light dark:border-border-dark pt-safe-top">
                <BackButton onClick={onBack} />
                <h1 className="flex-1 text-center text-[15px] font-semibold tracking-tight text-text-main dark:text-white">Din analys är redo</h1>
                <div className="w-10"></div>
            </header>
        )}
        <main className="flex-1 px-page-x py-6 space-y-6 pb-64 overflow-y-auto hide-scrollbar">
            {/* Property card with image */}
            <section className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-border-light dark:border-border-dark">
                <div className="aspect-[16/9] bg-surface-input dark:bg-surface-dark relative overflow-hidden">
                    <img alt="Property preview" className="w-full h-full object-cover grayscale opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDirPWKt7jYLTa82bc24BsGGWSERYidvmRCoZV9rSe8VK72xp3vrhAaMZ9DjtmaD1kHQZY4Lb9mr87CCYqe4_GEgsT5EWfiTsqeUVf7RdNO7-hiMdkxL22XbneiNXldTmOdZAZaXM0hZ_vy435QmDlmIuUPwIbeUQL3mW9etC4r7StqKuPlEO5rHaKY-MlsfL3B_hDyLqX0MPCQc9hvWCzBVqTfnxEFFHx6LNEOPP7UYfQ5eHVxaoDZqK48bC8etAdfYADoFVzZQ" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                        <div className="space-y-0.5">
                            <h2 className="text-xl font-bold tracking-tight text-text-main dark:text-white">Sibyllegatan 14</h2>
                            <p className="text-[13px] text-text-muted font-medium">Östermalm, Stockholm</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-text-muted font-semibold mb-0.5">Pris</p>
                            <p className="text-lg font-bold text-text-main dark:text-white">11.5M kr</p>
                        </div>
                    </div>
                    {/* Green badge */}
                    <div className="flex items-center gap-2 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                        <span className="material-icons text-emerald-600 dark:text-emerald-400 text-sm">check_circle</span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Handlingar identifierade</span>
                    </div>
                </div>
            </section>

            {/* Indicative Valuation */}
            <section className="space-y-3">
                <h3 className="font-semibold text-[11px] uppercase tracking-widest text-text-muted px-1">Kostnadsfri priskoll</h3>
                <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-border-light dark:border-border-dark">
                    <div className="flex justify-between items-baseline mb-5">
                        <span className="text-xs text-text-muted font-semibold uppercase tracking-wide">Estimering</span>
                        <span className="text-2xl font-bold text-text-main dark:text-white tracking-tighter">11.8M – 12.4M <span className="text-sm font-semibold text-text-muted">SEK</span></span>
                    </div>
                    <div className="relative h-1.5 bg-surface-input dark:bg-surface-dark rounded-full mb-4">
                        <div className="absolute left-[40%] right-[10%] h-full bg-primary rounded-full"></div>
                    </div>
                    <p className="text-[12px] text-text-secondary leading-relaxed">
                        Baserat på slutpriser i området, marknadstrender och objektets unika data.
                    </p>
                </div>
            </section>

            {/* Unlock full analysis section */}
            <section className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark overflow-hidden">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary font-bold">verified_user</span>
                        <h3 className="font-bold text-[19px] tracking-tight text-text-main dark:text-white leading-none">Gör en trygg affär</h3>
                    </div>
                    <p className="text-sm text-text-secondary mb-8">Få tillgång till de djupa insikterna och chatta med din AI-expert.</p>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-primary-soft dark:bg-primary/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[14px] font-semibold text-text-main dark:text-white leading-tight">Ekonomisk trygghet</h4>
                                <p className="text-[12px] text-text-muted leading-snug">Vi granskar dolda skulder och varnar för framtida avgiftshöjningar.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-primary-soft dark:bg-primary/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[20px]">monitoring</span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[14px] font-semibold text-text-main dark:text-white leading-tight">Stresstesta kalkylen</h4>
                                <p className="text-[12px] text-text-muted leading-snug">Se exakt hur din plånbok påverkas av ränta och amortering.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-10 h-10 shrink-0 bg-primary-soft dark:bg-primary/10 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[20px]">bolt</span>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[14px] font-semibold text-text-main dark:text-white leading-tight">AI-expert</h4>
                                <p className="text-[12px] text-text-muted leading-snug">Ställ obegränsat med frågor om föreningen, kalkylen och dokumenten.</p>
                            </div>
                        </div>
                    </div>
                    {/* Price and payment icons */}
                    <div className="mt-8 pt-6 border-t border-border-light dark:border-border-dark">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-1">Engångskostnad</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-text-main dark:text-white">99 kr</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-14 bg-white dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark flex items-center justify-center p-2">
                                    <div className="flex gap-0.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#EA001B]"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]"></div>
                                    </div>
                                </div>
                                <div className="h-10 w-14 bg-text-main dark:bg-white rounded-lg flex items-center justify-center">
                                    <span className="text-[11px] font-bold text-white dark:text-text-main italic tracking-tighter">Pay</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
        <footer className="sticky bottom-0 z-50 bg-page-bg-light/95 dark:bg-page-bg-dark/95 backdrop-blur-xl border-t border-border-light dark:border-border-dark px-page-x pt-4 pb-8 space-y-4">
            <button onClick={onNext} className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-[16px] active:scale-[0.98] transition-transform flex items-center justify-center">
                Lås upp fullständig analys (99 kr)
            </button>
            <p className="text-[10px] text-center text-text-muted leading-tight px-6 uppercase tracking-widest font-medium">
                Full tillgång direkt • Ingen prenumeration
            </p>
        </footer>
    </div>
);

const Step4 = ({ onFinish, onBack }: { onFinish: () => void, onBack: () => void }) => (
    <div className="absolute inset-0 z-50">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" onClick={onBack}></div>

        {/* Payment Sheet */}
        <div className="absolute inset-x-0 bottom-0 z-50 animate-slide-up">
            {/* Sheet Handle */}
            <div className="flex justify-center mb-2">
                <div className="h-1.5 w-10 bg-white/40 rounded-full"></div>
            </div>
            {/* Main White Sheet */}
            <div className="bg-white rounded-t-[24px] px-6 pt-6 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                {/* Apple Pay Header */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-black text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>ios</span>
                        <span className="font-semibold text-xl tracking-tight text-black">Pay</span>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                    {/* Purchase Row */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                        <div className="flex flex-col">
                            <span className="text-[15px] font-medium text-black">Analys: Sibyllegatan 14</span>
                        </div>
                        <span className="text-[15px] font-medium text-black">99,00 kr</span>
                    </div>
                    {/* Payment Method Row */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Betalningsmetod</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-8 h-5 bg-black rounded-sm flex items-center justify-center">
                                    <div className="w-3 h-3 border border-white/20 rounded-full"></div>
                                </div>
                                <span className="text-[15px] font-medium text-black">Visa •••• 1234</span>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                    {/* Contact Row */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div className="flex flex-col">
                            <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Kontakt</span>
                            <span className="text-[15px] font-medium text-black">epost@exempel.se</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                    {/* Total Row */}
                    <div className="flex justify-between items-center pt-2 pb-8">
                        <span className="text-lg font-bold text-black">TOTALT</span>
                        <span className="text-2xl font-bold text-black">99,00 kr</span>
                    </div>
                </div>

                {/* Auth/Confirmation Zone */}
                <div className="flex flex-col items-center gap-4 mt-4">
                    <div className="flex flex-col items-center justify-center">
                        <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(155,127,255,0.15)] cursor-pointer" onClick={() => { onFinish(); }}>
                            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'wght' 200" }}>face</span>
                        </div>
                        <p className="text-[15px] font-medium text-black">Bekräfta med FaceID</p>
                    </div>
                </div>
            </div>
        </div>


    </div>
);

export const NewAnalysis = ({ onFinish, onBack, hideHeader }: { onFinish: () => void, onBack: () => void, hideHeader?: boolean }) => {
    const [step, setStep] = useState(1);

    const prevStep = () => {
        if (step > 1) setStep(s => s - 1);
        else onBack();
    };

    return (
        <div className={`w-full h-full bg-page-bg-light dark:bg-page-bg-dark text-text-main dark:text-white relative ${hideHeader ? 'hide-inner-headers' : ''}`}>
            {step === 1 && <Step1 onFinish={onFinish} onBack={onBack} hideHeader={hideHeader} />}
        </div>
    );
};
