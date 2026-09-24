import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";
import ProductCard from "../components/ProductCard";

import products from "../data/products";
import PageMeta from "../components/PageMeta";

import "./Shop.css";

gsap.registerPlugin(ScrollTrigger);

function Shop() {
  const shopHeroRef = useRef(null);
  const shopIntroRef = useRef(null);
  const shopProductsRef = useRef(null);
  const shopOrderRef = useRef(null);
  const shopCtaRef = useRef(null);

  useEffect(() => {
    const hero = shopHeroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const image = hero.querySelector(".shop-hero__image img");
    const overlay = hero.querySelector(".shop-hero__overlay");
    const eyebrow = hero.querySelector(".shop-hero__content > span");
    const heading = hero.querySelector("h1");
    const paragraph = hero.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set([eyebrow, heading, paragraph], { opacity: 0, y: 30 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(image, { scale: 1.05, duration: 1.5, ease: "power2.out" })
        .to(overlay, { opacity: 0.5, duration: 0.8 }, 0.1)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, 0.48)
        .to(paragraph, { opacity: 1, y: 0, duration: 0.7 }, 0.68);
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = shopIntroRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".section-heading");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 30 });

      gsap.to(heading, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = shopProductsRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const filters = section.querySelector(".shop-products__filters");
    const cards = section.querySelectorAll(".product-card");

    const ctx = gsap.context(() => {
      gsap.set(filters, { opacity: 0, y: 25 });
      gsap.set(cards, { opacity: 0, y: 45 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .to(filters, { opacity: 1, y: 0, duration: 0.7 })
        .to(
          cards,
          { opacity: 1, y: 0, duration: 0.75, stagger: 0.12 },
          "-=0.35",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = shopOrderRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const content = section.querySelector(
      ".shop-order__grid > div:first-child",
    );
    const steps = section.querySelectorAll(".shop-order__steps > div");

    const ctx = gsap.context(() => {
      gsap.set(content, { opacity: 0, x: -40 });
      gsap.set(steps, { opacity: 0, x: 40 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .to(content, { opacity: 1, x: 0, duration: 0.8 })
        .to(
          steps,
          { opacity: 1, x: 0, duration: 0.65, stagger: 0.12 },
          "-=0.45",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = shopCtaRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".shop-cta__image img");
    const overlay = section.querySelector(".shop-cta__overlay");
    const content = section.querySelector(".shop-cta__content");
    const eyebrow = content.querySelector(":scope > span");
    const heading = content.querySelector("h2");
    const button = content.querySelector("a");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set([eyebrow, heading, button], { opacity: 0, y: 25 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .to(image, { scale: 1.03, duration: 1.4, ease: "power2.out" })
        .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, 0.25)
        .to(heading, { opacity: 1, y: 0, duration: 0.7 }, 0.38)
        .to(button, { opacity: 1, y: 0, duration: 0.55 }, 0.62);
    }, section);

    return () => ctx.revert();
  }, []);

  const categories = ["All", "Vegetables", "Fruits", "Eggs", "Meat", "Other"];

  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <main className="shop-page">
      <PageMeta
        title="Farm Produce"
        description="Explore seasonal produce and farm products from Mondol's Farm."
      />
      {/* HERO */}

      <section ref={shopHeroRef} className="shop-hero">
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

      <section ref={shopIntroRef} className="shop-intro section">
        <div className="container">
          <SectionHeading
            eyebrow="O U R &nbsp; P R O D U C E"
            title="Good food starts with good soil."
            description="What we offer changes with the seasons. Browse what's currently available and get in touch to place an order."
          />
        </div>
      </section>

      {/* PRODUCTS */}

      <section ref={shopProductsRef} className="shop-products section">
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

      <section ref={shopOrderRef} className="shop-order section">
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

      <section ref={shopCtaRef} className="shop-cta">
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
