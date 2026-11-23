import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  TrendingUp, 
  FileText, 
  Zap, 
  Globe2, 
  Cpu, 
  Lock, 
  ArrowRight,
  CheckCircle2,
  Wallet
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full max-w-[1720px] mx-auto py-4 sm:py-8 space-y-8 sm:space-y-12 font-sans text-slate-800">
      
      {/* 1. HERO SECTION */}
      <section className="reveal-init text-center space-y-4 max-w-4xl mx-auto py-4 sm:py-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Democratizing Institutional Equity Research</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Investments Made Simple, <br className="hidden sm:inline" />
          <span className="text-[#28C76F]">Backed by Audited Data</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          ProfitSheets is an institutional-grade equity research screener and demat execution platform designed for long-term fundamental investors, analysts, and traders in Indian public markets.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Explore Live Screener
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Try Virtual Demo Trading
          </Link>
        </div>
      </section>

      {/* 2. CORE PILLARS & ACCURATE CAPABILITIES */}
      <section className="reveal-init space-y-6">
        <div className="text-center space-y-1 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">What Powers ProfitSheets</h2>
          <p className="text-xs sm:text-sm text-slate-500">Every feature is designed with verifiable source data and zero marketing gimmicks.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Pillar 1 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">10-Year Audited Financials</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Complete audited balance sheets, profit & loss statements, cash flows, and quarterly XBRL results. Direct historical metrics for ROCE, ROE, EPS, and debt obligations.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Real-Time Exchange Ticker</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sub-second price updates, daily percentage changes, volume analytics, and accurate today vs. yesterday OHLC range comparisons for NSE (.NS) and BSE (.BO) equities.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Official BSE Filings & Concalls</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct access to verified PDF downloads of corporate announcements, quarterly concall transcripts, investor presentations, and board meeting resolutions.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zerodha Kite 1-Click Gateway</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Official client-side Zerodha Kite Publisher integration. Dispatch trade baskets directly into your Kite demat account with zero manual order transcription errors.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Virtual Demo Paper Trading</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              A ₹5,00,000 live simulated wallet allowing you to test investment theses, calculate risk-reward ratios, and journal swing trades before deploying real capital.
            </p>
          </div>

          {/* Pillar 6 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Dual-Currency Global Equity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Intelligent currency detection automatically formatting US equities (NVIDIA, Apple, Microsoft, Tesla) in Dollars ($) while keeping Indian equities in Rupees (₹).
            </p>
          </div>

        </div>
      </section>

      {/* 3. ARCHITECTURE & SECURITY */}
      <section className="reveal-init bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Architecture & Data Integrity</h2>
          <p className="text-xs sm:text-sm text-slate-500">How ProfitSheets maintains sub-second query performance and protects user data.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>MongoDB Atlas 24h Shield</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Audited statements are saved in MongoDB Atlas with a 24-hour TTL, allowing instant &lt; 20ms page loads while avoiding stale numbers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Real-Time Tick Pipeline</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Real-time price ticks and volume changes bypass the cache, ensuring you always see authentic live bids, asks, and day highs/lows.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero Credential Storage</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Zerodha Kite order authentication runs 100% inside Zerodha's official secure gateway window. ProfitSheets never receives or stores your password or PIN.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Bcrypt & JWT Security</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              User accounts utilize salted bcrypt (cost factor 10) password hashing and tamper-proof JSON Web Tokens (JWT) for session integrity.
            </p>
          </div>
        </div>
      </section>

      {/* 4. MISSION & COMMITMENT */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Our Investment Philosophy</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-4xl">
          We believe long-term compounding requires discipline, verifiable financials, and zero emotional noise. Too many retail tools overwhelm investors with paid tips, intrusive ads, and opaque algorithms. ProfitSheets is committed to staying clean, fast, light-mode focused, and 100% transparent.
        </p>
        <div className="pt-2 text-xs text-slate-500 font-mono">
          ProfitSheets • Built for Indian Capital Markets • NSE & BSE Verified
        </div>
      </section>

    </div>
  );
}
