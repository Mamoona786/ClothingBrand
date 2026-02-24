"use client";

import { useEffect, useState } from "react";
import Header from "../Home/Header";

const WISHLIST_KEY = "wishlist";
const CART_KEY = "cart";

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};

export default function HeaderWithCounts() {
  const [favCount, setFavCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const sync = () => {
      const favIds = readArray(WISHLIST_KEY).map(x => x.id);
      setFavCount(new Set(favIds).size);

      const cart = readArray(CART_KEY);
      const totalQty = cart.reduce((sum, it) => sum + (it.qty || 1), 0);
      setCartCount(totalQty);
    };

    // initial + subscribe to cross-page updates
    sync();
    const onStoreUpdate = (e) => {
      const k = e?.detail?.key;
      if (!k || k === WISHLIST_KEY || k === CART_KEY) sync();
    };
    window.addEventListener("store:update", onStoreUpdate);
    return () => window.removeEventListener("store:update", onStoreUpdate);
  }, []);

  return <Header favoritesCount={favCount} cartCount={cartCount} />;
}
