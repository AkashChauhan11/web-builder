// Configure GrapesJS's RichTextEditor with our custom action set.
// Per-widget filtering of which buttons appear is driven by the editable component's `rte_profile` prop.

import { openLinkPopover } from './link-popover.js';

export const RTE_PROFILES = {
    heading: ['bold', 'italic', 'link', 'clear'],
    button:  ['bold', 'italic'],
    text:    ['bold', 'italic', 'underline', 'strikethrough', 'link', 'h2', 'h3', 'h4', 'ul', 'ol', 'blockquote', 'code', 'clear'],
    inline:  ['bold', 'italic', 'link', 'clear'],
};

export function configureRTE(editor) {
    const rte = editor.RichTextEditor;

    // Remove GrapesJS defaults we replace with our own
    ['bold', 'italic', 'underline', 'strikethrough', 'link'].forEach((n) => {
        try { rte.remove(n); } catch { /* ignore — may not exist */ }
    });

    rte.add('bold',          { icon: '<b>B</b>',  attributes: { title: 'Bold (Ctrl+B)',  'data-action': 'bold' },          result: (r) => r.exec('bold') });
    rte.add('italic',        { icon: '<i>I</i>',  attributes: { title: 'Italic (Ctrl+I)', 'data-action': 'italic' },        result: (r) => r.exec('italic') });
    rte.add('underline',     { icon: '<u>U</u>',  attributes: { title: 'Underline (Ctrl+U)', 'data-action': 'underline' }, result: (r) => r.exec('underline') });
    rte.add('strikethrough', { icon: '<s>S</s>',  attributes: { title: 'Strikethrough', 'data-action': 'strikethrough' },   result: (r) => r.exec('strikeThrough') });
    rte.add('h2',            { icon: 'H2',         attributes: { title: 'Heading 2', 'data-action': 'h2' },                  result: (r) => r.exec('formatBlock', '<h2>') });
    rte.add('h3',            { icon: 'H3',         attributes: { title: 'Heading 3', 'data-action': 'h3' },                  result: (r) => r.exec('formatBlock', '<h3>') });
    rte.add('h4',            { icon: 'H4',         attributes: { title: 'Heading 4', 'data-action': 'h4' },                  result: (r) => r.exec('formatBlock', '<h4>') });
    rte.add('ul',            { icon: '&bull;',     attributes: { title: 'Bulleted list', 'data-action': 'ul' },              result: (r) => r.exec('insertUnorderedList') });
    rte.add('ol',            { icon: '1.',         attributes: { title: 'Numbered list', 'data-action': 'ol' },              result: (r) => r.exec('insertOrderedList') });
    rte.add('blockquote',    { icon: '&ldquo;',    attributes: { title: 'Blockquote', 'data-action': 'blockquote' },         result: (r) => r.exec('formatBlock', '<blockquote>') });
    rte.add('code',          { icon: '&lt;/&gt;',  attributes: { title: 'Inline code', 'data-action': 'code' },              result: (r) => r.exec('formatBlock', '<code>') });
    rte.add('clear',         { icon: '&times;',    attributes: { title: 'Clear formatting', 'data-action': 'clear' },        result: (r) => r.exec('removeFormat') });

    rte.add('link', {
        icon: '🔗',
        attributes: { title: 'Link', 'data-action': 'link' },
        result: (r) => {
            const sel = r.selection();
            const anchor = sel?.focusNode?.parentElement?.closest?.('a');
            const button = document.querySelector('.gjs-rte-actionbar [data-action="link"]') || document.body;
            openLinkPopover({
                anchorEl: button,
                current: anchor
                    ? { url: anchor.href, target: anchor.target || '_self', rel: anchor.rel || '' }
                    : {},
                onApply: ({ url, target, rel }) => {
                    if (!url) return;
                    r.exec('createLink', url);
                    const newAnchor = r.selection()?.focusNode?.parentElement?.closest?.('a');
                    if (newAnchor) {
                        if (target) newAnchor.target = target;
                        if (rel) newAnchor.rel = rel;
                        else newAnchor.removeAttribute('rel');
                    }
                },
                onUnlink: () => r.exec('unlink'),
            });
        },
    });

    // Per-widget filtering: when an editable region is enabled, show only the actions in its profile
    editor.on('rte:enable', (view) => {
        const profile = view?.model?.get('rte_profile') || 'text';
        const allowed = new Set(RTE_PROFILES[profile] || RTE_PROFILES.text);
        window.setTimeout(() => {
            document.querySelectorAll('.gjs-rte-actionbar [data-action]').forEach((btn) => {
                btn.style.display = allowed.has(btn.dataset.action) ? '' : 'none';
            });
        }, 0);
    });
}
