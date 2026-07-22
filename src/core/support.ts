export const SUPPORT_EVENT = 'openvox:support-opportunity';
const SUPPORT_COUNT_KEY = 'openvox.support.exportCount';

export function notifySupportOpportunity(): void {
  window.dispatchEvent(new CustomEvent(SUPPORT_EVENT));
}

export function shouldPromptForSupport(): boolean {
  let count = 0;
  try {
    count = Number.parseInt(window.localStorage.getItem(SUPPORT_COUNT_KEY) || '0', 10) || 0;
    count += 1;
    window.localStorage.setItem(SUPPORT_COUNT_KEY, String(count));
  } catch {
    count = 1;
  }
  return count === 1 || count % 4 === 0;
}
