import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Clock, TrendingUp, Sparkles, Filter, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchMarketNews();
  }, []);

  const fetchMarketNews = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/news/market');
      setNews(res.data || []);
    } catch (err) {
      console.warn('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    if (filter === 'ALL') return true;
    return item.category?.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-violet-50/90 via-purple-50/40 to-white rounded-[2.5rem] p-6 sm:p-8 border border-purple-100/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-100/80 text-violet-700 text-xs font-bold mb-2">
            <Newspaper className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">GLOBAL & INDIAN FINANCIAL PULSE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Live Market News & Corporate Filings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time corporate earnings, RBI/FED rate decisions, mergers, and financial headlines.
          </p>
        </div>

        <button
          onClick={fetchMarketNews}
          className="self-start md:self-auto px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 shadow-sm transition-all flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh News</span>
        </button>
      </div>

      {/* News Feed Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-5 h-72 animate-pulse space-y-3">
              <div className="h-36 bg-slate-100 rounded-2xl"></div>
              <div className="h-4 bg-slate-200 rounded-full w-1/3"></div>
              <div className="h-5 bg-slate-200 rounded-full w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded-full w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center text-slate-500 shadow-sm">
          <p className="text-base font-bold text-slate-900">No news articles found right now.</p>
          <p className="text-xs text-slate-400 mt-1">Check back in a few moments for new ticker releases.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map((item, idx) => {
            const safeUrl = (item.url && !item.url.includes('news.google.com'))
              ? item.url
              : `https://www.google.com/search?q=${encodeURIComponent((item.headline || item.title || '') + ' ' + (item.source || ''))}`;
            return (
              <a
                key={idx}
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-[2rem] border border-slate-100/90 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_32px_-8px_rgba(124,58,237,0.12)] hover:border-violet-200 transition-all duration-300 flex flex-col justify-between"
              >
              <div>
                {/* News Image */}
                <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.headline}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-violet-100 to-indigo-50 flex items-center justify-center">
                      <Newspaper className="w-10 h-10 text-violet-300" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/40 shadow-sm">
                    {item.source || 'Newswire'}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-2 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(item.datetime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className="uppercase text-violet-600 font-bold">{item.category || 'General'}</span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
                    {item.headline}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-violet-600">
                <span>Read Full Coverage</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
