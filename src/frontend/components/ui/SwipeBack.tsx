import React, { useRef, useCallback, useEffect } from 'react';

interface SwipeBackProps {
    children: React.ReactNode;
    onSwipeBack: () => void;
    /** Minimum horizontal distance to trigger (default: 80px) */
    threshold?: number;
    /** Whether swipe-back is enabled (disable on root screens) */
    enabled?: boolean;
}

/**
 * Wraps a screen and allows swipe-from-left-edge to trigger a back navigation.
 * Mimics iOS native edge-swipe behavior.
 */
export const SwipeBack: React.FC<SwipeBackProps> = ({
    children,
    onSwipeBack,
    threshold = 80,
    enabled = true,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const isDragging = useRef(false);
    const translateX = useRef(0);

    const updateIndicator = useCallback((progress: number) => {
        if (!indicatorRef.current) return;
        if (progress <= 0) {
            indicatorRef.current.style.opacity = '0';
            indicatorRef.current.style.transform = 'translateX(-100%)';
        } else {
            indicatorRef.current.style.opacity = `${Math.min(progress * 1.5, 1)}`;
            indicatorRef.current.style.transform = `translateX(${-100 + progress * 100}%)`;
        }
    }, []);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        if (!enabled) return;
        const touch = e.touches[0];
        // Only activate from left edge (first 30px)
        if (touch.clientX > 30) return;
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        isDragging.current = true;
    }, [enabled]);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX.current;
        const dy = touch.clientY - touchStartY.current;

        // If vertical movement exceeds horizontal, cancel
        if (Math.abs(dy) > Math.abs(dx)) {
            isDragging.current = false;
            containerRef.current.style.transform = '';
            containerRef.current.style.opacity = '';
            updateIndicator(0);
            return;
        }

        // Only allow right swipe
        if (dx < 0) return;

        e.preventDefault();
        translateX.current = dx;

        const progress = Math.min(dx / (threshold * 2), 1);
        containerRef.current.style.transform = `translateX(${dx}px)`;
        containerRef.current.style.opacity = `${1 - progress * 0.3}`;
        containerRef.current.style.transition = 'none';
        updateIndicator(progress);
    }, [threshold, updateIndicator]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging.current || !containerRef.current) return;
        isDragging.current = false;

        if (translateX.current >= threshold) {
            // Complete the swipe — slide fully off screen then navigate
            containerRef.current.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
            containerRef.current.style.transform = 'translateX(100%)';
            containerRef.current.style.opacity = '0';
            updateIndicator(1);
            setTimeout(onSwipeBack, 200);
        } else {
            // Snap back
            containerRef.current.style.transition = 'transform 0.25s ease-out, opacity 0.25s ease-out';
            containerRef.current.style.transform = 'translateX(0)';
            containerRef.current.style.opacity = '1';
            updateIndicator(0);
        }
        translateX.current = 0;
    }, [threshold, onSwipeBack, updateIndicator]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        el.addEventListener('touchstart', handleTouchStart, { passive: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart);
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    return (
        <div className="relative w-full h-full flex flex-col flex-1">
            {/* Swipe-back visual indicator */}
            {enabled && (
                <div
                    ref={indicatorRef}
                    className="absolute left-0 top-0 bottom-0 w-8 z-[100] pointer-events-none flex items-center justify-center"
                    style={{
                        opacity: 0,
                        transform: 'translateX(-100%)',
                        transition: 'opacity 0.15s ease-out, transform 0.15s ease-out',
                        background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)',
                    }}
                >
                    <span
                        className="material-symbols-outlined text-black/40 dark:text-white/40 text-lg"
                        style={{ marginLeft: -4 }}
                    >
                        chevron_left
                    </span>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full flex flex-col flex-1"
                style={{ willChange: 'transform' }}
            >
                {children}
            </div>
        </div>
    );
};
