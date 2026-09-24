import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

import galleryItems from "../data/gallery";
import galleryHero from "../assets/image/Memory/mustard-field.avif";
import galleryCta from "../assets/image/Memory/dust.jpg";
import PageMeta from "../components/PageMeta";

import "./Gallery.css";

gsap.registerPlugin(ScrollTrigger);

function Gallery() {
  const categories = [
    "All",
    "Farm Life",
    "Animals",
    "Harvest",
    "Homestay",
    "Countryside",
  ];

  const [activeCategory, setActiveCategory] = useState("All");

  const [selectedImage, setSelectedImage] = useState(null);

  const heroRef = useRef(null);
  const sectionRef = useRef(null);
  const ctaRef = useRef(null);
  const lightboxRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;

    if (!hero) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const image = hero;
    const content = hero.querySelector(".gallery-hero__content");
    const eyebrow = content?.querySelector(":scope > span");
    const heading = content?.querySelector("h1");
    const paragraph = content?.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, { backgroundSize: "108%" });
      gsap.set([eyebrow, heading, paragraph], { opacity: 0, y: 30 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(image, {
          backgroundSize: "103%",
          duration: 1.5,
          ease: "power2.out",
        })
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, 0.48)
        .to(paragraph, { opacity: 1, y: 0, duration: 0.7 }, 0.68);
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const heading = section.querySelector(".gallery-heading");
    const filters = section.querySelector(".gallery-filters");
    const items = section.querySelectorAll(".gallery-item");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 25 });
      gsap.set(filters, { opacity: 0, y: 20 });
      gsap.set(items, { opacity: 0, y: 35, scale: 0.96 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, y: 0, duration: 0.7 })
        .to(filters, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(
          items,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.1,
          },
          "-=0.2",
        );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const grid = section.querySelector(".gallery-grid");
    if (!grid) return;

    const items = grid.querySelectorAll(".gallery-item");

    gsap.fromTo(
      items,
      { opacity: 0, y: 25, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.1,
        ease: "power3.out",
        overwrite: true,
      },
    );
  }, [activeCategory]);

  useEffect(() => {
    const cta = ctaRef.current;

    if (!cta) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const content = cta.querySelector(".container");
    const eyebrow = content?.querySelector(":scope > span");
    const heading = content?.querySelector("h2");
    const button = content?.querySelector("a");

    const ctx = gsap.context(() => {
      gsap.set(cta, { backgroundSize: "108%" });
      gsap.set([eyebrow, heading, button], { opacity: 0, y: 20 });

      gsap
        .timeline({
          scrollTrigger: {
            trigger: cta,
            start: "top 80%",
            once: true,
          },
          defaults: { ease: "power3.out" },
        })
        .to(cta, {
          backgroundSize: "103%",
          duration: 1.4,
          ease: "power2.out",
        })
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, 0.25)
        .to(heading, { opacity: 1, y: 0, duration: 0.7 }, 0.38)
        .to(button, { opacity: 1, y: 0, duration: 0.55 }, 0.62);
    }, cta);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!selectedImage || !lightboxRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lightbox = lightboxRef.current;
    const content = lightbox.querySelector(".gallery-lightbox__content");
    const image = content?.querySelector("img");
    const info = content?.querySelector("div");

    if (!content || !image || !info) return;

    const ctx = gsap.context(() => {
      gsap.set(lightbox, { opacity: 0 });
      gsap.set(content, { opacity: 0, y: 25, scale: 0.97 });
      gsap.set(image, { scale: 1.03 });
      gsap.set(info, { opacity: 0, y: 12 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(lightbox, { opacity: 1, duration: 0.25 })
        .to(content, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, "-=0.05")
        .to(image, { scale: 1, duration: 0.7, ease: "power2.out" }, "-=0.35")
        .to(info, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25");
    }, lightbox);

    return () => ctx.revert();
  }, [selectedImage]);

  const filteredItems =
    activeCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <main className="gallery-page">
      <PageMeta
        title="Farm Memories"
        description="A visual collection of the land, projects, animals, and everyday life at Mondol's Farm."
      />
      {/* ========================================
          HERO
      ======================================== */}

      <section
        ref={heroRef}
        className="gallery-hero"
        style={{ backgroundImage: `url(${galleryHero})` }}
      >
        <div className="container gallery-hero__content">
          <span>F A R M &nbsp; M E M O R I E S</span>

          <h1>
            Life,
            <br />
            as it happens.
          </h1>

          <p>
            A collection of moments from the fields, the farm, the countryside,
            and the people who make this place what it is.
          </p>
        </div>
      </section>

      {/* ========================================
          GALLERY
      ======================================== */}

      <section ref={sectionRef} className="gallery-section section">
        <div className="container">
          <div className="gallery-heading">
            <div>
              <span className="gallery-eyebrow">
                F R O M &nbsp; T H E &nbsp; F A R M
              </span>

              <h2>Farm memories.</h2>
            </div>

            <p>
              Every season brings something different. Here's a glimpse of life
              at Mondol's Farm.
            </p>
          </div>

          {/* FILTERS */}

          <div className="gallery-filters">
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

          {/* GRID */}

          <div className="gallery-grid">
            {filteredItems.map((item) => (
              <button
                type="button"
                className="gallery-item"
                key={item.id}
                onClick={() => setSelectedImage(item)}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  title={item.text}
                  loading="lazy"
                />

                <span className="gallery-item__cursor">View Memory</span>

                <div className="gallery-item__overlay">
                  <span>{item.category}</span>
                  <strong>{item.title}</strong>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section
        ref={ctaRef}
        className="gallery-cta"
        style={{ backgroundImage: `url(${galleryCta})` }}
      >
        <div className="container">
          <span>E X P E R I E N C E &nbsp; T H E &nbsp; F A R M</span>

          <h2>
            Some moments
            <br />
            are better lived.
          </h2>

          <Link to="/stay" className="button button--light">
            Stay With Us
          </Link>
        </div>
      </section>

      {/* ========================================
          LIGHTBOX
      ======================================== */}

      {selectedImage && (
        <div
          ref={lightboxRef}
          className="gallery-lightbox"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="gallery-lightbox__close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            ×
          </button>

          <div
            className="gallery-lightbox__content"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={selectedImage.image} alt={selectedImage.title} />

            <div>
              <span>{selectedImage.category}</span>

              <strong>{selectedImage.title}</strong>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Gallery;
