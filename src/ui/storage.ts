/** Browser save slots. Storage can be unavailable (private mode, blocked site data), so every call is guarded. */
const PREFIX = 'sf-sim:save:';

export interface SlotInfo {
  slot: string;
  savedAt: string;
  label: string;
}

export function writeSlot(slot: string, text: string): boolean {
  try {
    localStorage.setItem(PREFIX + slot, text);
    return true;
  } catch {
    return false;
  }
}

export function readSlot(slot: string): string | null {
  try {
    return localStorage.getItem(PREFIX + slot);
  } catch {
    return null;
  }
}

export function listSlots(): SlotInfo[] {
  try {
    const out: SlotInfo[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;
      try {
        const data = JSON.parse(localStorage.getItem(key) ?? '{}');
        out.push({ slot: key.slice(PREFIX.length), savedAt: data.savedAt ?? '', label: data.label ?? '' });
      } catch {
        /* skip unreadable slot */
      }
    }
    return out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
