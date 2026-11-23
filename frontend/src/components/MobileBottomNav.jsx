import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  Bookmark, 
  History, 
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStoredWatchlist } from '../utils/watchlist';

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const [watchlistCount, setWatchlistCount] = useState(0);

  // Keep watchlist count synchronized
  useEffect(() => {
    const updateCount = () => {
      const list = getStoredWatchlist();
      setWatchlistCount(list.length);
    };

    updateCount();
    window.addEventListener('watchlist_updated', updateCount);
    return () => window.removeEventListener('watchlist_updated', updateCount);
  }, []);

  const navItems = [
    {
      label: 'Home',
      to: '/',
      icon: Home,
      isActive: location.pathname === '/' || location.pathname === '/markets'
    },
    {
      label: 'Screens',
      to: '/company/RELIANCE',
      icon: Compass,
      isActive: location.pathname.startsWith('/company')
    },
    {
      label: 'Watchlist',
      to: '/watchlist',
      icon: Bookmark,
      badge: watchlistCount > 0 ? watchlistCount : null,
      isActive: location.pathname === '/watchlist'
    },
    {
      label: 'Orders',
      to: '/orders',
      icon: History,
      isActive: location.pathname === '/orders' || location.pathname === '/history'
    },
    {
      label: user ? 'Profile' : 'Sign In',
      to: user ? '/profile' : '/login',
      icon: User,
      isActive: location.pathname === '/profile' || location.pathname === '/login' || location.pathname === '/signup'
    }
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-transform duration-300 animate-bottom-nav select-none"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 group ${
                active 
                  ? 'text-emerald-700' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon 
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? 'scale-110 stroke-[2.2]' : 'stroke-[1.75]'
                  }`} 
                />
                {item.badge && (
                  <span className="absolute -top-1 -right-2.5 px-1 min-w-[15px] h-[15px] rounded-full bg-emerald-600 text-white text-[9px] font-mono font-bold flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </div>

              <span 
                className={`text-[10px] tracking-tight mt-1 font-medium transition-colors duration-200 ${
                  active ? 'text-emerald-800 font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>

              {/* Subtle active indicator pip */}
              {active && (
                <span className="w-1 h-1 rounded-full bg-emerald-600 mt-0.5 animate-in fade-in zoom-in-50 duration-200" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

