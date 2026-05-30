// Central registration for all 20 Elementor-style widgets.

import { registerHeading } from './heading.js';
import { registerText } from './text.js';
import { registerButton } from './button.js';
import { registerIcon } from './icon.js';
import { registerIconBox } from './icon-box.js';
import { registerDivider } from './divider.js';
import { registerSpacer } from './spacer.js';
import { registerHtml } from './html.js';
import { registerAlert } from './alert.js';
import { registerImage } from './image.js';
import { registerGallery } from './gallery.js';
import { registerVideo } from './video.js';
import { registerSocial } from './social.js';
import { registerProgress } from './progress.js';
import { registerCounter } from './counter.js';
import { registerAccordion } from './accordion.js';
import { registerTabs } from './tabs.js';
import { registerCarousel } from './carousel.js';
import { registerTestimonial } from './testimonial.js';
import { registerPricing } from './pricing.js';
import { registerMap } from './map.js';
import { registerRating } from './rating.js';
import { registerShortcode } from './shortcode.js';
import { registerForm } from './form.js';

export function registerAllWidgets(editor) {
    registerHeading(editor);
    registerText(editor);
    registerButton(editor);
    registerIcon(editor);
    registerIconBox(editor);
    registerDivider(editor);
    registerSpacer(editor);
    registerHtml(editor);
    registerAlert(editor);
    registerImage(editor);
    registerGallery(editor);
    registerVideo(editor);
    registerSocial(editor);
    registerProgress(editor);
    registerCounter(editor);
    registerAccordion(editor);
    registerTabs(editor);
    registerCarousel(editor);
    registerTestimonial(editor);
    registerPricing(editor);
    registerMap(editor);
    registerRating(editor);
    registerShortcode(editor);
    registerForm(editor);

    registerWidgetBlocks(editor);
}

// Draggable widget tiles for the left panel — one per widget type, grouped by category.
const BLOCK_DEFS = [
    // Content
    { type: 'mp-heading',     label: 'Heading',      category: 'Content', glyph: 'H'   },
    { type: 'mp-text',        label: 'Text',         category: 'Content', glyph: '¶'   },
    { type: 'mp-button',      label: 'Button',       category: 'Content', glyph: '▭'   },
    { type: 'mp-icon',        label: 'Icon',         category: 'Content', glyph: '★'   },
    { type: 'mp-icon-box',    label: 'Icon Box',     category: 'Content', glyph: '✓'   },
    { type: 'mp-divider',     label: 'Divider',      category: 'Content', glyph: '—'   },
    { type: 'mp-spacer',      label: 'Spacer',       category: 'Content', glyph: '↕'   },
    { type: 'mp-html',        label: 'HTML',         category: 'Content', glyph: '</>' },
    // Media
    { type: 'mp-image',       label: 'Image',        category: 'Media', glyph: '🖼' },
    { type: 'mp-gallery',     label: 'Gallery',      category: 'Media', glyph: '▦' },
    { type: 'mp-video',       label: 'Video',        category: 'Media', glyph: '▶' },
    // Interactive
    { type: 'mp-accordion',   label: 'Accordion',    category: 'Interactive', glyph: '≡' },
    { type: 'mp-tabs',        label: 'Tabs',         category: 'Interactive', glyph: '▭▭' },
    { type: 'mp-counter',     label: 'Counter',      category: 'Interactive', glyph: '#' },
    { type: 'mp-carousel',    label: 'Carousel',     category: 'Interactive', glyph: '⇄' },
    // Social proof
    { type: 'mp-testimonial', label: 'Testimonial',  category: 'Social', glyph: '❝' },
    { type: 'mp-pricing',     label: 'Pricing',      category: 'Social', glyph: '$' },
    { type: 'mp-social',      label: 'Social Icons', category: 'Social', glyph: '♺' },
    // Utility
    { type: 'mp-progress',    label: 'Progress',     category: 'Utility', glyph: '▰' },
    { type: 'mp-alert',       label: 'Alert',        category: 'Utility', glyph: '!' },
    // Phase C
    { type: 'mp-map',         label: 'Map',          category: 'Media',   glyph: '📍' },
    { type: 'mp-rating',      label: 'Rating',       category: 'Social',  glyph: '⭐' },
    { type: 'mp-shortcode',   label: 'Shortcode',    category: 'Utility', glyph: '{}' },
    // Phase C/2 — Form Builder
    { type: 'mp-form',        label: 'Form',         category: 'Interactive', glyph: '✉' },
];

function registerWidgetBlocks(editor) {
    BLOCK_DEFS.forEach(({ type, label, category, glyph }) => {
        editor.Blocks.add(type, {
            label,
            category,
            media: `<div style="display:grid;place-items:center;height:36px;font-size:18px;color:#475569;font-weight:600">${glyph}</div>`,
            content: { type },
            select: true,
            activate: true,
        });
    });
}
