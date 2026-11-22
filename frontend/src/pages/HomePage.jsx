import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  FileText,
  Wallet,
  Activity,
  ExternalLink,
  PieChart,
  LayoutGrid,
  List,
  Sparkles
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
  const [marketPulse, setMarketPulse] = useState(null);
  const [indexTab, setIndexTab] = useState('BENCHMARK'); // 'BENCHMARK' | 'SECTORS' | 'GLOBAL'
  const [popularStocks, setPopularStocks] = useState([]);
  const [popularLoading, setPopularLoading] = useState(true);
  const [popularTab, setPopularTab] = useState('ALL'); // 'ALL' | 'GAINERS' | 'LOSERS' | 'VOLUME' | 'BLUECHIPS'
  const [stockViewMode, setStockViewMode] = useState('GRID'); // 'GRID' | 'LIST'

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
        title: 'Zerodha Kite order cancelled',
        message: 'The basket order was cancelled on Zerodha Kite. No trades were executed.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (statusParam === 'success') {
      setKiteStatusNotice({
        type: 'success',
        title: 'Zerodha Kite order placed',
        message: 'Basket order placed successfully on Zerodha Kite. Check your journal below.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch benchmark Indian indices
  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchIndices = async () => {
    try {
      const res = await axios.get('/api/stocks/market-pulse');
      if (res.data) {
        setMarketPulse(res.data);
        if (Array.isArray(res.data.benchmarks) && res.data.benchmarks.length > 0) {
          setIndices(res.data.benchmarks);
        }
      }
    } catch (err) {
      console.warn('Failed to load market pulse, falling back to indices:', err.message);
      try {
        const fallbackRes = await axios.get('/api/stocks/indices');
        if (Array.isArray(fallbackRes.data)) {
          setIndices(fallbackRes.data);
        }
      } catch (e) {}
    } finally {
      setIndicesLoading(false);
    }
  };

  // Fetch popular stock quotes for market movers section
  useEffect(() => {
    fetchPopularStocks();
  }, []);

  const fetchPopularStocks = async () => {
    setPopularLoading(true);
    try {
      const res = await axios.get('/api/stocks/popular');
      if (Array.isArray(res.data)) {
        setPopularStocks(res.data);
      }
    } catch (err) {
      console.warn('Failed to load popular quotes:', err.message);
    } finally {
      setPopularLoading(false);
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

      const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'OPEN').length;
      setPendingOrdersCount(pending);

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

  // Global '/' keyboard shortcut to focus search
  useEffect(() => {
    function handleGlobalSlash(e) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleGlobalSlash);
    return () => window.removeEventListener('keydown', handleGlobalSlash);
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
    }, 180);

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
    } else if (e.key === 'Escape') {
      setIsInputFocused(false);
    }
  };

  // Curated Screener Investment Strategies
  const screenerThemes = [
    {
      title: 'Magic Formula',
      desc: 'High ROCE (>22%) paired with an attractive price-to-earnings ratio (<25x) for compounding.',
      tag: 'Value',
      sample: ['LALITHAA', 'TCS', 'SBCL']
    },
    {
      title: 'High Growth Compounders',
      desc: '3-year sales and profit CAGR >20%, ROE >18%, with positive free cash flow generation.',
      tag: 'Growth',
      sample: ['TCS', 'INFY', 'LALITHAA']
    },
    {
      title: 'Virtually Debt-Free Leaders',
      desc: 'Conservative capital structure (debt to equity < 0.10) with resilient balance sheets.',
      tag: 'Safety',
      sample: ['TCS', 'HDFCBANK', 'RELIANCE']
    },
    {
      title: 'Make in India Capex',
      desc: 'Domestic indigenisation beneficiaries with multi-year order book visibility and PLI incentives.',
      tag: 'Thematic',
      sample: ['AVANTEL', 'HBLPOWER', 'TATAMOTORS']
    },
    {
      title: 'Undervalued Value Buys',
      desc: 'Trading below historical median P/E with high dividend payouts and steady capital return.',
      tag: 'Value',
      sample: ['SANDUMA', 'ITC', 'SBIN']
    },
    {
      title: 'Bhavcopy Delivery Surge',
      desc: 'Equities seeing >50% delivery percentage and institutional accumulation above the 50 DMA.',
      tag: 'Institutional',
      sample: ['LALITHAA', 'HDFCBANK', 'RELIANCE']
    }
  ];

  // Sector Performance Radar Data
  const sectorData = [
    { name: 'Nifty IT', change: 0.95, isUp: true, topStock: 'INFY', topReturn: '+1.8%' },
    { name: 'Nifty Bank', change: 1.45, isUp: true, topStock: 'HDFCBANK', topReturn: '+2.3%' },
    { name: 'Nifty Energy', change: 1.54, isUp: true, topStock: 'RELIANCE', topReturn: '+1.5%' },
    { name: 'Nifty Auto', change: 0.60, isUp: true, topStock: 'TATAMOTORS', topReturn: '+1.1%' },
    { name: 'Nifty FMCG', change: 0.50, isUp: true, topStock: 'HINDUNILVR', topReturn: '+0.5%' },
    { name: 'Nifty Metal', change: -0.45, isUp: false, topStock: 'TATASTEEL', topReturn: '-0.4%' },
    { name: 'Nifty Pharma', change: 0.85, isUp: true, topStock: 'SUNPHARMA', topReturn: '+1.4%' },
    { name: 'Nifty Realty', change: 2.10, isUp: true, topStock: 'DLF', topReturn: '+2.8%' }
  ];

  // Filtered & Sorted popular stocks based on active tab
  const filteredPopular = useMemo(() => {
    // Deduplicate by symbol and alias
    const seen = new Set();
    const uniqueList = popularStocks.filter(s => {
      if (!s || !s.symbol || seen.has(s.symbol)) return false;
      if (s.symbol === 'TMCV' && seen.has('TATAMOTORS')) return false;
      seen.add(s.symbol);
      return true;
    });

    let list = [...uniqueList];
    if (popularTab === 'GAINERS') {
      return list.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 8);
    }
    if (popularTab === 'LOSERS') {
      return list.sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 8);
    }
    if (popularTab === 'VOLUME') {
      return list.sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 8);
    }
    if (popularTab === 'BLUECHIPS') {
      return list.filter(s => ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'SBIN', 'LT'].includes(s.symbol)).slice(0, 8);
    }
    return list.slice(0, 8);
  }, [popularStocks, popularTab]);

  // Mini Trend Sparkline Generator
  const renderSparkline = (isUp) => {
    const points = isUp 
      ? "0,14 10,12 20,13 30,8 40,9 50,5 60,7 70,2 80,1"
      : "0,2 10,4 20,3 30,8 40,7 50,11 60,10 70,13 80,15";
    return (
      <svg className="w-12 sm:w-16 h-3.5 sm:h-4 overflow-visible shrink-0" viewBox="0 0 80 16" aria-hidden="true">
        <polyline
          fill="none"
          stroke={isUp ? "#16a34a" : "#dc2626"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-8 pb-16 sm:pb-20 font-sans text-slate-900">
      
      {/* 1. TOP MARKET PULSE & BENCHMARK INDICES BAR */}
      <section className="reveal-init bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-5 shadow-xs space-y-3">
        
        {/* Responsive Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between sm:justify-start space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-bold tracking-wider">MARKET PULSE</span>
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
              <span className="text-emerald-700 font-semibold">{marketPulse?.breadth?.advances || '1,482 Adv'}</span>
              <span className="text-slate-300">/</span>
              <span className="text-rose-600 font-semibold">{marketPulse?.breadth?.declines || '984 Dec'}</span>
            </div>
          </div>

          {/* Full-width Segmented Tab Control on Mobile */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs sm:flex sm:space-x-1 sm:w-auto">
            <button
              onClick={() => setIndexTab('BENCHMARK')}
              className={`py-1.5 px-2 sm:px-3 sm:py-1 rounded-lg text-center transition-all cursor-pointer text-[11px] sm:text-xs font-medium ${
                indexTab === 'BENCHMARK' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Benchmark
            </button>
            <button
              onClick={() => setIndexTab('SECTORS')}
              className={`py-1.5 px-2 sm:px-3 sm:py-1 rounded-lg text-center transition-all cursor-pointer text-[11px] sm:text-xs font-medium ${
                indexTab === 'SECTORS' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sector Heat
            </button>
            <button
              onClick={() => setIndexTab('GLOBAL')}
              className={`py-1.5 px-2 sm:px-3 sm:py-1 rounded-lg text-center transition-all cursor-pointer text-[11px] sm:text-xs font-medium ${
                indexTab === 'GLOBAL' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Global Macro
            </button>
          </div>
        </div>

        {/* Dynamic Indices: Symmetrical 2x2 Grid on Mobile, 4-Col Grid on Desktop */}
        {indexTab === 'BENCHMARK' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {indicesLoading && indices.length === 0 ? (
              [1, 2, 3, 4].map(n => (
                <div key={n} className="h-20 rounded-xl bg-slate-50 border border-slate-100 p-3 animate-pulse"></div>
              ))
            ) : (
              indices.map((idx, i) => {
                const isPositive = (idx.changePercent || 0) >= 0;
                return (
                  <div 
                    key={i}
                    className="bg-slate-50/70 hover:bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/90 transition-all flex flex-col justify-between space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                          {idx.symbol}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-slate-200/60 text-slate-600">
                          {idx.exchange}
                        </span>
                      </div>
                      <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                        {renderSparkline(isPositive)}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                      <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 tabular-nums">
                        {Number(idx.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold inline-flex items-center px-1.5 py-0.5 rounded ${
                        isPositive ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/60' : 'text-rose-700 bg-rose-50 border border-rose-200/60'
                      }`}>
                        {isPositive ? '+' : ''}{Number(idx.changePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {indexTab === 'SECTORS' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {(marketPulse?.sectors || sectorData).slice(0, 4).map((sec, i) => (
              <div 
                key={i} 
                onClick={() => handleSelectCompany(sec.topStock)}
                className="bg-slate-50/70 hover:bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-1.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">{sec.name}</span>
                  <span className={`font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded ${
                    sec.isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}>
                    {sec.isUp ? '+' : ''}{Number(sec.change).toFixed(2)}%
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Top: <strong className="text-slate-800">{sec.topStock}</strong></span>
                  <span className="text-emerald-700 font-semibold">{sec.topReturn}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {indexTab === 'GLOBAL' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
            {(marketPulse?.macro || [
              { name: 'GIFT Nifty', sub: 'Singapore', price: '25,402', displayChange: '+0.4%', isUp: true },
              { name: 'India VIX', sub: 'Volatility', price: '15.21', displayChange: '-3.0%', isUp: false },
              { name: 'Brent Crude', sub: 'USD/Bbl', price: '$91.74', displayChange: '-0.8%', isUp: false },
              { name: 'USD/INR', sub: 'Forex Spot', price: '₹84.38', displayChange: '+0.0%', isUp: false }
            ]).map((m, i) => (
              <div key={i} className="bg-slate-50/70 hover:bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/90 flex flex-col justify-between space-y-1 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">{m.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{m.sub}</span>
                </div>
                <div className="flex items-baseline justify-between pt-1 border-t border-slate-100 font-mono">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{m.price}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    m.isUp ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-100'
                  }`}>
                    {m.displayChange}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Market Breadth & Flow */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-500 gap-1.5 sm:gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Inst. Flow:</span>
            <span className="bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 font-mono font-semibold border border-emerald-200/60">
              FII {marketPulse?.flows?.fii || '+₹1,420 Cr'}
            </span>
            <span className="bg-emerald-50 px-2 py-0.5 rounded text-emerald-800 font-mono font-semibold border border-emerald-200/60">
              DII {marketPulse?.flows?.dii || '+₹2,180 Cr'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
            <span>52W Highs: <strong className="text-slate-800 font-bold">{marketPulse?.fiftyTwoWeek?.high || 182}</strong></span>
            <span>•</span>
            <span>Lows: <strong className="text-slate-800 font-bold">{marketPulse?.fiftyTwoWeek?.low || 19}</strong></span>
          </div>
        </div>
      </section>

      {/* Kite Status Notification Banner */}
      {kiteStatusNotice && (
        <div className={`p-3.5 sm:p-4 rounded-xl border flex items-start justify-between shadow-xs ${
          kiteStatusNotice.type === 'cancelled'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div>
            <h4 className="text-xs font-semibold">{kiteStatusNotice.title}</h4>
            <p className="text-xs mt-0.5 opacity-90">{kiteStatusNotice.message}</p>
          </div>
          <button
            onClick={() => setKiteStatusNotice(null)}
            className="text-xs font-bold px-2 py-1 rounded hover:bg-black/5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. INSTITUTIONAL HERO SECTION */}
      <section className="reveal-init stagger-1 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-b from-white via-slate-50/40 to-white p-4 sm:p-9 text-center space-y-4 sm:space-y-6 shadow-xs">
        {/* Ambient Gradient Glow Backdrop */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

        <div className="relative max-w-5xl mx-auto space-y-3.5 sm:space-y-5">
          
          {/* Institutional Telemetry Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/80 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 tracking-wider font-mono">
              INSTITUTIONAL EQUITIES SCREENER • REAL-TIME NSE & BSE
            </span>
          </div>

          {/* High-Authority Headline & Subtitle */}
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.2]">
              Search, Screen & Analyze Indian Equities with <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Audited Precision</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Real-time ticks, 3-year audited financial statements, verified BSE corporate disclosures, and 1-click Zerodha Kite order execution across 4,000+ listed equities.
            </p>
          </div>

          {/* Omnibar Command Search Palette */}
          <div className="relative text-left max-w-3xl mx-auto pt-1" ref={searchRef}>
            <div className="relative flex items-center bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-300 shadow-sm hover:border-slate-400 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/15 focus-within:shadow-md transition-all duration-200 p-1 sm:p-1.5">
              <div className="pl-3 sm:pl-3.5 pr-2 text-slate-400 flex items-center">
                {loading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-emerald-600" />
                ) : (
                  <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                )}
              </div>

              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
                onFocus={() => setIsInputFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search 4,000+ stocks (e.g. Reliance, Tata Motors, TCS, HDFC Bank)..."
                className="w-full py-2 sm:py-2.5 pr-2 text-xs sm:text-sm font-medium placeholder-slate-400 text-slate-900 bg-transparent focus:outline-none"
              />

              {query.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={() => { setQuery(''); searchInputRef.current?.focus(); }}
                  className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 mr-2 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-slate-400 border border-slate-200 bg-slate-50 select-none">
                  <span>/</span>
                </kbd>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-80 overflow-y-auto">
                <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Matching stocks ({results.length})</span>
                  <span>Press Enter to select</span>
                </div>
                {results.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCompany(item.symbol)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                      selectedIndex === idx ? 'bg-slate-50 text-slate-900' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 text-xs shrink-0 font-mono font-bold">
                        {item.symbol.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {item.name || item.symbol}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center space-x-1.5 mt-0.5">
                          <span className="font-semibold text-emerald-700">{item.symbol}</span>
                          <span>•</span>
                          <span className="truncate">{item.sector || 'Equities'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                      {item.exchange || 'NSE'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Searches Dropdown */}
            {isInputFocused && !query.trim() && recentSearches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50 divide-y divide-slate-100 text-left">
                <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Recent searches</span>
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear history
                  </button>
                </div>

                {recentSearches.map((sym, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectCompany(sym)}
                    className="px-3.5 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-mono font-semibold text-slate-800">{sym}</span>
                    </div>
                    <span className="text-xs text-emerald-700 font-medium">Open screener →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clean Trending Equities Row - BALANCED FLEX NO-ORPHAN */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 text-xs text-slate-500 max-w-4xl mx-auto">
            <span className="text-slate-400 shrink-0 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1 mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Trending:</span>
            </span>
            {[
              { label: 'Reliance', sym: 'RELIANCE' },
              { label: 'TCS', sym: 'TCS' },
              { label: 'HDFC Bank', sym: 'HDFCBANK' },
              { label: 'Infosys', sym: 'INFY' },
              { label: 'Tata Motors', sym: 'TATAMOTORS' },
              { label: 'SBI', sym: 'SBIN' },
              { label: 'ICICI Bank', sym: 'ICICIBANK' },
              { label: 'Lalithaa', sym: 'LALITHAA' }
            ].map((c) => (
              <button
                key={c.sym}
                onClick={() => handleSelectCompany(c.sym)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50/90 hover:bg-emerald-50 border border-slate-200/90 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-[11px] font-mono font-medium transition-all duration-150 hover:-translate-y-0.5 active:scale-95 cursor-pointer shrink-0 shadow-2xs"
              >
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Focal Crafted Horizon Element: Live Terminal Quick Deck */}
          <div className="pt-2 sm:pt-3 max-w-4xl mx-auto text-left">
            <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-3 sm:p-4.5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-slate-900 tracking-tight">Active Market Horizon</span>
                  <span className="text-[10px] font-mono text-slate-400">Live Indian Bluechips</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 flex-wrap">
                  <span className="text-emerald-700 font-semibold">{marketPulse?.breadth?.advances || '1,482 Adv'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-rose-600 font-semibold">{marketPulse?.breadth?.declines || '984 Dec'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700 font-semibold">Net Inst: {marketPulse?.flows?.dii || '+₹2,180 Cr'}</span>
                </div>
              </div>

              {/* 4 Bluechip Equities Live Ticker Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {[
                  { sym: 'RELIANCE', name: 'Reliance Ind.', price: '1,377.50', chg: '+2.43%', up: true },
                  { sym: 'TCS', name: 'Tata Consultancy', price: '3,842.20', chg: '+1.18%', up: true },
                  { sym: 'HDFCBANK', name: 'HDFC Bank', price: '1,724.80', chg: '+0.85%', up: true },
                  { sym: 'INFY', name: 'Infosys Ltd', price: '1,892.40', chg: '+1.64%', up: true }
                ].map((stock) => (
                  <div
                    key={stock.sym}
                    onClick={() => handleSelectCompany(stock.sym)}
                    className="group p-2.5 sm:p-3 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {stock.sym}
                      </span>
                      <span className="inline-flex items-center text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {stock.chg}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between pt-0.5 text-xs font-mono">
                      <span className="text-slate-800 font-bold">₹{stock.price}</span>
                      <span className="text-[10px] text-slate-400 group-hover:text-emerald-600 transition-colors">Screen →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Searches Line */}
          {recentSearches.length > 0 && (
            <div className="flex items-center justify-between sm:justify-center gap-2 text-xs text-slate-400 font-mono pt-1.5 border-t border-slate-100 overflow-x-auto no-scrollbar whitespace-nowrap">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="flex items-center gap-1 text-[11px] font-sans text-slate-400 shrink-0 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" /> Recent:
                </span>
                {recentSearches.slice(0, 5).map((sym) => (
                  <button
                    key={sym}
                    onClick={() => handleSelectCompany(sym)}
                    className="font-mono text-[11px] font-semibold text-slate-700 hover:text-emerald-700 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0 bg-slate-100 px-2 py-0.5 rounded-md"
                  >
                    {sym}
                  </button>
                ))}
              </div>
              <button
                onClick={handleClearRecent}
                className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors font-sans cursor-pointer shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {/* Institutional Feature Highlights (3 Live Micro-Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 max-w-3xl mx-auto text-left">
            <div className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-emerald-200 hover:shadow-xs transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 tracking-tight">Real-Time Tick Feeds</div>
                <div className="text-[10px] text-slate-500 truncate">Sub-second NSE & BSE ticks</div>
              </div>
            </div>

            <div className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-teal-200 hover:shadow-xs transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-4 h-4 text-teal-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 tracking-tight">Audited Financials</div>
                <div className="text-[10px] text-slate-500 truncate">3-Yr statements & BSE filings</div>
              </div>
            </div>

            <div className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all duration-200">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 tracking-tight">1-Click Kite Demat</div>
                <div className="text-[10px] text-slate-500 truncate">Direct Zerodha order dispatch</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. USER PORTFOLIO / PAPER TRADING BANNER */}
      {user && (boughtStocks.length > 0 || pendingOrdersCount > 0) && (
        <section className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-semibold text-slate-900">
                    Active portfolio & paper positions
                  </h2>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-emerald-100 text-emerald-800">
                    {boughtStocks.length} active
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Tracked from executed paper orders and Kite dispatches.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-3 pt-1 sm:pt-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block font-mono">Allocated value</span>
                <span className="text-xs sm:text-sm font-semibold font-mono text-emerald-700">
                  ₹{Number(totalHoldingsValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {pendingOrdersCount > 0 && (
                <div className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-mono font-medium">
                  {pendingOrdersCount} in Kite
                </div>
              )}

              <button
                onClick={() => navigate('/orders')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
              >
                <span>Journal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
            {boughtStocks.map((stock, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-mono font-semibold text-xs sm:text-sm text-slate-900">{stock.symbol}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                      {stock.exchange || 'NSE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Quantity</span>
                      <strong className="font-mono text-slate-800 font-semibold">{stock.shares}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Avg buy</span>
                      <strong className="font-mono text-slate-800 font-semibold text-[11px] sm:text-xs">
                        ₹{Number(stock.avgPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">
                    ₹{(stock.shares * Number(stock.avgPrice)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <button
                    onClick={() => handleSelectCompany(stock.symbol)}
                    className="text-emerald-700 font-medium hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                  >
                    <span>Analyze</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. LIVE MARKET MOVERS */}
      <section className="reveal-init bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-6 shadow-xs space-y-3.5">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 sm:pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  Market movers & bluechips
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Live quotes, 52-week bounds, and intraday range dynamics
              </p>
            </div>

            {/* Mobile View Mode Switcher (Grid vs List) */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setStockViewMode('GRID')}
                title="Card Grid view"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  stockViewMode === 'GRID' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setStockViewMode('LIST')}
                title="List view"
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  stockViewMode === 'LIST' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs (Horizontal Scrollable on Mobile, Zero Text Wrap) */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 max-w-full">
            <button
              onClick={() => setPopularTab('ALL')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors cursor-pointer text-xs font-medium shrink-0 whitespace-nowrap ${
                popularTab === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All movers
            </button>
            <button
              onClick={() => setPopularTab('GAINERS')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors cursor-pointer text-xs font-medium flex items-center gap-1 shrink-0 whitespace-nowrap ${
                popularTab === 'GAINERS' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Top gainers</span>
            </button>
            <button
              onClick={() => setPopularTab('LOSERS')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors cursor-pointer text-xs font-medium flex items-center gap-1 shrink-0 whitespace-nowrap ${
                popularTab === 'LOSERS' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Pullbacks</span>
            </button>
            <button
              onClick={() => setPopularTab('VOLUME')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors cursor-pointer text-xs font-medium shrink-0 whitespace-nowrap ${
                popularTab === 'VOLUME' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume spike
            </button>
            <button
              onClick={() => setPopularTab('BLUECHIPS')}
              className={`px-2.5 sm:px-3 py-1 rounded-md transition-colors cursor-pointer text-xs font-medium shrink-0 whitespace-nowrap ${
                popularTab === 'BLUECHIPS' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nifty 50 core
            </button>
          </div>
        </div>

        {/* Stock List / Grid View Content */}
        {stockViewMode === 'LIST' ? (
          /* High-Density Compact List View (Ideal for Fast Mobile Scanning) */
          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            {popularLoading && filteredPopular.length === 0 ? (
              [1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-14 p-3 bg-slate-50 animate-pulse"></div>
              ))
            ) : (
              filteredPopular.map((stock, i) => {
                const isPositive = (stock.changePercent || 0) >= 0;
                const isIndianStock = stock.exchange === 'NSE' || stock.exchange === 'BSE' || stock.currency === 'INR' || (!['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(stock.symbol?.toUpperCase()));
                const cardCurrencySymbol = stock.currencySymbol || (isIndianStock ? '₹' : '$');
                const isUSD = cardCurrencySymbol === '$';

                return (
                  <div
                    key={i}
                    onClick={() => handleSelectCompany(stock.symbol)}
                    className="p-3 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                          {stock.symbol}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                          {stock.exchange || 'NSE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5" title={stock.name}>
                        {stock.name || stock.symbol}
                      </p>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 block tabular-nums">
                        {cardCurrencySymbol}{Number(stock.price || 0).toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`inline-flex items-center text-[10px] sm:text-xs font-bold px-1.5 py-0.2 rounded mt-0.5 tabular-nums ${
                        isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}>
                        {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Card Grid View with Enhanced Legibility */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {popularLoading && filteredPopular.length === 0 ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} className="h-32 rounded-xl bg-slate-50 border border-slate-100 animate-pulse"></div>
              ))
            ) : (
              filteredPopular.map((stock, i) => {
                const isPositive = (stock.changePercent || 0) >= 0;
                const range = Math.max((stock.high || stock.price) - (stock.low || stock.price), 0.01);
                const posPct = Math.max(0, Math.min(100, (((stock.price - (stock.low || stock.price)) / range) * 100)));
                const isIndianStock = stock.exchange === 'NSE' || stock.exchange === 'BSE' || stock.currency === 'INR' || (!['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(stock.symbol?.toUpperCase()));
                const cardCurrencySymbol = stock.currencySymbol || (isIndianStock ? '₹' : '$');
                const isUSD = cardCurrencySymbol === '$';

                return (
                  <div
                    key={i}
                    onClick={() => handleSelectCompany(stock.symbol)}
                    className="bg-white hover:bg-slate-50/70 rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 transition-all cursor-pointer flex flex-col justify-between space-y-2.5 shadow-2xs hover:shadow-xs group"
                  >
                    <div>
                      {/* Header: Symbol & Sector */}
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors">
                            {stock.symbol}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            {stock.exchange || 'NSE'}
                          </span>
                        </div>
                        <span className={`text-xs font-mono font-bold inline-flex items-center px-1.5 py-0.5 rounded ${
                          isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          {isPositive ? '+' : ''}{Number(stock.changePercent || 0).toFixed(2)}%
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate" title={stock.name}>
                        {stock.name || stock.symbol}
                      </p>
                    </div>

                    {/* Price & Intraday Range Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex items-baseline justify-between font-mono">
                        <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                          {cardCurrencySymbol}{Number(stock.price || 0).toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Vol: {stock.volume >= 10000000 ? `${(stock.volume / 10000000).toFixed(1)}Cr` : stock.volume >= 100000 ? `${(stock.volume / 100000).toFixed(1)}L` : String(stock.volume || 0)}
                        </span>
                      </div>

                      {/* Day's Range Visual Bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            style={{ width: `${posPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-500">
                          <span>L: {cardCurrencySymbol}{Number(stock.low || stock.price).toFixed(1)}</span>
                          <span className="text-slate-400 text-[9px] uppercase tracking-wider">Day Range</span>
                          <span>H: {cardCurrencySymbol}{Number(stock.high || stock.price).toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[10px]">
                        {stock.fiftyTwoWeekHigh ? `52W H: ${cardCurrencySymbol}${stock.fiftyTwoWeekHigh}` : stock.sector || 'Equities'}
                      </span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5 text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>Analyze</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* 5. SECTOR PERFORMANCE RADAR */}
      <section className="reveal-init bg-slate-50/70 rounded-2xl border border-slate-200/90 p-3.5 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900">
              Sector performance radar
            </h2>
          </div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-mono">Ranked by session change</span>
        </div>

        {/* 2-Col Grid on Mobile, 4-Col Grid on Desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {(marketPulse?.sectors && marketPulse.sectors.length > 0 ? marketPulse.sectors : sectorData).map((sec, i) => (
            <div 
              key={i} 
              onClick={() => handleSelectCompany(sec.topStock)}
              className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-2xs hover:shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate">
                  {sec.name}
                </span>
                <span className={`text-[10px] sm:text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                  sec.isUp ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                }`}>
                  {sec.isUp ? '+' : ''}{sec.change}%
                </span>
              </div>

              {/* Visual Sector Strength Bar */}
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${sec.isUp ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.max(20, Math.abs(parseFloat(sec.change) || 1) * 35))}%` }}
                />
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-mono">
                <span>Top: <strong className="text-slate-800">{sec.topStock}</strong></span>
                <span className="text-emerald-700 font-semibold">{sec.topReturn}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PROVEN SCREENER INVESTMENT THEMES */}
      <section className="reveal-init space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-900">
              Institutional screener presets
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Screen for high-probability setups curated by fundamental valuation
            </p>
          </div>
          <button
            onClick={() => handleSelectCompany('RELIANCE')}
            className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
          >
            <span>Explore all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          {screenerThemes.map((theme, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 transition-colors flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                    {theme.title}
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {theme.tag}
                  </span>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  {theme.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Sample:</span>
                <div className="flex items-center gap-1.5">
                  {theme.sample.map((sym, j) => (
                    <button
                      key={j}
                      onClick={() => handleSelectCompany(sym)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 7. PLATFORM CAPABILITY HIGHLIGHTS */}
      <section className="reveal-init bg-slate-900 text-white rounded-2xl p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-mono font-medium">
              <Zap className="w-3.5 h-3.5" />
              <span>1-Click Kite Gateway</span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white">Direct demat dispatch</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect official Zerodha Kite Publisher to execute basket and single-leg trades directly from company reports.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-300 text-xs font-mono font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>Audited financials</span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white">3-year audited statements</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Comprehensive balance sheets, P&L, quarterly results, con-call transcripts, and BSE corporate announcements.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-300 text-xs font-mono font-medium">
              <Wallet className="w-3.5 h-3.5" />
              <span>Paper trading</span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white">₹5,00,000 virtual balance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test strategies against real-time live market quotes with zero financial risk and MongoDB order journal persistence.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
