import axios from 'axios';

const STORAGE_KEY = 'profitsheets_watchlist';
const DEFAULT_WATCHLIST = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];

/**
 * Validates whether a token string is formatted like a genuine JWT
 * (three dot-separated base64 segments) and is not 'null'/'undefined'.
 */
export function isValidAuthToken(token) {
  if (!token || typeof token !== 'string') return false;
  const trimmed = token.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed.length < 20) {
    return false;
  }
  return trimmed.split('.').length === 3;
}

/**
 * Handles 401/403 session expiration silently without breaking UI.
 */
function handleAuthExpiry(e) {
  if (e?.response?.status === 401 || e?.response?.status === 403) {
    try {
      localStorage.removeItem('ps_token');
      delete axios.defaults.headers.common['Authorization'];
      window.dispatchEvent(new CustomEvent('auth_expired'));
    } catch (_) {}
  }
}

export function getStoredWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WATCHLIST));
      return DEFAULT_WATCHLIST;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_WATCHLIST;
  } catch (e) {
    return DEFAULT_WATCHLIST;
  }
}

export async function fetchWatchlist(token) {
  let list = getStoredWatchlist();
  
  // Only sync with remote server if an authentic JWT token is present
  if (isValidAuthToken(token)) {
    try {
      const res = await axios.get('/api/user/watchlist', {
        headers: { Authorization: `Bearer ${token.trim()}` }
      });
      if (res.data?.watchlist && Array.isArray(res.data.watchlist)) {
        // Merge server watchlist with local storage without duplicates
        const combined = Array.from(new Set([...res.data.watchlist, ...list]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
        list = combined;
      }
    } catch (e) {
      handleAuthExpiry(e);
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        console.warn('Could not sync remote watchlist:', e.message);
      }
    }
  }
  return list;
}

export async function addWatchlistSymbol(symbol, token) {
  if (!symbol) return getStoredWatchlist();
  const clean = symbol.trim().toUpperCase();
  const current = getStoredWatchlist();
  let updated = current;
  if (!current.includes(clean)) {
    updated = [clean, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  if (isValidAuthToken(token)) {
    try {
      await axios.post('/api/user/watchlist', { symbol: clean }, {
        headers: { Authorization: `Bearer ${token.trim()}` }
      });
    } catch (e) {
      handleAuthExpiry(e);
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        console.warn('Failed to sync added symbol to server:', e.message);
      }
    }
  }

  window.dispatchEvent(new CustomEvent('watchlist_updated', { detail: { symbol: clean, action: 'add', list: updated } }));
  return updated;
}

export async function removeWatchlistSymbol(symbol, token) {
  if (!symbol) return getStoredWatchlist();
  const clean = symbol.trim().toUpperCase();
  const current = getStoredWatchlist();
  const updated = current.filter(s => s !== clean);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  if (isValidAuthToken(token)) {
    try {
      await axios.delete(`/api/user/watchlist/${encodeURIComponent(clean)}`, {
        headers: { Authorization: `Bearer ${token.trim()}` }
      });
    } catch (e) {
      handleAuthExpiry(e);
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        console.warn('Failed to sync removed symbol to server:', e.message);
      }
    }
  }

  window.dispatchEvent(new CustomEvent('watchlist_updated', { detail: { symbol: clean, action: 'remove', list: updated } }));
  return updated;
}

export function isSymbolInWatchlist(symbol) {
  if (!symbol) return false;
  const clean = symbol.trim().toUpperCase();
  const current = getStoredWatchlist();
  return current.includes(clean);
}

