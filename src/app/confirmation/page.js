// src/app/confirmation/page.js
"use client";

import { useEffect, useState } from "react";
import base from "../page.module.css";             // container styles you already use
import checkoutCss from "../checkout/page.module.css"; // stepper styles
import HeaderWithCounts from "../../components/Cart/HeaderWithCounts";
import WishlistHeading from "@/components/Wishlist/Heading";
import Link from "next/link";

const ORDERS_KEY = "orders";

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};

export default function ConfirmationPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const orders = readArray(ORDERS_KEY);
    // grab the last placed order (what your payment page writes)
    setOrder(orders.length ? orders[orders.length - 1] : null);
  }, []);

  const orderId =
    order?.id || ("ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase());

  // tweak this to whatever "maximum days" you want to show
  const MAX_DELIVERY_DAYS = 3;

  return (
    <>
      <HeaderWithCounts />

      {/* Stepper (Step 3 active) */}
      <section className={checkoutCss.wishlistContainer} aria-label="Checkout progress">
        <div className={checkoutCss.progressBar}>
          <div className={checkoutCss.progressTrack}>
            {/* 100% fill because we're on step 3 */}
            <div className={checkoutCss.progressFill} style={{ width: "100%" }} />
          </div>
          <ol className={checkoutCss.progressList}>
            <li className={checkoutCss.step}>
              <span className={checkoutCss.stepDot}>1</span>
              <span className={checkoutCss.stepLabel}>Checkout</span>
            </li>
            <li className={checkoutCss.step}>
              <span className={checkoutCss.stepDot}>2</span>
              <span className={checkoutCss.stepLabel}>Payment Method</span>
            </li>
            <li className={`${checkoutCss.step} ${checkoutCss.active}`} aria-current="step">
              <span className={checkoutCss.stepDot}>3</span>
              <span className={checkoutCss.stepLabel}>Confirmation</span>
            </li>
          </ol>
        </div>
      </section>

      {/* Heading */}
      <section className={checkoutCss.wishlistContainer}>
        <WishlistHeading title="Order Confirmation" count={order?.items?.length || 0} continueHref="/" />
      </section>

      {/* Content */}
      <section className={base.categoryProducts} style={{ maxWidth: 900, margin: "0 auto" }}>
        <div
          style={{
            border: "1px solid #e8e8e8",
            borderRadius: 12,
            background: "var(--white)",
            padding: 24,
            textAlign: "center",
            boxShadow: `0 6px 20px var(--shadow)`,
          }}
        >
          {/* Tick in themed circle */}
          <div
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 12px",
              borderRadius: "50%",
              background: "var(--primary)",
              display: "grid",
              placeItems: "center",
              color: "var(--white)",
              boxShadow: `0 6px 20px var(--shadow)`,
            }}
            aria-hidden="true"
          >
            <span style={{ fontSize: 48, lineHeight: 1 }}>✓</span>
          </div>

          <h2 style={{ marginBottom: 6, color: "var(--primary-dark)" }}>Thank you!</h2>
          <p style={{ color: "var(--text)" }}>
            Your order has been placed successfully.
          </p>

          {/* Order ID */}
          <p style={{ marginTop: 8, color: "var(--text-light)" }}>
            Order ID:&nbsp;<strong style={{ color: "var(--text)" }}>{orderId}</strong>
          </p>

          {/* Delivery image */}
          <img
            src="/delivery-boy-logo.png"
            alt="Delivery in progress"
            style={{
              display: "block",
              width: "min(420px, 80%)",
              height: "auto",
              margin: "16px auto 8px",
              borderRadius: 12,
              boxShadow: `0 8px 24px var(--shadow)`,
              background: "var(--background)",
            }}
            onError={(e) => {
              // fallback in case the image is missing
              e.currentTarget.style.display = "none";
            }}
          />

          {/* Delivery time line */}
          <p style={{ marginTop: 8, fontSize: 16, color: "var(--text)" }}>
            Maximum delivery time:{" "}
            <strong style={{ color: "var(--primary-dark)" }}>
              {MAX_DELIVERY_DAYS} {MAX_DELIVERY_DAYS === 1 ? "day" : "days"}
            </strong>
          </p>

          {/* Actions */}
          <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/"
              className={base.primaryBtn || ""}
              style={{
                background: "var(--primary-dark)",
                color: "var(--white)",
                padding: "10px 14px",
                borderRadius: 10,
                textDecoration: "none",
              }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
