import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { KiteProvider } from './context/KiteContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <KiteProvider>
          <App />
        </KiteProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
