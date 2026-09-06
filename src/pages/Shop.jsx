import { useState } from "react";
import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import ProductCard from "../components/ProductCard";

import products from "../data/products";

import "./Shop.css";

function Shop() {
  const categories = ["All", "Vegetables", "Fruits", "Eggs", "Meat", "Other"];

  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <main className="shop-page">
      {/* HERO */}

      <section className="shop-hero">
        <div className="shop-hero__image">
          <img
            src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=2000&q=85"
            alt="Fresh farm produce"
          />
        </div>

        <div className="shop-hero__overlay"></div>

        <div className="container shop-hero__content">
          <span>F R O M &nbsp; O U R &nbsp; F A R M</span>

          <h1>
            Fresh from
            <br />
            the farm.
          </h1>

          <p>Seasonal produce grown, raised, and harvested with care.</p>
        </div>
      </section>

      {/* INTRO */}

      <section className="shop-intro section">
        <div className="container">
          <SectionHeading
            eyebrow="O U R &nbsp; P R O D U C E"
            title="Good food starts with good soil."
            description="What we offer changes with the seasons. Browse what's currently available and get in touch to place an order."
          />
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="shop-products section">
        <div className="container">
          <div className="shop-products__filters">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? "is-active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="shop-products__grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* ORDERING */}

      <section className="shop-order section">
        <div className="container">
          <div className="shop-order__grid">
            <div>
              <span className="shop-order__eyebrow">
                H O W &nbsp; I T &nbsp; W O R K S
              </span>

              <h2>
                Simple ordering.
                <br />
                No complicated checkout.
              </h2>
            </div>

            <div className="shop-order__steps">
              <div>
                <span>01</span>

                <h3>Browse</h3>

                <p>See what's currently available from the farm.</p>
              </div>

              <div>
                <span>02</span>

                <h3>Choose</h3>

                <p>Tell us what you'd like and how much you need.</p>
              </div>

              <div>
                <span>03</span>

                <h3>Contact</h3>

                <p>We'll confirm availability, price, and delivery details.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}

      <section className="shop-cta">
        <div className="shop-cta__image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside farmland"
            loading="lazy"
          />
        </div>

        <div className="shop-cta__overlay"></div>

        <div className="container shop-cta__content">
          <span>
            W A N T &nbsp; T O &nbsp; K N O W &nbsp; W H A T ' S &nbsp; A V A I
            L A B L E ?
          </span>

          <h2>
            Let's talk about
            <br />
            what's growing.
          </h2>

          <Link to="/contact" className="button button--light">
            Get in Touch
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Shop;
