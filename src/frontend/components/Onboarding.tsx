import React, { useState } from 'react';
import { BackButton } from './ui/BackButton';
import { haptic } from '../utils/haptics';
import { useHousehold } from '../context/HouseholdContext';

/* ─── Known users for partner search ─── */
const KNOWN_USERS = [
    { email: 'erik@gmail.com', name: 'Erik Lindqvist', avatarUrl: 'https://i.pravatar.cc/150?u=erik.lindqvist', income: 48000, savings: 350000, loans: 2000 },
    { email: 'sara.berg@gmail.com', name: 'Sara Berg', avatarUrl: 'https://i.pravatar.cc/150?u=sara.berg', income: 41000, savings: 280000, loans: 3500 },
];

type SearchState = 'idle' | 'searching' | 'found' | 'not_found' | 'invited' | 'linked';

/* ─────────────────────────────────────────────────────────
   Single-step Onboarding
   ───────────────────────────────────────────────────────── */
export const Onboarding = ({ onFinish }: { onFinish: () => void }) => {
    const { dispatch } = useHousehold();
    const [buyingTogether, setBuyingTogether] = useState(false);
    const [email, setEmail] = useState('');
    const [searchState, setSearchState] = useState<SearchState>('idle');
    const [foundUser, setFoundUser] = useState<typeof KNOWN_USERS[0] | null>(null);

    const handleSearch = () => {
        if (!email.includes('@')) return;
        setSearchState('searching');
        haptic('light');
        setTimeout(() => {
            const user = KNOWN_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
            if (user) { setFoundUser(user); setSearchState('found'); }
            else { setSearchState('not_found'); }
        }, 1200);
    };

    const handleLink = () => {
        if (!foundUser) return;
        haptic('success');
        dispatch({
            type: 'LINK_PARTNER',
            partner: { name: foundUser.name, avatarUrl: foundUser.avatarUrl, income: foundUser.income, savings: foundUser.savings, loans: foundUser.loans },
        });
        setSearchState('linked');
    };

    const handleInvite = () => {
        haptic('light');
        setSearchState('invited');
    };

    const inputClass = "w-full bg-surface-input dark:bg-surface-dark rounded-2xl px-5 py-4 text-[15px] text-text-main dark:text-white placeholder:text-text-placeholder focus:ring-2 focus:ring-primary/20 transition-all outline-none";

    return (
        <div className="w-full h-full text-text-main dark:text-white overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col h-full min-h-0 pt-safe-top">
                <main className="flex-1 overflow-y-auto px-page-x pt-14 hide-scrollbar">
                    {/* ── Hero ── */}
                    <div className="mb-8 animate-slide-up">
                        <h1 className="text-[34px] font-display leading-[1.1] text-text-main dark:text-white mb-3">
                            Vad har du råd med<br /><em>— egentligen?</em>
                        </h1>
                        <p className="text-text-muted text-[15px] leading-relaxed text-pretty max-w-[300px]">
                            Vi räknar ut din verkliga marginal efter ränta, amortering och levnadskostnader.
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* ── Profile Card ── */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-slide-up stagger-1">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-primary-light">person</span>
                                </div>
                                <label className="text-[13px] font-semibold text-text-main dark:text-white">Om dig</label>
                            </div>
                            <div className="space-y-2">
                                <input type="text" placeholder="Förnamn" className={inputClass} />
                                <input type="text" placeholder="Efternamn" className={inputClass} />
                            </div>
                        </div>

                        {/* ── Buying Toggle Card ── */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-slide-up stagger-2">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-primary-light">group</span>
                                </div>
                                <label className="text-[13px] font-semibold text-text-main dark:text-white">Vem köper bostaden?</label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => { haptic('light'); setBuyingTogether(false); setSearchState('idle'); setFoundUser(null); setEmail(''); }}
                                    className={`relative flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all active:scale-[0.97] ${!buyingTogether
                                        ? 'bg-primary dark:bg-primary text-white'
                                        : 'bg-surface-input dark:bg-[#1E293B] text-text-main dark:text-white hover:bg-border-light dark:hover:bg-border-dark'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[28px] mb-2">{!buyingTogether ? 'person' : 'person_outline'}</span>
                                    <span className="font-semibold text-[13px]">Jag köper själv</span>
                                    {!buyingTogether && (
                                        <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-white/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                        </div>
                                    )}
                                </button>
                                <button
                                    onClick={() => { haptic('light'); setBuyingTogether(true); }}
                                    className={`relative flex flex-col items-center justify-center p-5 rounded-xl cursor-pointer transition-all active:scale-[0.97] ${buyingTogether
                                        ? 'bg-primary dark:bg-primary text-white'
                                        : 'bg-surface-input dark:bg-[#1E293B] text-text-main dark:text-white hover:bg-border-light dark:hover:bg-border-dark'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[28px] mb-2">group</span>
                                    <span className="font-semibold text-[13px]">Vi köper ihop</span>
                                    {buyingTogether && (
                                        <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-white/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[14px]">check</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── Partner Invite Card ── */}
                        {buyingTogether && (
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-scale-in">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px] text-primary dark:text-primary-light">person_add</span>
                                    </div>
                                    <label className="text-[13px] font-semibold text-text-main dark:text-white">Bjud in din partner</label>
                                </div>

                                {(searchState === 'idle' || searchState === 'searching') && (
                                    <div className="relative">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); if (searchState !== 'idle') setSearchState('idle'); setFoundUser(null); }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            placeholder="namn@exempel.se"
                                            disabled={searchState === 'searching'}
                                            className={`${inputClass} pr-14 disabled:opacity-50`}
                                        />
                                        <button
                                            onClick={handleSearch}
                                            disabled={!email.includes('@') || searchState === 'searching'}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-primary flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                                        >
                                            {searchState === 'searching' ? (
                                                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-white text-lg">search</span>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {searchState === 'found' && foundUser && (
                                    <div className="bg-success-soft dark:bg-success/10 rounded-xl p-4 flex items-center gap-3">
                                        <img src={foundUser.avatarUrl} alt={foundUser.name} className="size-10 rounded-full object-cover" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-text-main dark:text-white text-[14px]">{foundUser.name}</p>
                                            <p className="text-[12px] text-success flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">check_circle</span>Nivå-medlem
                                            </p>
                                        </div>
                                        <button onClick={handleLink} className="bg-primary text-white px-4 py-2 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform cursor-pointer">
                                            Koppla
                                        </button>
                                    </div>
                                )}

                                {searchState === 'not_found' && (
                                    <div className="bg-surface-input dark:bg-[#1E293B] rounded-xl p-4 flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-border-light dark:bg-border-dark flex items-center justify-center">
                                            <span className="material-symbols-outlined text-text-muted text-lg">person_off</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-text-main dark:text-white text-[14px]">Hittades inte</p>
                                            <p className="text-[12px] text-text-muted truncate">{email}</p>
                                        </div>
                                        <button onClick={handleInvite} className="bg-primary text-white px-4 py-2 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform cursor-pointer flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px]">send</span>
                                            Bjud in
                                        </button>
                                    </div>
                                )}

                                {searchState === 'invited' && (
                                    <div className="bg-success-soft dark:bg-success/10 rounded-xl p-4 flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-success/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-success text-lg">mark_email_read</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-text-main dark:text-white text-[14px]">Inbjudan skickad!</p>
                                            <p className="text-[12px] text-text-muted">Vi meddelar dig när din partner ansluter.</p>
                                        </div>
                                    </div>
                                )}

                                {searchState === 'linked' && foundUser && (
                                    <div className="bg-success-soft dark:bg-success/10 rounded-xl p-4 flex items-center gap-3">
                                        <img src={foundUser.avatarUrl} alt={foundUser.name} className="size-10 rounded-full object-cover ring-2 ring-success/30" />
                                        <div className="flex-1">
                                            <p className="font-semibold text-text-main dark:text-white text-[14px]">{foundUser.name}</p>
                                            <p className="text-[12px] text-success flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">check_circle</span>Ihopkopplade
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <p className="text-[12px] text-text-muted mt-3">Du kan alltid bjuda in din partner i din profil.</p>
                            </div>
                        )}

                        {/* ── Income Card ── */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-slide-up stagger-3">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px] text-primary dark:text-primary-light">payments</span>
                                </div>
                                <label className="text-[13px] font-semibold text-text-main dark:text-white">Din inkomst efter skatt</label>
                            </div>
                            <div className="relative flex items-center">
                                <input className={`${inputClass} pr-12 text-xl font-bold tabular-nums`} placeholder="35 000" type="text" inputMode="numeric" pattern="[0-9]*" />
                                <span className="absolute right-5 text-[15px] font-medium text-text-muted">kr</span>
                            </div>
                            <p className="text-[12px] text-text-muted text-pretty mt-3">Din lön efter skatt. Inkludera stabila extrainkomster.</p>
                        </div>

                        {/* ── Partner Income Card ── */}
                        {buyingTogether && (
                            <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-scale-in">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[18px] text-primary dark:text-primary-light">payments</span>
                                    </div>
                                    <label className="text-[13px] font-semibold text-text-main dark:text-white">Din partners inkomst efter skatt</label>
                                </div>
                                <div className="relative flex items-center">
                                    <input className={`${inputClass} pr-12 text-xl font-bold tabular-nums`} placeholder="30 000" type="text" inputMode="numeric" pattern="[0-9]*" />
                                    <span className="absolute right-5 text-[15px] font-medium text-text-muted">kr</span>
                                </div>
                                <p className="text-[12px] text-text-muted text-pretty mt-3">Uppskatta om du inte vet exakt.</p>
                            </div>
                        )}

                        {/* ── Savings Card ── */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-slide-up stagger-4">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px] text-primary">savings</span>
                                </div>
                                <label className="text-[13px] font-semibold text-text-main dark:text-white">
                                    {buyingTogether ? 'Ert sparkapital' : 'Ditt sparkapital'}
                                </label>
                            </div>
                            <div className="relative">
                                <input className={`${inputClass} pr-14 text-xl font-bold tabular-nums`} placeholder="500 000" type="text" inputMode="numeric" pattern="[0-9]*" />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-text-muted">kr</span>
                            </div>
                            <p className="text-[12px] text-text-muted text-pretty mt-3">
                                {buyingTogether
                                    ? 'Ert totala sparkapital som kan användas till kontantinsats.'
                                    : 'Detta sätter taket för din kontantinsats.'}
                            </p>
                        </div>

                        {/* ── Loans Card (merged from Step 2) ── */}
                        <div className="bg-white dark:bg-surface-dark rounded-2xl p-5 border border-border-light animate-slide-up stagger-5">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="size-8 rounded-xl bg-primary-soft dark:bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[18px] text-primary">credit_score</span>
                                </div>
                                <label className="text-[13px] font-semibold text-text-main dark:text-white">
                                    {buyingTogether ? 'Era månadskostnader för lån' : 'Månadskostnad för lån'}
                                </label>
                            </div>
                            <div className="relative">
                                <input className={`${inputClass} pr-24 text-xl font-bold tabular-nums`} placeholder="0" type="text" inputMode="numeric" pattern="[0-9]*" />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-text-muted">kr/mån</span>
                            </div>
                            <p className="text-[12px] text-text-muted text-pretty mt-3">
                                {buyingTogether
                                    ? 'CSN, billån, privatlån — summera era gemensamma kostnader.'
                                    : 'CSN, billån, privatlån — summera alla månadskostnader.'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => { haptic('light'); onFinish(); }}
                        className="w-full bg-primary text-white py-4 rounded-2xl text-[15px] font-semibold active:scale-[0.98] transition-transform cursor-pointer mt-6 mb-8"
                    >
                        Klar — visa mig resultatet
                    </button>
                </main>
            </div>
        </div>
    );
};
