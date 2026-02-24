"use client";
import Image from "next/image";
import styles from "../../app/page.module.css";
import { useState, useRef } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function CategoryNavbar() {
  const [activeCategory, setActiveCategory] = useState(null);
  const scrollContainerRef = useRef(null);

  const categories = [
    { name: "Shirts", image: "/categories/shirts.jpg" },
    { name: "Trousers", image: "/categories/trousers.jpg" },
    { name: "Hats", image: "/categories/hats.jpg" },
    { name: "Blazer Pants", image: "/categories/blazer-pants.jpg" },
    { name: "Shoes", image: "/categories/shoes.jpg" },
    { name: "Dresses", image: "/categories/dresses.jpg" },
    { name: "Accessories", image: "/categories/accessories.jpg" },
    { name: "Bags", image: "/categories/bags.jpg" },
    { name: "Business", image: "/categories/business.jpg" },
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.categorySection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Shop by Category</h2>
        <p className={styles.sectionSubtitle}>Discover our curated collections</p>
      </div>

      <div className={styles.categoryNavContainer}>
        <button
          className={styles.scrollButton}
          onClick={scrollLeft}
          aria-label="Scroll left"
        >
          <FaChevronLeft />
        </button>

        <div
          className={styles.categoryNavbar}
          ref={scrollContainerRef}
        >
          {categories.map((cat, index) => (
            <div
              key={index}
              className={`${styles.categoryItem} ${activeCategory === index ? styles.active : ''}`}
              onMouseEnter={() => setActiveCategory(index)}
              onMouseLeave={() => setActiveCategory(null)}
            >
              <div className={styles.imageContainer}>
                <div className={styles.circle}>
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={80}
                    height={80}
                    className={styles.categoryImage}
                  />
                </div>
                <div className={styles.overlay}></div>
              </div>
              <p className={styles.categoryName}>{cat.name}</p>
            </div>
          ))}
        </div>

        <button
          className={styles.scrollButton}
          onClick={scrollRight}
          aria-label="Scroll right"
        >
          <FaChevronRight />
        </button>
      </div>
    </section>
  );
}
