// MiniPress public-page runtime — initializes interactive widgets on saved pages.
// Loaded by resources/views/layouts/app.blade.php via @vite.

import EmblaCarousel from 'embla-carousel';

const HANDLERS = {
    'accordion': initAccordion,
    'tabs': initTabs,
    'alert': initAlert,
    'counter': initCounter,
    'progress': initProgress,
    'carousel': initCarousel,
    'gallery': initGallery,
    'form': initForm,
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

function initAll() {
    document.querySelectorAll('[data-mp-widget]').forEach((el) => {
        const type = el.dataset.mpWidget;
        const handler = HANDLERS[type];
        if (handler) handler(el);
    });
    initAnimations();
}

// ----- Entrance animations -----
function initAnimations() {
    const els = document.querySelectorAll('[data-mp-animation]');
    if (els.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    els.forEach((el) => observer.observe(el));
}

// ----- Accordion -----
function initAccordion(root) {
    const allowMultiple = root.dataset.mpMultiple === '1';
    const items = root.querySelectorAll('.mp-accordion__item');
    items.forEach((item) => {
        const title = item.querySelector('.mp-accordion__title');
        title?.addEventListener('click', () => {
            const isOpen = item.dataset.mpOpen === '1';
            if (!allowMultiple) {
                items.forEach((sib) => { sib.dataset.mpOpen = '0'; });
            }
            item.dataset.mpOpen = isOpen ? '0' : '1';
        });
    });
}

// ----- Tabs -----
function initTabs(root) {
    const tabs = Array.from(root.querySelectorAll('.mp-tab'));
    if (tabs.length === 0) return;
    const defaultIdx = parseInt(root.dataset.mpDefault, 10) || 0;

    function activate(idx) {
        tabs.forEach((tab, i) => {
            const active = i === idx ? '1' : '0';
            tab.dataset.mpActive = active;
            tab.querySelector('.mp-tab__label')?.setAttribute('data-mp-active', active);
            tab.querySelector('.mp-tab__panel')?.setAttribute('data-mp-active', active);
        });
    }

    tabs.forEach((tab, i) => {
        tab.querySelector('.mp-tab__label')?.addEventListener('click', () => activate(i));
    });

    activate(Math.max(0, Math.min(tabs.length - 1, defaultIdx)));
}

// ----- Alert -----
function initAlert(root) {
    if (root.dataset.mpDismissible !== '1') return;
    const close = root.querySelector('.mp-alert__close');
    close?.addEventListener('click', () => {
        root.style.display = 'none';
    });
}

// ----- Counter -----
function initCounter(root) {
    const start = parseFloat(root.dataset.mpStart) || 0;
    const end = parseFloat(root.dataset.mpEnd) || 100;
    const duration = parseFloat(root.dataset.mpDuration) || 2000;
    const prefix = root.dataset.mpPrefix || '';
    const suffix = root.dataset.mpSuffix || '';
    const separator = root.dataset.mpSeparator || ',';
    const display = root.querySelector('.mp-counter__value');
    if (!display) return;

    const format = (n) => {
        const rounded = Math.round(n);
        const withSep = separator
            ? String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, separator)
            : String(rounded);
        return `${prefix}${withSep}${suffix}`;
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateValue(start, end, duration, (v) => { display.textContent = format(v); });
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    observer.observe(root);
}

function animateValue(from, to, duration, onTick) {
    const t0 = performance.now();
    function tick(now) {
        const t = Math.min(1, (now - t0) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        onTick(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ----- Progress -----
function initProgress(root) {
    if (root.dataset.mpAnimated !== '1') return;
    const fill = root.querySelector('.mp-progress__fill');
    if (!fill) return;

    const targetWidth = fill.style.width || '0%';
    fill.style.width = '0%';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                requestAnimationFrame(() => { fill.style.width = targetWidth; });
                observer.disconnect();
            }
        });
    }, { threshold: 0.3 });
    observer.observe(root);
}

// ----- Carousel -----
function initCarousel(root) {
    const viewport = root.querySelector('.mp-carousel__viewport');
    if (!viewport) return;

    const loop = root.dataset.mpLoop === '1';
    const autoplayMs = parseInt(root.dataset.mpAutoplay, 10) || 0;

    const embla = EmblaCarousel(viewport, { loop, slidesToScroll: 1 });

    if (root.dataset.mpArrows === '1') {
        root.querySelector('.mp-carousel__prev')?.addEventListener('click', () => embla.scrollPrev());
        root.querySelector('.mp-carousel__next')?.addEventListener('click', () => embla.scrollNext());
    }

    if (root.dataset.mpDots === '1') {
        const dotsContainer = root.querySelector('.mp-carousel__dots');
        if (dotsContainer) {
            const slides = embla.scrollSnapList();
            dotsContainer.innerHTML = slides.map((_, i) =>
                `<button class="mp-carousel__dot" data-active="${i === 0 ? '1' : '0'}" data-idx="${i}" aria-label="Go to slide ${i + 1}"></button>`
            ).join('');
            dotsContainer.addEventListener('click', (e) => {
                const idx = e.target.closest('[data-idx]')?.dataset.idx;
                if (idx !== undefined) embla.scrollTo(parseInt(idx, 10));
            });
            embla.on('select', () => {
                const active = embla.selectedScrollSnap();
                dotsContainer.querySelectorAll('.mp-carousel__dot').forEach((dot, i) => {
                    dot.dataset.active = i === active ? '1' : '0';
                });
            });
        }
    }

    if (autoplayMs > 0) {
        const interval = window.setInterval(() => embla.scrollNext(), autoplayMs);
        // Pause autoplay on hover
        root.addEventListener('mouseenter', () => window.clearInterval(interval));
    }
}

// ----- Gallery lightbox -----
function initGallery(root) {
    if (root.dataset.mpLightbox !== '1') return;
    root.querySelectorAll('.mp-gallery__item').forEach((item) => {
        item.style.cursor = 'zoom-in';
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            if (!img) return;
            openLightbox(img.src, img.alt);
        });
    });
}

