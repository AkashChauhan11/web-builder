// Fetches the template library from /admin/templates/list and caches it.
// Falls back to an empty array if the request fails.

let cache = null;

export async function fetchTemplates() {
    if (cache) return cache;
    try {
        const resp = await fetch('/admin/templates/list', {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' },
        });
        if (!resp.ok) return [];
        const body = await resp.json();
        cache = (body.data || []).map((t) => ({
            ...t,
            // DB returns components_json as JSON string sometimes (depending on Laravel JSON cast settings); normalize
            components_json: typeof t.components_json === 'string' ? JSON.parse(t.components_json) : t.components_json,
        }));
        return cache;
    } catch (err) {
        console.error('[MiniPress] failed to fetch templates', err);
        return [];
    }
}

export function clearTemplateCache() {
    cache = null;
}
