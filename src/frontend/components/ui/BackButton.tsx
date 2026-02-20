import React from 'react';

interface BackButtonProps {
    onClick: () => void;
    className?: string;
}

/**
 * Standardized iOS-style back button.
 * - Consistent 48×48pt touch target (exceeds Apple's 44pt minimum)
 * - Uses chevron_left (iOS convention)
 * - active: feedback for touch
 */
export const BackButton = ({ onClick, className = '' }: BackButtonProps) => (
    <button
        onClick={onClick}
        className={`w-12 h-12 -ml-2 flex items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/5 transition-colors ${className}`}
        aria-label="Tillbaka"
    >
        <span className="material-symbols-outlined text-[28px] text-black dark:text-white">chevron_left</span>
    </button>
);
