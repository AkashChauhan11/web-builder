// Pricing — Section with three pricing cards.

export function getPricingTemplate() {
    return {
        type: 'mp-section',
        props: { width: 'boxed', max_inner_width: 1200 },
        components: [{
            tagName: 'div', attributes: { class: 'mp-sec__inner' },
            selectable: false, hoverable: false, draggable: false, droppable: '.mp-col',
            components: [
                {
                    type: 'mp-column', props: { size_pct: 33.33 }, components: [{ type: 'mp-pricing', props: {
                        currency_symbol: '$', period_label: '/mo', highlighted: false,
                        button: { url: '/signup', label: 'Choose Free', target: '_self' },
                        features: [
                            { text: '1 project', included: true },
                            { text: 'Community support', included: true },
                            { text: 'Custom domains', included: false },
                        ],
                    } }],
                },
                {
                    type: 'mp-column', props: { size_pct: 33.33 }, components: [{ type: 'mp-pricing', props: {
                        currency_symbol: '$', period_label: '/mo', highlighted: true,
                        button: { url: '/signup', label: 'Start Pro trial', target: '_self' },
                        features: [
                            { text: 'Unlimited projects', included: true },
                            { text: 'Priority support', included: true },
                            { text: 'Custom domains', included: true },
                        ],
                    } }],
                },
                {
                    type: 'mp-column', props: { size_pct: 33.34 }, components: [{ type: 'mp-pricing', props: {
                        currency_symbol: '$', period_label: '/mo', highlighted: false,
                        button: { url: '/contact', label: 'Contact sales', target: '_self' },
                        features: [
                            { text: 'Custom contracts', included: true },
                            { text: 'Dedicated CSM', included: true },
                            { text: 'SLA + audits', included: true },
                        ],
                    } }],
                },
            ],
        }],
    };
}
