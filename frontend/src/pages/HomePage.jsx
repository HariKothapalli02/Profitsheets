import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Loader2, 
  Building2, 
  ChevronRight, 
  Clock, 
  History, 
  X,
  TrendingUp,
  TrendingDown,
  Briefcase,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Flame,
  Layers,
  Compass,
  FileText,
  Wallet
} from 'lucide-react';
import axios from 'axios';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../utils/recentSearches';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // User holdings state
  const [boughtStocks, setBoughtStocks] = useState([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [totalHoldingsValue, setTotalHoldingsValue] = useState(0);

  // Market indices & popular stocks
  const [indices, setIndices] = useState([]);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [popularStocks, setPopularStocks] = useState([]);
  const [popularTab, setPopularTab] = useState('ALL'); // 'ALL' | 'GAINERS' | 'HEAVYWEIGHTS'

  // Kite callback notice
  const [kiteStatusNotice, setKiteStatusNotice] = useState(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Keyboard shortcut listener: '/' or 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) && 
          document.activeElement !== searchInputRef.current &&
          !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check URL query params for Kite Publisher callback (?status=cancelled or ?status=success)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = (params.get('status') || '').toLowerCase();

    if (statusParam === 'cancelled') {
      setKiteStatusNotice({
        type: 'cancelled',
        title: 'Zerodha Kite Order Cancelled',
        message: 'The basket order was cancelled on Zerodha Kite. No trades were executed and no funds were debited.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (statusParam === 'success') {
      setKiteStatusNotice({
        type: 'success',
        title: 'Zerodha Kite Order Placed',
        message: 'Basket order placed on Zerodha Kite! Check your holdings and execution journal below.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch benchmark Indian indices
  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 20000); // 20s refresh
    return () => clearInterval(interval);
  }, []);

  const fetchIndices = async () => {
    try {
      const res = await axios.get('/api/stocks/indices');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setIndices(res.data);
      }
    } catch (err) {
      console.warn('Failed to load indices:', err.message);
    } finally {
      setIndicesLoading(false);
    }
  };

  // Fetch popular stock quotes for market movers section
  useEffect(() => {
    fetchPopularStocks();
  }, []);

  const fetchPopularStocks = async () => {
    try {
      const res = await axios.get('/api/stocks/popular');
      if (Array.isArray(res.data)) {
        setPopularStocks(res.data);
      }
    } catch (err) {
      console.warn('Failed to load popular quotes:', err.message);
    }
  };

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Fetch bought stocks only after login
  useEffect(() => {
    if (user) {
      fetchBoughtStocks();
    } else {
      setBoughtStocks([]);
      setPendingOrdersCount(0);
      setTotalHoldingsValue(0);
    }
  }, [user]);

  const fetchBoughtStocks = async () => {
    try {
      const res = await axios.get('/api/user/orders');
      const orders = res.data.orders || [];

      // Count pending orders
      const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'OPEN').length;
      setPendingOrdersCount(pending);

      // Aggregate active holdings from executed buy/sell orders
      const holdingsMap = {};
      orders
        .filter(o => o.status === 'COMPLETE' || o.status === 'EXECUTED')
        .forEach(o => {
          const sym = o.symbol.toUpperCase();
          if (!holdingsMap[sym]) {
            holdingsMap[sym] = {
              symbol: sym,
              shares: 0,
              totalInvested: 0,
              lastPrice: o.executedPrice || o.price,
              exchange: o.exchange || 'NSE'
            };
          }
          if (o.action === 'BUY') {
            holdingsMap[sym].shares += Number(o.quantity || 0);
            holdingsMap[sym].totalInvested += Number(o.total || (o.quantity * (o.executedPrice || o.price)));
          } else if (o.action === 'SELL') {
            holdingsMap[sym].shares = Math.max(0, holdingsMap[sym].shares - Number(o.quantity || 0));
          }
        });

      const activeHoldings = Object.values(holdingsMap)
        .filter(h => h.shares > 0)
        .map(h => ({
          ...h,
          avgPrice: h.shares > 0 ? (h.totalInvested / h.shares).toFixed(2) : h.lastPrice
        }));

      setBoughtStocks(activeHoldings);
      const totalVal = activeHoldings.reduce((sum, h) => sum + (h.shares * Number(h.avgPrice)), 0);
      setTotalHoldingsValue(totalVal);
    } catch (err) {
      console.warn('Failed to fetch user bought stocks:', err.message);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsInputFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/stocks/search?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data || []);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectCompany = (symbol) => {
    addRecentSearch(symbol);
    navigate(`/company/${symbol}`);
  };

  const handleClearRecent = (e) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleKeyDown = (e) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelectCompany(results[selectedIndex].symbol);
      } else if (results.length > 0) {
        handleSelectCompany(results[0].symbol);
      } else if (query.trim()) {
        handleSelectCompany(query.trim().toUpperCase());
      }
    }
  };

  const sampleCompanies = [
    { label: 'Lalithaa', symbol: 'LALITHAA', sector: 'Jewellery' },
    { label: 'Reliance', symbol: 'RELIANCE', sector: 'Energy' },
    { label: 'TCS', symbol: 'TCS', sector: 'IT' },
    { label: 'Infosys', symbol: 'INFY', sector: 'IT' },
    { label: 'HDFC Bank', symbol: 'HDFCBANK', sector: 'Banking' },
    { label: 'Avantel', symbol: 'AVANTEL', sector: 'Defense' },
    { label: 'Coastal Corp', symbol: 'COASTCORP', sector: 'Agro' },
    { label: 'Frontier Springs', symbol: 'FRONTIER', sector: 'Railways' },
    { label: 'Godawari Power', symbol: 'GPIL', sector: 'Metals' },
    { label: 'HBL Power', symbol: 'HBLPOWER', sector: 'Defense' },
    { label: 'Sandur Manganese', symbol: 'SANDUMA', sector: 'Mining' },
    { label: 'Shivalik Bimetal', symbol: 'SBCL', sector: 'Auto/EV' }
  ];

  // Pre-configured screener themes
  const screenerThemes = [
    {
      title: 'High Growth Compounders',
      desc: 'Profit CAGR >20%, ROE >18%, with consistent high operating cash flows.',
      icon: Sparkles,
      color: 'from-emerald-500/10 to-teal-500/10 border-emerald-200/80 text-emerald-800',
      tag: 'GROWTH',
      sample: ['TCS', 'INFY', 'LALITHAA']
    },
    {
      title: 'Debt-Free Leaders',
      desc: 'Virtually zero debt (D/E < 0.1) with strong return on capital employed.',
      icon: ShieldCheck,
      color: 'from-blue-500/10 to-indigo-500/10 border-blue-200/80 text-blue-800',
      tag: 'SAFETY',
      sample: ['TCS', 'HDFCBANK', 'RELIANCE']
    },
    {
      title: 'Defense & Railway Capex',
      desc: 'High order book visibility benefiting from Make-in-India & PLI schemes.',
      icon: Flame,
      color: 'from-amber-500/10 to-orange-500/10 border-amber-200/80 text-amber-800',
      tag: 'THEMATIC',
      sample: ['AVANTEL', 'HBLPOWER', 'FRONTIER']
    },
    {
      title: 'Undervalued Value Buys',
      desc: 'Trading below historical median P/E with strong dividend yield and ROCE.',
      icon: BarChart3,
      color: 'from-purple-500/10 to-violet-500/10 border-purple-200/80 text-purple-800',
      tag: 'VALUE',
      sample: ['GPIL', 'SANDUMA', 'SBCL']
    }
  ];

  // Filtered popular stocks
  const filteredPopular = popularStocks.filter(s => {
    if (popularTab === 'GAINERS') return (s.changePercent || 0) > 0;
    if (popularTab === 'HEAVYWEIGHTS') return ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'SBIN', 'LT'].includes(s.symbol);
    return true;
  }).slice(0, 8);

  return (
    <div className="space-y-10 pb-16 font-sans">
      
      {/* 1. Live Indian Benchmark Indices Bar */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-700 font-mono">
              Indian Markets Today
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            NSE & BSE Real-Time Feed
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {indicesLoading && indices.length === 0 ? (
            [1, 2, 3, 4].map(n => (
              <div key={n} className="h-16 rounded-xl bg-slate-50 animate-pulse border border-slate-100 p-2.5"></div>
            ))
          ) : (
            indices.map((idx, i) => {
              const isPositive = (idx.changePercent || 0) >= 0;
              return (
                <div 
                  key={i}
                  className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-2.5 sm:p-3 border border-slate-200/70 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-slate-600 text-xs font-bold">
                    <span className="truncate">{idx.symbol}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-200/60 font-mono text-slate-500">
                      {idx.exchange}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-sm sm:text-base font-black font-mono text-slate-900 tracking-tight">
                      {Number(idx.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[11px] font-bold font-mono inline-flex items-center ${
                      isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {isPositive ? '+' : ''}{Number(idx.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Kite Status Notification Banner */}
      {kiteStatusNotice && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between shadow-xs animate-in fade-in duration-200 ${
          kiteStatusNotice.type === 'cancelled'
            ? 'bg-amber-50/90 border-amber-200 text-amber-900'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-start space-x-3">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider">{kiteStatusNotice.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{kiteStatusNotice.message}</p>
            </div>
          </div>
          <button
            onClick={() => setKiteStatusNotice(null)}
            className="text-xs font-bold px-2 py-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Hero Search & Brand Center */}
      <section className="text-center max-w-3xl mx-auto pt-4 sm:pt-6 space-y-6">
        
        {/* Subtle pill badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>NSE & BSE Screener + Zerodha 1-Click Publisher Gateway</span>
        </div>

        {/* Brand Logo & Name */}
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-2xl font-sans">
            P
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-sans">
            Profit<span className="text-emerald-600">Sheets</span>
          </h1>
          <div className="flex items-end space-x-1 h-9">
            <span className="w-1.5 h-3 bg-emerald-500 rounded-xs"></span>
            <span className="w-1.5 h-5 bg-emerald-500 rounded-xs"></span>
            <span className="w-1.5 h-7 bg-emerald-500 rounded-xs"></span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Search over 4,000+ Indian public companies for 3-year audited financials, concalls, BSE announcements, and 1-click Kite demat order execution.
        </p>

        {/* Search Bar Container */}
        <div className="relative max-w-2xl mx-auto" ref={searchRef}>
          <div className="relative flex items-center bg-white rounded-2xl border-2 border-slate-200/90 shadow-md shadow-slate-200/40 hover:border-emerald-500/70 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all p-1.5">
            <div className="pl-3.5 pr-2 text-slate-400">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : (
                <Search className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
              onFocus={() => setIsInputFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search company or ticker (e.g. Reliance, Lalithaa, TCS, Avantel)..."
              className="w-full py-2.5 pr-3 text-slate-900 text-sm sm:text-base placeholder-slate-400 bg-transparent focus:outline-none font-medium"
            />

            {/* Clear button if query exists */}
            {query.trim().length > 0 ? (
              <button
                type="button"
                onClick={() => { setQuery(''); searchInputRef.current?.focus(); }}
                className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center space-x-1 mr-2 px-2 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-mono font-bold border border-slate-200/60 select-none">
                <span>Press</span>
                <kbd className="text-slate-600 font-bold">/</kbd>
              </div>
            )}
          </div>

          {/* Autocomplete dropdown (Live search results) */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-84 overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-150">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCompany(item.symbol)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                    selectedIndex === idx ? 'bg-emerald-50/70 text-emerald-950' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">
                        {item.name || item.symbol}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {item.symbol} • {item.sector || 'Equities'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase font-mono">
                      {item.exchange || 'NSE'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Searches Dropdown (when query is empty and input is focused) */}
          {isInputFocused && !query.trim() && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 text-left animate-in fade-in duration-150">
              <div className="px-4 py-2.5 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recent Searches</span>
                </span>
                <button
                  onClick={handleClearRecent}
                  className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors uppercase tracking-wider"
                >
                  Clear History
                </button>
              </div>

              {recentSearches.map((sym, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCompany(sym)}
                  className="px-4 py-2.5 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-bold font-mono text-slate-800">{sym}</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-medium">Open Screener →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links / Recently Searched Row */}
        {recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent:</span>
            </span>
            {recentSearches.slice(0, 6).map((sym, i) => (
              <button
                key={i}
                onClick={() => handleSelectCompany(sym)}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/90 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 font-mono text-xs font-semibold shadow-2xs transition-all"
              >
                {sym}
              </button>
            ))}
            <button
              onClick={handleClearRecent}
              className="text-[10px] text-slate-400 hover:text-rose-600 underline ml-1"
            >
              Clear
            </button>
          </div>
        )}

        {/* Or Analyse Popular Companies */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
          <span className="font-medium mr-1 text-slate-400">Popular screens:</span>
          {sampleCompanies.map((c, i) => (
            <button
              key={i}
              onClick={() => handleSelectCompany(c.symbol)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50 text-slate-600 text-xs transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Logged-in User Portfolio & Active Holdings Dashboard */}
      {user && (boughtStocks.length > 0 || pendingOrdersCount > 0) && (
        <section className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white rounded-3xl border border-emerald-200/90 p-5 sm:p-6 shadow-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-emerald-100 gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    My Active Holdings & Portfolio
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono">
                    {boughtStocks.length} POSITIONS
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time equity positions tracked from executed orders and Zerodha Kite demat dispatches.
                </p>
              </div>
            </div>

            {/* Quick stats and journal link */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Allocated Value
                </span>
                <span className="text-base font-black font-mono text-emerald-700">
                  ₹{Number(totalHoldingsValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {pendingOrdersCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-pulse font-mono">
                  {pendingOrdersCount} in Kite
                </div>
              )}

              <button
                onClick={() => navigate('/orders')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 shrink-0"
              >
                <span>View Full Journal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Holdings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {boughtStocks.map((stock, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-emerald-100 p-4 shadow-2xs hover:shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="font-mono font-black text-sm text-slate-900">
                        {stock.symbol}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 uppercase font-mono border border-emerald-200/50">
                      {stock.exchange || 'NSE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Quantity</span>
                      <strong className="font-mono text-slate-800 text-sm">{stock.shares} Sh</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Avg Buy Price</span>
                      <strong className="font-mono text-slate-800 text-sm">
                        ₹{Number(stock.avgPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] font-mono text-slate-500">
                    Total: <strong className="text-slate-900">₹{(stock.shares * Number(stock.avgPrice)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                  </div>
                  <button
                    onClick={() => handleSelectCompany(stock.symbol)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 hover:underline"
                  >
                    <span>Analyze</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Live Market Movers & Trending Bluechips */}
      <section className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500 fill-current" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Trending Indian Equities & Bluechips
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live quotes and intraday performance from NSE & BSE
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPopularTab('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                popularTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Popular
            </button>
            <button
              onClick={() => setPopularTab('GAINERS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                popularTab === 'GAINERS'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Top Gainers</span>
            </button>
            <button
              onClick={() => setPopularTab('HEAVYWEIGHTS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                popularTab === 'HEAVYWEIGHTS'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nifty 50 Core
            </button>
          </div>
        </div>

        {/* Stock Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {filteredPopular.length === 0 ? (
            [1, 2, 3, 4].map(n => (
              <div key={n} className="h-28 rounded-2xl bg-slate-50 animate-pulse border border-slate-100"></div>
            ))
          ) : (
            filteredPopular.map((stock, i) => {
              const isPositive = (stock.changePercent || 0) >= 0;
              return (
                <div
                  key={i}
                  onClick={() => handleSelectCompany(stock.symbol)}
                  className="group bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-emerald-500/80 p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="font-mono font-black text-slate-900 group-hover:text-emerald-700 text-sm transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {stock.exchange || 'NSE'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate" title={stock.name}>
                      {stock.name || stock.symbol}
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-sm font-black font-mono text-slate-900">
                      ₹{Number(stock.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-xs font-bold font-mono inline-flex items-center px-1.5 py-0.5 rounded ${
                      isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 5. Pre-Built Investment Screens & Theme Frameworks */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <span>Proven Screener Investment Themes</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Screen for high-probability setups curated by fundamental and quantitative parameters
            </p>
          </div>
          <Link
            to="/company/LALITHAA"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center gap-1"
          >
            <span>Explore All Screens</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {screenerThemes.map((theme, i) => {
            const Icon = theme.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-slate-700" />
                    </div>
                    <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {theme.tag}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {theme.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {theme.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">Examples:</span>
                  <div className="flex items-center gap-1.5">
                    {theme.sample.map((sym, j) => (
                      <button
                        key={j}
                        onClick={() => handleSelectCompany(sym)}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-mono text-[11px] font-bold transition-colors"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Platform Capability Highlights */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">1-Click Kite Gateway</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connect official Zerodha Kite Publisher to execute basket and single-leg trades instantly from company reports.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">3-Year Audited Financials</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Detailed balance sheets, P&L, quarterly results, con-call transcripts, and BSE corporate announcements.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">₹5,00,000 Paper Trading</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Test setups with real-time live market pricing and zero financial risk with MongoDB order journal persistence.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
