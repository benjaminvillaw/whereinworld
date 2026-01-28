import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that triggers a callback when the page becomes visible.
 * Used to auto-update location when user returns to the app.
 */
export function useVisibilityUpdate(onVisible) {
    const callbackRef = useRef(onVisible);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onVisible;
    }, [onVisible]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                callbackRef.current?.();
            }
        };

        // Also trigger on window focus for better coverage
        const handleFocus = () => {
            callbackRef.current?.();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);
}

/**
 * Hook that returns an interval-based updater.
 * Updates at specified interval, but respects a minimum cooldown.
 */
export function useIntervalUpdate(callback, intervalMs = 60000) {
    const lastUpdate = useRef(0);

    const throttledCallback = useCallback(() => {
        const now = Date.now();
        if (now - lastUpdate.current >= intervalMs) {
            lastUpdate.current = now;
            callback();
        }
    }, [callback, intervalMs]);

    useEffect(() => {
        const id = setInterval(throttledCallback, intervalMs);
        return () => clearInterval(id);
    }, [throttledCallback, intervalMs]);

    return throttledCallback;
}
