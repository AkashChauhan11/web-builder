// Curated icon sprite — Lucide icons tree-shaken at build time, plus inline brand paths.
// Each icon is an array of [tagName, attrs] pairs that the renderer serializes to inline SVG.

import {
    ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
    ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
    Check, X, Plus, Minus, Menu, MoreHorizontal, Search,
    Info, AlertTriangle, AlertCircle, CheckCircle,
    Star, Heart, Mail, Phone, MapPin, Calendar, Clock, Home, User,
} from 'lucide';

// Brand icons — Lucide 1.x removed these. Inlined as [tag, attrs] arrays matching the Lucide format.
const Facebook  = [['path', { d: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' }]];
const Twitter   = [['path', { d: 'M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z' }]];
const Instagram = [
    ['rect', { width: 20, height: 20, x: 2, y: 2, rx: 5, ry: 5 }],
    ['path', { d: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z' }],
    ['line', { x1: 17.5, x2: 17.51, y1: 6.5, y2: 6.5 }],
];
const Linkedin  = [
    ['path', { d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z' }],
    ['rect', { width: 4, height: 12, x: 2, y: 9 }],
    ['circle', { cx: 4, cy: 4, r: 2 }],
];
const Youtube   = [
    ['path', { d: 'M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17' }],
    ['path', { d: 'm10 15 5-3-5-3z' }],
];
const Github    = [
    ['path', { d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4' }],
    ['path', { d: 'M9 18c-4.51 2-5-2-7-2' }],
];

const ICONS = {
    'arrow-right':   ArrowRight,
    'arrow-left':    ArrowLeft,
    'arrow-up':      ArrowUp,
    'arrow-down':    ArrowDown,
    'chevron-right': ChevronRight,
    'chevron-left':  ChevronLeft,
    'chevron-up':    ChevronUp,
    'chevron-down':  ChevronDown,
    'check':         Check,
    'x':             X,
    'plus':          Plus,
    'minus':         Minus,
    'menu':          Menu,
    'more':          MoreHorizontal,
    'search':        Search,
    'info':          Info,
    'alert':         AlertTriangle,
    'alert-circle':  AlertCircle,
    'check-circle':  CheckCircle,
    'star':          Star,
    'heart':         Heart,
    'mail':          Mail,
    'phone':         Phone,
    'map-pin':       MapPin,
    'calendar':      Calendar,
    'clock':         Clock,
    'home':          Home,
    'user':          User,
    'facebook':      Facebook,
    'twitter':       Twitter,
    'instagram':     Instagram,
    'linkedin':      Linkedin,
    'youtube':       Youtube,
    'github':        Github,
};

export const ICON_NAMES = Object.keys(ICONS);

export function renderIcon(name, { size = 20, className = '', strokeWidth = 2 } = {}) {
    const def = ICONS[name];
    if (!def) return '';
    const inner = def.map(([tag, attrs]) => {
        const a = Object.entries(attrs || {})
            .map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`)
            .join(' ');
        return `<${tag} ${a} />`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="${className}">${inner}</svg>`;
}

export function hasIcon(name) {
    return name in ICONS;
}