function openLightbox(src, alt) {
    const overlay = document.createElement('div');
    overlay.className = 'mp-lightbox';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
        <button class="mp-lightbox__close" type="button" aria-label="Close">&times;</button>
        <img src="${escapeAttr(src)}" alt="${escapeAttr(alt || '')}">
    `;
    document.body.appendChild(overlay);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const close = () => {
        overlay.remove();
        document.body.style.overflow = prevOverflow;
        document.removeEventListener('keydown', onEsc);
    };

    function onEsc(e) { if (e.key === 'Escape') close(); }
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.closest('.mp-lightbox__close')) close();
    });
    document.addEventListener('keydown', onEsc);
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }

// ----- Form -----
function initForm(form) {
    if (form.dataset.mpFormInitialized === '1') return;
    form.dataset.mpFormInitialized = '1';

    // Inject honeypot + timestamp hidden inputs
    const honeypot = document.createElement('input');
    honeypot.type = 'text';
    honeypot.name = '_honeypot';
    honeypot.tabIndex = -1;
    honeypot.autocomplete = 'off';
    honeypot.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    honeypot.setAttribute('aria-hidden', 'true');
    form.appendChild(honeypot);

    const ts = document.createElement('input');
    ts.type = 'hidden';
    ts.name = '_ts';
    ts.value = String(Math.floor(Date.now() / 1000));
    form.appendChild(ts);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitForm(form);
    });
}

async function submitForm(form) {
    const formId = form.dataset.mpFormId || '';
    const formName = form.dataset.mpFormName || '';
    const redirectUrl = form.dataset.mpRedirect || '';
    const successMessage = form.dataset.mpSuccessMessage || 'Thanks — we received your message.';
    const notificationEmail = form.dataset.mpNotification || '';

    const fields = {};
    const formData = new FormData(form);
    for (const [k, v] of formData.entries()) {
        if (k === '_honeypot' || k === '_ts') continue;
        if (k in fields) {
            // Multi-value (e.g. checkbox group)
            const prev = fields[k];
            fields[k] = Array.isArray(prev) ? [...prev, v] : [prev, v];
        } else {
            fields[k] = v;
        }
    }

    const submitBtn = form.querySelector('button[type=submit], input[type=submit]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.mpOriginalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending…';
    }

    try {
        const resp = await fetch('/forms/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                form_id: formId,
                form_name: formName,
                page_url: window.location.href,
                notification_email: notificationEmail,
                fields,
                _honeypot: form.querySelector('[name=_honeypot]')?.value || '',
                _ts: parseInt(form.querySelector('[name=_ts]')?.value || '0', 10),
            }),
        });

        const body = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            renderFormMessage(form, 'error', body.message || `Submission failed (${resp.status})`);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.dataset.mpOriginalText || 'Send';
            }
            return;
        }

        if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
        }

        renderFormMessage(form, 'success', successMessage);
        form.reset();
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.mpOriginalText || 'Send';
        }
    } catch (err) {
        renderFormMessage(form, 'error', 'Network error — please try again.');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.mpOriginalText || 'Send';
        }
    }
}

function renderFormMessage(form, kind, msg) {
    let bar = form.querySelector('.mp-form__msg');
    if (!bar) {
        bar = document.createElement('div');
        bar.className = 'mp-form__msg';
        form.appendChild(bar);
    }
    bar.dataset.kind = kind;
    bar.textContent = msg;
}
