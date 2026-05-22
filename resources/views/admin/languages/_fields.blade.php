<div>
    <label class="block text-sm mb-1" for="name">Name</label>
    <input id="name" name="name" required value="{{ old('name', $language?->name) }}" class="w-full border rounded px-3 py-2">
</div>
<div>
    <label class="block text-sm mb-1" for="code">Code (e.g. en, es, fr, pt-br)</label>
    <input id="code" name="code" required maxlength="8" value="{{ old('code', $language?->code) }}" class="w-full border rounded px-3 py-2 font-mono">
</div>
<label class="flex items-center gap-2 text-sm">
    <input type="checkbox" name="is_default" value="1" @checked(old('is_default', $language?->is_default))> Default language
</label>
<label class="flex items-center gap-2 text-sm">
    <input type="checkbox" name="is_active" value="1" @checked(old('is_active', $language?->is_active ?? true))> Active
</label>
<div>
    <label class="block text-sm mb-1" for="sort_order">Sort order</label>
    <input id="sort_order" name="sort_order" type="number" value="{{ old('sort_order', $language?->sort_order ?? 0) }}" class="w-full border rounded px-3 py-2">
</div>
