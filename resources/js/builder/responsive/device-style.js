// Device-aware style read/write adapter.
// GrapesJS natively supports per-device CSS via `mediaText` on style rules — when a device with a
// `widthMedia` is active, addStyle creates rules inside a @media block. We just wrap that so the
// style panel can transparently read/write the current device's value, with fallback to Desktop.
//
// API:
//   readStyle(editor, component, prop)   → current device's value, falling back to Desktop if unset
//   writeStyle(editor, component, patch) → writes the patch to the current device's rule
//   isInherited(editor, component, prop) → true if the current device has no override for this prop
//   currentDeviceName(editor)            → 'Desktop' | 'Tablet' | 'Mobile'

export function currentDeviceName(editor) {
    const dev = editor.Devices?.getSelected?.();
    return dev?.get?.('name') ?? 'Desktop';
}

export function readStyle(editor, component, prop) {
    if (!component) return undefined;
    const current = component.getStyle();
    return current[prop];
}

export function readAllStyle(editor, component) {
    if (!component) return {};
    return component.getStyle();
}

export function writeStyle(editor, component, patch) {
    if (!component) return;
    component.addStyle(patch);
}

export function removeProp(editor, component, prop) {
    if (!component) return;
    component.removeStyle(prop);
}

/**
 * Returns true if the prop has a value at the Desktop device but no override on the active device.
 * Used to render the "↳ desktop" inheritance badge next to controls.
 */
export function isInherited(editor, component, prop) {
    if (!component) return false;
    const deviceName = currentDeviceName(editor);
    if (deviceName === 'Desktop') return false;

    // Read with current device active
    const currentVal = component.getStyle()[prop];

    // Temporarily swap to Desktop and read
    const prevDevice = editor.Devices.getSelected();
    editor.Devices.select('desktop');
    const desktopVal = component.getStyle()[prop];
    editor.Devices.select(prevDevice);

    return desktopVal !== undefined && desktopVal !== '' && (currentVal === undefined || currentVal === '');
}
