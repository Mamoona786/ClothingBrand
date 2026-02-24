"use client";

import WishlistHeading from "@/components/Wishlist/Heading";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { FaHeart, FaShoppingCart, FaEye, FaTrash } from "react-icons/fa";
import HeaderWithCounts from "../../components/Cart/HeaderWithCounts";

const WISHLIST_KEY = "wishlist";
const CART_KEY = "cart";

/* helpers */
const readArray = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k) || "[]");
  } catch {
    return [];
  }
};
const writeArray = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function getWishlist() {
  return readArray(WISHLIST_KEY);
}
function setWishlist(items) {
  writeArray(WISHLIST_KEY, items);
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: WISHLIST_KEY } }));
}

function getCart() {
  return readArray(CART_KEY);
}
function setCart(items) {
  writeArray(CART_KEY, items);
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: CART_KEY } }));
}

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    setItems(getWishlist());
    const onStoreUpdate = (e) => {
      if (!e?.detail?.key || e.detail.key === WISHLIST_KEY) {
        setItems(getWishlist());
      }
    };
    window.addEventListener("store:update", onStoreUpdate);
    return () => window.removeEventListener("store:update", onStoreUpdate);
  }, []);

  // Un-heart: remove from wishlist AND decrement cart qty by 1 (remove if 0)
  const handleToggleLike = useCallback((id) => {
    const nextW = getWishlist().filter((x) => String(x.id) !== String(id));
    setWishlist(nextW);
    setItems(nextW);

    const cart = getCart();
    const idx = cart.findIndex((c) => String(c.id) === String(id));
    if (idx >= 0) {
      const newQty = Math.max(0, (cart[idx].qty || 1) - 1);
      if (newQty === 0) cart.splice(idx, 1);
      else cart[idx] = { ...cart[idx], qty: newQty };
      setCart(cart);
    }
  }, []);

  const handleAddToCart = useCallback((item) => {
    const cart = getCart();
    const found = cart.find((c) => String(c.id) === String(item.id));
    if (found) found.qty = (found.qty || 1) + 1;
    else cart.push({ ...item, qty: 1 });
    setCart(cart);

    // Show feedback animation
    setAddedItems(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [item.id]: false }));
    }, 2000);
  }, []);

  return (
    <>
      {/* Header with live counts */}
      <HeaderWithCounts />

      <section className={styles.wishlistContainer}>

        <WishlistHeading count={items.length} continueHref="/" />

        {items.length > 0 ? (
          <ul className={styles.list} role="list">
            {items.map((item) => (
              <li key={item.id} className={styles.row}>
                <div className={styles.imageContainer}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className={styles.thumb}
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                  <span className={styles.stockBadge}>In Stock</span>
                </div>

                <div className={styles.meta}>
                  <h3 className={styles.title} title={item.title}>
                    {item.title}
                  </h3>
                  <p className={styles.desc} title={item.description}>
                    {item.description}
                  </p>
                  <div className={styles.rating}>
                    ★★★★★ <span className={styles.ratingCount}>(12)</span>
                  </div>
                </div>

                <div className={styles.right}>
                  <div className={styles.priceTag}>{item.price}</div>

                  <div className={styles.actionBar}>
                    <button
                      className={`${styles.addBtn} ${addedItems[item.id] ? styles.addedToCart : ''}`}
                      onClick={() => handleAddToCart(item)}
                      aria-label={`Add ${item.title} to cart`}
                    >
                      {addedItems[item.id] ? (
                        <>
                          <FaShoppingCart className={styles.icon} /> Added To Cart
                        </>
                      ) : (
                        <>
                          <FaShoppingCart className={styles.icon} /> Add to Cart
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLike(item.id)}
                      aria-label="Remove from wishlist"
                      title="Remove from wishlist"
                      className={styles.removeBtn}
                    >
                      <FaTrash className={styles.icon} />
                    </button>
                  </div>

                  {/* Quick view link */}
                  <div className={styles.quickRow}>
                    <Link
  href={{
    pathname: "/quickview",
    query: {
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,                 // no manual encodeURIComponent needed
      desc: item.description ?? ""
    }
  }}
  className={styles.quickLink}
>
  <FaEye className={styles.eyeIcon} /> Quick View
</Link>

                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptyState} role="status" aria-live="polite">
            <div className={styles.emptyHeart}>
              <FaHeart />
            </div>
            <h3>Your wishlist is empty</h3>
            <p>Save your favorite items here for easy access later</p>
            <Link href="/" className={styles.primaryBtn}>
              Start Shopping
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
