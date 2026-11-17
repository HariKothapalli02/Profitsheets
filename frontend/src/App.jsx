import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import KiteSettingsModal from './components/KiteSettingsModal';

import HomePage from './pages/HomePage';
import CompanyPage from './pages/CompanyPage';
import OrdersPage from './pages/OrdersPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import WatchlistPage from './pages/WatchlistPage';
import AboutPage from './pages/AboutPage';
import SupportPage from './pages/SupportPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans antialiased">
      {/* Authentic Screener.in Top Header */}
      <Navbar />

      {/* Main Screener Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Routes>
          {/* 1. Root Homepage */}
          <Route path="/" element={<HomePage />} />
          <Route path="/markets" element={<Navigate to="/" replace />} />

          {/* 2. Dedicated Separate Authentication Pages (Not Popups) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* 3. User Account & Virtual Demo Cash Management */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />

          {/* 4. Screener Company Report with Live Ticks & Buy/Sell Terminal */}
          <Route path="/company/:symbol" element={<CompanyPage />} />

          {/* 5. Trade Orders & Journal */}
          <Route path="/orders" element={<OrdersPage />} />

          {/* 6. Static Institutional Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Fallback to homepage */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Screener.in Clean Minimalist Footer */}
      <Footer />

      {/* Modals for Zerodha Kite Config */}
      <KiteSettingsModal />
    </div>
  );
}
