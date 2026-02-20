import React, { useState } from 'react';
import { BackButton } from './ui/BackButton';
import { haptic } from '../utils/haptics';
import { useHousehold } from '../context/HouseholdContext';

const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWzmKf6lHJw9jFDvZTe2EKWjI_yIbuHl08kvULqvVvsShnOBTiHhLStTiWAWEwUfkuUbQEym6VtQlWpfCYPOt1VYsJqBW8b17L4vSG69_jurg1DmOP8cIFsJJ0aI0re5a-tiVou1bWnfjIt4l0LxJzL3wCqeTSawheQWgUdLBKtwxxeMQxBBZUfQYd5hlZ7L3zH-RcYaY030cDlEP0jHZvmVyIcYyf0vGPo0ZkrMZYGma9GUl8gG0CPFc5Nw3BpeWj94EsvRWmTw';

interface ObjectChatProps {
    onBack: () => void;
    onHome: () => void;
    address: string;
    hideHeader?: boolean;
}

/* ── Read receipt indicator ── */
const ReadReceipt = ({ avatarUrl, name, visible }: { avatarUrl: string; name: string; visible: boolean }) => {
    if (!visible) return null;
    return (
        <div className="flex justify-end mt-1 animate-scale-in">
            <img
                src={avatarUrl}
                alt={`${name} har läst`}
                className="size-4 rounded-full object-cover opacity-60"
                title={`Läst av ${name}`}
            />
        </div>
    );
};

