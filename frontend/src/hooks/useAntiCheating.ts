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
            if (document.hidden) {
                const now = Date.now();
                if (lastBlurTimeRef.current && now - lastBlurTimeRef.current < 1000) {
                    // Multiple rapid switches
                    violationCountRef.current += 1;
                    setViolations(violationCountRef.current);
                    onViolation?.('tab_switch');
                    showWarning('Tab switching detected');
                }
                lastBlurTimeRef.current = now;
            }
        };

        const handleBlur = () => {
            const now = Date.now();
            if (lastBlurTimeRef.current && now - lastBlurTimeRef.current < 1000) {
                violationCountRef.current += 1;
                setViolations(violationCountRef.current);
                onViolation?.('window_blur');
                showWarning('Window focus lost');
            }
            lastBlurTimeRef.current = now;
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
            setIsWarningVisible(true);
            setTimeout(() => setIsWarningVisible(false), 3000);
        };

        // Add event listeners
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
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

