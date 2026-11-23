import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200/90 mt-auto font-sans text-slate-600">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 pb-36 md:py-6">
        
        {/* Main Single Row: Brand & Inline Navigation */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          
          {/* Left: Logo & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <Link to="/" className="inline-block shrink-0">
              <img 
                src="/logo.png" 
                alt="ProfitSheets" 
                className="h-7 w-auto object-contain hover:opacity-95 transition-opacity"
              />
            </Link>
            <span className="hidden sm:inline text-slate-300">•</span>
            <p className="text-xs text-slate-500 font-medium">
              Stock analysis and screening tool for investors in India.
            </p>
          </div>

          {/* Right: Clean Minimalist Nav Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
            <Link to="/" className="hover:text-emerald-700 transition-colors">
              Screens
            </Link>
            <Link to="/watchlist" className="hover:text-emerald-700 transition-colors">
              Watchlist
            </Link>
            <Link to="/orders" className="hover:text-emerald-700 transition-colors">
              Paper Trading
            </Link>
            <Link to="/about" className="hover:text-emerald-700 transition-colors">
              About us
            </Link>
            <Link to="/support" className="hover:text-emerald-700 transition-colors">
              Support
            </Link>
          </nav>

        </div>

        {/* Bottom Row: Compact Copyright & Live Telemetry Tags */}
        <div className="pt-3.5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2 text-center sm:text-left">
          <p>© {currentYear} ProfitSheets Technologies India. All rights reserved.</p>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              NSE & BSE REAL-TIME
            </span>
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
              ZERODHA KITE READY
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