export const ObjectChat = ({ onBack, onHome, address, hideHeader }: ObjectChatProps) => {
    const [message, setMessage] = useState('');
    const { state, isHousehold } = useHousehold();
    const isPartnerLinked = isHousehold && state.partner?.linked;

    const handleSend = () => {
        if (!message.trim()) return;
        haptic('light');
        setMessage('');
    };

    return (
        <div className={`w-full h-full bg-white dark:bg-black relative overflow-hidden flex flex-col ${hideHeader ? 'hide-inner-headers' : ''}`}>
            {/* Header */}
            {!hideHeader && (
                <header className="pt-safe-top px-page-x border-b border-border-light dark:border-border-dark sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-xl z-20">
                    <div className="flex items-center justify-between h-14">
                        <BackButton onClick={onBack} />
                        <div className="flex items-center gap-2">
                            <h1 className="text-[15px] font-semibold tracking-tight">Analysstöd</h1>
                            {isPartnerLinked && (
                                <div className="flex -space-x-1">
                                    <img src={USER_AVATAR} alt="Du" className="size-5 rounded-full object-cover border border-white dark:border-black" />
                                    <img src={state.partner!.avatarUrl} alt={state.partner!.name} className="size-5 rounded-full object-cover border border-white dark:border-black" />
                                </div>
                            )}
                        </div>
                        <button className="size-10 flex items-center justify-end text-black dark:text-white active:opacity-50 transition-opacity">
                            <span className="material-symbols-outlined text-xl">more_horiz</span>
                        </button>
                    </div>
                    <div className="flex justify-center pb-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-input dark:bg-white/5 rounded-full">
                            <span className="material-symbols-outlined text-[14px] text-text-muted">location_on</span>
                            <span className="text-[11px] font-medium text-text-secondary dark:text-text-muted">{address}</span>
                        </div>
                    </div>
                </header>
            )}

            {/* Address pill — compact for persistent header */}
            {hideHeader && (
                <div className="flex justify-center py-2.5 border-b border-border-light dark:border-border-dark">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-input dark:bg-white/5 rounded-full">
                        <span className="material-symbols-outlined text-[14px] text-text-muted">location_on</span>
                        <span className="text-[11px] font-medium text-text-secondary dark:text-text-muted">{address}</span>
                    </div>
                </div>
            )}

            {/* Group chat banner (when partner linked) */}
            {isPartnerLinked && (
                <div className="mx-page-x mt-3 mb-1 flex items-center justify-center gap-2 py-2 px-3 bg-surface-input dark:bg-white/5 rounded-full animate-slide-up">
                    <span className="text-[13px]">👫</span>
                    <span className="text-[11px] font-medium text-text-muted">
                        Gruppchatt med {state.partner!.name.split(' ')[0]}
                    </span>
                </div>
            )}

            {/* Chat Messages */}
            <main className="flex-1 overflow-y-auto px-page-x py-6 space-y-5 hide-scrollbar pb-72">
                {/* AI Message 1 */}
                <div className="flex flex-col gap-2 items-start max-w-[88%] animate-slide-up">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary dark:bg-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] text-white dark:text-black">auto_awesome</span>
                        </div>
                        <span className="text-[11px] font-semibold text-text-muted">Nivå AI</span>
                    </div>
                    <div className="bg-surface-input dark:bg-white/5 rounded-2xl rounded-tl-md p-4 text-[15px] leading-relaxed text-text-secondary dark:text-white/80 text-pretty">
                        Hej! Jag har gått igenom årsredovisningen och stadgarna för {address}. Vill du titta närmare på föreningens lån, kommande renoveringar eller hur din kalkyl påverkas av ränteändringar?
                    </div>
                    {/* Read receipt from partner */}
                    {isPartnerLinked && (
                        <ReadReceipt avatarUrl={state.partner!.avatarUrl} name={state.partner!.name} visible={true} />
                    )}
                </div>

                {/* User Message */}
                <div className="flex flex-col gap-2 items-end ml-auto max-w-[88%] animate-slide-up stagger-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-text-muted">Du</span>
                        <img src={USER_AVATAR} alt="Du" className="size-5 rounded-full object-cover" />
                    </div>
                    <div className="bg-primary dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-md p-4 text-[15px] leading-relaxed">
                        Hur påverkas min kalkyl om räntan stiger med 1% och vad säger årsredovisningen om lån?
                    </div>
                    {/* Read receipt from partner */}
                    {isPartnerLinked && (
                        <ReadReceipt avatarUrl={state.partner!.avatarUrl} name={state.partner!.name} visible={true} />
                    )}
                </div>

                {/* Partner Message (when linked) */}
                {isPartnerLinked && (
                    <div className="flex flex-col gap-2 items-end ml-auto max-w-[88%] animate-slide-up stagger-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-text-muted">{state.partner!.name.split(' ')[0]}</span>
                            <img src={state.partner!.avatarUrl} alt={state.partner!.name} className="size-5 rounded-full object-cover" />
                        </div>
                        <div className="bg-[#E8E8ED] dark:bg-white/10 text-black dark:text-white rounded-2xl rounded-tr-md p-4 text-[15px] leading-relaxed">
                            Bra fråga! Kan vi även kolla vad som händer om vi amorterar extra? 🤔
                        </div>
                    </div>
                )}

                {/* AI Message 2 (Rich) */}
                <div className="flex flex-col gap-2 items-start max-w-[92%] animate-slide-up stagger-3">
                    <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-primary dark:bg-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] text-white dark:text-black">auto_awesome</span>
                        </div>
                        <span className="text-[11px] font-semibold text-text-muted">Nivå AI</span>
                    </div>
                    <div className="bg-surface-input dark:bg-white/5 rounded-2xl rounded-tl-md p-4 text-[15px] leading-relaxed text-text-secondary dark:text-white/80 space-y-4">
                        <p className="text-pretty">En ränteökning på 1 % innebär en kostnadsökning för dig på ca <strong className="font-semibold text-black dark:text-white">3 450 kr/månad</strong> (efter ränteavdrag). Din marginal landar då på ca <strong className="font-semibold text-black dark:text-white">+8 950 kr</strong>.</p>

                        {/* Embedded Card */}
                        <div className="bg-white dark:bg-black/40 p-4 rounded-xl space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">📉</span>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Skuldsättning & Bindningstider</p>
                            </div>
                            <p className="text-[14px] leading-relaxed text-black dark:text-white text-pretty">
                                Föreningen har en stabil belåning på <strong className="font-semibold">6 200 kr/kvm</strong>. Notera att tre lån skrivs om under 2024. Vid nuvarande ränteläge kan detta kräva en avgiftshöjning på ca 5–8 % för att bibehålla kassaflödet.
                            </p>
                            <div className="pt-2 border-t border-border-light dark:border-border-dark flex items-center gap-1.5 text-text-muted">
                                <span className="material-symbols-outlined text-[14px]">description</span>
                                <span className="text-[10px] font-medium"><em>Källa: Årsredovisning 2023, s. 14</em></span>
                            </div>
                        </div>

                        <p className="text-pretty">Ska vi simulera hur din månadskostnad påverkas om avgiften höjs med 8 %?</p>
                    </div>
                    {/* Read receipt from partner */}
                    {isPartnerLinked && (
                        <ReadReceipt avatarUrl={state.partner!.avatarUrl} name={state.partner!.name} visible={true} />
                    )}
                </div>
            </main>

            {/* Bottom Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-border-light dark:border-border-dark px-page-x pt-3 pb-8 space-y-3 z-20">
                {/* Quick Action Chips */}
                <div className="relative">
                    <div className="flex overflow-x-auto gap-2 hide-scrollbar pr-8">
                        <button className="flex-none px-4 py-2 bg-primary dark:bg-white text-white dark:text-black rounded-full text-[13px] font-medium active:scale-95 transition-transform">
                            Risker i stadgarna
                        </button>
                        <button className="flex-none px-4 py-2 bg-surface-input dark:bg-white/10 rounded-full text-[13px] font-medium text-text-secondary dark:text-text-muted active:bg-border-light transition-colors">
                            Planerat underhåll
                        </button>
                        <button className="flex-none px-4 py-2 bg-surface-input dark:bg-white/10 rounded-full text-[13px] font-medium text-text-secondary dark:text-text-muted active:bg-border-light transition-colors">
                            Räntekänslighet
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 dark:from-black/95 to-transparent pointer-events-none"></div>
                </div>

                {/* Cash Status */}
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm">💰</span>
                        <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Kassaflöde</span>
                    </div>
                    <div className="text-[13px] text-text-muted">
                        Marginal: <span className="font-semibold text-black dark:text-white tabular-nums">+12 400 kr</span>
                    </div>
                </div>

                {/* Input — with partner typing indicator when linked */}
                <div className="space-y-2 pb-4">
                    {isPartnerLinked && (
                        <div className="flex items-center gap-2 px-1 animate-pulse-soft">
                            <img src={state.partner!.avatarUrl} alt={state.partner!.name} className="size-4 rounded-full object-cover opacity-50" />
                            <span className="text-[11px] text-text-muted italic">{state.partner!.name.split(' ')[0]} ser chatten</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5">
                        <div className="flex-1 bg-surface-input dark:bg-white/5 rounded-2xl flex items-center px-4 py-1">
                            <button className="text-text-muted active:text-black dark:active:text-white transition-colors">
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                            <input
                                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] py-3 placeholder:text-text-placeholder"
                                placeholder="Fråga om föreningen…"
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className="size-[48px] bg-primary dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-black active:scale-95 transition-transform flex-shrink-0"
                        >
                            <span className="material-symbols-outlined text-xl">arrow_upward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
