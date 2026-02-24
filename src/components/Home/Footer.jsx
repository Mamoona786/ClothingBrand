"use client";
import styles from "../../app/page.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>&copy; 2025 Garments Store. All Rights Reserved.</p>
      <p>
        <a href="#">Facebook</a> | <a href="#">Instagram</a> |{" "}
        <a href="#">Twitter</a>
      </p>
    </footer>
  );
}
