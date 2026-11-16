import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  User, 
  ChevronDown, 
  LogOut, 
  Building2, 
  ChevronRight,
  Loader2,
  Wallet,
  Zap,
  Clock,
  Bookmark,
  Menu,
  X,
  SlidersHorizontal,
  History
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useKite } from '../context/KiteContext';
import { getRecentSearches, addRecentSearch } from '../utils/recentSearches';
import { getStoredWatchlist } from '../utils/watchlist';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConfigured, setIsModalOpen } = useKite();
  const location = useLocation();
  const navigate = useNavigate();

  const isHomePage = location.pathname === '/' || location.pathname === '/markets';

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);

  const navSearchRef = useRef(null);

  // Update watchlist count
  useEffect(() => {
    const updateCount = () => {
      const list = getStoredWatchlist();
      setWatchlistCount(list.length);
    };
    updateCount();
    window.addEventListener('watchlist_updated', updateCount);
    return () => window.removeEventListener('watchlist_updated', updateCount);
  }, []);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
    setMobileMenuOpen(false); // Close mobile menu on page transition
  }, [location.pathname]);

  // Click outside to close nav search dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (navSearchRef.current && !navSearchRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search on company/report pages
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
        console.warn('Navbar search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectStock = (item) => {
    addRecentSearch(item.symbol);
    navigate(`/company/${item.symbol}`);
    setSearchQuery('');
    setSearchResults([]);
    setIsFocused(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Left: Logo & Desktop Navigation */}
          <div className="flex items-center space-x-6 lg:space-x-8">
            {/* ProfitSheets Logo */}
            <Link to="/" className="flex items-center group shrink-0 py-1">
              <img 
                src="/logo.png" 
                alt="ProfitSheets - investments made simple" 
                className="h-8 sm:h-9 w-auto object-contain hover:opacity-95 transition-opacity"
              />
            </Link>

            {/* Desktop Nav Menu Items */}
            <nav className="hidden md:flex items-center space-x-6 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Link 
                to="/" 
                className={`hover:text-slate-900 transition-colors ${location.pathname === '/' ? 'text-emerald-600 font-extrabold' : ''}`}
              >
                HOME
              </Link>

              <Link 
                to="/company/LALITHAA" 
                className={`hover:text-slate-900 transition-colors ${location.pathname.startsWith('/company') ? 'text-emerald-600 font-extrabold' : ''}`}
              >
                SCREENS
              </Link>

              <Link 
                to="/watchlist" 
                className={`hover:text-slate-900 transition-colors flex items-center gap-1.5 ${location.pathname === '/watchlist' ? 'text-emerald-600 font-extrabold' : ''}`}
              >
                <span>WATCHLIST</span>
                {watchlistCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                    {watchlistCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Right: Search Bar, Auth Actions & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Desktop Search Bar (shown on subpages) */}
            {!isHomePage && (
              <div className="relative hidden sm:block w-56 lg:w-72" ref={navSearchRef}>
                <div className="relative flex items-center bg-slate-50 hover:bg-white rounded-lg border border-slate-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
                  <div className="pl-3 pr-1 text-slate-400">
                    {isSearching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    placeholder="Search company (e.g. LALITHAA)..."
                    className="w-full py-1.5 pr-3 text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none font-sans"
                  />
                </div>

                {/* Autocomplete dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectStock(item)}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between text-left"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">
                            {item.name || item.symbol}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {item.symbol} • {item.sector || 'Equities'}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {item.exchange || 'NSE'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recent Searches */}
                {isFocused && !searchQuery.trim() && recentSearches.length > 0 && (
                  <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50 divide-y divide-slate-100 text-left">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Recent Searches</span>
                    </div>
                    {recentSearches.slice(0, 5).map((sym, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          addRecentSearch(sym);
                          navigate(`/company/${sym}`);
                          setIsFocused(false);
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors"
                      >
                        <span className="text-xs font-bold font-mono text-slate-800">{sym}</span>
                        <span className="text-[10px] text-slate-400">View →</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Desktop Auth Controls */}
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl py-2 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 pb-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Virtual Fund:</span>
                      <strong className="font-mono text-emerald-600 font-bold">
                        ₹{Number(user.walletBalance || 500000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </strong>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                    >
                      My Profile & Balance
                    </Link>

                    <Link
                      to="/watchlist"
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 border-b border-slate-100"
                    >
                      My Watchlist ({watchlistCount})
                    </Link>

                    <Link
                      to="/history"
                      onClick={() => setProfileOpen(false)}
                      className="block px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Trade Orders & History
                    </Link>

                    <button
                      onClick={() => { logout(); setProfileOpen(false); navigate('/login'); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 flex items-center space-x-1.5 transition-colors uppercase tracking-wider"
                >
                  <User className="w-3 h-3" />
                  <span>LOGIN</span>
                </Link>

                <Link
                  to="/signup"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors uppercase tracking-wider shadow-2xs"
                >
                  GET FREE ACCOUNT
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Slide-Down Drawer (Thorough Mobile Responsiveness) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          
          {/* Mobile Search Bar */}
          <div className="relative">
            <div className="relative flex items-center bg-slate-50 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-emerald-500">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks (e.g. LALITHAA)..."
                className="w-full py-2 pl-2 pr-3 text-xs text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Search results on mobile */}
            {searchResults.length > 0 && (
              <div className="mt-1 bg-white rounded-lg border border-slate-200 shadow-lg divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectStock(item)}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">{item.symbol}</span>
                      <span className="text-[10px] text-slate-500">{item.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{item.exchange || 'NSE'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50"
            >
              <span>HOME</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/company/LALITHAA"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50"
            >
              <span>SCREENS (LALITHAA)</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/watchlist"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <span>WATCHLIST</span>
                {watchlistCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    {watchlistCount}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50"
            >
              <span>TRADE JOURNAL & HISTORY</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </nav>

          {/* User profile / Auth buttons in mobile menu */}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{user.name}</span>
                    <span className="text-[10px] text-slate-400 block">{user.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Virtual Fund</span>
                    <span className="font-mono font-bold text-emerald-600 block">
                      ₹{Number(user.walletBalance || 500000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 rounded-lg border border-slate-300 text-center text-xs font-semibold text-slate-700"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); navigate('/login'); }}
                    className="py-2.5 px-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-center text-xs font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg border border-slate-300 text-center text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>LOGIN</span>
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-lg bg-emerald-600 text-center text-xs font-bold text-white shadow-2xs"
                >
                  GET FREE ACCOUNT
                </Link>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
