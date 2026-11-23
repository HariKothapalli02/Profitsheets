import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Bookmark, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Plus, 
  ExternalLink,
  Search,
  Check,
  ShieldCheck,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  fetchWatchlist, 
  addWatchlistSymbol, 
  removeWatchlistSymbol, 
  getStoredWatchlist 
} from '../utils/watchlist';
import { CardGridSkeleton, BrandedSpinner } from '../components/LoadingAnimations';

export default function WatchlistPage() {
  const { user, token } = useAuth();
  const [symbols, setSymbols] = useState([]);
  const [stockDetails, setStockDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const popularSuggestions = ['LALITHAA', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

  const loadWatchlistData = async () => {
    setLoading(true);
    try {
      const currentList = (user && token) ? await fetchWatchlist(token) : getStoredWatchlist();
      setSymbols(currentList);

      if (currentList.length > 0) {
        // Fetch batch quotes from backend (public/guest accessible)
        const res = await axios.post('/api/stocks/batch', { symbols: currentList });
        setStockDetails(res.data?.stocks || []);
      } else {
        setStockDetails([]);
      }
    } catch (e) {
      console.warn('Failed to load watchlist details:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlistData();

    const handleUpdate = () => {
      loadWatchlistData();
    };

    window.addEventListener('watchlist_updated', handleUpdate);
    return () => window.removeEventListener('watchlist_updated', handleUpdate);
  }, [user, token]);

  // Quick search to add to watchlist
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await axios.get(`/api/stocks/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data || []);
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRemove = async (sym) => {
    await removeWatchlistSymbol(sym, token);
    setSymbols(prev => prev.filter(s => s !== sym));
    setStockDetails(prev => prev.filter(s => s.symbol !== sym));
  };

  const handleAddSymbol = async (sym) => {
    await addWatchlistSymbol(sym, token);
    setSearchQuery('');
    setSearchResults([]);
    loadWatchlistData();
  };

  return (
    <div className="space-y-6 w-full max-w-[1720px] mx-auto pb-6 sm:pb-8 font-sans">
      
      {/* 1. Header (Unslopped, Clean Origin-UI Style) */}
      <div className="reveal-init bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span className="uppercase tracking-wider">PORTFOLIO WATCHLIST</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Stock Watchlist ({symbols.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time price tracking, session performance, and one-click company analysis.
          </p>
        </div>

        {/* Quick Add Search Bar */}
        <div className="relative w-full sm:w-72">
          <div className="relative flex items-center bg-slate-50 hover:bg-white rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Add stock to watchlist..."
              className="w-full py-2 pl-2 pr-3 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-30 divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {searchResults.map((item, idx) => {
                const inList = symbols.includes(item.symbol);
                return (
                  <div
                    key={idx}
                    className="p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{item.symbol}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">{item.name}</span>
                    </div>
                    {inList ? (
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddSymbol(item.symbol)}
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Watchlist Grid / Empty State */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs font-semibold text-emerald-800">
            <BrandedSpinner size="sm" />
            <span>Streaming real-time exchange ticks for your watchlist...</span>
          </div>
          <CardGridSkeleton count={6} />
        </div>
      ) : stockDetails.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
            <Bookmark className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Your Watchlist is Empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              Follow stocks like <strong className="text-slate-700">LALITHAA</strong> or <strong className="text-slate-700">RELIANCE</strong> to track real-time exchange quotes and access quick orders.
            </p>
          </div>

          {/* Quick Suggestions */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Popular Stocks to Track:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {popularSuggestions.map((sym) => (
                <button
                  key={sym}
                  onClick={() => handleAddSymbol(sym)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white text-xs font-mono font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  <span>{sym}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="reveal-init stagger-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockDetails.map((stock) => {
            const isPos = Number(stock.changePercent) >= 0;
            const isIndian = stock.currency === 'INR' || stock.exchange === 'NSE' || stock.exchange === 'BSE' || (!['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(stock.symbol?.toUpperCase()));
            const currencySymbol = stock.currencySymbol || (isIndian ? '₹' : '$');
            const isUSD = currencySymbol === '$';

            return (
              <div
                key={stock.symbol}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm p-4 sm:p-5 transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to={`/company/${stock.symbol}`}
                      className="text-base font-bold text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-1.5 group-hover:text-emerald-700"
                    >
                      <span className="font-mono">{stock.symbol}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                    </Link>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                      {stock.name}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRemove(stock.symbol)}
                    title={`Remove ${stock.symbol} from watchlist`}
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Price & Performance */}
                <div className="p-3 bg-slate-50/70 rounded-lg border border-slate-100 flex items-baseline justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Live Price</span>
                    <span className="text-lg font-black text-slate-900 tabular-nums">
                      {currencySymbol}{Number(stock.currentPrice || 0).toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold block">Change</span>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${
                      isPos ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isPos ? '+' : ''}{stock.changePercent || '0.00'}%
                    </span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-[10px] font-mono text-slate-400">
                    {stock.exchange || 'NSE'} • Vol: {Number(stock.volume || 0).toLocaleString('en-IN')}
                  </span>

                  <Link
                    to={`/company/${stock.symbol}`}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>View Screener</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
