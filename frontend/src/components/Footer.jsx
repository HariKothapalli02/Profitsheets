import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          
          {/* Left Brand */}
          <div className="space-y-2">
            <Link to="/" className="inline-block">
              <img 
                src="/logo.png" 
                alt="ProfitSheets - investments made simple" 
                className="h-8 sm:h-9 w-auto object-contain opacity-95 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="text-xs text-slate-500 font-medium">
              Stock analysis and screening tool for investors in India.
            </p>
          </div>

          {/* Right Links matching Screener Layout */}
          <div className="flex flex-wrap items-start gap-12 sm:gap-16 text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Product</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li>
                  <Link to="/" className="hover:text-slate-800 transition-colors">Screens</Link>
                </li>
                <li>
                  <Link to="/watchlist" className="hover:text-slate-800 transition-colors">Watchlist</Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-slate-800 transition-colors">Paper Trading</Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Team</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li>
                  <Link to="/about" className="hover:text-slate-800 transition-colors">About us</Link>
                </li>
                <li>
                  <Link to="/support" className="hover:text-slate-800 transition-colors">Support</Link>
                </li>
              </ul>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>© {new Date().getFullYear()} ProfitSheets. Live NSE & BSE Indian Equities Engine.</p>
          <p>Zerodha Kite 1-Click Order Execution Enabled.</p>
        </div>
      </div>
    </footer>
  );
}
