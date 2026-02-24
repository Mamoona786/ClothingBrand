"use client";

import HeaderWithCounts from "../../components/Cart/HeaderWithCounts";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { useState } from "react";
import base from "../page.module.css";
import styles from "./page.module.css";
import SafeImage from "@/components/QuickView/SafeImage";
import WishlistHeading from "@/components/Wishlist/Heading";

export default function QuickViewPage() {
  // 1) FIRST: get the search params
  const sp = useSearchParams();

  // 2) THEN: helper that reads from `sp`
  const safeParam = (key, fallback = "") => {
    const v = sp.get(key);
    return v && v !== "null" && v !== "undefined" ? v : fallback;
  };

  // 3) NOW it’s safe to call the helper
  const title = safeParam("title", "Sample Product");
  const price = safeParam("price", "PKR 3,999");
  const image = safeParam("image", "/placeholder.png");
  const desc  = safeParam(
    "desc",
    "A short, descriptive paragraph about the product. Customize this via the URL or wire it to your data."
  );
  const id = safeParam("id", "QV-001");

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const thumbnails = [image, image, image];

  const handleAddToCart = () => {
  // 1) read current cart
  const cart = readArray(CART_KEY);

  // 2) upsert the item with qty
  const idx = cart.findIndex((c) => String(c.id) === String(id));
  if (idx >= 0) {
    cart[idx].qty = (cart[idx].qty || 1) + quantity;
  } else {
    cart.push({
      id,
      title,
      price,
      image,
      description: desc,
      qty: quantity,
    });
  }

  // 3) save + notify header
  setCart(cart);

  // 4) local UI feedback
  setAddedToCart(true);
  setTimeout(() => setAddedToCart(false), 2000);
};

  const CART_KEY = "cart";

const readArray = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const setCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("store:update", { detail: { key: CART_KEY } }));
};


  return (
    <>
      {/* Header with live cart/wishlist counts */}
      <HeaderWithCounts />
        <div className={styles.container}>
          <WishlistHeading title="Quick View" showCount={false} continueHref="/" />
        </div>
      <main className={`${base.products} ${styles.container}`}>

        {/* Card styled like wishlist row (border, radius, subtle hover, spacing) */}
        <div className={`${base.product} ${styles.qvCard}`}>
          <div className={styles.left}>
            <div className={styles.imgWrap}>
              <SafeImage
                className={`${base.productImage} ${styles.qvImage}`}
                src={thumbnails[selectedImage]}
                alt={title}
                fill
                sizes="(max-width: 900px) 100vw, 50vw"
                priority
                fallback="/placeholder.png"
              />
              <span className={styles.badge}>In stock</span>
            </div>

            <div className={styles.thumbStrip}>
              {thumbnails.map((thumb, index) => (
                <button
                  key={index}
                  className={`${styles.thumb} ${selectedImage === index ? styles.thumbActive : ''}`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <SafeImage
                    src={thumb}
                    alt=""
                    fill
                    sizes="80px"
                    fallback="/placeholder.png"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={`${base.productInfo} ${styles.right}`}>
            <h1 className={`${base.productTitle} ${styles.title}`}>{title}</h1>

            <div className={styles.metaRow}>
              <span className={styles.rating}>★★★★★ <span className={styles.ratingCount}>(24)</span></span>
              <span className={styles.divider}>•</span>
              <span className={styles.sku}>SKU: QV-001</span>
              <span className={styles.divider}>•</span>
              <span className={styles.inStock}><FaCheck /> In Stock</span>
            </div>

            <p className={`${base.price} ${styles.priceBig}`}>{price}</p>

            <div className={styles.quantitySelector}>
              <label htmlFor="quantity">Quantity:</label>
              <div className={styles.quantityControls}>
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >-</button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>

            <p className={`${base.productDescription} ${styles.desc}`}>{desc}</p>

            <div className={styles.btnRow}>
              <button
                className={`${styles.primaryBtn} ${addedToCart ? styles.addedToCart : ''}`}
                onClick={handleAddToCart}
                aria-label={`Add ${title} to cart`}
              >
                {addedToCart ? (
                  <>
                    <FaCheck /> Added to Cart
                  </>
                ) : (
                  <>
                    <FaShoppingCart className={styles.icon} /> Add to Cart
                  </>
                )}
              </button>
              <button className={styles.secondaryBtn}>
                Buy Now
              </button>
            </div>


            <ul className={styles.perks} role="list">
              <li><FaCheck /> 7-day easy returns</li>
              <li><FaCheck /> Free shipping over PKR 5,000</li>
              <li><FaCheck /> Secure checkout</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
