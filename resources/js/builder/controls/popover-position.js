// Shared popover positioning helper. Anchors a popover under an element with viewport clamping
// and a vertical-flip fallback if there isn't room below.

const MARGIN = 8;

export function positionPopover(popover, anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();

    let left = rect.right + window.scrollX - popRect.width;
    let top = rect.bottom + window.scrollY + 4;

    // Clamp horizontally within the viewport
    const minLeft = window.scrollX + MARGIN;
    const maxLeft = window.scrollX + window.innerWidth - popRect.width - MARGIN;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    // Flip above the anchor if not enough room below
    const bottomEdge = top + popRect.height;
    const viewportBottom = window.scrollY + window.innerHeight - MARGIN;
    if (bottomEdge > viewportBottom) {
        const above = rect.top + window.scrollY - popRect.height - 4;
        if (above > window.scrollY + MARGIN) top = above;
    }

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
}
