import React from "react";

export function ContactActionBar() {
    return (
        <div style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "var(--space-3) var(--space-5)",
            paddingBottom: "calc(var(--space-3) + env(safe-area-inset-bottom, 0px))",
            background: "rgba(250, 248, 245, 0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            gap: "var(--space-3)",
            zIndex: 90,
        }}>
            <button
                onClick={() => {
                    // Future: deep-link to phone/email
                    window.open("tel:", "_self");
                }}
                style={{
                    flex: 1,
                    padding: "var(--space-3)",
                    background: "white",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-2)",
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
                Ring mäklare
            </button>

            <button
                onClick={() => {
                    // Future: open email composer
                    window.open("mailto:", "_self");
                }}
                style={{
                    flex: 1,
                    padding: "var(--space-3)",
                    background: "var(--color-midnight)",
                    border: "none",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    color: "white",
                    cursor: "pointer",
                    minHeight: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-2)",
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                </svg>
                Kontakta mäklare
            </button>
        </div>
    );
}
