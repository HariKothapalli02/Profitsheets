import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = searchParams.get('redirect') || '/profile';

  if (user) {
    navigate(redirectTarget);
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectTarget);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex flex-col items-center justify-center py-8 px-4 font-sans">
      {/* Top Back Navigation */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs">
        <Link 
          to="/" 
          className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>← Back to Home</span>
        </Link>
        <span className="text-slate-400 font-mono text-[11px]">ProfitSheets Security</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-lg p-8 sm:p-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0c324e]/5 border border-[#0c324e]/10 text-[#0c324e] mb-1">
            <TrendingUp className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Sign in to ProfitSheets</h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Access your ₹5,00,000 virtual cash portfolio, trade history, and real-time feeds.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[11px] font-bold text-indigo-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0c324e] hover:bg-[#14466b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Account Quick Pill */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">⚡ Quick Demo Test Login:</span>
          <div className="flex justify-between items-center font-mono">
            <span>demo@profitsheets.com</span>
            <button 
              type="button"
              onClick={() => { setEmail('demo@profitsheets.com'); setPassword('demo123456'); }}
              className="text-indigo-600 font-bold hover:underline"
            >
              Autofill
            </button>
          </div>
        </div>

        {/* Bottom Signup Switch */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/signup" className="font-bold text-indigo-600 hover:underline">
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}
