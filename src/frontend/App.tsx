import React, { useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { Home } from "./components/Home";
import { Onboarding } from "./components/Onboarding";
import { PartnerInvite } from "./components/PartnerInvite";

import { ObjectDetail } from "./components/ObjectDetail";
import { NewAnalysis } from "./components/NewAnalysis";
import { ObjectChat } from "./components/ObjectChat";
import { Profile } from "./components/Profile";
import { HouseholdProvider } from "./context/HouseholdContext";
import { SwipeBack } from "./components/ui/SwipeBack";
import { BackButton } from "./components/ui/BackButton";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { haptic } from "./utils/haptics";
import type { AnalysisData } from "./types";

type ViewType = "home" | "onboarding" | "partnerInvite" | "newAnalysis" | "objectDetail" | "objectChat" | "profile";

// Define which views are "root" (no swipe-back) and the back targets
const VIEW_BACK_MAP: Partial<Record<ViewType, ViewType>> = {

    newAnalysis: "home",
    objectDetail: "home",
    objectChat: "objectDetail",
    profile: "home",
    partnerInvite: "home",
};

// Root views where swipe-back should be disabled
const ROOT_VIEWS: ViewType[] = ["home", "onboarding"];



const INITIAL_ANALYSES: AnalysisData[] = [
    {
        address: "Sibyllegatan 14",
        area: "Östermalm, Stockholm",
        price: "11.5M",
        valuation: "12-14M",
        brf: "A++",
        marginal: "+15k",
        imageUrl: "/images/apartment-ostermalm.png",
        unlocked: true,
    },
    {
        address: "Odengatan 23",
        area: "Vasastan, Stockholm",
        price: "7.9M",
        valuation: "8.1-8.6M",
        brf: "B",
        marginal: "-2k",
        imageUrl: "/images/apartment-vasastan.png",
        unlocked: false,
    },
    {
        address: "Sveavägen 45",
        area: "Norrmalm, Stockholm",
        price: "9.2M",
        valuation: "9.5-10.1M",
        brf: "A",
        marginal: "+8k",
        imageUrl: "/images/apartment-sodermalm.png",
        unlocked: true,
    },
];

const App = () => {
    const [currentView, setCurrentView] = useState<ViewType>("onboarding");
    const [analyses, setAnalyses] = useState<AnalysisData[]>(INITIAL_ANALYSES);
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [navDirection, setNavDirection] = useState<'forward' | 'back'>('forward');

    const navigate = useCallback((to: ViewType, direction: 'forward' | 'back' = 'forward') => {
        setNavDirection(direction);
        haptic(direction === 'forward' ? 'light' : 'selection');
        setCurrentView(to);
    }, []);

    const goBack = useCallback(() => {
        const backTarget = VIEW_BACK_MAP[currentView];
        if (backTarget) {
            navigate(backTarget, 'back');
        }
    }, [currentView, navigate]);

    const handleOpenAnalysis = useCallback((index: number) => {
        setSelectedAnalysis(analyses[index]);
        setSelectedIndex(index);
        navigate("objectDetail", 'forward');
    }, [navigate, analyses]);

    const handleScrapedListing = useCallback((listing: any) => {
        const priceNum = listing.priceRaw || 0;
        const priceMil = priceNum / 1_000_000;

        // Build display price — use scraped formatted price if available
        let displayPrice = listing.price || '';
        if (!displayPrice && priceNum > 0) {
            displayPrice = `${priceMil.toFixed(1)}M`;
        } else if (!displayPrice) {
            displayPrice = 'Kontakta mäklare';
        }

        // Valuation — use Booli's estimate if available, else rough heuristic
        let valuation = '–';
        if (listing.estimatePrice > 0) {
            // Use Booli's own market valuation
            const estMil = listing.estimatePrice / 1_000_000;
            if (listing.estimateLow && listing.estimateHigh) {
                const lowMil = (listing.estimateLow / 1_000_000).toFixed(1);
                const highMil = (listing.estimateHigh / 1_000_000).toFixed(1);
                valuation = `${lowMil}–${highMil}M`;
            } else {
                valuation = `~${estMil.toFixed(1)}M`;
            }
        } else if (priceNum > 0) {
            // Fallback: rough ±5-15% of asking price
            const lowMil = (priceMil * 1.05).toFixed(1);
            const highMil = (priceMil * 1.15).toFixed(1);
            valuation = `${lowMil}-${highMil}M`;
        }

        const sourceUrl = listing.hemnetUrl || listing.booliUrl || '';

        const newAnalysis: AnalysisData = {
            address: listing.address || 'Okänd adress',
            area: listing.area || '',
            price: displayPrice,
            valuation,
            brf: listing.brfName || '–',
            marginal: '–',
            imageUrl: listing.imageUrl || '/images/apartment-ostermalm.png',
            unlocked: false,
            hemnetUrl: listing.hemnetUrl,
            booliUrl: listing.booliUrl,
            sourceUrl,
            source: listing.source || 'hemnet',
            priceRaw: priceNum,
            avgift: listing.avgift || '',
            rooms: listing.rooms || '',
            sqm: listing.sqm || '',
            floor: listing.floor || '',
            brfName: listing.brfName || '',
            constructionYear: listing.constructionYear || '',
            energyClass: listing.energyClass || '',
            documents: listing.documents || [],
            estimatePrice: listing.estimatePrice || 0,
            estimateLow: listing.estimateLow || 0,
            estimateHigh: listing.estimateHigh || 0,
            estimatePricePerSqm: listing.estimatePricePerSqm || 0,
        };
        // Add to analyses list (prepend so it's first) and navigate
        setAnalyses(prev => [newAnalysis, ...prev]);
        setSelectedAnalysis(newAnalysis);
        setSelectedIndex(0);
        navigate("objectDetail", 'forward');
    }, [navigate]);

    const handleRemoveAnalysis = useCallback(() => {
        if (selectedIndex >= 0) {
            setAnalyses(prev => prev.filter((_, i) => i !== selectedIndex));
        }
        setSelectedAnalysis(null);
        setSelectedIndex(-1);
        navigate("home", 'back');
    }, [selectedIndex, navigate]);

    const canSwipeBack = !ROOT_VIEWS.includes(currentView);

    // Determine the CSS animation class
    const animationClass = navDirection === 'back' ? 'view-enter-left' : 'view-enter-right';

    // Persistent header config per view
    const renderHeader = () => {
        // Home has its own unique header (logo + avatar), keep it inside the component
        // Onboarding has progress dots, keep it inside
        if (currentView === 'home' || currentView === 'onboarding' || currentView === 'newAnalysis') return null;

        let title = '';
        let onBackFn: (() => void) | undefined;
        let rightSlot: React.ReactNode = null;

        switch (currentView) {
            case 'partnerInvite':
                title = '';
                // PartnerInvite has its own header with Nivå logo + step count
                return null;

            case 'objectDetail':
                title = selectedAnalysis?.address ?? '';
                onBackFn = () => navigate('home', 'back');
                break;
            case 'objectChat':
                title = 'Analysstöd';
                onBackFn = () => navigate('objectDetail', 'back');
                rightSlot = (
                    <button className="w-10 h-10 flex items-center justify-center text-black dark:text-white active:opacity-50 transition-opacity">
                        <span className="material-symbols-outlined text-[22px]">more_horiz</span>
                    </button>
                );
                break;
            case 'profile':
                title = 'Profil';
                onBackFn = () => navigate('home', 'back');
                break;
        }

        return (
            <header className="sticky top-0 z-50 pt-safe-top">
                <div className="flex items-center justify-between px-5 h-14">
                    {onBackFn ? (
                        <BackButton onClick={onBackFn} />
                    ) : (
                        <div className="w-10" />
                    )}
                    <h1 className="text-sm-ui font-bold tracking-[0.1em] uppercase text-black dark:text-white">{title}</h1>
                    {rightSlot || <div className="w-10" />}
                </div>
            </header>
        );
    };

    return (
        <HouseholdProvider>
            <div className="h-full w-full bg-page-bg-light dark:bg-page-bg-dark sm:max-w-md sm:mx-auto sm:border-x sm:border-gray-200 shadow-2xl overflow-hidden relative flex flex-col">
                {/* Persistent header — never animates */}
                {renderHeader()}

                {/* Animated content area */}
                <SwipeBack onSwipeBack={goBack} enabled={canSwipeBack}>
                    <ErrorBoundary>
                        <div key={currentView} className={`w-full flex-1 flex flex-col overflow-hidden ${animationClass}`}>
                            {currentView === "onboarding" && (
                                <Onboarding onFinish={() => navigate("home", 'forward')} />
                            )}
                            {currentView === "partnerInvite" && (
                                <PartnerInvite onFinish={() => navigate("home", 'forward')} />
                            )}
                            {currentView === "home" && (
                                <Home
                                    onNewAnalysis={() => navigate("newAnalysis", 'forward')}
                                    onScrapedListing={handleScrapedListing}
                                    onOpenAnalysis={handleOpenAnalysis}
                                    onOpenProfile={() => navigate("profile", 'forward')}
                                    analyses={analyses}
                                />
                            )}
                            {currentView === "newAnalysis" && (
                                <NewAnalysis
                                    onFinish={() => navigate("home", 'back')}
                                    onBack={() => navigate("home", 'back')}
                                />
                            )}

                            {currentView === "objectDetail" && selectedAnalysis && (
                                <ObjectDetail
                                    analysis={selectedAnalysis}
                                    onBack={() => navigate("home", 'back')}
                                    onOpenChat={() => navigate("objectChat", 'forward')}
                                    onRemove={handleRemoveAnalysis}
                                    hideHeader
                                />
                            )}
                            {currentView === "objectChat" && selectedAnalysis && (
                                <ObjectChat
                                    address={selectedAnalysis.address}
                                    onBack={() => navigate("objectDetail", 'back')}
                                    onHome={() => navigate("home", 'back')}
                                    hideHeader
                                />
                            )}
                            {currentView === "profile" && (
                                <Profile onBack={() => navigate("home", 'back')} hideHeader />
                            )}
                        </div>
                    </ErrorBoundary>
                </SwipeBack>
            </div>
        </HouseholdProvider>
    );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
