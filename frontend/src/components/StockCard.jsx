import React from 'react';
import { ArrowUpRight, ArrowDownRight, Bookmark, Zap, TrendingUp, Sparkles } from 'lucide-react';

export default function StockCard({ stock, isWatchlisted, onToggleWatchlist, onSelectStock }) {
  const isPositive = stock.change >= 0;
  const isIndian = stock.exchange === 'NSE' || stock.exchange === 'BSE' || stock.currency === 'INR' || (!['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(stock.symbol?.toUpperCase()));
  const currencySymbol = stock.currencySymbol || (isIndian ? '₹' : '$');
  const isUSD = currencySymbol === '$';

  // Day range percentage
  const rangeSpan = (stock.high - stock.low) || 1;
  const rangePct = Math.min(100, Math.max(0, ((stock.price - stock.low) / rangeSpan) * 100));

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/90 p-5 shadow-sm hover:shadow-xl hover:border-[#28C76F]/60 transition-all duration-300 flex flex-col justify-between group">
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#0c324e]/10 text-[#0c324e] border border-[#0c324e]/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B8415] mr-1.5 animate-pulse"></span>
              {stock.exchange === 'NSE' ? 'NSE LIVE' : stock.exchange === 'NASDAQ' ? 'NASDAQ LIVE' : stock.exchange}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {stock.sector || 'EQUITY'}
            </span>
          </div>

          <button
            onClick={() => onToggleWatchlist(stock.symbol)}
            className={`p-2 rounded-xl transition-all ${
              isWatchlisted
                ? 'bg-emerald-50 text-[#1B8415] border border-emerald-200'
                : 'bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
            }`}
            title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Company Title */}
        <div className="cursor-pointer mb-3" onClick={() => onSelectStock(stock)}>
          <div className="flex items-baseline space-x-2">
            <h3 className="font-black text-lg text-[#0c324e] group-hover:text-[#1B8415] transition-colors">
              {stock.symbol}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
            {stock.name}
          </p>
        </div>

        {/* Price & Change */}
        <div className="my-3">
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black tracking-tight text-slate-900 font-mono">
              {currencySymbol}{stock.price?.toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className={`inline-flex items-center font-mono text-xs font-bold px-2 py-1 rounded-xl ${
              isPositive 
                ? 'bg-emerald-50 text-[#1B8415] border border-emerald-200/80' 
                : 'bg-red-50 text-[#cf2e2e] border border-red-200/80'
            }`}>
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {isPositive ? '+' : ''}{stock.change} ({stock.changePercent}%)
            </span>
          </div>

          {/* Intraday Range Indicator */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1.5 font-semibold">
              <span>L: {currencySymbol}{stock.low}</span>
              <span className="text-slate-400">Day Range</span>
              <span>H: {currencySymbol}{stock.high}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isPositive 
                    ? 'bg-gradient-to-r from-[#1B8415] to-[#28C76F]' 
                    : 'bg-gradient-to-r from-[#cf2e2e] to-[#ef4444]'
                }`} 
                style={{ width: `${rangePct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons matching Screenshot 1 */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <button
          onClick={() => onSelectStock(stock)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors px-2 py-1.5"
        >
          View Chart
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onSelectStock({ ...stock, defaultAction: 'BUY' })}
            className="px-4 py-2 rounded-xl bg-[#00965e] hover:bg-[#007f50] text-white font-extrabold text-xs shadow-xs transition-all flex items-center space-x-1 active:scale-95 cursor-pointer tracking-wider"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>BUY</span>
          </button>
          <button
            onClick={() => onSelectStock({ ...stock, defaultAction: 'SELL' })}
            className="px-4 py-2 rounded-xl bg-[#df1d44] hover:bg-[#c21437] text-white font-extrabold text-xs shadow-xs transition-all flex items-center space-x-1 active:scale-95 cursor-pointer tracking-wider"
          >
            <span>SELL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
