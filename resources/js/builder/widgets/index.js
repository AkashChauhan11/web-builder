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
}
