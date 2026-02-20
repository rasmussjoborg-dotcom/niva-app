import React, { useState, useCallback, useRef, useEffect } from 'react';

type NavigationDirection = 'forward' | 'back' | 'none';

interface ViewTransitionProps {
    /** A unique key for the current view — changes trigger transitions */
    viewKey: string;
    /** The direction of the navigation */
    direction: NavigationDirection;
    children: React.ReactNode;
}

/**
 * Manages animated view transitions with iOS-style slide animations.
 * - Forward: new view slides in from right, old slides left
 * - Back: new view slides in from left, old slides right
 * - None (initial): simple fade in
 */
export const ViewTransition: React.FC<ViewTransitionProps> = ({
    viewKey,
    direction,
    children,
}) => {
    const [currentView, setCurrentView] = useState<React.ReactNode>(children);
    const [animationClass, setAnimationClass] = useState('view-fade-in');
    const prevKeyRef = useRef(viewKey);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (viewKey !== prevKeyRef.current) {
            // Determine animation based on direction
            const enterClass = direction === 'back' ? 'view-enter-left' : 'view-enter-right';
            setAnimationClass(enterClass);
            setCurrentView(children);
            prevKeyRef.current = viewKey;
        }
    }, [viewKey, children, direction]);

    // Also update children content when they change but key stays same
    useEffect(() => {
        setCurrentView(children);
    }, [children]);

    return (
        <div
            key={viewKey}
            className={`w-full h-full ${animationClass}`}
        >
            {currentView}
        </div>
    );
};
