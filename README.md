# ProfitSheets - Investment Made Simple 📈

Full-stack production-grade stock market analytics, live news, and 1-click trading web application with isolated **frontend** and **backend** architectures.

---

## 📁 Repository Structure

```text
profitsheets/
├── backend/
│   ├── data/                 # Data persistence
│   ├── .env                  # Port, JWT secret, Finnhub key, Kite API key, MongoDB URI
│   ├── index.js              # Express API & SPA server
│   ├── mongo.js              # MongoDB Mongoose layer (User, Order, Setting models)
│   ├── yahooData.js          # 100% Genuine live real-time stock & candle data engine
│   └── package.json          # Backend dependencies (express, mongoose, axios, etc.)
│
├── frontend/
│   ├── src/                  # React 18 application
│   │   ├── components/       # Navbar, StockCard, StockDetailModal, AuthModal, KiteSettingsModal
│   │   ├── context/          # AuthContext, KiteContext
│   │   └── pages/            # MarketsPage, NewsPage, WatchlistPage, OrdersPage
│   ├── index.html            # Vite entry point with Zerodha Kite Publisher script
│   ├── vite.config.js        # Vite config with API proxy to port 5000
│   ├── tailwind.config.js    # ProfitSheets color tokens
│   └── package.json          # Frontend dependencies (react, lucide-react, etc.)
│
└── package.json              # Monorepo root scripts
```

---

## 🚀 Running the Project

### Option A: Run Backend Server (serves full app + API on port 5000)
```bash
cd backend
npm start
```
Open **`http://localhost:5000`** in your browser.

### Option B: Run in Development Mode (Vite Hot-Reload on port 3000)
Terminal 1:
```bash
cd backend
npm start
```

Terminal 2:
```bash
cd frontend
npm run dev
```
Open **`http://localhost:3000`** in your browser.
