import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Home, 
  LineChart, 
  Bookmark, 
  Newspaper, 
  Layers, 
  KeyRound, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  LogOut, 
  User, 
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useKite } from '../context/KiteContext';

export function Sidebar({ 
  isOpen, 
  onClose 
}) {
  const { user, logout } = useAuth();
  const { isConfigured, setIsModalOpen } = useKite();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/markets', label: 'Home / Screener', icon: Home },
    { path: '/watchlist', label: 'My Watchlist', icon: Bookmark },
    { path: '/news', label: 'Live Stock News', icon: Newspaper },
    { path: '/orders', label: 'MongoDB Trade Journal', icon: Layers },
  ];

  const secondaryItems = [
    { 
      label: 'Kite Publisher API', 
      icon: KeyRound, 
      action: () => setIsModalOpen(true),
      badge: isConfigured ? 'Active' : 'Setup'
    },
    { 
      label: 'Paper Trading Rules', 
      icon: FileText, 
      action: () => alert('ProfitSheets Paper Trading: Instant execution with ₹5,00,000 virtual balance and live Yahoo Finance tick data.') 
    },
    { 
      label: 'Broker Documentation', 
      icon: HelpCircle, 
      action: () => window.open('https://kite.trade/docs/connect/v3/', '_blank') 
    },
    { 
      label: 'Feedback & Support', 
      icon: MessageSquare, 
      action: () => alert('Thank you for using ProfitSheets! Support ticket submitted.') 
    },
  ];

  const handleNav = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-[#002137]/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[#0c324e]/10
        flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top: Brand Header */}
        <div>
          <div className="flex items-center justify-between px-2 pt-2 pb-5 border-b border-slate-100">
            <div 
              onClick={() => handleNav('/markets')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {/* ProfitSheets Signature Logo Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#0c324e] relative flex items-center justify-center shadow-md border border-[#14466b] overflow-hidden group-hover:scale-105 transition-transform">
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#28C76F] rounded-bl-lg"></div>
                <span className="text-white font-black text-xl font-sans tracking-tight">P</span>
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-[#0c324e] font-sans">
                  Profit<span className="text-[#28C76F]">Sheets</span>
                </span>
                <p className="text-[10px] font-semibold text-[#cf2e2e] tracking-tight">
                  investments made simple
                </p>
              </div>
            </div>

            {/* Close Button on Mobile */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Primary Navigation with Real URLs */}
          <div className="space-y-1.5 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/markets' && location.pathname.startsWith('/company'));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`
                    w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200
                    ${isActive 
                      ? 'bg-[#0c324e] text-white shadow-md shadow-[#0c324e]/20 translate-x-1 border-l-4 border-[#28C76F]' 
                      : 'text-slate-600 hover:text-[#0c324e] hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#28C76F]' : 'text-slate-400'}`} />
                  <span className={isActive ? 'text-white' : 'text-slate-700'}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Utilities */}
          <div className="pt-6 mt-4 border-t border-slate-100 space-y-1">
            <p className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
              Configuration & Rules
            </p>
            {secondaryItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => { item.action(); if (onClose) onClose(); }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 hover:text-[#0c324e] hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.badge === 'Active' 
                        ? 'bg-emerald-50 text-[#1B8415] border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="pt-4 border-t border-slate-100">
          {user ? (
            <div className="bg-[#f8fafc] p-3 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-[#0c324e] text-white font-bold text-xs flex items-center justify-center border border-[#14466b] shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold text-[#0c324e] truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-[#cf2e2e] border border-slate-200 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="bg-[#0c324e] text-white p-4 rounded-2xl border border-[#14466b] text-center space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#28C76F]/20 text-[#28C76F] flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-white">Sign in to ProfitSheets</p>
              <p className="text-[11px] text-slate-300 leading-tight">
                Unlock paper trading, Kite execution & live tracking.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { navigate('/login'); if (onClose) onClose(); }}
                  className="w-full py-2 bg-[#0c324e] hover:bg-[#14466b] text-white rounded-xl text-xs font-bold shadow-md transition-all uppercase tracking-wider"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate('/signup'); if (onClose) onClose(); }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all uppercase tracking-wider"
                >
                  Create Free Account
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
