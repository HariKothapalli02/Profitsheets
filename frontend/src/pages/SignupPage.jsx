import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const rawRedirect = searchParams.get('redirect');
  const redirectTarget =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/';

  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, redirectTarget, navigate]);

  if (user) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password);
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Account creation failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center py-8 sm:py-12 px-4 font-sans">
      
      {/* Top Back Navigation */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs px-1">
        <Link 
          to="/" 
          className="text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
        <span className="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>100% Free Registration</span>
        </span>
      </div>

      {/* Main Focused Signup Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block pb-1">
            <img 
              src="/logo.png" 
              alt="ProfitSheets" 
              className="h-9 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Free Account</h1>
          <p className="text-xs text-slate-500">
            Includes ₹5,00,000 virtual demo trading cash and real-time quotes.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Radhakishan Damani"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Create Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{loading ? 'Creating Account...' : 'Get Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Bottom Switch to Sign In */}
        <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
          Already have an account?{' '}
          <Link
            to={rawRedirect ? `/login?redirect=${encodeURIComponent(redirectTarget)}` : '/login'}
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Sign In here
          </Link>
        </div>

      </div>

    </div>
  );
}
