import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import type { AnalysisData } from '../types';

interface ScrapedListing {
    address: string;
    area: string;
    price: string;
    priceRaw: number;
    avgift: string;
    rooms: string;
    sqm: string;
    floor: string;
    brfName: string;
    constructionYear: string;
    imageUrl: string;
    hemnetUrl: string;
}

interface HomeProps {
    onNewAnalysis: () => void;
    onScrapedListing: (listing: ScrapedListing) => void;
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

export const Home = ({ onNewAnalysis, onScrapedListing, onOpenAnalysis, onOpenProfile, analyses }: HomeProps) => {
    const { state, isHousehold } = useHousehold();
    const isPartnerLinked = isHousehold && state.partner?.linked;
    const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'done'>('idle');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [scrapedListing, setScrapedListing] = useState<ScrapedListing | null>(null);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) { setUrl(text); setError(''); }
        } catch { /* clipboard not available */ }
    };

    const handleFetch = async () => {
        const trimmed = url.trim();
        if (!trimmed) { setError('Klistra in en länk först'); return; }
        if (!trimmed.includes('hemnet.se') && !trimmed.includes('booli.se')) { setError('Länken måste vara från hemnet.se eller booli.se'); return; }

        setFetchState('loading');
        setError('');
        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: trimmed }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: 'Okänt fel' }));
                throw new Error(data.error || `Fel ${res.status}`);
            }
            const listing: ScrapedListing = await res.json();
            setScrapedListing(listing);
            setFetchState('done');
        } catch (err: any) {
            setError(err.message || 'Kunde inte hämta bostadsdata');
            setFetchState('idle');
        }
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
                                <input
                                    className="w-full h-[56px] bg-surface-input dark:bg-surface-dark rounded-2xl px-5 pr-14 text-[15px] text-text-main dark:text-white placeholder:text-text-placeholder focus:ring-2 focus:ring-primary/20 outline-none transition-all border border-border-light dark:border-border-dark"
                                    id="property-link"
                                    placeholder="https://www.booli.se/bostad/..."
                                    type="url"
                                    value={url}
                                    onChange={(e) => { setUrl(e.target.value); setError(''); if (fetchState === 'done') { setFetchState('idle'); setScrapedListing(null); } }}
                                    readOnly={fetchState === 'loading'}
                                />
                                <button onClick={handlePaste} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-text-muted hover:text-primary transition-colors active:scale-95">
                                    <span className="material-symbols-outlined text-[22px]">content_paste</span>
                                </button>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 px-1">
                                    <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
                                    <p className="text-[13px] text-red-500 font-medium">{error}</p>
                                </div>
                            )}
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
                                        <p className="text-[12px] text-text-muted">{url.length > 45 ? url.slice(0, 42) + '...' : url}</p>
                                    </div>
                                </div>
                            )}

                            {/* ── Fetch Results (inside same card) ── */}
                            {fetchState === 'done' && scrapedListing && (
                                <div className="animate-slide-up space-y-4">
                                    <hr className="border-border-light dark:border-border-dark -mx-5" />
                                    {/* Property preview */}
                                    {scrapedListing.imageUrl && (
                                        <div className="rounded-xl overflow-hidden aspect-[16/9]">
                                            <img src={scrapedListing.imageUrl} alt={scrapedListing.address} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-[18px] font-bold tracking-tight text-text-main dark:text-white leading-tight">Vi har hittat bostaden</h2>
                                        <p className="text-[13px] text-text-secondary mt-1 font-medium">{scrapedListing.address}{scrapedListing.area ? `, ${scrapedListing.area}` : ''}</p>
                                    </div>
                                    {/* Property details */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {scrapedListing.price && (
                                            <div className="bg-surface-input dark:bg-surface-dark rounded-xl p-3">
                                                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-0.5">Pris</p>
                                                <p className="text-[14px] font-bold text-text-main dark:text-white">{scrapedListing.price}</p>
                                            </div>
                                        )}
                                        {scrapedListing.rooms && (
                                            <div className="bg-surface-input dark:bg-surface-dark rounded-xl p-3">
                                                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-0.5">Rum</p>
                                                <p className="text-[14px] font-bold text-text-main dark:text-white">{scrapedListing.rooms}</p>
                                            </div>
                                        )}
                                        {scrapedListing.sqm && (
                                            <div className="bg-surface-input dark:bg-surface-dark rounded-xl p-3">
                                                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-0.5">Storlek</p>
                                                <p className="text-[14px] font-bold text-text-main dark:text-white">{scrapedListing.sqm}</p>
                                            </div>
                                        )}
                                        {scrapedListing.avgift && (
                                            <div className="bg-surface-input dark:bg-surface-dark rounded-xl p-3">
                                                <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest mb-0.5">Avgift</p>
                                                <p className="text-[14px] font-bold text-text-main dark:text-white">{scrapedListing.avgift}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Continue button */}
                                    <button onClick={() => onScrapedListing(scrapedListing)} className="w-full h-[56px] bg-primary text-white font-semibold text-[15px] rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                                        <span>Se din kostnadsfria priskoll</span>
                                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                    </button>
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
