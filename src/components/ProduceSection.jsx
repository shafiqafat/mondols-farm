import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";

import products from "../data/products";

import "./ProduceSection.css";
import { Link } from "react-router-dom";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function ProduceSection() {
  const produceRef = useRef(null);

  useEffect(() => {
    const section = produceRef.current;

    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) return;

    const header = section.querySelector(".produce__header");
    const cards = section.querySelectorAll(".product-card");
    const footer = section.querySelector(".produce__footer");

    const ctx = gsap.context(() => {
      gsap.set(header, {
        opacity: 0,
        y: 25,
      });

      gsap.set(cards, {
        opacity: 0,
        y: 45,
      });

      gsap.set(footer, {
        opacity: 0,
        y: 20,
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 75%",
          once: true,
        },
        defaults: {
          ease: "power3.out",
        },
      });

      timeline
        .to(header, {
          opacity: 1,
          y: 0,
          duration: 0.7,
        })
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
          },
          0.2,
        )
        .to(
          footer,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          0.65,
        );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={produceRef} className="produce section">
      <div className="container">
        <div className="produce__header">
          <SectionHeading
            eyebrow="F R O M &nbsp; T H E &nbsp; F A R M"
            title="Fresh from our farm."
            description="Seasonal produce grown, raised, and harvested with care."
          />

          <span className="produce__season">SEASONAL AVAILABILITY</span>
        </div>

        <div className="produce__grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="produce__footer">
          <Link to="/shop">
            Explore Our Produce
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ProduceSection;
