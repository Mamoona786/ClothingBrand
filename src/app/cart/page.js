"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import HeaderWithCounts from "../../components/Cart/HeaderWithCounts";
import WishlistHeading from "@/components/Wishlist/Heading";
import Link from "next/link";

const CART_KEY = "cart";

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const writeArray = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function getCart() { return readArray(CART_KEY); }
function setCartLS(items) {
  // Normalize price & qty before persisting so other pages can trust it
  const normalized = items.map((it) => {
    const unit = getUnitPrice(it);                 // ← your robust extractor
    const qty  = Math.max(1, parseInt(it.qty || 1, 10));
    return {
      ...it,
      qty,
      price_num: unit,      // stable numeric price (integer PKR)
      pricePKR: unit,       // optional alias some UIs already read
    };
  });
  writeArray(CART_KEY, normalized);
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: CART_KEY } }));
}

/** Parse any price string -> number (supports "$1,299", "Rs. 1,299.50", "1299") */
/** Parse any price string -> number (handles "Rs. 1,299", "PKR 1,299.50", "1299") */
const asNumber = (p) => {
  if (typeof p === "number" && Number.isFinite(p)) return p;
  const s = String(p ?? "");
  // Find the first numeric block like "1,234.56" or "3999"
  const m = s.match(/(\d[\d,]*\.?\d*)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(/,/g, ""));
};


/** Round to whole rupees */
const toPKRInt = (p) => Math.round(asNumber(p));

