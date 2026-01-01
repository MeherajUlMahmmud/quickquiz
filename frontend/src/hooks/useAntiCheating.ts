import { useEffect, useRef, useState } from 'react';

interface AntiCheatingOptions {
    enabled: boolean;
    onViolation?: (type: string) => void;
    maxViolations?: number;
}

export const useAntiCheating = ({ enabled, onViolation, maxViolations = 3 }: AntiCheatingOptions) => {
    const [violations, setViolations] = useState(0);
    const [isWarningVisible, setIsWarningVisible] = useState(false);
    const violationCountRef = useRef(0);
    const lastBlurTimeRef = useRef<number | null>(null);
    const hiddenTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!enabled) return;

        // Prevent copy/paste
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            violationCountRef.current += 1;
            setViolations(violationCountRef.current);
            onViolation?.('copy');
            showWarning('Copying is disabled during the quiz');
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            violationCountRef.current += 1;
            setViolations(violationCountRef.current);
            onViolation?.('paste');
            showWarning('Pasting is disabled during the quiz');
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            violationCountRef.current += 1;
            setViolations(violationCountRef.current);
            onViolation?.('cut');
            showWarning('Cutting is disabled during the quiz');
        };

        // Prevent right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            violationCountRef.current += 1;
            setViolations(violationCountRef.current);
            onViolation?.('right_click');
            showWarning('Right-click is disabled during the quiz');
        };

        // Detect tab/window switching
        const handleVisibilityChange = () => {
            const now = Date.now();
            if (document.hidden) {
                // Page became hidden - record the time
                hiddenTimeRef.current = now;
                // Only count if it's been more than 500ms since last blur to avoid double counting
                if (!lastBlurTimeRef.current || (now - lastBlurTimeRef.current) > 500) {
                    violationCountRef.current += 1;
                    setViolations(violationCountRef.current);
                    onViolation?.('tab_switch');
                    showWarning('Tab/window switching detected');
                }
                lastBlurTimeRef.current = now;
            } else {
                // Page became visible again - check if it was hidden for a significant time
                if (hiddenTimeRef.current) {
                    const hiddenDuration = now - hiddenTimeRef.current;
                    // If hidden for more than 500ms, it's likely a window switch
                    if (hiddenDuration > 500) {
                        violationCountRef.current += 1;
                        setViolations(violationCountRef.current);
                        onViolation?.('window_switch');
                        showWarning('Window switching detected');
                    }
                    hiddenTimeRef.current = null;
                }
            }
        };

        const handleBlur = () => {
            const now = Date.now();
            // Detect window focus loss
            // Only count if it's been more than 500ms since last blur to avoid double counting
            if (!lastBlurTimeRef.current || (now - lastBlurTimeRef.current) > 500) {
                violationCountRef.current += 1;
                setViolations(violationCountRef.current);
                onViolation?.('window_blur');
                showWarning('Window focus lost');
            }
            lastBlurTimeRef.current = now;
        };

        // Detect focus loss on the window itself
        const handleFocus = () => {
            // When window regains focus, check if it was hidden
            if (document.hidden === false && lastBlurTimeRef.current) {
                const now = Date.now();
                // If focus was lost for more than 1 second, it's likely a switch
                if ((now - lastBlurTimeRef.current) > 1000) {
                    violationCountRef.current += 1;
                    setViolations(violationCountRef.current);
                    onViolation?.('window_switch');
                    showWarning('Window switching detected');
                }
            }
        };

        // Prevent keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Disable F12 (DevTools), Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U (View Source)
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
                (e.ctrlKey && e.key === 'u')
            ) {
                e.preventDefault();
                violationCountRef.current += 1;
                setViolations(violationCountRef.current);
                onViolation?.('devtools_shortcut');
                showWarning('Developer tools are disabled during the quiz');
            }
        };

        const showWarning = (message: string) => {
            console.log("Showing warning:", message);
            setIsWarningVisible(true);
            setTimeout(() => {
                console.log("Hiding warning");
                setIsWarningVisible(false);
            }, 3000);
        };

        // Add event listeners
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled, onViolation]);

    useEffect(() => {
        if (violations >= maxViolations) {
            onViolation?.('max_violations');
        }
    }, [violations, maxViolations, onViolation]);

    return {
        violations,
        isWarningVisible,
        shouldBlock: violations >= maxViolations,
    };
};

