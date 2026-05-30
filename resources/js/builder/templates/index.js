// Central export of starter Section templates (bundled, JS-shipped).

import { getHeroTemplate } from './hero.js';
import { getTwoColumnTemplate } from './two-column.js';
import { getCtaBannerTemplate } from './cta-banner.js';
import { getFeatureGridTemplate } from './feature-grid.js';

// Phase B extras
import { getAboutTemplate } from './extra/about.js';
import { getPricingTemplate } from './extra/pricing.js';
import { getContactTemplate } from './extra/contact.js';
import { getTeamTemplate } from './extra/team.js';
import { getServicesTemplate } from './extra/services.js';
import { getPortfolioTemplate } from './extra/portfolio.js';
import { getTestimonialsTemplate } from './extra/testimonials.js';
import { getFaqTemplate } from './extra/faq.js';
import { getFooterCtaTemplate } from './extra/footer-cta.js';
import { getFeatureListTemplate } from './extra/feature-list.js';

export const TEMPLATES = [
    // Phase A originals
    { id: 'hero',         label: 'Hero',         build: getHeroTemplate,         thumb: '🎯' },
    { id: 'two-column',   label: 'Two Column',   build: getTwoColumnTemplate,    thumb: '⫶⫶' },
    { id: 'cta-banner',   label: 'CTA Banner',   build: getCtaBannerTemplate,    thumb: '📣' },
    { id: 'feature-grid', label: 'Feature Grid', build: getFeatureGridTemplate,  thumb: '⊞' },
    // Phase B additions
    { id: 'about',         label: 'About',        build: getAboutTemplate,         thumb: '📖' },
    { id: 'pricing',       label: 'Pricing',      build: getPricingTemplate,       thumb: '💵' },
    { id: 'contact',       label: 'Contact',      build: getContactTemplate,       thumb: '✉️' },
    { id: 'team',          label: 'Team',         build: getTeamTemplate,          thumb: '👥' },
    { id: 'services',      label: 'Services',     build: getServicesTemplate,      thumb: '🛠' },
    { id: 'portfolio',     label: 'Portfolio',    build: getPortfolioTemplate,     thumb: '🖼' },
    { id: 'testimonials',  label: 'Testimonials', build: getTestimonialsTemplate,  thumb: '❝' },
    { id: 'faq',           label: 'FAQ',          build: getFaqTemplate,           thumb: '❓' },
    { id: 'footer-cta',    label: 'Footer CTA',   build: getFooterCtaTemplate,     thumb: '🚀' },
    { id: 'feature-list',  label: 'Feature List', build: getFeatureListTemplate,   thumb: '☑' },
];
