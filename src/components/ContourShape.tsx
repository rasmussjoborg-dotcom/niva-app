import React from "react";

interface ContourShapeProps {
    /** Position: top-right, bottom-left, center, etc */
    position?: "top-right" | "bottom-left" | "top-left" | "center-right";
    /** Rotation in degrees */
    rotation?: number;
    /** Scale multiplier */
    scale?: number;
    /** Flip horizontally */
    flipX?: boolean;
    /** Custom opacity override */
    opacity?: number;
}

export function ContourShape({
    position = "top-right",
    rotation = 0,
    scale = 1,
    flipX = false,
    opacity = 0.06,
}: ContourShapeProps) {
    const positionStyles: Record<string, React.CSSProperties> = {
        "top-right": { top: -120, right: -180 },
        "bottom-left": { bottom: -160, left: -200 },
        "top-left": { top: -100, left: -220 },
        "center-right": { top: "20%", right: -200 },
    };

    const pos = positionStyles[position] || positionStyles["top-right"];
    const baseSize = 700 * scale;

    return (
        <svg
            viewBox="0 0 390 400"
            fill="none"
            style={{
                position: "absolute",
                ...pos,
                width: baseSize,
                height: baseSize * 1.17,
                opacity,
                transform: `rotate(${rotation}deg)${flipX ? " scaleX(-1)" : ""}`,
                pointerEvents: "none",
                animation: "fadeIn 2s ease",
            }}
        >
            <path d="M320 80C280 40 220 20 160 40C100 60 60 120 40 180C20 240 40 300 80 340C120 380 200 400 260 360C320 320 360 260 340 200C320 140 360 120 320 80Z" stroke="var(--color-midnight)" strokeWidth="1.5" />
            <path d="M300 100C260 65 210 50 160 65C110 80 75 135 60 190C45 245 60 295 95 330C130 365 195 380 245 345C295 310 330 255 315 200C300 145 335 130 300 100Z" stroke="var(--color-midnight)" strokeWidth="1.5" />
            <path d="M280 120C245 90 205 80 165 90C125 100 95 145 80 195C65 245 80 290 110 320C140 350 190 360 230 335C270 310 300 260 290 210C280 160 310 140 280 120Z" stroke="var(--color-midnight)" strokeWidth="1.5" />
            <path d="M260 145C230 120 200 110 170 118C140 126 115 160 105 200C95 240 105 275 125 300C145 325 180 335 210 315C240 295 265 255 258 215C251 175 275 165 260 145Z" stroke="var(--color-midnight)" strokeWidth="1.5" />
            <path d="M240 170C220 150 198 142 178 148C158 154 140 178 132 208C124 238 130 265 145 282C160 299 180 305 200 290C220 275 238 248 233 218C228 188 245 182 240 170Z" stroke="var(--color-midnight)" strokeWidth="1.5" />
        </svg>
    );
}
