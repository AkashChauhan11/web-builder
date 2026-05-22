import grapesjsPresetWebpage from 'grapesjs-preset-webpage';
import grapesjsBlocksBasic from 'grapesjs-blocks-basic';
import grapesjsCustomCode from 'grapesjs-custom-code';
import grapesjsStyleBg from 'grapesjs-style-bg';

export function plugins() {
    return [grapesjsPresetWebpage, grapesjsBlocksBasic, grapesjsCustomCode, grapesjsStyleBg];
}

export function registerBlocks(editor) {
    const bm = editor.BlockManager;

    bm.add('mp-hero', {
        label: 'Hero Section',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="2" width="40" height="28" rx="2" fill="#1e3a8a"/><rect x="10" y="10" width="24" height="3" rx="1" fill="white"/><rect x="13" y="16" width="18" height="2" rx="1" fill="#cbd5e1"/></svg>',
        content: `
<section class="bg-slate-900 text-white py-20 px-6 text-center">
  <h1 class="text-4xl md:text-5xl font-bold">Your Headline Here</h1>
  <p class="mt-4 max-w-2xl mx-auto text-slate-300">A short subheading explaining your value proposition.</p>
  <a href="#" class="inline-block mt-8 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded font-semibold">Get Started</a>
</section>`.trim(),
    });

    bm.add('mp-two-col', {
        label: 'Two Column',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="6" width="18" height="20" rx="2" fill="#94a3b8"/><rect x="24" y="6" width="18" height="20" rx="2" fill="#cbd5e1"/></svg>',
        content: `
<section class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto p-8">
  <div>
    <h2 class="text-2xl font-bold mb-2">Left column</h2>
    <p class="text-slate-600">Drop content here.</p>
  </div>
  <div>
    <h2 class="text-2xl font-bold mb-2">Right column</h2>
    <p class="text-slate-600">Drop content here too.</p>
  </div>
</section>`.trim(),
    });

    bm.add('mp-cta', {
        label: 'CTA Banner',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="10" width="40" height="12" rx="2" fill="#059669"/><rect x="28" y="14" width="10" height="4" rx="1" fill="white"/></svg>',
        content: `
<section class="bg-emerald-600 text-white py-12 px-6 text-center">
  <h2 class="text-3xl font-bold">Ready to take the next step?</h2>
  <a href="#" class="inline-block mt-6 bg-white text-emerald-700 px-5 py-2 rounded font-semibold hover:bg-slate-100">Contact us</a>
</section>`.trim(),
    });

    bm.add('mp-navbar', {
        label: 'Navigation Bar',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="6" width="40" height="6" rx="1" fill="#1e293b"/><rect x="6" y="8" width="6" height="2" rx="1" fill="white"/><rect x="16" y="8" width="6" height="2" rx="1" fill="white"/><rect x="26" y="8" width="6" height="2" rx="1" fill="white"/><rect x="16" y="14" width="14" height="10" rx="1" fill="#e2e8f0"/></svg>',
        content: `
<nav class="mp-nav bg-white border-b">
  <style>
    .mp-nav [data-mp-dropdown] > .mp-dd { display: none; }
    .mp-nav [data-mp-dropdown]:hover > .mp-dd,
    .mp-nav [data-mp-dropdown].is-open > .mp-dd { display: block; }
  </style>
  <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="{{LOCALE_PREFIX}}/" class="font-bold text-lg">Brand</a>
    <ul class="flex gap-6 items-center text-sm">
      <li><a href="{{LOCALE_PREFIX}}/" class="hover:text-emerald-600">Home</a></li>
      <li class="relative" data-mp-dropdown>
        <button type="button" onclick="this.parentElement.classList.toggle('is-open')" class="hover:text-emerald-600 inline-flex items-center gap-1">
          Services <span aria-hidden="true">&#9662;</span>
        </button>
        <ul class="mp-dd absolute left-0 top-full bg-white border rounded shadow min-w-[180px] py-2 z-10">
          <li><a href="{{LOCALE_PREFIX}}/services/a" class="block px-4 py-2 hover:bg-slate-100">Service A</a></li>
          <li><a href="{{LOCALE_PREFIX}}/services/b" class="block px-4 py-2 hover:bg-slate-100">Service B</a></li>
          <li><a href="{{LOCALE_PREFIX}}/services/c" class="block px-4 py-2 hover:bg-slate-100">Service C</a></li>
        </ul>
      </li>
      <li><a href="{{LOCALE_PREFIX}}/about" class="hover:text-emerald-600">About</a></li>
      <li><a href="{{LOCALE_PREFIX}}/contact" class="hover:text-emerald-600">Contact</a></li>
    </ul>
  </div>
</nav>`.trim(),
    });

    bm.add('mp-feature-grid', {
        label: 'Feature Grid',
        category: 'MiniPress',
        media: '<svg width="44" height="32" viewBox="0 0 44 32" fill="none"><rect x="2" y="6" width="11" height="20" rx="2" fill="#cbd5e1"/><rect x="16" y="6" width="11" height="20" rx="2" fill="#cbd5e1"/><rect x="30" y="6" width="11" height="20" rx="2" fill="#cbd5e1"/></svg>',
        content: `
<section class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto p-8">
  <div class="p-6 border rounded bg-white">
    <div class="text-3xl mb-3">⚡</div>
    <h3 class="font-semibold mb-2">Feature one</h3>
    <p class="text-slate-600 text-sm">Describe the value of this feature in one or two sentences.</p>
  </div>
  <div class="p-6 border rounded bg-white">
    <div class="text-3xl mb-3">🛡️</div>
    <h3 class="font-semibold mb-2">Feature two</h3>
    <p class="text-slate-600 text-sm">Describe the value of this feature in one or two sentences.</p>
  </div>
  <div class="p-6 border rounded bg-white">
    <div class="text-3xl mb-3">🚀</div>
    <h3 class="font-semibold mb-2">Feature three</h3>
    <p class="text-slate-600 text-sm">Describe the value of this feature in one or two sentences.</p>
  </div>
</section>`.trim(),
    });
}
