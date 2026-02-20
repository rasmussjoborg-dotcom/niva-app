/**
 * Haptic feedback utility for mobile.
 * Uses the Vibration API (PWA) or Capacitor Haptics (native builds).
 * Gracefully degrades — no-op on unsupported devices.
 */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const VIBRATION_DURATIONS: Record<HapticStyle, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    selection: 5,
    success: [10, 50, 15],
    warning: [15, 30, 15],
    error: [20, 40, 20, 40, 20],
};

export function haptic(style: HapticStyle = 'light'): void {
    try {
        // Check for Capacitor Haptics first (native builds)
        if (typeof (window as any).Capacitor !== 'undefined') {
            const { Haptics, ImpactStyle, NotificationType } = (window as any).Capacitor.Plugins;
            if (Haptics) {
                switch (style) {
                    case 'light':
                        Haptics.impact({ style: ImpactStyle.Light });
                        return;
                    case 'medium':
                        Haptics.impact({ style: ImpactStyle.Medium });
                        return;
                    case 'heavy':
                        Haptics.impact({ style: ImpactStyle.Heavy });
                        return;
                    case 'selection':
                        Haptics.selectionStart();
                        Haptics.selectionChanged();
                        Haptics.selectionEnd();
                        return;
                    case 'success':
                        Haptics.notification({ type: NotificationType.Success });
                        return;
                    case 'warning':
                        Haptics.notification({ type: NotificationType.Warning });
                        return;
                    case 'error':
                        Haptics.notification({ type: NotificationType.Error });
                        return;
                }
            }
        }

        // Fallback to Vibration API (Chrome on Android, some PWAs)
        if (navigator.vibrate) {
            navigator.vibrate(VIBRATION_DURATIONS[style]);
        }
    } catch {
        // Silently fail — haptics are nice-to-have
    }
}
