"use client";
import { useState, useEffect } from "react";
import { FaTruck, FaLock, FaStar, FaArrowRight } from "react-icons/fa";
import styles from "../../app/page.module.css";

export default function HeroSection() {
  const images = ["/banner1.png", "/banner2.png", "/banner3.png"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className={styles.hero}>
      {/* Background image with overlay */}
      <div
        className={`${styles.heroBackground} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}
        style={{ backgroundImage: `url(${images[currentIndex]})` }}
      ></div>

      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>
            Dress to <span className={styles.highlight}>Express</span>
          </h2>

          <p className={styles.heroSubtitle}>
            Quality fabrics, modern cuts, and effortless elegance.
          </p>

          <button className={styles.heroButton}>
            Shop Now <FaArrowRight className={styles.buttonIcon} />
          </button>

          {/* Extra selling points */}
          <div className={styles.sellingPoints}>
            <div className={styles.point}>
              <div className={styles.pointIcon}>
                <FaTruck />
              </div>
              <div className={styles.pointText}>
                <h4>Free Shipping</h4>
                <p>On orders over $50</p>
              </div>
            </div>

            <div className={styles.point}>
              <div className={styles.pointIcon}>
                <FaLock />
              </div>
              <div className={styles.pointText}>
                <h4>Secure Payment</h4>
                <p>256-bit encryption</p>
              </div>
            </div>

            <div className={styles.point}>
              <div className={styles.pointIcon}>
                <FaStar />
              </div>
              <div className={styles.pointText}>
                <h4>Premium Quality</h4>
                <p>Guaranteed satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators */}
      <div className={styles.indicators}>
        {images.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${currentIndex === index ? styles.active : ""}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
