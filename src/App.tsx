import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { SplashScreen } from "./screens/SplashScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { ObjectTeaserScreen } from "./screens/ObjectTeaserScreen";
import { AIChatScreen } from "./screens/AIChatScreen";
import { BudSimulatorScreen } from "./screens/BudSimulatorScreen";
import { NivaLiveScreen } from "./screens/NivaLiveScreen";
import { AuctionResultScreen } from "./screens/AuctionResultScreen";
import { CalculatorScreen } from "./screens/CalculatorScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { getSession as fetchSession } from "./hooks/useApi";
import type { UserData } from "./hooks/useApi";

// User context — shared across all screens
interface UserContextValue {
    user: UserData | null;
    setUser: (user: UserData) => void;
}

const UserContext = createContext<UserContextValue>({
    user: null,
    setUser: () => { },
});

export function useUser() {
    return useContext(UserContext);
}

export default function App() {
    return (
        <BrowserRouter>
            <AppInner />
        </BrowserRouter>
    );
}

function AppInner() {
    const [user, setUser] = useState<UserData | null>(null);
    const [showSplash, setShowSplash] = useState(true);
    const [sessionChecked, setSessionChecked] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Remember where the user wanted to go (for deep links)
    const [intendedPath] = useState(() =>
        location.pathname !== "/" ? location.pathname : null
    );

    // Restore session on mount
    useEffect(() => {
        fetchSession()
            .then(({ user }) => {
                if (user) {
                    setUser(user);
                    setShowSplash(false);
                    if (intendedPath) navigate(intendedPath, { replace: true });
                }
            })
            .catch((err) => {
                console.warn("Session restore failed:", err);
            })
            .finally(() => setSessionChecked(true));
    }, []);

    // Wait for session check before rendering anything
    if (!sessionChecked) {
        return (
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: "100vh", background: "var(--color-bg)",
            }}>
                <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    border: "3px solid var(--color-border)",
                    borderTopColor: "var(--color-gold)",
                    animation: "spin 0.8s linear infinite",
                }} />
            </div>
        );
    }

    if (showSplash) {
        return <SplashScreen onContinue={() => setShowSplash(false)} />;
    }

    if (!user) {
        return <OnboardingScreen onComplete={(userData: UserData) => {
            setUser(userData);
            if (intendedPath) navigate(intendedPath, { replace: true });
        }} />;
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
                <div style={{ flex: 1 }}>
                    <Routes>
                        <Route path="/" element={<DashboardScreen />} />
                        <Route path="/analys/:id" element={<ObjectTeaserScreen />} />
                        <Route path="/analys/:id/chat" element={<AIChatScreen />} />
                        <Route path="/analys/:id/simulator" element={<BudSimulatorScreen />} />
                        <Route path="/analys/:id/live" element={<NivaLiveScreen />} />
                        <Route path="/analys/:id/resultat" element={<AuctionResultScreen />} />
                        <Route path="/analys/:id/kalkyl" element={<CalculatorScreen />} />
                        <Route path="/profil" element={<ProfileScreen />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </div>
        </UserContext.Provider>
    );
}

