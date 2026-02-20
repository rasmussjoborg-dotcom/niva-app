import React from 'react';

/**
 * Skeleton loading primitives for a premium loading experience.
 * Each component uses a shimmer animation that matches the app's design language.
 */

const shimmerClass = 'animate-pulse bg-surface-input dark:bg-surface-dark rounded-2xl';

/** A generic rectangular skeleton block */
export const SkeletonBlock = ({ className = '' }: { className?: string }) => (
    <div className={`${shimmerClass} ${className}`} />
);

/** Skeleton for a single property card on the Home screen */
export const SkeletonPropertyCard = () => (
    <div className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden">
        {/* Image placeholder — full bleed like redesigned cards */}
        <SkeletonBlock className="w-full aspect-[16/10] rounded-none bg-border-light dark:bg-border-dark" />
        {/* Text content below image */}
        <div className="p-5 space-y-3">
            <SkeletonBlock className="h-5 w-3/4 rounded-lg" />
            <SkeletonBlock className="h-3 w-1/2 rounded-lg" />
            <div className="flex gap-2 pt-1">
                <SkeletonBlock className="h-7 w-20 rounded-full" />
                <SkeletonBlock className="h-7 w-24 rounded-full" />
                <SkeletonBlock className="h-7 w-16 rounded-full" />
            </div>
        </div>
    </div>
);

/** Skeleton for the Home screen — header + hero + cards */
export const SkeletonHome = () => (
    <div className="w-full h-full bg-page-bg-light dark:bg-page-bg-dark flex flex-col">
        {/* Header */}
        <header className="px-page-x py-4 flex justify-between items-center pt-safe-top">
            <SkeletonBlock className="h-7 w-16 rounded-lg" />
            <SkeletonBlock className="h-10 w-10 rounded-full" />
        </header>
        {/* Hero search prompt */}
        <div className="px-page-x mb-6">
            <SkeletonBlock className="h-14 w-full rounded-2xl" />
        </div>
        {/* Section title */}
        <div className="px-page-x flex justify-between items-baseline mb-5">
            <SkeletonBlock className="h-4 w-28 rounded-lg" />
            <SkeletonBlock className="h-3 w-16 rounded" />
        </div>
        {/* Cards */}
        <div className="px-page-x space-y-5">
            <SkeletonPropertyCard />
            <SkeletonPropertyCard />
        </div>
    </div>
);
