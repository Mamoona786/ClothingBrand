"use client";
import styles from "../../app/page.module.css";
import { FaHeart, FaShoppingCart, FaSearch } from "react-icons/fa";
import Link from "next/link";

export default function Header({ favoritesCount = 0, cartCount = 0 }) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <h1 className={styles.logo}>GARMENTS STORE</h1>

        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search garments..."
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>
            <FaSearch className={styles.searchIcon} />
          </button>
        </div>

        <div className={styles.icons}>
          <Link href="/wishlist" className={styles.iconLink} aria-label="Favorites">
            <FaHeart className={styles.icon} />
            <span className={styles.iconBadge}>{favoritesCount}</span>
          </Link>

          {/* ✅ Navigate to /cart */}
          <Link href="/cart" className={styles.iconLink} aria-label="Cart">
            <FaShoppingCart className={styles.icon} />
            <span className={styles.iconBadge}>{cartCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
