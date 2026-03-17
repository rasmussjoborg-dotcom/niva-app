import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { chatWithAI } from "../hooks/useApi";

interface Message {
    role: "user" | "model";
    content: string;
}

export function AIChatScreen() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [messages, setMessages] = useState<Message[]>([
        { role: "model", content: "Hej! Jag har analyserat bostaden och föreningens ekonomi. Vad undrar du över?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || loading || !id) return;

        const userMsg: Message = { role: "user", content: textToSend };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        if (!textOverride) setInput("");
        setLoading(true);

        try {
            const apiHistory = newMsgs.filter(m => m.role !== "model" || m.content !== "Hej! Jag har analyserat bostaden och föreningens ekonomi. Vad undrar du över?");
            const response = await chatWithAI(id, apiHistory);
            setMessages([...newMsgs, { role: "model", content: response.message }]);
        } catch (err) {
            console.error(err);
            setMessages([...newMsgs, { role: "model", content: "Ett fel uppstod. Försök igen om en stund." }]);
        } finally {
            setLoading(false);
        }
    };

    const SUGGESTED_TOPICS = [
        { label: "💰 Ekonomi", prompt: "Kan du sammanfatta föreningens ekonomi och lån?" },
        { label: "🛠️ Renoveringar", prompt: "Finns det några stora kommande eller nyligen gjorda renoveringar?" },
        { label: "📈 Avgifter", prompt: "Har föreningen några planerade avgiftshöjningar?" },
        { label: "⚡ Energi & Uppvärmning", prompt: "Vilken typ av uppvärmning används och hur ser energiklassningen ut?" },
        { label: "🏢 Mark & Ägande", prompt: "Äger föreningen marken eller är det tomträtt?" }
    ];

    return (
        <div style={{
            display: "flex", flexDirection: "column",
            position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
            background: "var(--color-bg)",
            borderRadius: "inherit",
            overflow: "hidden"
        }}>
            {/* Header */}
            <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "var(--space-4)",
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                position: "sticky", top: 0, zIndex: 10
            }}>
                <button onClick={() => navigate(-1)} style={{
                    background: "none", border: "none", color: "var(--color-text-primary)",
                    cursor: "pointer", display: "flex", alignItems: "center", padding: "var(--space-2)",
                    marginLeft: -8, gap: 4, fontSize: "var(--font-size-sm)", fontWeight: 500
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Tillbaka
                </button>
                <div style={{
                    position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                    fontWeight: 600, fontSize: "var(--font-size-base)", color: "var(--color-text-primary)"
                }}>AI-experten</div>
                <div style={{ width: 24 }} /> {/* Balance space */}
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{
                flex: 1, overflowY: "auto", padding: "var(--space-4)",
                display: "flex", flexDirection: "column", gap: "var(--space-4)"
            }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        background: m.role === "user" ? "var(--color-text-primary)" : "var(--color-surface)",
                        color: m.role === "user" ? "white" : "var(--color-text-primary)",
                        padding: "var(--space-3) var(--space-4)",
                        borderRadius: "16px",
                        borderBottomRightRadius: m.role === "user" ? "4px" : "16px",
                        borderBottomLeftRadius: m.role === "model" ? "4px" : "16px",
                        fontSize: "var(--font-size-sm)",
                        lineHeight: 1.5,
                        boxShadow: m.role === "model" ? "0 2px 4px rgba(0,0,0,0.02)" : "none",
                        border: m.role === "model" ? "1px solid var(--color-border)" : "none"
                    }}>
                        {m.content}
                    </div>
                ))}

                {loading && (
                    <div style={{ alignSelf: "flex-start", padding: "var(--space-2) var(--space-3)", color: "var(--color-text-muted)" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--color-border)", borderTopColor: "var(--color-gold)", animation: "spin 0.6s linear infinite" }} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div style={{
                padding: "var(--space-3) 0",
                background: "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
                paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + var(--space-6))"
            }}>
                {/* Horizontal chips */}
                <div className="no-scrollbar" style={{
                    display: "flex", gap: "var(--space-2)", overflowX: "auto",
                    padding: "0 var(--space-4) var(--space-3) var(--space-4)",
                    WebkitOverflowScrolling: "touch", scrollbarWidth: "none"
                }}>
                    {SUGGESTED_TOPICS.map(topic => (
                        <button
                            key={topic.label}
                            onClick={() => handleSend(topic.prompt)}
                            style={{
                                background: "var(--color-bg)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "100px",
                                padding: "6px 12px",
                                fontSize: "var(--font-size-xs)",
                                color: "var(--color-text-secondary)",
                                whiteSpace: "nowrap",
                                cursor: "pointer",
                                flexShrink: 0
                            }}
                        >
                            {topic.label}
                        </button>
                    ))}
                </div>

                <div style={{
                    display: "flex", alignItems: "center", gap: "var(--space-2)",
                    background: "var(--color-bg)", borderRadius: "24px",
                    padding: "4px 4px 4px var(--space-4)",
                    border: "1px solid var(--color-border)",
                    margin: "0 var(--space-4)"
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleSend()}
                        placeholder="Fråga om bostaden..."
                        style={{
                            flex: 1, border: "none", background: "transparent",
                            outline: "none", fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-primary)"
                        }}
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        style={{
                            background: input.trim() ? "var(--color-text-primary)" : "var(--color-border)",
                            color: "white", border: "none",
                            width: 32, height: 32, borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: input.trim() ? "pointer" : "default",
                            transition: "background 0.2s"
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
