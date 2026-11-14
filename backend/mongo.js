import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORIGINAL_DB_PATH = path.join(__dirname, 'data', 'database.json');
const FALLBACK_DB_PATH = process.env.VERCEL 
  ? path.join('/tmp', 'database.json') 
  : ORIGINAL_DB_PATH;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/profitsheets';

let isMongoConnected = false;
let isMongoConnecting = false;

// -------------------------------------------------------------
// MONGOOSE SCHEMAS
// -------------------------------------------------------------
const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 500000.00 },
  watchlist: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  symbol: { type: String, required: true, uppercase: true },
  action: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  exchange: { type: String, default: 'NSE' },
  orderType: { type: String, default: 'MARKET' },
  broker: { type: String, default: 'Zerodha Kite' },
  status: { type: String, default: 'EXECUTED' },
  timestamp: { type: Date, default: Date.now }
});

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed }
});

export const UserModel = mongoose.model('User', UserSchema);
export const OrderModel = mongoose.model('Order', OrderSchema);
export const SettingModel = mongoose.model('Setting', SettingSchema);

// Connect to MongoDB
export async function initMongoDB() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    isMongoConnected = true;
    return true;
  }
  if (isMongoConnecting) return;
  isMongoConnecting = true;

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2500 // Quick timeout if local mongod is not started
    });
    isMongoConnected = true;
    console.log('[MongoDB] Connected successfully to:', MONGODB_URI);
  } catch (err) {
    console.warn('[MongoDB] MongoDB server not detected at', MONGODB_URI, '- using resilient persistent fallback layer.');
    isMongoConnected = false;
  } finally {
    isMongoConnecting = false;
  }
}

// Resilient DAO that uses MongoDB if connected, or Local DB
export const mongoDao = {
  isConnected: () => isMongoConnected,

  // Users
  findUserByEmail: async (email) => {
    if (isMongoConnected) {
      return await UserModel.findOne({ email: email.toLowerCase() });
    }
    const data = readLocal();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById: async (id) => {
    if (isMongoConnected) {
      return await UserModel.findOne({ id });
    }
    const data = readLocal();
    return data.users.find(u => u.id === id) || null;
  },

  createUser: async (userObj) => {
    if (isMongoConnected) {
      const u = new UserModel(userObj);
      return await u.save();
    }
    const data = readLocal();
    data.users.push(userObj);
    data.watchlists[userObj.id] = userObj.watchlist || ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'AAPL'];
    writeLocal(data);
    return userObj;
  },

  updateUserBalance: async (userId, newBalance) => {
    if (isMongoConnected) {
      return await UserModel.updateOne({ id: userId }, { $set: { walletBalance: newBalance } });
    }
    const data = readLocal();
    const u = data.users.find(usr => usr.id === userId);
    if (u) u.walletBalance = newBalance;
    writeLocal(data);
  },

  // Watchlist
  getWatchlist: async (userId) => {
    if (isMongoConnected) {
      const u = await UserModel.findOne({ id: userId });
      return u?.watchlist || ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'AAPL'];
    }
    const data = readLocal();
    return data.watchlists[userId] || ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'AAPL'];
  },

  updateWatchlist: async (userId, watchlist) => {
    if (isMongoConnected) {
      await UserModel.updateOne({ id: userId }, { $set: { watchlist } });
      return watchlist;
    }
    const data = readLocal();
    data.watchlists[userId] = watchlist;
    writeLocal(data);
    return watchlist;
  },

  // Orders
  getOrders: async (userId) => {
    if (isMongoConnected) {
      return await OrderModel.find({ userId }).sort({ timestamp: -1 });
    }
    const data = readLocal();
    return (data.trades || []).filter(t => t.userId === userId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  clearOrders: async (userId) => {
    if (isMongoConnected) {
      await OrderModel.deleteMany({ userId });
      return true;
    }
    const data = readLocal();
    data.trades = (data.trades || []).filter(t => t.userId !== userId);
    writeLocal(data);
    return true;
  },

  createOrder: async (orderObj) => {
    if (isMongoConnected) {
      const o = new OrderModel(orderObj);
      return await o.save();
    }
    const data = readLocal();
    data.trades.push(orderObj);
    writeLocal(data);
    return orderObj;
  },

  // Settings
  getSetting: async (key, defaultVal = '') => {
    if (isMongoConnected) {
      const s = await SettingModel.findOne({ key });
      return s ? s.value : defaultVal;
    }
    const data = readLocal();
    return data.settings?.[key] !== undefined ? data.settings[key] : defaultVal;
  },

  setSetting: async (key, value) => {
    if (isMongoConnected) {
      await SettingModel.findOneAndUpdate({ key }, { value }, { upsert: true });
      return value;
    }
    const data = readLocal();
    if (!data.settings) data.settings = {};
    data.settings[key] = value;
    writeLocal(data);
    return value;
  }
};

let memoryFallback = null;

function readLocal() {
  if (memoryFallback) return memoryFallback;
  try {
    if (fs.existsSync(FALLBACK_DB_PATH)) {
      memoryFallback = JSON.parse(fs.readFileSync(FALLBACK_DB_PATH, 'utf-8'));
      return memoryFallback;
    } else if (fs.existsSync(ORIGINAL_DB_PATH)) {
      memoryFallback = JSON.parse(fs.readFileSync(ORIGINAL_DB_PATH, 'utf-8'));
      return memoryFallback;
    }
  } catch (e) {}
  memoryFallback = { users: [], watchlists: {}, trades: [], settings: {} };
  return memoryFallback;
}

function writeLocal(d) {
  memoryFallback = d;
  try {
    const dir = path.dirname(FALLBACK_DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(d, null, 2));
  } catch (e) {
    // In serverless read-only environments, memoryFallback holds the data
    console.warn('writeLocal note (in-memory preserved):', e.message);
  }
}
