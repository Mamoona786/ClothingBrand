"use client";

import Link from "next/link";
import styles from "./Heading.module.css";

export default function WishlistHeading({
  title = "My Wishlist",
  count = 0,
  showCount = true,
  continueHref = "/",
}) {
  return (
    <header className={styles.wishlistHeader}>
      <div className={styles.titleWrap}>
        <h2 className={styles.wishlistTitle}>{title}</h2>

        {showCount && (
          <span
            className={styles.countChip}
            aria-label={`${count} items in wishlist`}
          >
            {count} {count === 1 ? "item" : "items"}
          </span>
        )}
      </div>

      <div className={styles.headerActions}>
        <Link href={continueHref} className={styles.linkButton}>
          ← Continue shopping
        </Link>
      </div>
    </header>
  );
}
