// Focus trap for popovers/modals. Cycles Tab/Shift+Tab between focusable elements inside `root`.
// Stores the previously-focused element so callers can restore on close.

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Trap focus inside `root`. Returns a cleanup function the caller MUST call when closing.
 * The cleanup restores focus to whatever was active before `trap()` was called.
 */
export function trapFocus(root) {
    const previousActive = document.activeElement;

    function onKeyDown(e) {
        if (e.key !== 'Tab') return;
        const focusables = Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) {
            e.preventDefault();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    root.addEventListener('keydown', onKeyDown);

    // Focus the first focusable element inside the root
    const firstFocusable = root.querySelector(FOCUSABLE);
    firstFocusable?.focus();

    return function cleanup() {
        root.removeEventListener('keydown', onKeyDown);
        if (previousActive && typeof previousActive.focus === 'function' && document.contains(previousActive)) {
            previousActive.focus();
        }
    };
}
