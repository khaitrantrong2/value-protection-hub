/** Keep the Tab sequence inside an open native dialog, including embedded browser engines. */
export function containDialogFocus(event: KeyboardEvent, dialog: HTMLDialogElement | null): void {
  if (event.key !== 'Tab' || !dialog?.open) return;
  const items = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.matches(':disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0);
  const first = items[0], last = items.at(-1);
  if (!first) { event.preventDefault(); dialog.focus({ preventScroll: true }); return; }
  if (event.shiftKey && (event.target === first || event.target === dialog)) { event.preventDefault(); last?.focus({ preventScroll: true }); }
  else if (!event.shiftKey && (event.target === last || event.target === dialog)) { event.preventDefault(); first.focus({ preventScroll: true }); }
}
