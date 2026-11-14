import React from 'react';
import { Link } from 'react-router-dom';
import { Sun } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          
          {/* Left Brand */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#10b981] to-[#047857] flex items-center justify-center text-white font-black text-xs font-sans">
                P
              </div>
              <span className="text-xl font-black text-slate-800 tracking-tight font-sans">
                Profit<span className="text-[#10b981]">Sheets</span>
              </span>
              <div className="flex items-end space-x-0.5 h-4">
                <span className="w-1 h-2 bg-[#10b981] rounded-xs"></span>
                <span className="w-1 h-3 bg-[#10b981] rounded-xs"></span>
                <span className="w-1 h-4 bg-[#10b981] rounded-xs"></span>
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Stock analysis and screening tool for investors in India.
            </p>
          </div>

          {/* Right Links matching Screenshot 1 */}
          <div className="flex flex-wrap items-start gap-12 sm:gap-16 text-xs">
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Product</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li className="hover:text-slate-800 cursor-pointer">Premium</li>
                <li className="hover:text-slate-800 cursor-pointer">What's new?</li>
                <li className="hover:text-slate-800 cursor-pointer">Learn</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Team</h4>
              <ul className="space-y-1.5 text-slate-500">
                <li className="hover:text-slate-800 cursor-pointer">About us</li>
                <li className="hover:text-slate-800 cursor-pointer">Support</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Theme</h4>
              <div className="flex items-center space-x-1.5 text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium text-[11px]">Light</span>
              </div>
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
