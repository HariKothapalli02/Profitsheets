import React, { useState } from 'react';
import { X, Key, CheckCircle, ExternalLink, ShieldCheck, Zap, Copy, Check } from 'lucide-react';
import { useKite } from '../context/KiteContext';

export default function KiteSettingsModal() {
  const { kiteApiKey, isConfigured, isModalOpen, setIsModalOpen, saveKiteApiKey } = useKite();
  const [inputKey, setInputKey] = useState(kiteApiKey || '');
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  if (!isModalOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      await saveKiteApiKey(inputKey);
      setStatusMsg({ type: 'success', text: 'Kite Publisher API Key saved and activated successfully!' });
      setTimeout(() => {
        setIsModalOpen(false);
      }, 1200);
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to update key. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <div>
              <h3 className="text-lg font-black">Zerodha Kite Publisher Setup</h3>
              <p className="text-xs text-white/80">Connect your official Zerodha Kite API Key</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-violet-700">Official Publisher Integration:</span> When investors click <strong className="text-slate-900">Trade</strong>, ProfitSheets generates a Zerodha Basket Order and opens the official window to execute orders directly in their Zerodha Demat account.
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Zerodha Kite API Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter your Kite API key (e.g. pplopxdr29w7pa6u)"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Obtained from <a href="https://developers.kite.trade/" target="_blank" rel="noreferrer" className="text-violet-600 font-bold hover:underline">Zerodha Developer Console</a>.
              </p>
            </div>

            {/* Redirect URL Helper for Kite Developer Console */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Developer Console Redirect URL
              </label>
              <p className="text-[11px] text-slate-500 leading-normal">
                Paste this URL into your Zerodha Developer Console under <strong className="text-slate-800">Redirect URL</strong> so Zerodha returns to your app when orders are completed or cancelled:
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <code className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-[11px] font-mono text-indigo-700 truncate select-all">
                  {`${window.location.origin}/orders`}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/orders`);
                    setCopiedRedirect(true);
                    setTimeout(() => setCopiedRedirect(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1"
                >
                  {copiedRedirect ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {statusMsg && (
              <div className={`p-3 rounded-2xl text-xs font-semibold ${
                statusMsg.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {statusMsg.text}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setInputKey('pplopxdr29w7pa6u')}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors"
              >
                Use Default Key
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-violet-500/20 transition-all"
              >
                {loading ? 'Saving...' : 'Save & Activate Key'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
