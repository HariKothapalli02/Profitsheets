# ProfitSheets - Investment Made Simple 📈

Full-stack production-grade stock market analytics, Screener-grade fundamentals, BSE corporate announcements/concalls, live news, and 1-click Zerodha trading portal.

---

## ⚡ 1-Click Vercel Deployment (Frontend + Backend in Same Project)

ProfitSheets is pre-configured to deploy the **entire full-stack application (React 18 frontend + Node.js API backend) as a single unified project on Vercel**.

### Architecture on Vercel:
```text
profitsheets/
├── api/
│   └── index.js             # Vercel Serverless Function entry point (Express engine)
├── vercel.json              # Directs /api/* to Serverless Function & /* to Vite SPA CDN
├── frontend/
│   ├── src/                 # React 18, Tailwind CSS, Screener Charts & Tables
│   └── dist/                # Static asset output served directly by Vercel Edge CDN
├── backend/
│   ├── bseAnnouncements.js  # Free official BSE India Corporate Filings & Concalls
│   ├── financialStatements.js # Zero-cost audited 4-year P&L, Balance Sheet, Ratios
│   ├── yahooData.js         # Real-time exchange ticks & candlestick histories
│   └── mongo.js             # MongoDB Mongoose & resilient fallback layer
└── package.json             # Root npm workspace coordinating frontend & backend
```

---

### Deploying to Vercel in 2 Simple Steps:

#### Method 1: Via GitHub / GitLab / Bitbucket (Recommended)
1. Push this repository to GitHub.
2. In your [Vercel Dashboard](https://vercel.com/new), click **"Add New Project"** and import this repository.
3. Keep default settings:
   - **Framework Preset:** `Vite` (or `Other` — `vercel.json` automatically handles everything).
   - **Root Directory:** `./` (Leave as root).
   - **Build Command:** `npm run build` (or `cd frontend && npm install && npm run build`).
   - **Output Directory:** `frontend/dist`.
4. In **Environment Variables**, add:
   - `JWT_SECRET`: your secret key (e.g. `your_production_jwt_secret_key`)
   - `FINNHUB_API_KEY`: your Finnhub API key
   - `KITE_API_KEY`: your Zerodha Kite Publisher key
   - `ANGEL_API_KEY`: your Angel One SmartAPI key
   - `MONGODB_URI`: your MongoDB Atlas connection string (`mongodb+srv://<username>:<password>@cluster.mongodb.net/profitsheets?retryWrites=true&w=majority`)
5. Click **Deploy**. Vercel will build the frontend, deploy the serverless functions, and generate your live production URL (e.g., `https://your-profitsheets.vercel.app`).

#### Method 2: Via Vercel CLI
```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Deploy from the root directory
vercel

# 3. For production release
vercel --prod
```

---

## 💻 Local Development

### Option A: Complete Standalone Server (Port 5000)
```bash
node backend/index.js
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

### Option B: Concurrent Development Mode (Vite Hot-Reload on Port 3000)
```bash
npm run dev
```
Runs both the backend API and the frontend Vite dev server concurrently with auto-proxying.
