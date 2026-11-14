const RECENT_KEY = 'profitsheets_recent_searches';
const DEFAULT_RECENTS = ['LALITHAA', 'RELIANCE', 'TCS', 'INFY'];

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) {
      localStorage.setItem(RECENT_KEY, JSON.stringify(DEFAULT_RECENTS));
      return DEFAULT_RECENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RECENTS;
  } catch {
    return DEFAULT_RECENTS;
  }
}

export function addRecentSearch(symbol) {
  if (!symbol) return;
  const clean = symbol.trim().toUpperCase();
  const current = getRecentSearches().filter(s => s !== clean);
  current.unshift(clean);
  const updated = current.slice(0, 8);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function clearRecentSearches() {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify([]));
  } catch {}
  return [];
}

