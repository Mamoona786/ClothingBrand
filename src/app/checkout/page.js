"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import styles from "../page.module.css";
import checkoutCss from "./page.module.css";
import HeaderWithCounts from "../../components/Cart/HeaderWithCounts";
import WishlistHeading from "@/components/Wishlist/Heading";
import Link from "next/link";
import { useRouter } from "next/navigation";  // <-- NEW

const CART_KEY = "cart";
const ORDERS_KEY = "orders";
const CHECKOUT_FORM_KEY = "checkout_form";   // <-- NEW
const CHECKOUT_PROMO_KEY = "checkout_promo"; // <-- NEW

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const writeArray = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const asNumber = (p) =>
  typeof p === "number" ? p : parseFloat(String(p || "0").replace(/[^\d.]/g, "")) || 0;

/** Round to whole rupees (same as cart) */
const toPKRInt = (p) => Math.round(asNumber(p));

/** Format as "Rs. 4,000" (same as cart) */
const formatPKR = (n) =>
  `Rs. ${Number(n).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

/** Robust per-item price extractor (same as cart) */
const getUnitPrice = (it) => {
  // ← Prefer normalized price if present
  if (it?.price_num && Number.isFinite(+it.price_num)) return Math.round(+it.price_num);
  if (it?.pricePKR && Number.isFinite(+it.pricePKR))   return Math.round(+it.pricePKR);
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
  const m = text.match(/(?:Rs\.?|PKR|₨)\s*([0-9][0-9,\.]*)/i);
  if (m) return toPKRInt(m[1]);

  return 0;
};


export default function CheckoutPage() {
  const router = useRouter(); // <-- NEW

  const [cart, setCart] = useState([]);
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal: "",
    country: "",
    payment: "cod",
  });
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const cur = readArray(CART_KEY);
  // Defensive: ensure every item has a numeric price_num locally too
  const normalized = cur.map((it) => {
    const unit = getUnitPrice(it);
    return { ...it, price_num: unit };
  });
  setCart(normalized);
  }, []);

  const subtotal = useMemo(
   () => cart.reduce((sum, it) =>
        sum + (it.price_num ?? getUnitPrice(it)) * (it.qty || 1), 0),
   [cart]
 );

  const shipping = useMemo(() => (subtotal > 5000 ? 0 : (cart.length ? 250 : 0)), [subtotal, cart.length]);
  const discount = promoApplied?.amount || 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (code === "SAVE10") {
      const amount = Math.min(0.1 * subtotal, 1000);
      setPromoApplied({ code, amount });
    } else if (code === "FREESHIP") {
      setPromoApplied({ code, amount: shipping });
    } else {
      setPromoApplied(null);
      alert("Invalid promo code");
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.address.trim()) e.address = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.postal.trim()) e.postal = "Required";
    if (!form.country.trim()) e.country = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // NEW: proceed to payment (save shipping details + promo, then navigate)
  const proceedToPayment = useCallback(() => {
    if (!cart.length) { alert("Your cart is empty."); return; }
    if (!validate()) return;

    localStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(form));
    if (promoApplied) {
      localStorage.setItem(CHECKOUT_PROMO_KEY, JSON.stringify(promoApplied));
    } else {
      localStorage.removeItem(CHECKOUT_PROMO_KEY);
    }
    router.push("/payment");
  }, [cart, form, promoApplied, router]);

  if (success) {
    // (This branch will rarely trigger now; success is handled in /payment.)
    return (
      <>
        <HeaderWithCounts />
        <section className={styles.categoryProducts} style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2>Order Confirmed 🎉</h2>
          <p>Order ID: <strong>{success.id}</strong></p>
          <p>Total Paid: <strong>{success.amounts.total.toFixed(2)}</strong></p>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <Link href="/" className={styles.primaryBtn || ""} style={{ background: "#111", color: "#fff", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
              Continue Shopping
            </Link>
            <Link href="/cart" className={styles.secondaryBtn || ""} style={{ background: "#f5f5f5", padding: "10px 14px", borderRadius: 10, textDecoration: "none", color: "#333" }}>
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

      {/* Stepper (Step 1 active) */}
      <section className={checkoutCss.wishlistContainer} aria-label="Checkout progress">
        <div className={checkoutCss.progressBar}>
          <div className={checkoutCss.progressTrack}>
            <div className={checkoutCss.progressFill} />
          </div>
          <ol className={checkoutCss.progressList}>
            <li className={`${checkoutCss.step} ${checkoutCss.active}`} aria-current="step">
              <span className={checkoutCss.stepDot}>1</span>
              <span className={checkoutCss.stepLabel}>Checkout</span>
            </li>
            <li className={checkoutCss.step}>
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

      {/* Same heading as cart */}
      <section className={checkoutCss.wishlistContainer}>
        <WishlistHeading title="Checkout" count={cart.length} continueHref="/" />
      </section>

      {/* Content */}
      <section className={styles.categoryProducts} style={{ maxWidth: 1100, margin: "0 auto" }}>
        {cart.length === 0 ? (
          <div style={{ padding: "12px 0" }}>
            <p>Your cart is empty.</p>
            <Link href="/cart" className={styles.primaryBtn || ""} style={{ background: "#111", color: "#fff", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
              Back to Cart
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 16 }}>
            {/* Left: shipping form (payment block removed) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ border: "1px solid #e8e8e8", borderRadius: 12, background: "#fff", padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>Shipping details</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className={checkoutCss.label}>Full name</label>
                    <input className={checkoutCss.input} name="fullName" value={form.fullName} onChange={onChange} />
                    {errors.fullName && <small style={{ color: "#a00" }}>{errors.fullName}</small>}
                  </div>
                  <div>
                    <label className={checkoutCss.label}>Email</label>
                    <input className={checkoutCss.input} name="email" value={form.email} onChange={onChange} />
                    {errors.email && <small style={{ color: "#a00" }}>{errors.email}</small>}
                  </div>
                  <div>
                    <label className={checkoutCss.label}>Phone (optional)</label>
                    <input className={checkoutCss.input} name="phone" value={form.phone} onChange={onChange} />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className={checkoutCss.label}>Address</label>
                    <input className={checkoutCss.input} name="address" value={form.address} onChange={onChange} />
                    {errors.address && <small style={{ color: "#a00" }}>{errors.address}</small>}
                  </div>
                  <div>
                    <label className={checkoutCss.label}>City</label>
                    <input className={checkoutCss.input} name="city" value={form.city} onChange={onChange} />
                    {errors.city && <small style={{ color: "#a00" }}>{errors.city}</small>}
                  </div>
                  <div>
                    <label className={checkoutCss.label}>Postal code</label>
                    <input className={checkoutCss.input} name="postal" value={form.postal} onChange={onChange} />
                    {errors.postal && <small style={{ color: "#a00" }}>{errors.postal}</small>}
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className={checkoutCss.label}>Country</label>
                    <input className={checkoutCss.input} name="country" value={form.country} onChange={onChange} />
                    {errors.country && <small style={{ color: "#a00" }}>{errors.country}</small>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: order summary */}
            <aside style={{ border: "1px solid #e8e8e8", borderRadius: 12, background: "#fff", padding: 16, height: "fit-content", position: "sticky", top: 16 }}>
              <h3 style={{ marginTop: 0 }}>Order summary</h3>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                {cart.map((it) => (
                  <li key={it.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 8, alignItems: "center" }}>
                    <img src={it.image} alt={it.title} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</div>
                      <div style={{ opacity: 0.8 }}>Qty: {it.qty || 1}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
   {formatPKR((it.price_num ?? getUnitPrice(it)) * (it.qty || 1))}
 </div>
                  </li>
                ))}
              </ul>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <input
                  placeholder="Promo code"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  className={checkoutCss.input}
                  style={{ flex: 1 }}
                />
                <button onClick={applyPromo} className={checkoutCss.secondaryBtn} style={{ borderRadius: 10, padding: "10px 14px" }}>
                  Apply
                </button>
              </div>
              {promoApplied && (
                <p style={{ marginTop: 6, fontSize: 13, color: "#0a7" }}>
                  Applied <strong>{promoApplied.code}</strong>: −{promoApplied.amount.toFixed(2)}
                </p>
              )}

              <hr style={{ margin: "12px 0", border: 0, borderTop: "1px solid #eee" }} />

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal</span><span>{formatPKR(subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shipping</span><span>{formatPKR(shipping)}</span>
              </div>
              {promoApplied?.amount > 0 && (
   <div style={{ display: "flex", justifyContent: "space-between", color: "#0a7" }}>
     <span>Discount</span><span>−{formatPKR(promoApplied.amount)}</span>
   </div>
 )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontWeight: 700 }}>
                <span>Total</span><span>{formatPKR(total)}</span>
              </div>

              {/* NEW: Proceed to Payment */}
              <button
                onClick={proceedToPayment}
                className={checkoutCss.primaryBtn}
                style={{ width: "100%", marginTop: 12 }}
              >
                Proceed to Payment
              </button>

            </aside>
          </div>
        )}
      </section>
    </>
  );
}
