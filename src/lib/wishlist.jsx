import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const KEY = 'vanmod.web.wishlist.v1';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [set, setSet] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch {
      // abaikan (mode privat)
    }
  }, [set]);

  const toggle = useCallback((key) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <WishlistContext.Provider
      value={{ has: (key) => set.has(key), toggle, count: set.size, keys: [...set] }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist harus di dalam WishlistProvider');
  return ctx;
}
