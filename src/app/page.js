"use client";
import styles from "./page.module.css";
import HeaderWithCounts from "../components/Cart/HeaderWithCounts";
import HeroSection from "../components/Home/HeroSection";
import CategoryNavbar from "../components/Home/CategoryNavbar";
import Card from "../components/Home/Card";
import Footer from "../components/Home/Footer";
import DummyData from "../../public/data/DummyData";
import CategoryData from "../../public/data/CategoryData"; // for lookup when CategoryCards calls onToggleLike(id)
import { useState, useEffect, useMemo } from "react";
import CategoryCards from "../components/Home/CategoryCards";

/* ============ localStorage helpers ============ */
const WISHLIST_KEY = "wishlist";
const CART_KEY = "cart";

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const writeArray = (k, v) => localStorage.setItem(k, JSON.stringify(v));

/** onToggleLike: add/remove item in localStorage wishlist (and notify listeners) */
const onToggleLikeLS = (id, itemData) => {
  const list = readArray(WISHLIST_KEY);
  const exists = list.some((x) => String(x.id) === String(id));
  let next;
  if (exists) next = list.filter((x) => String(x.id) !== String(id));
  else next = [...list, { id, ...itemData }];
  writeArray(WISHLIST_KEY, next);
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: WISHLIST_KEY } }));
};

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleCards = 5;
  const slideInterval = 3000;

  // ❤️ favorites as a Set of product ids (mirrors localStorage for header badge & UI)
  const [favorites, setFavorites] = useState(() => new Set());

  // 🛒 cart as an array [{id, qty, image, title, price}]
  const [cart, setCart] = useState(() => []);

  // Duplicate data for smooth infinite scroll
  const extendedData = useMemo(() => [...DummyData, ...DummyData], []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentIndex((p) => p + 1), slideInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentIndex >= DummyData.length) {
      const t = setTimeout(() => setCurrentIndex(0), 500);
      return () => clearTimeout(t);
    }
  }, [currentIndex]);

  // ------ Sync favorites & cart from localStorage on mount, and listen for cross-page updates ------
  useEffect(() => {
    // initial
    const initialFavIds = readArray(WISHLIST_KEY).map((x) => x.id);
    setFavorites(new Set(initialFavIds));
    setCart(readArray(CART_KEY));

    // listener for both wishlist & cart updates
    const onStoreUpdate = (e) => {
      const key = e?.detail?.key;
      if (!key || key === WISHLIST_KEY) {
        const ids = readArray(WISHLIST_KEY).map((x) => x.id);
        setFavorites(new Set(ids));
      }
      if (!key || key === CART_KEY) {
        setCart(readArray(CART_KEY));
      }
    };
    window.addEventListener("store:update", onStoreUpdate);
    return () => window.removeEventListener("store:update", onStoreUpdate);
  }, []);

  // ===== Handlers =====

  // 🛒 Add to cart (updates LS + dispatches event so header badges update anywhere)
  // 🛒 Add to cart (LS is source of truth → prevents double increments)
const addToCart = (item) => {
  // read the freshest cart from LS
  const cur = readArray(CART_KEY);
  const idx = cur.findIndex((x) => String(x.id) === String(item.id));

  if (idx >= 0) {
    cur[idx] = { ...cur[idx], qty: (cur[idx].qty || 1) + 1 };
  } else {
    cur.push({
      id: item.id,
      image: item.image,
      title: item.title,
      price: item.price,
      qty: 1,
    });
  }

  // write once + broadcast
  writeArray(CART_KEY, cur);
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: CART_KEY } }));

  // mirror into local React state (keeps Header on this page in sync)
  setCart(cur);
};


  // Wrap LS toggle to also update local favorites Set for instant UI/header badge
  const toggleFavoriteAndSync = (id, itemData) => {
  const wasLiked = favorites.has(id); // capture current state

  // 1) Toggle in LS + event, and mirror into state
  onToggleLikeLS(id, itemData);
  setFavorites((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  // 2) If it was liked and user clicked again (un-heart), decrement cart by 1 if present
  if (wasLiked) {
    setCart((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      const idx = next.findIndex((x) => String(x.id) === String(id));
      if (idx >= 0) {
        const newQty = Math.max(0, (next[idx].qty || 1) - 1);
        if (newQty === 0) next.splice(idx, 1);
        else next[idx] = { ...next[idx], qty: newQty };
        writeArray(CART_KEY, next);
        window.dispatchEvent(new CustomEvent("store:update", { detail: { key: CART_KEY } }));
      }
      return next;
    });
  }
};

  // Helper: if CategoryCards calls us with only (id), look up item details here
  const lookupItemById = (id) => {
    // Prefer CategoryData; fallback to DummyData
    const all = [...CategoryData, ...DummyData];
    const found = all.find((x) => String(x.id) === String(id));
    if (found) {
      const { image, title, description, price } = found;
      return { image, title, description, price };
    }
    return undefined;
  };

  // Hand-off for CategoryCards (it calls onToggleLike(id) only)
  const onCategoryCardToggle = (id) => {
    const data = lookupItemById(id) || {};
    toggleFavoriteAndSync(id, data);
  };

  const favoritesCount = favorites.size;
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  return (
    <>
      <HeaderWithCounts favoritesCount={favoritesCount} cartCount={cartCount} />
      <HeroSection />
      <CategoryNavbar />

      {/* Product Showcase */}
      <section className={styles.products}>
        <h2>Featured Products</h2>

        <div className={styles.carouselWrapper}>
          <div
            className={styles.carouselInner}
            style={{
              transform: `translateX(-${currentIndex * (100 / visibleCards)}%)`,
            }}
          >
            {extendedData.map((item, index) => {
              const id = item.id ?? `featured-${index}`; // fallback if DummyData lacks id
              return (
                <div className={styles.carouselItem} key={`${id}-${index}`}>
                  <Card
                    id={id}
                    image={item.image}
                    title={item.title}
                    description={item.description}
                    price={item.price}
                    isLiked={favorites.has(id)}
                    // include item data so wishlist page has everything it needs
                    onToggleLike={(idArg) =>
                      toggleFavoriteAndSync(idArg, {
                        image: item.image,
                        title: item.title,
                        description: item.description,
                        price: item.price,
                      })
                    }
                    onAddToCart={addToCart}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CategoryCards
        favorites={favorites}
        onToggleLike={onCategoryCardToggle} // receives only (id); we look up details here
        onAddToCart={addToCart}
      />

      <Footer />
    </>
  );
}
