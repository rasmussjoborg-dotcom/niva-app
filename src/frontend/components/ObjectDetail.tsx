import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { BackButton } from './ui/BackButton';
import { haptic } from '../utils/haptics';
import type { AnalysisData } from '../types';

interface ObjectDetailProps {
    onBack: () => void;
    onOpenChat: () => void;
    analysis: AnalysisData;
    hideHeader?: boolean;
}

export const ObjectDetail = ({ onBack, onOpenChat, analysis, hideHeader }: ObjectDetailProps) => {
    const { combinedIncome, isHousehold, state } = useHousehold();
    const [budniva, setBudniva] = useState(12.5);
    const [kontantinsats, setKontantinsats] = useState(3.1);
    const [ranta, setRanta] = useState(4.5);
    const [avgift, setAvgift] = useState(4500);
    const [isPremium, setIsPremium] = useState(false);
    const isPartnerLinked = isHousehold && state.partner?.linked;

    const loanAmount = (budniva * 1000000) - (kontantinsats * 1000000);
    const monthlyInterest = (loanAmount * (ranta / 100)) / 12;
    const monthlyAmort = loanAmount > budniva * 700000 ? loanAmount * 0.02 / 12 : loanAmount * 0.01 / 12;
    const pengarOver = combinedIncome - monthlyInterest - monthlyAmort - avgift;

    const formatKr = (n: number) => new Intl.NumberFormat('sv-SE').format(Math.round(n));
    const formatMKr = (n: number) => new Intl.NumberFormat('sv-SE').format(Math.round(n));

    const handleUnlock = () => {
        haptic('impact');
        setIsPremium(true);
    };

    return (
        <div className={`w-full h-full bg-page-bg-light dark:bg-page-bg-dark relative overflow-hidden flex flex-col ${hideHeader ? 'hide-inner-headers' : ''}`}>
            {/* ── Nav (only when not managed by App shell) ── */}
            {!hideHeader && (
                <nav className="sticky top-0 w-full bg-page-bg-light/90 dark:bg-page-bg-dark/90 backdrop-blur-xl z-50 pt-safe-top">
                    <div className="flex items-center justify-between px-page-x h-14">
                        <BackButton onClick={onBack} />
                        <h1 className="text-[15px] font-semibold tracking-tight text-center">{analysis.address}</h1>
                        <div className="w-10"></div>
                    </div>
                </nav>
            )}

            {/* ── Scrollable Content ── */}
            <main className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
                {/* Hero Image */}
                <div className="mx-page-x mt-2 aspect-[16/10] overflow-hidden rounded-2xl">
                    <img
                        alt={`${analysis.address} interior`}
                        className="w-full h-full object-cover"
                        src={analysis.imageUrl}
                    />
                </div>

                <div className="px-page-x space-y-6 pt-5">
                    {/* Price + Avatars */}
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[13px] text-text-muted mb-1">Utgångspris</p>
                            <h2 className="text-[30px] font-display tabular-nums">{analysis.price}</h2>
                        </div>
                        <div className="flex -space-x-2 pb-1">
                            <img alt="Du" className="size-9 rounded-full border-2 border-page-bg-light dark:border-page-bg-dark" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWzmKf6lHJw9jFDvZTe2EKWjI_yIbuHl08kvULqvVvsShnOBTiHhLStTiWAWEwUfkuUbQEym6VtQlWpfCYPOt1VYsJqBW8b17L4vSG69_jurg1DmOP8cIFsJJ0aI0re5a-tiVou1bWnfjIt4l0LxJzL3wCqeTSawheQWgUdLBKtwxxeMQxBBZUfQYd5hlZ7L3zH-RcYaY030cDlEP0jHZvmVyIcYyf0vGPo0ZkrMZYGma9GUl8gG0CPFc5Nw3BpeWj94EsvRWmTw" />
                            {isPartnerLinked && state.partner && (
                                <img alt={state.partner.name} className="size-9 rounded-full border-2 border-page-bg-light dark:border-page-bg-dark" src={state.partner.avatarUrl} />
                            )}
                        </div>
                    </div>

                    {/* Stats — consistent gray bg chips */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-3.5 text-center">
                            <p className="text-[11px] text-text-muted mb-1 font-medium">Marknadsvärde</p>
                            <p className="text-[15px] font-semibold tabular-nums">{analysis.valuation}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-3.5 text-center">
                            <p className="text-[11px] text-text-muted mb-1 font-medium">Förening</p>
                            <p className="text-[15px] font-semibold">{analysis.brf}</p>
                        </div>
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-3.5 text-center">
                            <p className="text-[11px] text-text-muted mb-1 font-medium">{isHousehold ? 'Hushåll' : 'Utrymme'}</p>
                            {isPremium ? (
                                <p className="text-[15px] font-semibold tabular-nums">{analysis.marginal}</p>
                            ) : (
                                <span className="material-symbols-outlined text-text-muted text-[20px]">lock</span>
                            )}
                        </div>
                    </div>

                    {/* AI Summary — shown first so user sees teaser before upsell */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                            <h3 className="text-[13px] font-semibold uppercase tracking-wider">Strategisk analys</h3>
                        </div>
                        <ul className="space-y-3">
                            {/* First bullet — always visible */}
                            <li className="flex items-start gap-3">
                                <span className="size-1.5 rounded-full bg-primary dark:bg-white mt-2 shrink-0"></span>
                                <p className="text-[14px] leading-relaxed text-text-secondary dark:text-white/80 text-pretty"><strong className="font-semibold text-black dark:text-white">Finansiell styrka:</strong> Mycket låg belåning (2 400 kr/kvm) ger stor trygghet vid framtida räntehöjningar.</p>
                            </li>
                            {isPremium ? (
                                <>
                                    <li className="flex items-start gap-3">
                                        <span className="size-1.5 rounded-full bg-primary dark:bg-white mt-2 shrink-0"></span>
                                        <p className="text-[14px] leading-relaxed text-text-secondary dark:text-white/80 text-pretty"><strong className="font-semibold text-black dark:text-white">Värdepotential:</strong> Kombinationen av toppskick och eftertraktat läge indikerar en stabil värdeutveckling över tid.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="size-1.5 rounded-full bg-primary dark:bg-white mt-2 shrink-0"></span>
                                        <p className="text-[14px] leading-relaxed text-text-secondary dark:text-white/80 text-pretty"><strong className="font-semibold text-black dark:text-white">Räntekänslighet:</strong> Föreningen tål en ränteuppgång till 5,5 % utan att kassaflödet blir negativt.</p>
                                    </li>
                                </>
                            ) : (
                                <li className="flex items-center gap-2.5 pt-1">
                                    <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                                    <p className="text-[13px] text-text-muted italic">+2 insikter med Premium</p>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* ── Premium Upsell (below Strategisk analys) ── */}
                    {!isPremium && (
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 space-y-5 border-2 border-primary/20 dark:border-primary/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">Premium</div>
                            <div>
                                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-text-muted">Fullständig analys</h3>
                                <p className="text-[13px] text-text-secondary mt-1 leading-relaxed text-pretty">Fördjupad genomgång av föreningen, ränterisker och obegränsad AI-rådgivning.</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-soft dark:bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-text-main dark:text-white">Föreningens finanser</p>
                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">Dolda skulder, prognoser, avgiftsrisker</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-soft dark:bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-[20px]">query_stats</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-text-main dark:text-white">Räntetest</p>
                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">Se hur din marginal förändras vid ränteuppgång</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary-soft dark:bg-primary/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-text-main dark:text-white">AI-expert</p>
                                        <p className="text-[11px] text-text-muted uppercase tracking-wider">Ställ obegränsat med frågor om föreningen</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleUnlock} className="w-full h-[52px] bg-primary text-white font-semibold text-[15px] rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                                <span className="material-symbols-outlined text-[20px]">lock_open</span>
                                Lås upp fullständig analys — 99 kr
                            </button>
                        </div>
                    )}

                    {/* Cost Calculator — locked when free */}
                    <div className="relative">
                        {!isPremium && (
                            <div className="absolute inset-0 z-10 bg-white/60 dark:bg-surface-dark/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-surface-input dark:bg-white/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-text-muted text-[28px]">lock</span>
                                </div>
                                <p className="text-[14px] font-semibold text-text-main dark:text-white">Premium-funktion</p>
                                <p className="text-[12px] text-text-muted text-center max-w-[200px]">Lås upp för att justera din boendekalkyl</p>
                            </div>
                        )}
                        <div className={`bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-border-light dark:border-border-dark ${!isPremium ? 'pointer-events-none' : ''}`}>
                            <div className="p-5 space-y-7">
                                {/* Header */}
                                <div className="flex items-center justify-between pb-4 border-b border-border-light dark:border-border-dark">
                                    <h3 className="text-[13px] font-semibold uppercase tracking-wider">Din boendekalkyl</h3>
                                    <span className="material-symbols-outlined text-text-muted text-[18px]">tune</span>
                                </div>

                                {/* Budnivå */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-[13px] text-text-muted font-medium">Ditt maxbud</label>
                                        <span className="text-[17px] font-semibold tabular-nums">
                                            {formatMKr(budniva * 1000000)} <span className="text-[13px] text-text-muted">kr</span>
                                        </span>
                                    </div>
                                    <input
                                        className="niva-slider w-full"
                                        type="range" min="10" max="15" step="0.1"
                                        value={budniva}
                                        onChange={(e) => { setBudniva(parseFloat(e.target.value)); haptic('selection'); }}
                                    />
                                    <div className="flex justify-between text-[11px] text-text-muted font-medium tabular-nums">
                                        <span>10M</span><span>15M</span>
                                    </div>
                                </div>

                                {/* Kontantinsats */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-[13px] text-text-muted font-medium">Egen finansiering</label>
                                        <span className="text-[17px] font-semibold tabular-nums">
                                            {formatMKr(kontantinsats * 1000000)} <span className="text-[13px] text-text-muted">kr</span>
                                        </span>
                                    </div>
                                    <input
                                        className="niva-slider w-full"
                                        type="range" min="0" max={budniva} step="0.1"
                                        value={kontantinsats}
                                        onChange={(e) => { setKontantinsats(parseFloat(e.target.value)); haptic('selection'); }}
                                    />
                                    <div className="flex justify-between items-center bg-surface-input dark:bg-white/5 px-4 py-3 rounded-xl">
                                        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">Behov av bolån</span>
                                        <span className="text-[15px] font-semibold tabular-nums">{formatKr(loanAmount)} kr</span>
                                    </div>
                                </div>

                                {/* Ränta */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-[13px] text-text-muted font-medium">Förväntad ränta</label>
                                        <span className="text-[17px] font-semibold tabular-nums">
                                            {ranta.toFixed(2)} <span className="text-[13px] text-text-muted">%</span>
                                        </span>
                                    </div>
                                    <input
                                        className="niva-slider w-full"
                                        type="range" min="1" max="8" step="0.1"
                                        value={ranta}
                                        onChange={(e) => { setRanta(parseFloat(e.target.value)); haptic('selection'); }}
                                    />
                                    <div className="flex justify-between text-[11px] text-text-muted font-medium tabular-nums">
                                        <span>1,0%</span>
                                        <span className="opacity-60">Snitt: 4,1 %</span>
                                        <span>8,0%</span>
                                    </div>
                                </div>

                                {/* Avgift */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <label className="text-[13px] text-text-muted font-medium">Månadsavgift</label>
                                        <span className="text-[17px] font-semibold tabular-nums">
                                            {formatKr(avgift)} <span className="text-[13px] text-text-muted">kr</span>
                                        </span>
                                    </div>
                                    <input
                                        className="niva-slider w-full"
                                        type="range" min="1000" max="12000" step="100"
                                        value={avgift}
                                        onChange={(e) => { setAvgift(parseFloat(e.target.value)); haptic('selection'); }}
                                    />
                                    <div className="flex justify-between text-[11px] text-text-muted font-medium tabular-nums">
                                        <span>1 000 kr</span><span>12 000 kr</span>
                                    </div>
                                </div>
                            </div>

                            {/* Result */}
                            <div className="bg-warm-tint dark:bg-white/5 p-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] text-text-muted font-medium">Kvar i plånboken</span>
                                    <span className={`text-[28px] font-semibold tracking-tight tabular-nums ${pengarOver >= 0 ? 'text-black dark:text-white' : 'text-error'}`}>
                                        {pengarOver >= 0 ? '+' : ''}{formatKr(pengarOver)} kr
                                    </span>
                                </div>
                                <p className="text-[12px] text-text-muted mt-2 leading-relaxed text-pretty">{isHousehold ? 'Beräknat för hela hushållet.' : 'Ränta, amortering, avgift och uppskattade levnadskostnader är inräknade.'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="px-5 py-4">
                    {isPremium ? (
                        <button
                            onClick={onOpenChat}
                            className="w-full bg-primary dark:bg-white text-white dark:text-black py-4 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2.5 active:opacity-80 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-xl">forum</span>
                            <span>Ställ frågor till AI-experten</span>
                        </button>
                    ) : (
                        <button
                            disabled
                            className="w-full bg-surface-input dark:bg-white/5 text-text-placeholder dark:text-white/25 py-4 rounded-xl font-medium text-[15px] flex items-center justify-center gap-2.5 cursor-not-allowed border border-border-light dark:border-border-dark"
                        >
                            <span className="material-symbols-outlined text-[18px]">lock</span>
                            <span>Ställ frågor till AI-experten</span>
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};
