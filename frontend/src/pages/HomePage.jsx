import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Loader2, 
  Building2, 
  ChevronRight, 
  Clock, 
  History, 
  X,
  TrendingUp,
  Briefcase,
  ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../utils/recentSearches';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [boughtStocks, setBoughtStocks] = useState([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const searchRef = useRef(null);

  const sampleCompanies = [
    { label: 'Lalithaa', symbol: 'LALITHAA' },
    { label: 'Reliance', symbol: 'RELIANCE' },
    { label: 'TCS', symbol: 'TCS' },
    { label: 'Infosys', symbol: 'INFY' },
    { label: 'HDFC Bank', symbol: 'HDFCBANK' },
    { label: 'Avantel', symbol: 'AVANTEL' },
    { label: 'Coastal Corp', symbol: 'COASTCORP' },
    { label: 'Frontier Springs', symbol: 'FRONTIER' },
    { label: 'Godawari Power', symbol: 'GPIL' },
    { label: 'Grand Continent', symbol: 'GRAND' },
    { label: 'HBL Engineering', symbol: 'HBLPOWER' },
    { label: 'Pix Transmission', symbol: 'PIXTRANS' },
    { label: 'RACL Geartech', symbol: 'RACLGEAR' },
    { label: 'Sandur Manganese', symbol: 'SANDUMA' },
    { label: 'Shivalik Bimetal', symbol: 'SBCL' },
    { label: 'VTM', symbol: 'VTM' }
  ];

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

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12">
      {/* Brand Hero */}
      <div className="w-full max-w-2xl text-center space-y-6">
        {/* ProfitSheets Brand Logo with 3 green bars */}
        <div className="flex items-center justify-center space-x-2.5">
          <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#047857] flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-2xl sm:text-3xl font-sans">
            P
          </div>
          <span className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight font-sans">
            Profit<span className="text-[#10b981]">Sheets</span>
          </span>
          <div className="flex items-end space-x-0.5 h-8">
            <span className="w-1.5 h-3 bg-[#10b981] rounded-xs"></span>
            <span className="w-1.5 h-5 bg-[#10b981] rounded-xs"></span>
            <span className="w-1.5 h-7 bg-[#10b981] rounded-xs"></span>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-sm sm:text-base text-slate-600 font-medium">
          Stock analysis and screening tool for investors in India.
        </p>

        {/* Central Search Bar */}
        <div className="relative mt-8" ref={searchRef}>
          <div className="relative flex items-center bg-white rounded-lg border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
            <div className="pl-4 pr-2 text-slate-400">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
              onFocus={() => setIsInputFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search for a company (e.g. Reliance, Lalithaa, TCS)"
              autoFocus
              className="w-full py-3.5 pr-4 text-slate-800 text-sm sm:text-base placeholder-slate-400 bg-transparent focus:outline-none"
            />
          </div>

          {/* Autocomplete dropdown (Live search results) */}
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-80 overflow-y-auto text-left">
              {results.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectCompany(item.symbol)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-4 py-3 cursor-pointer flex items-center justify-between transition-colors ${
                    selectedIndex === idx ? 'bg-indigo-50/70 text-indigo-900' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 leading-tight">
                        {item.name || item.symbol}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {item.symbol} • {item.sector || 'Equities'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-mono">
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 text-left">
              <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
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
                  <span className="text-[10px] text-slate-400 font-sans">Open Report →</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 0. Bought Stocks / Active Portfolio - Only visible after login when user has bought stocks */}
        {user && (boughtStocks.length > 0 || pendingOrdersCount > 0) && (
          <div className="pt-2 text-center animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl shadow-xs max-w-xl mx-auto text-left">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100/90">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider font-mono">
                  <Briefcase className="w-3.5 h-3.5 text-[#00965e]" />
                  <span>Your Bought Stocks ({boughtStocks.length})</span>
                  {pendingOrdersCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse font-sans">
                      {pendingOrdersCount} pending in Kite
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/orders')}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-0.5 font-sans"
                >
                  <span>View Journal</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {boughtStocks.map((stock, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectCompany(stock.symbol)}
                    className="group px-3 py-1.5 rounded-xl bg-white border border-emerald-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 shadow-2xs transition-all flex items-center gap-2 text-xs"
                    title={`Open full report for ${stock.symbol}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-[#00965e] group-hover:scale-125 transition-transform"></span>
                    <span className="font-mono font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {stock.symbol}
                    </span>
                    <span className="text-[11px] font-bold font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {stock.shares} sh
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ₹{Number(stock.avgPrice).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 1. "Recently searched of mine" section */}
        {recentSearches.length > 0 && (
          <div className="pt-2 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-700 font-bold flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span>Recently searched:</span>
              </span>
              {recentSearches.map((sym, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectCompany(sym)}
                  className="px-3 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold font-mono text-xs transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span>{sym}</span>
                </button>
              ))}
              <button
                onClick={handleClearRecent}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-1"
                title="Clear recent searches"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* 2. "Or analyse:" pills */}
        <div className="pt-1 text-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium mr-1">Or analyse:</span>
            {sampleCompanies.map((c, i) => (
              <button
                key={i}
                onClick={() => handleSelectCompany(c.symbol)}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
