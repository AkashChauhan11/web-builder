// Strip non-allowed tags + attributes from clipboard HTML on paste.
// Attached to the canvas iframe document when the editor loads.

const ALLOWED = new Set([
    'B', 'I', 'U', 'S', 'A',
    'UL', 'OL', 'LI',
    'BLOCKQUOTE', 'CODE',
    'BR', 'P', 'H2', 'H3', 'H4',
    'SPAN', 'STRONG', 'EM',
]);

const ALLOWED_ATTR = {
    A: ['href', 'target', 'rel'],
};

export function attachPasteFilter(canvasDoc) {
    canvasDoc.addEventListener('paste', (e) => {
        const target = canvasDoc.activeElement;
        if (!target || !target.isContentEditable) return;

        const html = e.clipboardData?.getData('text/html');
        const text = e.clipboardData?.getData('text/plain');

        e.preventDefault();

        if (html) {
            const clean = sanitize(html);
            canvasDoc.execCommand('insertHTML', false, clean);
        } else if (text) {
            canvasDoc.execCommand('insertText', false, text);
        }
    });
}

function sanitize(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    walk(doc.body);
    return doc.body.innerHTML;
}

function walk(node) {
    for (const child of Array.from(node.children)) {
        if (!ALLOWED.has(child.tagName)) {
            while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
            child.remove();
            continue;
        }
        const allowedAttrs = ALLOWED_ATTR[child.tagName] || [];
        for (const attr of Array.from(child.attributes)) {
            if (!allowedAttrs.includes(attr.name)) child.removeAttribute(attr.name);
        }
        walk(child);
    }
}
