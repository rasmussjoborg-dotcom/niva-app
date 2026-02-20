import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Catches rendering errors in child components and shows a recovery UI
 * instead of crashing the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 font-display">
                    <div className="text-center space-y-4 max-w-xs">
                        <span className="material-symbols-outlined text-4xl text-text-muted">
                            error_outline
                        </span>
                        <h2 className="text-lg font-bold text-black dark:text-white">
                            Något gick fel
                        </h2>
                        <p className="text-sm text-text-muted leading-relaxed">
                            Ett oväntat fel uppstod. Försök igen eller gå tillbaka.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="mt-4 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-section text-sm font-semibold active:scale-[0.98] transition-transform"
                        >
                            Försök igen
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
