import React, { useState } from 'react';
import { 
  HelpCircle, 
  Clock, 
  ShieldCheck, 
  Zap, 
  Mail, 
  Send, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'Zerodha Kite Gateway',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    const tid = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(tid);
    setSubmitted(true);
  };

  const faqs = [
    {
      q: "How does the Zerodha Kite 1-Click Demat Gateway work?",
      a: "ProfitSheets integrates Zerodha's official Kite Publisher gateway script. When you click 'Buy' or 'Sell', the exact order specifications (Symbol, Quantity, Price, Product type) are dispatched directly into a secure Zerodha Kite basket window in your browser. You authenticate directly with Zerodha—ProfitSheets never asks for or stores your Kite password or 2FA PIN."
    },
    {
      q: "Are financial statements and stock quotes delayed?",
      a: "No. Stock quotes and intraday session data update in real time from live exchange tick feeds during market hours (09:15 AM to 03:30 PM IST). Audited financial statements, balance sheets, and quarterly reports are sourced directly from official BSE and exchange XBRL repositories and refreshed daily."
    },
    {
      q: "Why are some stocks displayed in Dollars ($) while others are in Rupees (₹)?",
      a: "ProfitSheets features dual-currency detection. Indian stocks listed on the National Stock Exchange (NSE) and Bombay Stock Exchange (BSE) are denominated in Indian Rupees (₹) with Indian notation (Crores). US stocks (such as NVIDIA, Apple, Microsoft, Tesla) are denominated in US Dollars ($) with global financial notation (Billions/Trillions)."
    },
    {
      q: "How does the Virtual Demo Paper Trading wallet work?",
      a: "Every registered account receives a default virtual trading balance of ₹5,00,000. When placing an order, selecting 'Virtual Demo' executes the trade immediately against real-time live quotes, deducting or crediting your virtual cash balance so you can test trading strategies without risking real money."
    },
    {
      q: "Where do corporate announcements and concall PDFs come from?",
      a: "Announcements are pulled directly from BSE India's corporate disclosure archive. Concall transcripts, investor presentation slide decks, and board meeting outcomes are accompanied by direct PDF links verified against exchange scrip codes."
    }
  ];

  return (
    <div className="w-full max-w-[1720px] mx-auto py-4 sm:py-8 space-y-8 sm:space-y-10 font-sans text-slate-800">
      
      {/* 1. HEADER */}
      <section className="reveal-init text-center space-y-3 max-w-3xl mx-auto py-2 sm:py-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>ProfitSheets Help & Support Desk</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Find answers regarding exchange data feeds, Kite demat order execution, financial statement XBRL sources, or get in touch with our team.
        </p>
      </section>

      {/* 2. LIVE EXCHANGE TIMINGS & SYSTEM HEALTH */}
      <section className="reveal-init bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Exchange Trading Hours & System Status</h2>
              <p className="text-[11px] text-slate-500 font-mono">NSE & BSE Cash Equities Segment (IST)</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold font-mono border border-emerald-200 w-fit">
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 text-xs">
          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Regular Trading</span>
            <p className="font-mono font-bold text-slate-900 text-sm">09:15 AM – 03:30 PM</p>
            <span className="text-[10px] text-slate-500 block">Monday to Friday (Excl. Holidays)</span>
          </div>

          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pre-Open Session</span>
            <p className="font-mono font-bold text-slate-900 text-sm">09:00 AM – 09:08 AM</p>
            <span className="text-[10px] text-slate-500 block">Order collection & price discovery</span>
          </div>

          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Data Feed Latency</span>
            <p className="font-mono font-bold text-emerald-700 text-sm">&lt; 250ms Ticks</p>
            <span className="text-[10px] text-slate-500 block">Real-time live quotes</span>
          </div>
        </div>
      </section>

      {/* 3 & 4. 2-COLUMN DESKTOP SPLIT: FREQUENTLY ASKED QUESTIONS + DIRECT SUPPORT TICKET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Frequently Asked Questions */}
        <section className="reveal-init lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Answers to common inquiries regarding data sources, order dispatch, and accounts.</p>
          </div>

          <div className="space-y-2.5">
            {faqs.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div 
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isExpanded ? -1 : idx)}
                    className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-900 hover:text-slate-700 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-50 bg-slate-50/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Direct Contact / Ticket Form */}
        <section className="reveal-init lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Submit a Support Request</h2>
            <p className="text-xs text-slate-500">
              Have a question about a stock report, broker integration, or bug? Send us a ticket.
            </p>
          </div>

          {submitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Support Ticket Created Successfully</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Your request has been logged under ticket reference <strong className="font-mono text-slate-900 font-bold">{ticketId}</strong>. A response will be dispatched to <strong className="text-slate-900">{formData.email}</strong> within 24 business hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', category: 'Zerodha Kite Gateway', message: '' });
                }}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 underline cursor-pointer"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block text-xs">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 block text-xs">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-xs">Issue Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="Zerodha Kite Gateway">Zerodha Kite Gateway / Demat Orders</option>
                  <option value="Financial Data Discrepancy">Financial Statements / Data Discrepancy</option>
                  <option value="Virtual Demo Paper Trading Account">Virtual Demo Paper Trading Account</option>
                  <option value="Feature Request">Feature Request / Stock Addition</option>
                  <option value="Other">Other Technical Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block text-xs">Message Details</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe the issue or feedback in detail..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 mr-2" />
                Submit Ticket
              </button>
            </form>
          )}
        </section>

      </div>

      {/* 5. DIRECT EMAIL & CHANNELS */}
      <section className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-800 block">Direct Email Support</span>
            <span className="text-[11px] text-slate-500">support@profitsheets.com • Responds Mon–Fri</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono text-center sm:text-right">
          ProfitSheets Support Desk • Bangalore, India
        </div>
      </section>

    </div>
  );
}
