import React, { useState } from 'react';
import { useHousehold } from '../context/HouseholdContext';
import { BackButton } from './ui/BackButton';
import { haptic } from '../utils/haptics';
import { Toggle, SectionHeader, ListRow, Divider } from './ui/ProfilePrimitives';

interface ProfileProps {
    onBack: () => void;
    hideHeader?: boolean;
}

export const Profile = ({ onBack, hideHeader }: ProfileProps) => {
    const { state, dispatch, combinedIncome, combinedSavings, combinedLoans, isHousehold } = useHousehold();

    const [isEditingName, setIsEditingName] = useState(false);
    const [firstName, setFirstName] = useState('Anna');
    const [lastName, setLastName] = useState('Lindqvist');

    // Ekonomisk profil state (local display values)
    const [adults, setAdults] = useState<1 | 2>(1);
    const [hasCar, setHasCar] = useState(false);
    const [hasChildren, setHasChildren] = useState(true);

    // Partner email input
    const [partnerEmail, setPartnerEmail] = useState('');

    // Notifications
    const [notifPriceChange, setNotifPriceChange] = useState(true);
    const [notifAnalysisDone, setNotifAnalysisDone] = useState(true);
    const [notifPartnerActivity, setNotifPartnerActivity] = useState(false);

    // Ekonomisk profil expand/collapse
    const [isEconExpanded, setIsEconExpanded] = useState(false);

    // Privacy toggle — hide sensitive financial data
    const [hideSensitive, setHideSensitive] = useState(false);
    const mask = (value: string) => hideSensitive ? '• • • • •' : value;

    const isPartnerLinked = state.partner?.linked ?? false;

    const formatKr = (n: number) => new Intl.NumberFormat('sv-SE').format(n);

    // Partner search state
    const KNOWN_USERS = [
        { email: 'erik@gmail.com', name: 'Erik Lindqvist', avatarUrl: 'https://i.pravatar.cc/150?u=erik.lindqvist', income: 48000, savings: 350000, loans: 2000 },
        { email: 'sara.berg@gmail.com', name: 'Sara Berg', avatarUrl: 'https://i.pravatar.cc/150?u=sara.berg', income: 41000, savings: 280000, loans: 3500 },
    ];
    const [foundPartner, setFoundPartner] = useState<typeof KNOWN_USERS[0] | null>(null);

    type ProfileSearchState = 'idle' | 'not_found' | 'found' | 'invited';
    const [profileSearchState, setProfileSearchState] = useState<ProfileSearchState>('idle');

    const handleSearchPartner = () => {
        const user = KNOWN_USERS.find(u => u.email.toLowerCase() === partnerEmail.trim().toLowerCase());
        if (user) {
            setFoundPartner(user);
            setProfileSearchState('found');
        } else {
            setFoundPartner(null);
            setProfileSearchState('not_found');
        }
    };

    const handleInviteFromProfile = () => {
        haptic('light');
        setProfileSearchState('invited');
        setTimeout(() => {
            setProfileSearchState('idle');
            setPartnerEmail('');
        }, 2000);
    };

    const handleLinkPartner = () => {
        if (!foundPartner) return;
        dispatch({
            type: 'LINK_PARTNER',
            partner: {
                name: foundPartner.name,
                avatarUrl: foundPartner.avatarUrl,
                income: foundPartner.income,
                savings: foundPartner.savings,
                loans: foundPartner.loans,
            },
        });
        setFoundPartner(null);
    };

    const handleUnlinkPartner = () => {
        dispatch({ type: 'UNLINK_PARTNER' });
    };

    // Shared input class
    const inputClass = "w-full bg-surface-input dark:bg-surface-dark rounded-2xl px-5 py-4 text-[15px] text-black dark:text-white placeholder:text-text-placeholder focus:bg-border-light dark:focus:bg-border-dark transition-colors outline-none";

    return (
        <div className={`w-full h-full bg-page-bg-light dark:bg-page-bg-dark relative overflow-hidden flex flex-col ${hideHeader ? 'hide-inner-headers' : ''}`}>
            {/* Fixed Header (only when not managed by App shell) */}
            {!hideHeader && (
                <header className="sticky top-0 z-20 bg-page-bg-light/90 dark:bg-page-bg-dark/90 backdrop-blur-xl pt-safe-top border-b border-border-light dark:border-border-dark">
                    <div className="px-page-x h-14 flex items-center">
                        <BackButton onClick={onBack} />
                        <h1 className="flex-1 text-center text-[15px] font-semibold tracking-tight pr-10">Profil</h1>
                    </div>
                </header>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
                {/* ── Section 1: Profile Header ── */}
                <div className="flex flex-col items-center pt-6 pb-6 px-6">
                    {/* Dual avatars when linked, single when not */}
                    {isPartnerLinked && state.partner ? (
                        <div className="flex items-center mb-4">
                            <div className="size-20 rounded-full overflow-hidden border-2 border-page-bg-light dark:border-page-bg-dark z-10">
                                <img
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWzmKf6lHJw9jFDvZTe2EKWjI_yIbuHl08kvULqvVvsShnOBTiHhLStTiWAWEwUfkuUbQEym6VtQlWpfCYPOt1VYsJqBW8b17L4vSG69_jurg1DmOP8cIFsJJ0aI0re5a-tiVou1bWnfjIt4l0LxJzL3wCqeTSawheQWgUdLBKtwxxeMQxBBZUfQYd5hlZ7L3zH-RcYaY030cDlEP0jHZvmVyIcYyf0vGPo0ZkrMZYGma9GUl8gG0CPFc5Nw3BpeWj94EsvRWmTw"
                                />
                            </div>
                            <div className="size-20 rounded-full overflow-hidden border-2 border-page-bg-light dark:border-page-bg-dark -ml-5">
                                <img
                                    alt="Partner"
                                    className="h-full w-full object-cover"
                                    src={state.partner.avatarUrl}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="size-24 rounded-full overflow-hidden mb-4">
                            <img
                                alt="Profile"
                                className="h-full w-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWzmKf6lHJw9jFDvZTe2EKWjI_yIbuHl08kvULqvVvsShnOBTiHhLStTiWAWEwUfkuUbQEym6VtQlWpfCYPOt1VYsJqBW8b17L4vSG69_jurg1DmOP8cIFsJJ0aI0re5a-tiVou1bWnfjIt4l0LxJzL3wCqeTSawheQWgUdLBKtwxxeMQxBBZUfQYd5hlZ7L3zH-RcYaY030cDlEP0jHZvmVyIcYyf0vGPo0ZkrMZYGma9GUl8gG0CPFc5Nw3BpeWj94EsvRWmTw"
                            />
                        </div>
                    )}
                    {isEditingName ? (
                        <div className="flex flex-col items-center gap-2.5 w-full max-w-[280px]">
                            <input
                                className={`${inputClass} text-center text-lg font-semibold`}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Förnamn"
                            />
                            <input
                                className={`${inputClass} text-center text-lg font-semibold`}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Efternamn"
                            />
                            <button
                                onClick={() => setIsEditingName(false)}
                                className="mt-1 px-6 py-2.5 bg-primary dark:bg-white text-white dark:text-black rounded-xl text-[13px] font-medium active:scale-[0.97] transition-transform"
                            >
                                Spara
                            </button>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-[20px] font-semibold text-black dark:text-white tracking-tight">
                                {isPartnerLinked ? 'Vår gemensamma profil' : `${firstName} ${lastName}`}
                            </h2>
                            {!isPartnerLinked && <p className="text-[13px] text-text-muted mt-0.5">anna.lindqvist@gmail.com</p>}
                            {isPartnerLinked && state.partner && (
                                <p className="text-[13px] text-text-muted mt-0.5">{firstName} & {state.partner.name}</p>
                            )}
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="mt-3 px-5 py-2 rounded-xl bg-surface-input dark:bg-surface-dark text-[13px] font-medium text-text-secondary dark:text-text-muted active:bg-border-light dark:active:bg-border-dark transition-colors"
                            >
                                Redigera
                            </button>
                        </>
                    )}
                </div>

                {/* ── Section 2: Partner ── */}
                <div className="px-page-x mt-2">
                    <SectionHeader>Koppla ihop</SectionHeader>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden">
                        {isPartnerLinked && state.partner ? (
                            <div className="p-5">
                                <div className="flex items-center gap-3.5">
                                    <div className="size-11 rounded-full overflow-hidden">
                                        <img alt="Partner" className="h-full w-full object-cover" src={state.partner.avatarUrl} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-black dark:text-white text-[15px]">{state.partner.name}</p>
                                        <p className="text-[12px] text-text-muted">Kopplad sedan feb 2026</p>
                                    </div>
                                    <button onClick={handleUnlinkPartner} className="text-[13px] text-error font-medium">Ta bort</button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-11 rounded-full bg-surface-input dark:bg-border-dark flex items-center justify-center">
                                        <span className="material-symbols-outlined text-xl text-text-muted">person_add</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-black dark:text-white text-[15px]">Köper ni tillsammans?</p>
                                        <p className="text-[12px] text-text-muted leading-relaxed mt-0.5 text-pretty">
                                            Slå ihop er ekonomi och se vad ni har råd med tillsammans.
                                        </p>
                                    </div>
                                </div>

                                {profileSearchState === 'idle' && (
                                    <div className="relative">
                                        <input
                                            className={`${inputClass} pr-14`}
                                            placeholder="namn@exempel.se"
                                            value={partnerEmail}
                                            onChange={(e) => setPartnerEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearchPartner()}
                                        />
                                        <button
                                            onClick={handleSearchPartner}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-xl bg-primary dark:bg-white flex items-center justify-center active:scale-95 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-white dark:text-black text-lg">search</span>
                                        </button>
                                    </div>
                                )}

                                {profileSearchState === 'found' && foundPartner && (
                                    <div>
                                        <div className="bg-surface-input dark:bg-border-dark rounded-2xl p-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className="size-11 rounded-full overflow-hidden">
                                                    <img src={foundPartner.avatarUrl} alt={foundPartner.name} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-black dark:text-white text-[15px]">{foundPartner.name}</p>
                                                    <p className="text-[12px] text-text-muted font-medium flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                        Nivå-medlem
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { handleLinkPartner(); setProfileSearchState('idle'); }}
                                                className="w-full mt-4 bg-primary dark:bg-white text-white dark:text-black py-3.5 rounded-xl text-[14px] font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">link</span>
                                                Koppla ihop
                                            </button>
                                        </div>
                                        <button onClick={() => { setProfileSearchState('idle'); setFoundPartner(null); }} className="w-full mt-2 text-[13px] text-text-muted font-medium py-2">Sök igen</button>
                                    </div>
                                )}

                                {profileSearchState === 'not_found' && (
                                    <div>
                                        <div className="bg-surface-input dark:bg-border-dark rounded-2xl p-4">
                                            <div className="flex items-center gap-3.5 mb-3">
                                                <div className="size-11 rounded-full bg-border-light dark:bg-border-dark flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-text-muted text-xl">person_off</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-black dark:text-white text-[15px]">Användaren hittades inte</p>
                                                    <p className="text-[12px] text-text-muted leading-relaxed mt-0.5 text-pretty">
                                                        Bjud in din partner till Nivå för att länka ihop er.
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white dark:bg-surface-dark rounded-xl px-4 py-3 mb-3">
                                                <span className="material-symbols-outlined text-text-muted text-lg">mail</span>
                                                <span className="text-[13px] text-text-muted">{partnerEmail}</span>
                                            </div>
                                            <button
                                                onClick={handleInviteFromProfile}
                                                className="w-full bg-primary dark:bg-white text-white dark:text-black py-3.5 rounded-xl text-[14px] font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">send</span>
                                                Skicka inbjudan via e-post
                                            </button>
                                        </div>
                                        <button onClick={() => { setProfileSearchState('idle'); setPartnerEmail(''); }} className="w-full mt-2 text-[13px] text-text-muted font-medium py-2">Sök igen</button>
                                    </div>
                                )}

                                {profileSearchState === 'invited' && (
                                    <div className="flex flex-col items-center py-4">
                                        <div className="size-11 rounded-full bg-primary-soft dark:bg-primary/10 flex items-center justify-center mb-3">
                                            <span className="material-symbols-outlined text-primary text-xl">mark_email_read</span>
                                        </div>
                                        <p className="font-semibold text-black dark:text-white text-[14px]">Inbjudan skickad!</p>
                                        <p className="text-[12px] text-text-muted text-center mt-1">Vi meddelar dig när din partner ansluter.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Section 3: Ekonomisk Profil (collapsible) ── */}
                <div className="px-page-x mt-6">
                    <div className="flex items-center gap-2 px-1 mb-3">
                        <button onClick={() => setIsEconExpanded(!isEconExpanded)} className="flex items-center justify-between flex-1 group">
                            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{isHousehold ? 'Hushållets totala ekonomi' : 'Min ekonomi'}</h2>
                            <span className={`material-symbols-outlined text-lg text-text-muted transition-transform duration-300 ${isEconExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        <button
                            onClick={() => setHideSensitive(!hideSensitive)}
                            className="flex items-center justify-center size-9 rounded-full active:bg-surface-input dark:active:bg-surface-dark transition-colors"
                            aria-label={hideSensitive ? 'Visa belopp' : 'Dölj belopp'}
                        >
                            <span className="material-symbols-outlined text-lg text-text-muted">
                                {hideSensitive ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                    <div
                        className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden transition-all duration-300 ease-in-out"
                        style={{
                            maxHeight: isEconExpanded ? '800px' : '56px',
                            opacity: 1,
                        }}
                    >
                        {/* Collapsed summary row */}
                        <button
                            onClick={() => setIsEconExpanded(!isEconExpanded)}
                            className="w-full px-5 py-4 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-xl text-text-muted">account_balance_wallet</span>
                                <span className="text-[15px] font-medium text-black dark:text-white tabular-nums">{mask(`${formatKr(combinedIncome)} kr/mån`)}</span>
                            </div>
                            <span className="text-[12px] text-text-muted">{isEconExpanded ? '' : 'Visa mer'}</span>
                        </button>

                        {/* Expanded content */}
                        <div className={`transition-opacity duration-300 ${isEconExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <Divider />
                            {/* Adults toggle */}
                            <div className="px-5 py-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-3 block">
                                    Antal vuxna i hushållet
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setAdults(1)}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-[14px] transition-all ${adults === 1
                                            ? 'bg-primary dark:bg-white text-white dark:text-black'
                                            : 'bg-surface-input dark:bg-border-dark text-text-muted'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">person</span>
                                        1 vuxen
                                    </button>
                                    <button
                                        onClick={() => setAdults(2)}
                                        className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-[14px] transition-all ${adults === 2
                                            ? 'bg-primary dark:bg-white text-white dark:text-black'
                                            : 'bg-surface-input dark:bg-border-dark text-text-muted'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-lg">group</span>
                                        2 vuxna
                                    </button>
                                </div>
                            </div>
                            <Divider />

                            {/* Monthly income */}
                            <div className="px-5 py-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 block">
                                    {isHousehold ? 'Gemensam månadsinkomst (efter skatt)' : 'Månadsinkomst (efter skatt)'}
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        className="w-full bg-surface-input dark:bg-border-dark rounded-2xl p-4 pr-12 text-lg font-semibold text-black dark:text-white tabular-nums outline-none"
                                        value={mask(formatKr(combinedIncome))}
                                        readOnly
                                    />
                                    <span className="absolute right-4 text-[13px] font-medium text-text-muted">kr</span>
                                </div>
                                {isHousehold && state.partner && (
                                    <p className="text-[12px] text-text-muted mt-2 tabular-nums">Din: {mask(formatKr(state.user.income))} kr · Partner: {mask(formatKr(state.partner.income))} kr</p>
                                )}
                            </div>
                            <Divider />

                            {/* Savings */}
                            <div className="px-5 py-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 block">
                                    {isHousehold ? 'Vår samlade kontantinsats' : 'Totalt sparande'}
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        className="w-full bg-surface-input dark:bg-border-dark rounded-2xl p-4 pr-12 text-lg font-semibold text-black dark:text-white tabular-nums outline-none"
                                        value={mask(formatKr(combinedSavings))}
                                        readOnly
                                    />
                                    <span className="absolute right-4 text-[13px] font-medium text-text-muted">kr</span>
                                </div>
                                {isHousehold && state.partner && (
                                    <p className="text-[12px] text-text-muted mt-2 tabular-nums">Din: {mask(formatKr(state.user.savings))} kr · Partner: {mask(formatKr(state.partner.savings))} kr</p>
                                )}
                            </div>
                            <Divider />

                            {/* Monthly loans */}
                            <div className="px-5 py-4">
                                <label className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2 block">
                                    Månatliga lånekostnader
                                </label>
                                <div className="relative flex items-center">
                                    <input
                                        className="w-full bg-surface-input dark:bg-border-dark rounded-2xl p-4 pr-16 text-lg font-semibold text-black dark:text-white tabular-nums outline-none"
                                        value={mask(formatKr(combinedLoans))}
                                        readOnly
                                    />
                                    <span className="absolute right-4 text-[13px] font-medium text-text-muted">kr/mån</span>
                                </div>
                                <p className="text-[12px] text-text-muted mt-2">(CSN, billån etc.)</p>
                            </div>
                            <Divider />

                            {/* Car toggle */}
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-[15px] font-medium text-black dark:text-white">Har du bil?</span>
                                <Toggle checked={hasCar} onChange={setHasCar} />
                            </div>
                            <Divider />

                            {/* Children toggle */}
                            <div className="flex items-center justify-between px-5 py-4">
                                <span className="text-[15px] font-medium text-black dark:text-white">Har du barn?</span>
                                <Toggle checked={hasChildren} onChange={setHasChildren} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section 4: Betalning ── */}
                <div className="px-page-x mt-6">
                    <SectionHeader>Betalning</SectionHeader>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 flex items-center gap-3.5">
                            <div className="size-10 rounded-lg bg-primary dark:bg-white flex items-center justify-center">
                                <span className="text-white dark:text-black text-lg font-bold" style={{ fontFamily: '-apple-system, system-ui' }}></span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-black dark:text-white text-[15px]">Apple Pay</p>
                                <p className="text-[12px] text-text-muted tabular-nums">Visa •••• 4289</p>
                            </div>
                            <span className="text-[12px] font-medium text-success bg-success/10 px-2.5 py-1 rounded-full">Aktiv</span>
                        </div>
                        <Divider />
                        <ListRow icon="credit_card" label="Hantera betalmetod" />
                        <Divider />
                        <ListRow icon="receipt_long" label="Köphistorik" />
                    </div>
                </div>

                {/* ── Section 5: Notifikationer ── */}
                <div className="px-page-x mt-6">
                    <SectionHeader>Notifikationer</SectionHeader>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3.5">
                                <span className="material-symbols-outlined text-xl text-text-muted">trending_up</span>
                                <span className="text-[15px] font-medium text-black dark:text-white">Prisförändringar</span>
                            </div>
                            <Toggle checked={notifPriceChange} onChange={setNotifPriceChange} />
                        </div>
                        <Divider />
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3.5">
                                <span className="material-symbols-outlined text-xl text-text-muted">analytics</span>
                                <span className="text-[15px] font-medium text-black dark:text-white">Ny analys klar</span>
                            </div>
                            <Toggle checked={notifAnalysisDone} onChange={setNotifAnalysisDone} />
                        </div>
                        <Divider />
                        <div className="flex items-center justify-between px-5 py-4">
                            <div className="flex items-center gap-3.5">
                                <span className="material-symbols-outlined text-xl text-text-muted">chat_bubble</span>
                                <span className="text-[15px] font-medium text-black dark:text-white">Meddelanden</span>
                            </div>
                            <Toggle checked={notifPartnerActivity} onChange={setNotifPartnerActivity} />
                        </div>
                    </div>
                </div>

                {/* ── Section 6: Konto ── */}
                <div className="px-page-x mt-6">
                    <SectionHeader>Konto</SectionHeader>
                    <div className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden">
                        <ListRow icon="help_outline" label="Hjälp & Support" />
                        <Divider />
                        <ListRow icon="description" label="Villkor & Integritetspolicy" />
                        <Divider />
                        <ListRow icon="logout" label="Logga ut" />
                        <Divider />
                        <ListRow icon="delete_forever" label="Radera konto" destructive />
                    </div>
                    <p className="text-center text-[12px] text-text-muted mt-6 mb-4">Nivå v1.0.0</p>
                </div>

                {/* Bottom safe area spacing */}
                <div className="pb-safe-bottom h-8"></div>
            </div>
        </div>
    );
};
