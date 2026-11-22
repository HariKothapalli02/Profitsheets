import React from 'react';
import { Activity, TrendingUp, BarChart3 } from 'lucide-react';

// Color-Free Reusable Skeleton Bone
export function Skeleton({ className = '', subtle = false }) {
  return (
    <div 
      className={`rounded-md ${subtle ? 'skeleton-bone-subtle' : 'skeleton-bone'} ${className}`} 
      aria-hidden="true"
    />
  );
}

// Minimalist Neutral Dual-Ring Spinner (Zero neon/colored tints)
export function BrandedSpinner({ size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14'
  };
  const dimension = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex items-center justify-center ${dimension} ${className}`}>
      <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="3.5"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#475569"
          strokeWidth="3.5"
          strokeDasharray="75, 200"
          strokeDashoffset="0"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-400"></div>
    </div>
  );
}

// 1:1 Structural Company Page Skeleton (Zero Artificial Banners, Zero Colors, Pure Slate)
export function CompanyPageSkeleton({ symbol = 'EQUITY' }) {
  const sym = (symbol || 'EQUITY').trim().toUpperCase();

  return (
    <div className="space-y-4 w-full max-w-[1720px] mx-auto pb-24 md:pb-16 font-sans">
      
      {/* 1. Header Identity & Price Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-6 shadow-xs space-y-3.5 sm:space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-5 pb-3.5 sm:pb-5 border-b border-slate-100">
          
          {/* Left: Avatar & Identity Details */}
          <div className="flex items-start space-x-3 sm:space-x-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center font-black text-sm sm:text-base shrink-0 select-none">
              {sym.substring(0, 2)}
            </div>

            <div className="space-y-2 min-w-0 flex-1">
              {/* Company Title & Symbol Badge */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <Skeleton className="h-6 sm:h-7 w-48 sm:w-72 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-5 w-20 rounded hidden sm:block" />
              </div>

              {/* Status and Verification Badges */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                <Skeleton className="h-4 w-20 rounded" />
                <span className="text-slate-200">•</span>
                <Skeleton className="h-4 w-12 rounded" />
                <span className="text-slate-200">•</span>
                <Skeleton className="h-4 w-28 rounded hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Right: Live Price & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-slate-100">
            <div className="text-left sm:text-right space-y-1">
              <div className="flex items-baseline sm:justify-end gap-2">
                <Skeleton className="h-7 sm:h-8 w-28 sm:w-36 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded" />
              </div>
              <Skeleton className="h-3 w-24 rounded sm:ml-auto" />
            </div>

            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-xl" />
              <Skeleton className="h-9 w-16 rounded-xl hidden sm:block" />
            </div>
          </div>
        </div>

        {/* 2. Key Valuation Stats 6-Card Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-0.5">
          {[
            { label: 'MARKET CAP', sub: 'Valuation' },
            { label: 'STOCK P/E', sub: 'Price to Earnings' },
            { label: 'ROCE / ROE', sub: 'Capital Return' },
            { label: 'BOOK VALUE', sub: 'Net Worth' },
            { label: '52-WEEK RANGE', sub: 'Yearly Bounds' },
            { label: 'DELIVERY %', sub: 'Exchange Volume' }
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-50/80 p-2 sm:p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.label}</span>
              <Skeleton className="h-5 w-20 rounded" />
              <span className="text-[10px] text-slate-400 font-mono block">{item.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Session OHLC Dynamics & Intraday Range Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-48 sm:w-60 rounded" />
              <Skeleton className="h-3 w-56 sm:w-72 rounded" />
            </div>
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/70 space-y-2.5">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-xl border border-slate-200/70 space-y-2.5">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Screener Candlestick & Volume Chart Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <Skeleton className="h-4 w-40 rounded" />
          </div>
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg">
            {['1D', '1W', '1M', '6M', '1Y', '3Y'].map(tf => (
              <div key={tf} className="h-6 w-8 sm:w-9 bg-white rounded border border-slate-200/70"></div>
            ))}
          </div>
        </div>

        {/* Clean Neutral Monochrome Chart Canvas */}
        <div className="h-64 sm:h-72 w-full bg-slate-50/60 rounded-xl border border-slate-200/60 p-4 flex flex-col justify-end relative overflow-hidden">
          <div className="flex items-end justify-between gap-1.5 sm:gap-2.5 h-44 w-full opacity-60">
            {[35, 55, 45, 70, 60, 80, 75, 95, 85, 110, 100, 125, 115, 140, 130, 155, 145, 170, 160, 185, 175, 200].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="w-0.5 h-2 bg-slate-300"></div>
                <div 
                  style={{ height: `${h * 0.65}%` }} 
                  className="w-full rounded-xs bg-slate-300/80"
                ></div>
                <div className="w-0.5 h-2 bg-slate-300"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Audited Financial Statements Suite Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-5 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <Skeleton className="h-3.5 w-28 rounded hidden sm:block" />
        </div>

        {/* Nav Tabs Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['Quarterly Results', 'Profit & Loss', 'Balance Sheet', 'Cash Flows', 'Ratios', 'Corporate Filings'].map((tab, idx) => (
            <div key={idx} className="h-8 w-28 shrink-0 bg-slate-100 rounded-lg border border-slate-200/70"></div>
          ))}
        </div>

        {/* Table Rows Skeleton */}
        <div className="border border-slate-200/80 rounded-lg overflow-hidden">
          <div className="bg-slate-100/80 h-9 flex items-center px-4 justify-between border-b border-slate-200/80">
            <Skeleton className="h-3 w-32 rounded" />
            <div className="flex gap-4 sm:gap-6">
              <Skeleton className="h-3 w-14 sm:w-16 rounded" />
              <Skeleton className="h-3 w-14 sm:w-16 rounded" />
              <Skeleton className="h-3 w-14 sm:w-16 rounded" />
              <Skeleton className="h-3 w-14 sm:w-16 rounded hidden sm:block" />
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6].map(row => (
            <div key={row} className="h-10 flex items-center px-4 justify-between border-b border-slate-100 bg-white">
              <Skeleton className="h-3 w-36 rounded" />
              <div className="flex gap-4 sm:gap-6">
                <Skeleton className="h-3 w-14 sm:w-16 rounded" />
                <Skeleton className="h-3 w-14 sm:w-16 rounded" />
                <Skeleton className="h-3 w-14 sm:w-16 rounded" />
                <Skeleton className="h-3 w-14 sm:w-16 rounded hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// Color-Free Financial Statement Table Skeleton
export function TableSkeleton({ rows = 5, columns = 5 }) {
  return (
    <div className="border border-slate-200/80 rounded-lg overflow-hidden bg-white shadow-xs">
      <div className="bg-slate-100/80 h-9 flex items-center px-4 justify-between border-b border-slate-200/80">
        <Skeleton className="h-3 w-32 rounded" />
        <div className="flex gap-4 sm:gap-6">
          {Array.from({ length: columns - 1 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-14 sm:w-16 rounded" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="h-10 flex items-center px-4 justify-between border-b border-slate-100 bg-white">
          <Skeleton className="h-3 w-36 rounded" />
          <div className="flex gap-4 sm:gap-6">
            {Array.from({ length: columns - 1 }).map((_, c) => (
              <Skeleton key={c} className="h-3 w-14 sm:w-16 rounded" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Color-Free Neutral Candlestick Chart Skeleton
export function ChartSkeleton({ height = 'h-64' }) {
  return (
    <div className={`${height} w-full bg-slate-50/70 rounded-xl border border-slate-200/70 p-4 flex flex-col justify-end relative overflow-hidden`}>
      <div className="flex items-end justify-between gap-2 h-44 w-full opacity-60">
        {[40, 60, 50, 75, 70, 85, 80, 105, 90, 115, 105, 130, 120, 150].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div className="w-0.5 h-2 bg-slate-300"></div>
            <div 
              style={{ height: `${h * 0.65}%` }} 
              className="w-full rounded-xs bg-slate-300/80"
            ></div>
            <div className="w-0.5 h-2 bg-slate-300"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Color-Free Neutral Grid Card Skeleton (for Watchlist & Markets)
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-6 w-14 rounded-md" />
          </div>
          <Skeleton className="h-6 w-24 rounded" />
          <div className="flex justify-between pt-2 border-t border-slate-100">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
