import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { haptic } from '../utils/haptics';
import { BackButton } from './ui/BackButton';

interface PartnerInviteProps {
    onFinish: () => void;
}

// Simulated existing users in the system
const KNOWN_USERS = [
    { email: 'erik@gmail.com', name: 'Erik Lindqvist', avatarUrl: 'https://i.pravatar.cc/150?u=erik.lindqvist', income: 48000, savings: 350000, loans: 2000 },
    { email: 'sara.berg@gmail.com', name: 'Sara Berg', avatarUrl: 'https://i.pravatar.cc/150?u=sara.berg', income: 41000, savings: 280000, loans: 3500 },
];

type SearchState = 'idle' | 'searching' | 'found' | 'not_found' | 'invited' | 'linked';

export const PartnerInvite = ({ onFinish }: PartnerInviteProps) => {
    const { dispatch } = useHousehold();
    const [email, setEmail] = useState('');
    const [searchState, setSearchState] = useState<SearchState>('idle');
    const [foundUser, setFoundUser] = useState<typeof KNOWN_USERS[0] | null>(null);

    const handleSearch = () => {
        if (!email.includes('@')) return;
        setSearchState('searching');
        haptic('light');
        setTimeout(() => {
            const user = KNOWN_USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
            if (user) {
                setFoundUser(user);
                setSearchState('found');
            } else {
                setSearchState('not_found');
            }
        }, 1200);
    };

    const handleLink = () => {
        if (!foundUser) return;
        haptic('success');
        dispatch({
            type: 'LINK_PARTNER',
            partner: {
                name: foundUser.name,
                avatarUrl: foundUser.avatarUrl,
                income: foundUser.income,
                savings: foundUser.savings,
                loans: foundUser.loans,
            },
        });
        setSearchState('linked');
        setTimeout(() => onFinish(), 1800);
    };

    const handleInvite = () => {
        haptic('light');
        setSearchState('invited');
        setTimeout(() => onFinish(), 2500);
    };

    const handleSkip = () => {
        haptic('light');
        onFinish();
    };

    return (
        <div className="flex-1 flex flex-col h-full min-h-0">
            <header className="px-page-x py-4 flex items-center z-10 pt-safe-top">
                <BackButton onClick={handleSkip} />
                <div className="flex-1 flex justify-center pr-12">
                    <div className="flex gap-1.5">
                        <div className="h-1 w-8 rounded-full bg-wireframe-gray dark:bg-border-dark"></div>
                        <div className="h-1 w-8 rounded-full bg-wireframe-gray dark:bg-border-dark"></div>
                        <div className="h-1 w-8 rounded-full bg-black dark:bg-white"></div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-page-x pt-8">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white mb-3">Köper ni tillsammans?</h1>
                    <p className="text-mid-gray text-base leading-relaxed">Slå ihop er ekonomi och se vad ni har råd med tillsammans. Sök på din partners e-post.</p>
                </div>

                {/* Email search */}
                {(searchState === 'idle' || searchState === 'searching') && (
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-text-muted">Partners e-postadress</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (searchState !== 'idle') setSearchState('idle');
                                    setFoundUser(null);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="namn@exempel.se"
                                disabled={searchState === 'searching'}
                                className="w-full bg-surface-muted-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-section px-5 py-4 pr-14 text-base text-black dark:text-white placeholder:text-text-muted focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-all outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={!email.includes('@') || searchState === 'searching'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-button bg-black dark:bg-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-all"
                            >
                                {searchState === 'searching' ? (
                                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent dark:border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <span className="material-symbols-outlined text-white dark:text-black text-lg">search</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Found user */}
                {searchState === 'found' && foundUser && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-surface-muted-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-section p-5">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full overflow-hidden ring-2 ring-black/20 dark:ring-white/20 ring-offset-2 ring-offset-white dark:ring-offset-black">
                                    <img src={foundUser.avatarUrl} alt={foundUser.name} className="h-full w-full object-cover grayscale" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-black dark:text-white text-base">{foundUser.name}</p>
                                    <p className="text-sm text-text-muted font-medium flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Nivå-medlem
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLink}
                                className="w-full mt-4 bg-black dark:bg-white text-white dark:text-black py-4 rounded-button text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">link</span>
                                Koppla ihop
                            </button>
                        </div>
                        <button onClick={() => { setSearchState('idle'); setFoundUser(null); }} className="w-full mt-3 text-sm text-text-muted font-medium py-2">Sök igen</button>
                    </div>
                )}

                {/* Not found — invite */}
                {searchState === 'not_found' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-surface-muted-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-section p-5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-14 w-14 rounded-full bg-border-light dark:bg-border-dark flex items-center justify-center">
                                    <span className="material-symbols-outlined text-text-muted text-2xl">person_off</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-black dark:text-white text-base">Användaren hittades inte</p>
                                    <p className="text-sm text-text-muted leading-relaxed mt-0.5">
                                        Bjud in din partner till Nivå för att länka ihop er.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-surface-muted-light dark:bg-surface-dark rounded-input px-4 py-3 mb-3">
                                <span className="material-symbols-outlined text-text-muted text-lg">mail</span>
                                <span className="text-sm text-text-muted">{email}</span>
                            </div>
                            <button
                                onClick={handleInvite}
                                className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-button text-sm font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">send</span>
                                Skicka inbjudan via e-post
                            </button>
                        </div>
                        <button onClick={() => { setSearchState('idle'); setEmail(''); }} className="w-full mt-3 text-sm text-text-muted font-medium py-2">Sök igen</button>
                    </div>
                )}

                {/* Invited confirmation */}
                {searchState === 'invited' && (
                    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in">
                        <div className="w-16 h-16 rounded-full bg-[#E8F5E9] dark:bg-[#0A2A0A] flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[#4CAF50] text-3xl">mark_email_read</span>
                        </div>
                        <p className="font-bold text-black dark:text-white text-lg mb-1">Inbjudan skickad!</p>
                        <p className="text-sm text-text-muted text-center max-w-[260px]">
                            Vi meddelar dig så fort din partner ansluter sig.
                        </p>
                    </div>
                )}

                {/* Linked confirmation */}
                {searchState === 'linked' && foundUser && (
                    <div className="flex flex-col items-center justify-center py-8 animate-in fade-in">
                        <div className="w-16 h-16 rounded-full bg-[#E8F5E9] dark:bg-[#0A2A0A] flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[#4CAF50] text-3xl">check_circle</span>
                        </div>
                        <p className="font-bold text-black dark:text-white text-lg mb-1">Ni är nu ihopkopplade!</p>
                        <p className="text-sm text-text-muted text-center">
                            Era siffror slås ihop i alla analyser.
                        </p>
                    </div>
                )}
            </main>

            <footer className="shrink-0 px-page-x py-6 pb-8 bg-white dark:bg-background-dark">
                {searchState !== 'linked' && searchState !== 'invited' && (
                    <button
                        onClick={handleSkip}
                        className="w-full py-4 rounded-section text-sm font-semibold text-text-muted active:bg-surface-muted-light dark:active:bg-surface-dark transition-colors"
                    >
                        Hoppa över — jag bjuder in senare
                    </button>
                )}
                <p className="text-center text-xs text-text-muted leading-relaxed mt-2">
                    Du kan alltid bjuda in eller ta bort en partner i din profil.
                </p>
            </footer>
        </div>
    );
};
