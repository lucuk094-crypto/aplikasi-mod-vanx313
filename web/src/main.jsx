import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { StoreProvider } from './lib/store.jsx';
import { WishlistProvider } from './lib/wishlist.jsx';
import './styles.css';
import { initFx } from './lib/fx.js';

initFx();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <WishlistProvider>
            <App />
          </WishlistProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
