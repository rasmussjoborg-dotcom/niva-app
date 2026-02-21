import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import type { AnalysisData } from '../types';

interface HomeProps {
    onNewAnalysis: () => void;
    onOpenAnalysis: (index: number) => void;
    onOpenProfile: () => void;
    analyses: AnalysisData[];
}

const CARD_INSIGHTS = [
    { icon: 'trending_up', label: 'Styrka', text: 'Mycket låg skuldsättning (2 500 kr/kvm) ger god trygghet vid räntehöjningar.' },
    { icon: 'warning_amber', label: 'Risk', text: 'Prognosen indikerar en avgiftshöjning på ca 15% inom 12 månader.' },
    { icon: 'verified', label: 'Trygghet', text: 'Föreningen har starka reserver och inga ofinansierade renoveringar.' },
];

const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWzmKf6lHJw9jFDvZTe2EKWjI_yIbuHl08kvULqvVvsShnOBTiHhLStTiWAWEwUfkuUbQEym6VtQlWpfCYPOt1VYsJqBW8b17L4vSG69_jurg1DmOP8cIFsJJ0aI0re5a-tiVou1bWnfjIt4l0LxJzL3wCqeTSawheQWgUdLBKtwxxeMQxBBZUfQYd5hlZ7L3zH-RcYaY030cDlEP0jHZvmVyIcYyf0vGPo0ZkrMZYGma9GUl8gG0CPFc5Nw3BpeWj94EsvRWmTw';

