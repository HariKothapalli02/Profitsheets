import React from 'react';
import { Activity, ShieldCheck, TrendingUp, BarChart3, Layers, Clock, Zap } from 'lucide-react';

// Modern Branded Dual-Ring Spinner
export function BrandedSpinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex items-center justify-center ${dimension} ${className}`}>
      {/* Outer Ring */}
      <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#emeraldGradient)"
          strokeWidth="4"
          strokeDasharray="80, 200"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      {/* Inner Glowing Core */}
      <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
      <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
    </div>
  );
}

// Full Fidelity Company Page Loading Experience
export function CompanyPageSkeleton({ symbol = 'EQUITY' }) {
  const sym = (symbol || 'EQUITY').trim().toUpperCase();

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto pb-16 font-sans">
      
      {/* 1. Sleek Live Telemetry Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-xl p-4 sm:p-5 shadow-lg border border-emerald-500/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <BrandedSpinner size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 tracking-wider">
                  {sym}
                </span>
                <span className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  STREAMING LIVE MARKET FEED & AUDITED FINANCIALS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 flex items-center gap-2 font-mono">
                <span>Connecting to NSE / BSE Tick Engine</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-semibold">Real-Time Quotes Active</span>
              </p>
            </div>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full sm:w-48 space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono text-slate-300">
              <span>SYNC TELEMETRY</span>
              <span className="text-emerald-400 font-bold animate-pulse">LIVE</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full w-2/3 animate-shimmer"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Header Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          
          {/* Left: Identity */}
          <div className="flex items-start space-x-3.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-slate-400 shrink-0 animate-pulse">
              {sym.substring(0, 2)}
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="h-7 w-48 sm:w-64 bg-slate-200 rounded-lg animate-shimmer"></div>
                <div className="h-5 w-20 bg-slate-100 rounded border border-slate-200 animate-pulse"></div>
                <div className="h-5 w-24 bg-slate-100 rounded border border-slate-200 animate-pulse"></div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="h-4 w-20 bg-emerald-50 rounded border border-emerald-100 animate-pulse"></div>
                <span className="text-slate-300">•</span>
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse"></div>
                <span className="text-slate-300">•</span>
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right: Price Skeleton & Action */}
          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-left md:text-right space-y-1.5">
              <div className="flex items-baseline md:justify-end gap-2">
                <div className="h-8 w-28 sm:w-36 bg-slate-200 rounded-lg animate-shimmer"></div>
                <div className="h-6 w-16 bg-emerald-100/70 rounded-md animate-pulse"></div>
              </div>
              <div className="h-3 w-24 bg-slate-100 rounded md:ml-auto animate-pulse"></div>
            </div>

            <div className="h-9 w-24 bg-slate-100 rounded-lg border border-slate-200 animate-pulse"></div>
          </div>
        </div>

        {/* 3. Real Market Stats 6-Card Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-0.5">
          {[
            { label: 'Market Cap', sub: 'Valuation' },
            { label: 'Stock P/E', sub: 'Price to Earnings' },
            { label: 'ROCE / ROE', sub: 'Capital Return' },
            { label: 'Book Value', sub: 'Net Worth' },
            { label: '52-Week Range', sub: 'Yearly Bounds' },
            { label: 'Delivery %', sub: 'Exchange Volume' }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 space-y-2 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-ping"></div>
              </div>
              <div className="h-5 w-24 bg-slate-200 rounded animate-shimmer"></div>
              <span className="text-[10px] text-slate-400 font-mono block">{item.sub}</span>
            </div>
          ))}
        </div>

        {/* 4. OHLC Dynamics & Intraday Range Skeleton */}
        <div className="mt-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="h-4 w-48 bg-slate-200 rounded animate-shimmer"></div>
                <div className="h-3 w-64 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-5 w-20 bg-emerald-50 rounded-full animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-2.5">
              <div className="h-3.5 w-28 bg-slate-200 rounded animate-shimmer"></div>
              <div className="h-3 w-full bg-slate-200 rounded-full animate-shimmer"></div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-2.5">
              <div className="h-3.5 w-32 bg-slate-200 rounded animate-shimmer"></div>
              <div className="h-3 w-full bg-slate-200 rounded-full animate-shimmer"></div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Interactive Candlestick Chart Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="h-4 w-40 bg-slate-200 rounded animate-shimmer"></div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              {['1D', '1W', '1M', '6M', '1Y', '3Y'].map(tf => (
                <div key={tf} className="h-6 w-9 bg-white rounded border border-slate-200 animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Animated Candlestick Wave Graphic */}
          <div className="h-72 w-full bg-slate-50/60 rounded-xl border border-slate-200/60 p-4 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer"></div>
            <div className="flex items-end justify-between gap-1.5 sm:gap-3 h-48 w-full opacity-60">
              {[42, 65, 55, 80, 72, 90, 84, 110, 95, 125, 115, 140, 130, 160, 145, 175, 160, 190, 180, 210, 200, 230].map((h, i) => {
                const isGreen = i % 2 === 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    {/* Upper wick */}
                    <div className={`w-0.5 h-3 ${isGreen ? 'bg-emerald-300' : 'bg-rose-300'}`}></div>
                    {/* Candle body */}
                    <div
                      style={{ height: `${h * 0.7}%` }}
                      className={`w-full rounded-xs ${isGreen ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}
                    ></div>
                    {/* Lower wick */}
                    <div className={`w-0.5 h-2 ${isGreen ? 'bg-emerald-300' : 'bg-rose-300'}`}></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 6. Audited Financial Statements Table Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="h-4 w-48 bg-slate-200 rounded animate-shimmer"></div>
            </div>
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse"></div>
          </div>

          {/* Statement Nav Tabs Skeleton */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['Quarterly Results', 'Profit & Loss', 'Balance Sheet', 'Cash Flows', 'Ratios', 'Corporate Filings'].map((tab, idx) => (
              <div key={idx} className="h-8 w-28 shrink-0 bg-slate-100 rounded-lg border border-slate-200 animate-pulse"></div>
            ))}
          </div>

          {/* Table Rows Skeleton */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 h-9 flex items-center px-4 justify-between border-b border-slate-200">
              <div className="h-3 w-28 bg-slate-300 rounded animate-pulse"></div>
              <div className="flex gap-6">
                <div className="h-3 w-16 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-300 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-slate-300 rounded animate-pulse"></div>
              </div>
            </div>
            {[1, 2, 3, 4, 5, 6].map(row => (
              <div key={row} className="h-10 flex items-center px-4 justify-between border-b border-slate-100 bg-white hover:bg-slate-50/50">
                <div className="h-3 w-32 bg-slate-200 rounded animate-shimmer"></div>
                <div className="flex gap-6">
                  <div className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// Financial Statement Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
      <div className="bg-slate-100 h-9 flex items-center px-4 justify-between border-b border-slate-200">
        <div className="h-3 w-32 bg-slate-300 rounded animate-pulse"></div>
        <div className="flex gap-6">
          {Array.from({ length: columns - 1 }).map((_, i) => (
            <div key={i} className="h-3 w-16 bg-slate-300 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-10 flex items-center px-4 justify-between border-b border-slate-100 bg-white">
          <div className="h-3 w-36 bg-slate-200 rounded animate-shimmer"></div>
          <div className="flex gap-6">
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <div key={c} className="h-3 w-16 bg-slate-200 rounded animate-shimmer"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Candlestick Chart Skeleton
export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`${height} w-full bg-slate-50/70 rounded-xl border border-slate-200/70 p-4 flex flex-col justify-end relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-shimmer"></div>
      <div className="flex items-end justify-between gap-2 h-44 w-full opacity-60">
        {[40, 60, 50, 75, 70, 85, 80, 105, 90, 115, 105, 130, 120, 150].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="w-0.5 h-2 bg-emerald-300"></div>
            <div style={{ height: `${h * 0.7}%` }} className="w-full rounded-xs bg-emerald-400 animate-pulse"></div>
            <div className="w-0.5 h-2 bg-emerald-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Grid Card Skeleton (for Watchlist & Markets)
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-4 w-20 bg-slate-200 rounded animate-shimmer"></div>
              <div className="h-3 w-32 bg-slate-100 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-16 bg-emerald-50 rounded-md animate-pulse"></div>
          </div>
          <div className="h-6 w-24 bg-slate-200 rounded animate-shimmer"></div>
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <div className="h-3 w-16 bg-slate-100 rounded animate-pulse"></div>
            <div className="h-3 w-20 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