/** Format as "Rs. 4,000" (no decimals) */
const formatPKR = (n) =>
  `Rs. ${Number(n).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

/** Try multiple fields; fallback to extracting from title/desc if needed */
const getUnitPrice = (it) => {
  if (!it) return 0;

  const pick = (...vals) => {
    for (const v of vals) {
      const n = toPKRInt(v);
      if (n > 0) return n;
    }
    return 0;
  };

  // 1) Common top-level fields
  const direct = pick(
    it?.price, it?.unitPrice, it?.unit_price, it?.pricePKR, it?.price_pkr,
    it?.amount, it?.cost, it?.p,
    it?.priceValue, it?.price_value, it?.priceNumber, it?.price_num, it?.prize,
    it?.finalPrice, it?.discountedPrice, it?.salePrice, it?.originalPrice
  );
  if (direct) return direct;

  // 2) Common nested shapes
  const nested = pick(
    it?.price?.value, it?.price?.amount, it?.price?.raw, it?.price?.current, it?.price?.current?.value,
    it?.price?.min, it?.price?.max,
    it?.pricing?.price, it?.pricing?.value, it?.pricing?.amount,
    it?.meta?.price, it?.details?.price, it?.sale?.price,
    it?.variant?.price,
    it?.variants?.[0]?.price, it?.variants?.[0]?.price?.value, it?.variants?.[0]?.pricing?.price,
    it?.offers?.[0]?.price, it?.offers?.[0]?.price?.value,
    it?.prices?.[0], it?.prices?.[0]?.value, it?.prices?.[0]?.amount
  );
  if (nested) return nested;

  // 3) Arrays of prices
  if (Array.isArray(it?.prices)) {
    for (const p of it.prices) {
      const n = pick(p?.value, p?.amount, p);
      if (n) return n;
    }
  }

  // 4) Last resort: parse from text fields
  const text = [
    it?.title, it?.name, it?.description, it?.subtitle, it?.caption, it?.priceText, it?.label
  ].filter(Boolean).join(" ");
  const m = text.match(/(?:Rs\.?|PKR)\s*([0-9][0-9,\.]*)/i);
  if (m) return toPKRInt(m[1]);

  return 0;
};

export default function CartPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const cur = getCart();
  // If any item is missing a numeric price, normalize the whole cart
  if (cur.some((it) => !Number.isFinite(parseInt(it?.price_num)))) {
    setCartLS(cur);     // setCartLS will normalize & re-save
    setItems(getCart()); // then read back the normalized version
 } else {
    setItems(cur);
  }
    const onStoreUpdate = (e) => {
      if (!e?.detail?.key || e.detail.key === CART_KEY) {
        setItems(getCart());
      }
    };
    window.addEventListener("store:update", onStoreUpdate);
    return () => window.removeEventListener("store:update", onStoreUpdate);
  }, []);

  const inc = useCallback((id) => {
    const next = getCart().map((it) =>
      String(it.id) === String(id) ? { ...it, qty: (it.qty || 1) + 1 } : it
    );
    setCartLS(next);
    setItems(next);
  }, []);

  const dec = useCallback((id) => {
    const cur = getCart();
    const idx = cur.findIndex((it) => String(it.id) === String(id));
    if (idx === -1) return;

    const currQty = cur[idx].qty || 1;
    let next;
    if (currQty <= 1) {
      next = cur.filter((_, i) => i !== idx);
    } else {
      next = cur.map((it) =>
        String(it.id) === String(id) ? { ...it, qty: currQty - 1 } : it
      );
    }
    setCartLS(next);
    setItems(next);
  }, []);

  const removeItem = useCallback((id) => {
    const next = getCart().filter((it) => String(it.id) !== String(id));
    setCartLS(next);
    setItems(next);
  }, []);

  const clearCart = useCallback(() => {
    setCartLS([]);
    setItems([]);
  }, []);

  /** ✅ Use integer prices for math + display */
  const subtotal = items.reduce(
    (sum, it) => sum + getUnitPrice(it) * (it.qty || 1),
    0
  );

  return (
    <>
      <HeaderWithCounts />

      <section className={styles.wishlistContainer}>
        <WishlistHeading title="My Cart" count={items.length} continueHref="/" />

        {items.length > 0 ? (
          <>
            <ul className={styles.list} role="list">
              {items.map((item) => (
                <li key={item.id} className={styles.row}>
                  <div className={styles.imageContainer}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className={styles.thumb}
                      onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                    />
                  </div>

                  <div className={styles.meta}>
                    <h3 className={styles.title} title={item.title}>{item.title}</h3>
                    <p className={styles.desc} title={item.description}>{item.description}</p>
                  </div>

                  <div className={styles.right}>
                    <div className={styles.priceTag}>
  {formatPKR(getUnitPrice(item) * (item.qty || 1))}
</div>


                    <div className={styles.actionBar}>
                      <div className={styles.qtyGroup} aria-label="Quantity controls">
                        <button
                          onClick={() => dec(item.id)}
                          aria-label={(item.qty || 1) <= 1 ? "Remove item" : "Decrease quantity"}
                          title={(item.qty || 1) <= 1 ? "Remove item" : "Decrease quantity"}
                          className={styles.qtyBtn}
                        >
                          −
                        </button>
                        <span className={styles.qtyValue}>{item.qty || 1}</span>
                        <button
                          onClick={() => inc(item.id)}
                          aria-label="Increase quantity"
                          title="Increase quantity"
                          className={styles.qtyBtn}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                        title="Remove"
                        className={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className={styles.cartSummary}>
              <div className={styles.cartSummaryRow}>
                <span className={styles.title}>Subtotal</span>
                <strong>{formatPKR(subtotal)}</strong>
              </div>
              <p className={styles.cartNote}>Taxes and shipping calculated at checkout.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Link href="/" className={styles.secondaryBtn}>Continue shopping</Link>
                <Link href="/checkout" className={styles.primaryBtn}>Proceed to Checkout</Link>
              </div>
            </div>
          </>
        ) : (
          <div className={styles.emptyState} role="status" aria-live="polite">
            <div className={styles.emptyHeart}>🛒</div>
            <h3>Your cart is empty</h3>
            <p>Add items to see them here</p>
            <Link href="/" className={styles.primaryBtn}>Browse products</Link>
          </div>
        )}
      </section>
    </>
  );
}
