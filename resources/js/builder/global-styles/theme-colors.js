// Reads the 6 theme colors from the document's CSS custom properties.
// Falls back to sensible defaults if the vars aren't set yet.

const KEYS = ['primary', 'secondary', 'accent', 'text', 'background', 'muted'];
const FALLBACKS = {
    primary: '#3b82f6',
    secondary: '#1e293b',
    accent: '#10b981',
    text: '#0f172a',
    background: '#ffffff',
    muted: '#64748b',
};

export function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    const out = {};
    for (const key of KEYS) {
        const v = styles.getPropertyValue(`--mp-color-${key}`).trim();
        out[key] = v || FALLBACKS[key];
    }
    return out;
}

export function getTypographyPresets() {
    const styles = getComputedStyle(document.documentElement);
    const read = (group) => ({
        font_family: styles.getPropertyValue(`--mp-${group}-family`).trim() || 'system-ui, sans-serif',
        font_size:   styles.getPropertyValue(`--mp-${group}-size`).trim()   || '16px',
        font_weight: styles.getPropertyValue(`--mp-${group}-weight`).trim() || '400',
        line_height: styles.getPropertyValue(`--mp-${group}-line`).trim()   || '1.5',
    });
    return {
        h1:   read('h1'),
        h2:   read('h2'),
        h3:   read('h3'),
        body: read('body'),
    };
}
