"use client";
import styles from "./page.module.css";
import { useEffect, useMemo, useState, useCallback } from "react";
import base from "../page.module.css";
import checkoutCss from "../checkout/page.module.css"; // reuse styles + stepper
import HeaderWithCounts from "../../components/Cart/HeaderWithCounts";
import WishlistHeading from "@/components/Wishlist/Heading";
import Link from "next/link";

const CART_KEY = "cart";
const ORDERS_KEY = "orders";
const CHECKOUT_FORM_KEY = "checkout_form";
const CHECKOUT_PROMO_KEY = "checkout_promo";

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const writeArray = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const readJSON = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; }
};

// ---- Price helpers (match Cart/Checkout) ----
const asNumber = (p) =>
  typeof p === "number" ? p : parseFloat(String(p || "0").replace(/[^\d.]/g, "")) || 0;

const toPKRInt = (p) => Math.round(asNumber(p));

const formatPKR = (n) =>
  `Rs. ${Number(n).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const getUnitPrice = (it) => {
  if (!it) return 0;

  // Prefer normalized values saved by Cart
  if (it?.price_num && Number.isFinite(+it.price_num)) return Math.round(+it.price_num);
  if (it?.pricePKR && Number.isFinite(+it.pricePKR))   return Math.round(+it.pricePKR);

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

  // 4) Fallback: parse from text
  const text = [
    it?.title, it?.name, it?.description, it?.subtitle, it?.caption, it?.priceText, it?.label
  ].filter(Boolean).join(" ");
  const m = text.match(/(?:Rs\.?|PKR|₨)\s*([0-9][0-9,\.]*)/i);
  if (m) return toPKRInt(m[1]);

  return 0;
};
// --------------------------------------------

export default function PaymentPage() {
  const [cart, setCart] = useState([]);
  const [form, setForm] = useState(null);
  const [promoApplied, setPromoApplied] = useState(null);
  const [method, setMethod] = useState("cod");
  const [success, setSuccess] = useState(null);

  // minimal card fields (demo only)
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  useEffect(() => {
    const cur = readArray(CART_KEY);
    // Normalize here too, so even legacy carts display correctly
    const normalized = cur.map((it) => ({
      ...it,
      qty: Math.max(1, parseInt(it.qty || 1, 10)),
      price_num: getUnitPrice(it),
    }));
    setCart(normalized);
    setForm(readJSON(CHECKOUT_FORM_KEY));
    setPromoApplied(readJSON(CHECKOUT_PROMO_KEY));
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, it) => sum + (it.price_num ?? getUnitPrice(it)) * (it.qty || 1), 0),
    [cart]
  );
  const shipping = useMemo(
    () => (subtotal > 5000 ? 0 : (cart.length ? 250 : 0)),
    [subtotal, cart.length]
  );
  const discount = promoApplied?.amount || 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const placeOrder = useCallback(() => {
  if (!cart.length) { alert("Your cart is empty."); return; }
  if (!form) {
    alert("Please complete shipping details first.");
    window.location.href = "/checkout";
    return;
  }
  if (method === "card") {
    if (!card.number.trim() || !card.name.trim() || !card.expiry.trim() || !card.cvv.trim()) {
      alert("Please fill card details.");
      return;
    }
  }

  const orders = readArray(ORDERS_KEY);
  const orderId = "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const order = {
    id: orderId,
    placedAt: new Date().toISOString(),
    items: cart,
    amounts: { subtotal, shipping, discount, total },
    customer: form,
    promo: promoApplied,
    paymentMethod: method,
    status: "PLACED",
  };

  // persist order + cleanup
  writeArray(ORDERS_KEY, [...orders, order]);
  writeArray(CART_KEY, []);
  localStorage.removeItem(CHECKOUT_FORM_KEY);
  localStorage.removeItem(CHECKOUT_PROMO_KEY);
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: CART_KEY } }));

  // navigate to confirmation page
  window.location.href = "/confirmation";
}, [cart, form, method, card, promoApplied, subtotal, shipping, discount, total]);


  if (success) {
    return (
      <>
        <HeaderWithCounts />
        <section className={base.categoryProducts} style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2>Order Confirmed 🎉</h2>
          <p>Order ID: <strong>{success.id}</strong></p>
          <p>Total Paid: <strong>{formatPKR(success.amounts.total)}</strong></p>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link href="/" className={base.primaryBtn || ""} style={{ background: "#111", color: "#fff", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
              Continue Shopping
            </Link>
            <Link href="/cart" className={base.secondaryBtn || ""} style={{ background: "#f5f5f5", padding: "10px 14px", borderRadius: 10, textDecoration: "none", color: "#333" }}>
              View Cart
            </Link>
          </div>
        </section>
      </>
    );

  }

  return (
    <>
      <HeaderWithCounts />

      {/* Stepper (Step 2 active) */}
      <section className={checkoutCss.wishlistContainer} aria-label="Checkout progress">
        <div className={checkoutCss.progressBar}>
          <div className={checkoutCss.progressTrack}>
            <div className={checkoutCss.progressFill} style={{ width: "66.66%" }} />
          </div>
          <ol className={checkoutCss.progressList}>
            <li className={checkoutCss.step}>
              <span className={checkoutCss.stepDot}>1</span>
              <span className={checkoutCss.stepLabel}>Checkout</span>
            </li>
            <li className={`${checkoutCss.step} ${checkoutCss.active}`} aria-current="step">
              <span className={checkoutCss.stepDot}>2</span>
              <span className={checkoutCss.stepLabel}>Payment Method</span>
            </li>
            <li className={checkoutCss.step}>
              <span className={checkoutCss.stepDot}>3</span>
              <span className={checkoutCss.stepLabel}>Confirmation</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Heading */}
      <section className={checkoutCss.wishlistContainer}>
        <WishlistHeading title="Payment Method" count={cart.length} continueHref="/checkout" />
      </section>

      {/* Content */}
      <section className={base.categoryProducts} style={{ maxWidth: 1100, margin: "0 auto" }}>
        {cart.length === 0 ? (
          <div style={{ padding: "12px 0" }}>
            <p>Your cart is empty.</p>
            <Link href="/cart" className={base.primaryBtn || ""} style={{ background: "#111", color: "#fff", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
              Back to Cart
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
  {/* Left column (payment options) */}
  <div className={styles.panel}>
    <h3 style={{ marginTop: 0 }}>Select payment</h3>

    <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
      <input
        type="radio"
        name="payment"
        checked={method === "cod"}
        onChange={() => setMethod("cod")}
      />
      Cash on Delivery
    </label>

    <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
      <input
        type="radio"
        name="payment"
        checked={method === "card"}
        onChange={() => setMethod("card")}
      />
      Card (demo)
    </label>

    {method === "card" && (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className={checkoutCss.label}>Card number</label>
          <input
            className={checkoutCss.input}
            value={card.number}
            onChange={(e) => setCard({ ...card, number: e.target.value })}
            placeholder="1234 5678 9012 3456"
          />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className={checkoutCss.label}>Name on card</label>
          <input
            className={checkoutCss.input}
            value={card.name}
            onChange={(e) => setCard({ ...card, name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className={checkoutCss.label}>Expiry</label>
          <input
            className={checkoutCss.input}
            value={card.expiry}
            onChange={(e) => setCard({ ...card, expiry: e.target.value })}
            placeholder="MM/YY"
          />
        </div>
        <div>
          <label className={checkoutCss.label}>CVV</label>
          <input
            className={checkoutCss.input}
            value={card.cvv}
            onChange={(e) => setCard({ ...card, cvv: e.target.value })}
            placeholder="123"
          />
        </div>
      </div>
    )}

    {form && (
      <p style={{ marginTop: 12, fontSize: 13, opacity: 0.75 }}>
        Shipping to <strong>{form.fullName}</strong>, {form.address}, {form.city}.
      </p>
    )}
  </div>

  {/* Right column (order summary) */}
  <aside className={`${styles.panel} ${styles.aside}`}>
    <h3 style={{ marginTop: 0 }}>Order summary</h3>

    <ul className={styles.summaryList}>
      {cart.map((it) => {
        const unit = it.price_num ?? getUnitPrice(it);
        const line = unit * (it.qty || 1);
        return (
          <li key={it.id} className={styles.summaryItem}>
            <img src={it.image} alt={it.title} className={styles.thumb} />
            <div style={{ minWidth: 0 }}>
              <div className={styles.itemTitle}>{it.title}</div>
              <div className={styles.itemQty}>Qty: {it.qty || 1}</div>
            </div>
            <div className={styles.amount}>{formatPKR(line)}</div>
          </li>
        );
      })}
    </ul>

    <hr style={{ margin: "12px 0", border: 0, borderTop: "1px solid #eee" }} />

    <div className={styles.rows}>
      <div className={styles.row}>
        <span>Subtotal</span>
        <span>{formatPKR(subtotal)}</span>
      </div>
      <div className={styles.row}>
        <span>Shipping</span>
        <span>{formatPKR(shipping)}</span>
      </div>
      {promoApplied?.amount > 0 && (
        <div className={`${styles.row} ${styles.discount}`}>
          <span>Discount</span>
          <span>−{formatPKR(promoApplied.amount)}</span>
        </div>
      )}
      <div className={`${styles.row} ${styles.total}`}>
        <span>Total</span>
        <span>{formatPKR(total)}</span>
      </div>
    </div>

    <button
      onClick={placeOrder}
      className={`${checkoutCss.primaryBtn} ${styles.payBtn}`}
    >
      Place Order
    </button>
  </aside>
</div>


        )}
      </section>
    </>
  );
}
