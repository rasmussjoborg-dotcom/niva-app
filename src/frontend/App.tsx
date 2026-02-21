import React, { useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { Home } from "./components/Home";
import { Onboarding } from "./components/Onboarding";
import { PartnerInvite } from "./components/PartnerInvite";

import { ObjectDetail } from "./components/ObjectDetail";
import { ObjectChat } from "./components/ObjectChat";
import { Profile } from "./components/Profile";
import { HouseholdProvider } from "./context/HouseholdContext";
import { SwipeBack } from "./components/ui/SwipeBack";
import { BackButton } from "./components/ui/BackButton";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { haptic } from "./utils/haptics";
import type { AnalysisData } from "./types";

type ViewType = "home" | "onboarding" | "partnerInvite" | "objectDetail" | "objectChat" | "profile";

// Define which views are "root" (no swipe-back) and the back targets
const VIEW_BACK_MAP: Partial<Record<ViewType, ViewType>> = {

    objectDetail: "home",
    objectChat: "objectDetail",
    profile: "home",
    partnerInvite: "home",
};

// Root views where swipe-back should be disabled
const ROOT_VIEWS: ViewType[] = ["home", "onboarding"];



const ANALYSES: AnalysisData[] = [
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
    const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
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
        setSelectedAnalysis(ANALYSES[index]);
        navigate("objectDetail", 'forward');
    }, [navigate]);

    const canSwipeBack = !ROOT_VIEWS.includes(currentView);

    // Determine the CSS animation class
    const animationClass = navDirection === 'back' ? 'view-enter-left' : 'view-enter-right';

    // Persistent header config per view
    const renderHeader = () => {
        // Home has its own unique header (logo + avatar), keep it inside the component
        // Onboarding has progress dots, keep it inside
        if (currentView === 'home' || currentView === 'onboarding') return null;

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
                                    onNewAnalysis={() => { setSelectedAnalysis(ANALYSES[0]); navigate("objectDetail", 'forward'); }}
                                    onOpenAnalysis={handleOpenAnalysis}
                                    onOpenProfile={() => navigate("profile", 'forward')}
                                    analyses={ANALYSES}
                                />
                            )}

                            {currentView === "objectDetail" && selectedAnalysis && (
                                <ObjectDetail
                                    analysis={selectedAnalysis}
                                    onBack={() => navigate("home", 'back')}
                                    onOpenChat={() => navigate("objectChat", 'forward')}
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