export const Home = ({ onNewAnalysis, onOpenAnalysis, onOpenProfile, analyses }: HomeProps) => {
    const { state, isHousehold } = useHousehold();
    const isPartnerLinked = isHousehold && state.partner?.linked;
    const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done'>('idle');

    const handleFetch = () => {
        setFetchState('loading');
        setTimeout(() => {
            setFetchState('done');
        }, 2500);
    };

    return (
        <div className="w-full h-full bg-page-bg-light dark:bg-page-bg-dark relative overflow-hidden flex flex-col">
            {/* ── Header ── */}
            <header className="px-page-x py-4 flex justify-between items-center z-10 sticky top-0 bg-page-bg-light/90 dark:bg-page-bg-dark/90 backdrop-blur-xl pt-safe-top">
                <h1 className="text-[24px] font-display italic text-text-main dark:text-white">Nivå</h1>
                <button
                    onClick={onOpenProfile}
                    className="size-9 rounded-full overflow-hidden active:scale-95 transition-transform"
                >
                    <img
                        alt="Profil"
                        className="size-full object-cover"
                        src={USER_AVATAR}
                    />
                </button>
            </header>

            {/* ── Main ── */}
            <main className="flex-1 overflow-y-auto pb-safe-bottom hide-scrollbar">
                {/* Hero */}
                <div className="px-page-x pt-4 pb-8">
                    <div className="mb-6 animate-slide-up">
                        <h2 className="text-[30px] font-display leading-[1.15] text-balance text-text-main dark:text-white">
                            Se om du har råd<br /><em>innan du lägger bud</em>
                        </h2>
                    </div>

                    {/* ── Inline Search Card ── */}
                    <div className="animate-slide-up stagger-1">
                        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark p-5 space-y-4">
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
                                <input className="w-full h-[56px] bg-surface-input dark:bg-surface-dark rounded-2xl px-5 pr-14 text-[15px] text-text-main dark:text-white placeholder:text-text-placeholder focus:ring-2 focus:ring-primary/20 outline-none transition-all border border-border-light dark:border-border-dark" id="property-link" placeholder="Klistra in mäklarlänken..." type="text" readOnly={fetchState !== 'idle'} />
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
                            {fetchState === 'loading' && (
                                <div className="flex items-center gap-3 py-3">
                                    <span className="material-symbols-outlined text-primary text-[20px] animate-spin">sync</span>
                                    <div>
                                        <p className="text-[14px] font-semibold text-text-main dark:text-white">Hämtar bostadsdata…</p>
                                        <p className="text-[12px] text-text-muted">Sibyllegatan 14, Stockholm</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Fetch Results (inside same card) ── */}
                            {fetchState === 'done' && (
                                <div className="animate-slide-up space-y-4">
                                    <hr className="border-border-light dark:border-border-dark -mx-5" />
                                    <div>
                                        <h2 className="text-[18px] font-bold tracking-tight text-text-main dark:text-white leading-tight">Vi har hittat bostaden</h2>
                                        <p className="text-[13px] text-text-secondary mt-1 font-medium">Sibyllegatan 14, Stockholm</p>
                                    </div>
                                    <div className="space-y-3">
                                        {/* Årsredovisning — found */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="material-icons text-[20px] text-emerald-500">check_circle</span>
                                                <span className="text-[14px] font-medium text-text-main dark:text-white">Årsredovisning</span>
                                            </div>
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Hittad</span>
                                        </div>
                                        {/* Stadgar — found */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="material-icons text-[20px] text-emerald-500">check_circle</span>
                                                <span className="text-[14px] font-medium text-text-main dark:text-white">Stadgar</span>
                                            </div>
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Hittad</span>
                                        </div>
                                        {/* Ekonomisk plan — found */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="material-icons text-[20px] text-emerald-500">check_circle</span>
                                                <span className="text-[14px] font-medium text-text-main dark:text-white">Ekonomisk plan</span>
                                            </div>
                                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Hittad</span>
                                        </div>
                                        {/* Energideklaration — missing */}
                                        <div className="flex items-center justify-between py-3 px-4 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl border border-amber-200/50 dark:border-amber-500/10">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">error</span>
                                                <span className="text-[14px] font-semibold text-text-main dark:text-white">Energideklaration</span>
                                            </div>
                                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-widest bg-amber-100 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg">Saknas</span>
                                        </div>
                                    </div>

                                    {/* Manual upload */}
                                    <div className="pt-1 space-y-3">
                                        <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-widest px-1">Hittade vi inte allt?</label>
                                        <div className="flex gap-3">
                                            <input className="flex-1 bg-surface-input dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl px-4 py-3.5 text-[14px] text-text-main dark:text-white placeholder:text-text-placeholder focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Länk till PDF eller ladda upp…" type="text" />
                                            <button className="shrink-0 bg-primary hover:bg-primary/90 text-white px-5 py-3.5 rounded-2xl text-[14px] font-semibold active:scale-[0.98] transition-all">
                                                Lägg till
                                            </button>
                                        </div>
                                    </div>

                                    {/* Continue button */}
                                    <button onClick={onNewAnalysis} className="w-full h-[56px] bg-primary text-white font-semibold text-[15px] rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                                        <span>Fortsätt till analys</span>
                                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                    </button>
                                    <p className="text-center text-[12px] text-text-muted leading-relaxed">
                                        Du kan lägga till saknade dokument senare.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Property Cards ── */}
                <section className="px-page-x pb-12">
                    <div className="flex justify-between items-baseline mb-5 animate-slide-up stagger-2">
                        <h2 className="text-[17px] font-semibold text-text-main dark:text-white">Dina analyser</h2>
                        <span className="text-sm text-text-muted tabular-nums">{analyses.length}</span>
                    </div>

                    <div className="space-y-5">
                        {analyses.map((analysis, index) => (
                            <div
                                key={index}
                                className={`bg-white dark:bg-surface-dark rounded-2xl overflow-hidden active:scale-[0.98] cursor-pointer transition-transform animate-slide-up stagger-${index + 3}`}
                                onClick={() => onOpenAnalysis(index)}
                            >
                                {/* Hero Image — full width, large */}
                                <div className="aspect-[16/10] w-full overflow-hidden">
                                    <img
                                        className="w-full h-full object-cover"
                                        src={analysis.imageUrl}
                                        alt={`${analysis.address} — ${analysis.area}`}
                                    />
                                </div>

                                {/* Info block */}
                                <div className="p-5 pb-3">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-[17px] leading-tight text-text-main dark:text-white">{analysis.address}</h3>
                                        {/* Avatar stack */}
                                        <div className="flex -space-x-1.5 shrink-0 ml-3">
                                            <div className="size-6 rounded-full border-2 border-white dark:border-surface-dark overflow-hidden">
                                                <img className="size-full object-cover" src={USER_AVATAR} alt="Du" />
                                            </div>
                                            {isPartnerLinked && state.partner && (
                                                <div className="size-6 rounded-full border-2 border-white dark:border-surface-dark overflow-hidden">
                                                    <img className="size-full object-cover" src={state.partner.avatarUrl} alt={state.partner.name} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-muted mb-4">{analysis.area} · {analysis.price}</p>

                                    {/* Data chips */}
                                    <div className="flex gap-2 flex-wrap">
                                        <span className="bg-accent-soft dark:bg-accent/10 rounded-lg px-3 py-1.5 text-xs font-medium text-accent-dark dark:text-accent-light tabular-nums">
                                            {analysis.valuation}
                                        </span>
                                        <span className="bg-accent-soft dark:bg-accent/10 rounded-lg px-3 py-1.5 text-xs font-medium text-accent-dark dark:text-accent-light">
                                            {analysis.brf}
                                        </span>
                                        {analysis.unlocked && (
                                            <span className="bg-accent-soft dark:bg-accent/10 rounded-lg px-3 py-1.5 text-xs font-medium text-accent-dark dark:text-accent-light tabular-nums">
                                                {isHousehold ? 'Hushåll' : 'Marginal'}: {analysis.marginal}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* AI Insight (unlocked) */}
                                {analysis.unlocked && CARD_INSIGHTS[index] && (
                                    <div className="mx-5 mb-3 flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-[16px] text-text-muted mt-0.5">{CARD_INSIGHTS[index].icon}</span>
                                        <p className="text-[13px] leading-relaxed text-text-secondary dark:text-text-muted text-pretty">
                                            <span className="font-medium text-black dark:text-white">{CARD_INSIGHTS[index].label}:</span> {CARD_INSIGHTS[index].text}
                                        </p>
                                    </div>
                                )}

                                {/* CTA */}
                                <div className="px-5 pb-5 pt-2">
                                    {analysis.unlocked ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenAnalysis(index); }}
                                            className="w-full bg-primary dark:bg-white text-white dark:text-black rounded-xl py-3.5 text-[15px] font-medium flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
                                        >
                                            Öppna analys
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </button>
                                    ) : (
                                        <div>
                                            <div className="mb-4 space-y-2.5">
                                                {[
                                                    'Fullständig granskning av föreningen',
                                                    'Prognos för ränta & avgiftshöjningar',
                                                    'Se exakt vad du har kvar varje månad',
                                                    'Tillgång till AI-Expert för föreningen',
                                                ].map((item) => (
                                                    <div key={item} className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-[14px] text-primary">check</span>
                                                        <span className="text-[13px] text-text-secondary dark:text-text-muted">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); }}
                                                className="w-full bg-primary dark:bg-white text-white dark:text-black rounded-xl py-3.5 text-[15px] font-medium active:opacity-80 transition-opacity"
                                            >
                                                Lås upp analys · 99 kr
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-[13px] text-text-muted py-8 text-pretty">
                        Fler analyser visas här allt eftersom du lägger till objekt.
                    </p>
                </section>
            </main>
        </div>
    );
};
