import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const KiteContext = createContext();

export function KiteProvider({ children }) {
  const [kiteApiKey, setKiteApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchKiteConfig();
  }, []);

  const fetchKiteConfig = async () => {
    try {
      const res = await axios.get('/api/config/kite');
      setKiteApiKey(res.data.kite_api_key || '');
      setIsConfigured(res.data.isConfigured || false);
    } catch (err) {
      console.warn('Could not fetch Kite config:', err.message);
    }
  };

  const saveKiteApiKey = async (newKey) => {
    try {
      const res = await axios.post('/api/config/kite', { kite_api_key: newKey });
      setKiteApiKey(res.data.kite_api_key);
      setIsConfigured(res.data.isConfigured);
      return res.data;
    } catch (err) {
      console.error('Failed to save Kite API Key:', err);
      throw err;
    }
  };

  // Function to execute order via Kite Publisher
  const executeKiteTrade = ({ tradingsymbol, exchange = 'NSE', transactionType = 'BUY', quantity = 1, price = 0 }) => {
    if (!isConfigured || !kiteApiKey) {
      setIsModalOpen(true);
      return { status: 'KEY_NEEDED' };
    }

    if (window.KiteConnect) {
      try {
        const kite = new window.KiteConnect(kiteApiKey);
        kite.add({
          exchange: exchange,
          tradingsymbol: tradingsymbol,
          quantity: Number(quantity),
          transaction_type: transactionType.toUpperCase(),
          order_type: 'MARKET'
        });
        kite.renderButton('#kite-trade-trigger-dummy');
        return { status: 'LAUNCHED' };
      } catch (e) {
        console.error('Kite invocation error:', e);
      }
    }
    return { status: 'SIMULATED' };
  };

  return (
    <KiteContext.Provider value={{
      kiteApiKey,
      isConfigured,
      isModalOpen,
      setIsModalOpen,
      saveKiteApiKey,
      executeKiteTrade
    }}>
      {children}
    </KiteContext.Provider>
  );
}

export function useKite() {
  return useContext(KiteContext);
}
