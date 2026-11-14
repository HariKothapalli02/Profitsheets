import React, { useState, useEffect } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  BarChart3,
  Layers
} from 'lucide-react';
import axios from 'axios';
import StockCard from '../components/StockCard';

export default function MarketsPage({ stocks, loading, watchlist, onToggleWatchlist, onSelectStock }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSector, setSelectedSector] = useState('ALL');

  const sectors = [
    { id: 'ALL', name: 'All Equities' },
    { id: 'NSE', name: 'NIFTY Bluechips' },
    { id: 'TECH', name: 'Information Technology' },
    { id: 'BANKING', name: 'Banking & Finance' },
    { id: 'AUTO_ENERGY', name: 'Auto & Energy' },
    { id: 'US', name: 'US Mega-Caps' },
  ];

  // Live Search Query to backend
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data || []);
      } catch (e) {
        console.warn('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = async (item) => {
    try {
      const res = await axios.get(`/api/stocks/quote?symbol=${item.yahooSymbol || item.symbol}`);
      onSelectStock(res.data);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      onSelectStock({
        symbol: item.symbol,
        name: item.name,
        exchange: item.exchange,
        price: 100,
        change: 0,
        changePercent: 0
      });
    }
  };

  // Filter local stock list
  const filteredStocks = stocks.filter(stock => {
    if (selectedSector === 'ALL') return true;
    if (selectedSector === 'NSE') return stock.exchange === 'NSE';
    if (selectedSector === 'TECH') return stock.sector?.includes('Technology') || stock.sector?.includes('Software');
    if (selectedSector === 'BANKING') return stock.sector?.includes('Banking');
    if (selectedSector === 'AUTO_ENERGY') return stock.sector?.includes('Energy') || stock.sector?.includes('Auto');
    if (selectedSector === 'US') return stock.exchange === 'NASDAQ' || stock.exchange === 'US';
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Hero Feature Banner with ProfitSheets Signature Navy & Green Palette */}
      <div className="relative rounded-[2.5rem] bg-gradient-to-br from-[#0c324e] via-[#09253b] to-[#002137] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-[#14466b] overflow-hidden">
        {/* Ambient Glow circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#28C76F]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Eyebrow tag */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#14466b] border border-[#28C76F]/40 text-[#28C76F] text-xs font-bold font-sans">
              <Sparkles className="w-3.5 h-3.5 text-[#28C76F] fill-current" />
              <span className="uppercase tracking-wider">INDIA'S FIRST ELITE STOCK SCREENER & 1-CLICK TRADING</span>
            </div>

            {/* Giant Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15]">
              THE NEXT WIN <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28C76F] via-[#00d084] to-[#00ff66]">
                COULD BE YOURS.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Screen transparent live equities daily. <strong className="text-white font-bold">FREE PAPER TRADING FOR EVERY INVESTOR.</strong> Execute orders instantly through Zerodha Kite Publisher or test proven strategies risk-free.
            </p>

            {/* Search Bar inside Hero */}
            <div className="relative max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any symbol (e.g. RELIANCE, TCS, HDFCBANK, AAPL, NVDA)..."
                className="w-full pl-11 pr-11 py-3.5 bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#28C76F] text-xs font-semibold placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#0c324e] animate-spin absolute right-4 top-4" />
              )}

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="p-3.5 hover:bg-emerald-50 cursor-pointer flex items-center justify-between transition-colors text-slate-900"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{item.symbol}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#0c324e]">
                            {item.exchange}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-[280px]">{item.name}</p>
                      </div>
                      <span className="text-xs font-bold text-[#1B8415] font-mono">View Quote →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => {
                  const el = document.getElementById('equities-grid');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#1B8415] to-[#28C76F] hover:from-[#166d11] hover:to-[#22a65d] text-white text-xs font-bold shadow-lg shadow-[#1B8415]/30 transition-all duration-200"
              >
                <span>EXPLORE SCREENER & EQUITIES</span>
                <span className="text-base">→</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#14466b] text-[#28C76F] border border-[#28C76F]/30">
                NOW ON NSE & NASDAQ
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#14466b] text-[#28C76F] border border-[#28C76F]/30">
                ZERO ENTRY FEE
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#14466b] text-sky-300 border border-sky-400/30">
                100% TRANSPARENT
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#14466b] text-amber-300 border border-amber-400/30">
                GENUINE LIVE TICKS
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#14466b] text-emerald-300 border border-emerald-400/30">
                KITE 1-CLICK
              </span>
            </div>

            {/* 4 Key Statistics row */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-[#14466b]">
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">2,000+</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE EQUITIES</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#28C76F]">&lt;50ms</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TICK REFRESH</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">₹5.0L+</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">VIRTUAL CASH</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#28C76F]">100%</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GENUINE DATA</p>
              </div>
            </div>
          </div>

          {/* Right Column: Floating Cards Display powered 100% by live stock feeds */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
            {(stocks && stocks.length > 0 ? stocks.slice(0, 4) : []).map((card, i) => {
              const isPos = (card.change || 0) >= 0;
              const currSym = card.currencySymbol || (card.exchange === 'NSE' || card.exchange === 'BSE' ? '₹' : '$');
              return (
                <div 
                  key={card.symbol || i}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xl hover:scale-[1.03] transition-all duration-200 cursor-pointer flex flex-col justify-between h-40 text-slate-900"
                  onClick={() => onSelectStock(card)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0c324e]/10 text-[#0c324e]">
                        {card.exchange}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {card.sector || 'EQUITY'}
                      </span>
                    </div>
                    <h4 className="font-black text-[#0c324e] text-sm">{card.symbol}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{card.name}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <span className="text-base font-black font-mono text-[#0c324e]">
                      {currSym}{card.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md ${
                      isPos ? 'bg-emerald-50 text-[#1B8415]' : 'bg-red-50 text-[#cf2e2e]'
                    }`}>
                      {isPos ? '+' : ''}{card.changePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sector Filter Chips */}
      <div id="equities-grid" className="flex items-center space-x-2.5 overflow-x-auto pb-2 scrollbar-none pt-2">
        <div className="flex items-center text-xs font-bold text-slate-500 pr-2">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5 text-[#0c324e]" />
          <span>Sectors:</span>
        </div>
        {sectors.map(sec => {
          const isSelected = selectedSector === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setSelectedSector(sec.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                isSelected
                  ? 'bg-[#0c324e] text-white shadow-md shadow-[#0c324e]/20 border border-[#0c324e]'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {sec.name}
            </button>
          );
        })}
      </div>

      {/* Equities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-200 p-6 h-52 animate-pulse flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-slate-100 rounded-full w-1/3"></div>
                <div className="h-5 bg-slate-200 rounded-full w-1/2"></div>
                <div className="h-3 bg-slate-100 rounded-full w-2/3"></div>
              </div>
              <div className="h-7 bg-slate-200 rounded-full w-1/2"></div>
              <div className="h-9 bg-slate-100 rounded-2xl"></div>
            </div>
          ))}
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-16 text-center text-slate-500 shadow-sm">
          <p className="text-base font-bold text-slate-900">No matching equities found</p>
          <p className="text-xs text-slate-400 mt-1">Try another search term or sector filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredStocks.map(stock => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              isWatchlisted={watchlist.includes(stock.symbol)}
              onToggleWatchlist={onToggleWatchlist}
              onSelectStock={onSelectStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
