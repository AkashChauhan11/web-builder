// Central export of starter Section templates.

import { getHeroTemplate } from './hero.js';
import { getTwoColumnTemplate } from './two-column.js';
import { getCtaBannerTemplate } from './cta-banner.js';
import { getFeatureGridTemplate } from './feature-grid.js';

export const TEMPLATES = [
    { id: 'hero',         label: 'Hero',         build: getHeroTemplate,         thumb: '🎯' },
    { id: 'two-column',   label: 'Two Column',   build: getTwoColumnTemplate,    thumb: '⫶⫶' },
    { id: 'cta-banner',   label: 'CTA Banner',   build: getCtaBannerTemplate,    thumb: '📣' },
    { id: 'feature-grid', label: 'Feature Grid', build: getFeatureGridTemplate,  thumb: '⊞' },
];
