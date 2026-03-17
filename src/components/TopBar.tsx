import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../App";

interface TopBarProps {
    title?: string;
    rightAction?: React.ReactNode;
}

export function TopBar({ title, rightAction }: TopBarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useUser();
    const [scrolled, setScrolled] = useState(false);

    const isDetailScreen = location.pathname.startsWith("/analys/");
    const isRootScreen = location.pathname === "/";

    useEffect(() => {
        const root = document.getElementById("root");
        if (!root) return;
        const handleScroll = () => setScrolled(root.scrollTop > 20);
        root.addEventListener("scroll", handleScroll, { passive: true });
        return () => root.removeEventListener("scroll", handleScroll);
    }, []);

    // Root screens: no top bar
    if (isRootScreen) return null;

    return (
        <div style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 90,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "var(--space-3)",
            paddingRight: "var(--space-4)",
            background: scrolled
                ? "rgba(250, 248, 245, 0.88)"
                : "rgba(250, 248, 245, 0.6)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: scrolled ? "1px solid var(--color-border)" : "1px solid transparent",
            transition: "background 250ms ease, border-color 250ms ease",
        }}>
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 500,
                    color: "var(--color-text-primary)",
                    padding: "var(--space-2) var(--space-3)",
                    marginLeft: -8,
                    minHeight: 44,
                    borderRadius: "var(--radius-md)",
                    transition: "opacity var(--transition-fast)",
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
                Tillbaka
            </button>

            {/* Center title — always visible on detail screens */}
            {title && (
                <div style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "55%",
                    textAlign: "center",
                }}>
                    {title}
                </div>
            )}

            {/* Right Action */}
            <div style={{ display: "flex", alignItems: "center" }}>
                {rightAction}
            </div>
        </div>
    );
}
