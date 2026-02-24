"use client";
import styles from "../../app/page.module.css";
import Card from "./Card";
import CategoryData from "../../../public/data/CategoryData";

export default function CategoryCards({ favorites, onToggleLike, onAddToCart }) {
  const categories = [
    "Shirts",
    "Trousers",
    "Hats",
    "Blazer Pants",
    "Shoes",
    "Dresses",
    "Accessories",
    "Bags",
    "Business",
  ];

  return (
    <section className={styles.categoryProducts}>
      <h2>Our Products</h2>

      {categories.map((cat) => {
        const products = CategoryData.filter((item) => item.category === cat);

        return (
          <div key={cat} className={styles.categorySection}>
            <h3 className={styles.categoryHeading}>{cat}</h3>

            <div className={styles.categoryGrid}>
              {products.length > 0 ? (
                products.map((item) => (
                  <div key={item.id} className={styles.cardWrap}>
                    <Card
                      id={item.id}
                      image={item.image}
                      title={item.title}
                      description={item.description}
                      price={item.price}
                      isLiked={favorites?.has(item.id)}
                      onToggleLike={onToggleLike}
                      onAddToCart={onAddToCart}
                    />
                  </div>
                ))
              ) : (
                <p className={styles.noProducts}>No products yet</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
