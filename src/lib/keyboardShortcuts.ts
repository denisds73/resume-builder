// Programmatic trigger for the global KeyboardShortcuts overlay.
// Lives in lib/ so files that import it stay component-only and play
// nice with Vite's fast refresh.
export const KBD_OPEN_EVENT = 'kbd-shortcuts:open'

export function openKeyboardShortcuts() {
  window.dispatchEvent(new Event(KBD_OPEN_EVENT))
}
