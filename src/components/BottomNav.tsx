import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../App";

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();

    const isProfile = location.pathname === "/profil";

    return (
        <nav className="bottom-nav-mobile" style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            height: 68,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            background: "var(--color-bg)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "var(--space-6)",
            paddingRight: "var(--space-6)",
            zIndex: 100,
            flexShrink: 0,
        }}>
            {/* Nivå wordmark — home */}
            <button
                onClick={() => navigate("/")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 48,
                    padding: "0 var(--space-2)",
                }}
            >
                <span style={{
                    fontFamily: "var(--font-editorial)",
                    fontSize: 26,
                    fontWeight: 400,
                    color: "var(--color-midnight)",
                    letterSpacing: "-0.01em",
                }}>
                    Nivå
                </span>
            </button>

            {/* Avatar — profile */}
            <button
                onClick={() => navigate("/profil")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 48,
                    minWidth: 48,
                    padding: 0,
                    transition: "opacity var(--transition-fast)",
                }}
            >
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-full)",
                    background: isProfile ? "var(--color-midnight)" : "var(--color-stone)",
                    color: isProfile ? "white" : "var(--color-text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    transition: "all var(--transition-fast)",
                    border: isProfile ? "none" : "1.5px solid var(--color-border-strong)",
                }}>
                    {user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
            </button>
        </nav>
    );
}

/** Standalone bottom bar for splash/onboarding — no router needed */
export function OnboardingBottomBar() {
    return (
        <div style={{
            height: 68,
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            background: "var(--color-bg)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            paddingLeft: "var(--space-6)",
            paddingRight: "var(--space-6)",
            flexShrink: 0,
        }}>
            <span style={{
                fontFamily: "var(--font-editorial)",
                fontSize: 26,
                fontWeight: 400,
                color: "var(--color-midnight)",
                letterSpacing: "-0.01em",
            }}>
                Nivå
            </span>
        </div>
    );
}
