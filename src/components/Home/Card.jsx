"use client";
import styles from "../../app/page.module.css";
import { FaHeart, FaShoppingCart } from "react-icons/fa";
import { useState, useEffect } from "react";

export default function Card({
  id,
  isLiked,             // boolean (controlled by parent)
  onToggleLike,        // (id) => void
  onAddToCart,         // ({ id, image, title, price }) => void
  image,
  title,
  description,
  price,
}) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  // keep local UI in sync with parent control
  useEffect(() => {
    if (typeof isLiked === "boolean") setIsWishlisted(isLiked);
  }, [isLiked]);

  const handleWishlistClick = () => {
    // ✅ Optimistic UI: flip immediately so the heart turns red instantly
    setIsWishlisted((v) => !v);

    // Lift to parent so counts/localStorage stay correct
    if (typeof onToggleLike === "function" && id !== undefined) {
      onToggleLike(id);
    }
  };

  const handleAddToCart = () => {
    if (typeof onAddToCart === "function" && id !== undefined) {
      onAddToCart({ id, image, title, price });
    }
  };

  return (
    <div className={styles.product}>
      {/* Wishlist Icon */}
      <button
        type="button"
        className={`${styles.wishlistIcon} ${isWishlisted ? styles.wishlisted : ""}`}
        onClick={handleWishlistClick}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
        title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      >
        <FaHeart />
      </button>

      <div className={styles.imageContainer}>
        <img src={image} alt={title} className={styles.productImage} />
        <div className={styles.overlay}>
          <button className={styles.quickView}>Quick View</button>
        </div>
      </div>

      <div className={styles.productInfo}>
        <h3 className={styles.productTitle}>{title}</h3>
        <p className={styles.productDescription}>{description}</p>
        <p className={styles.price}>{price}</p>

        <button className={styles.addToCart} onClick={handleAddToCart}>
          <FaShoppingCart className={styles.cartIcon} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
