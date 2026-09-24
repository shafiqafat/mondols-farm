import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";

import journalArticles from "../data/journal";
import journalCta from "../assets/image/journal/journal-cta.jpg";
import PageMeta from "../components/PageMeta";

import "./Journal.css";

gsap.registerPlugin(ScrollTrigger);

function Journal() {
  const journalHeroRef = useRef(null);
  const journalFeaturedRef = useRef(null);
  const journalArticlesRef = useRef(null);
  const journalCtaRef = useRef(null);
  const categories = [
    "All",
    "Farming",
    "Farm Updates",
    "Homestay",
    "Food",
    "Village Life",
    "Sustainability",
  ];

  const [activeCategory, setActiveCategory] = useState("All");

  const filteredArticles =
    activeCategory === "All"
      ? journalArticles
      : journalArticles.filter(
          (article) => article.category === activeCategory,
        );

  const featuredArticle = journalArticles[0];

  useEffect(() => {
    const hero = journalHeroRef.current;
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    const image = hero.querySelector(".journal-hero__image img");
    const overlay = hero.querySelector(".journal-hero__overlay");
    const eyebrow = hero.querySelector(".journal-hero__eyebrow");
    const heading = hero.querySelector("h1");
    const paragraph = hero.querySelector("p");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set([eyebrow, heading, paragraph], { opacity: 0, y: 30 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(image, { scale: 1.05, duration: 1.5, ease: "power2.out" })
        .to(overlay, { opacity: 0.52, duration: 0.8 }, 0.1)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.6 }, 0.35)
        .to(heading, { opacity: 1, y: 0, duration: 0.8 }, 0.48)
        .to(paragraph, { opacity: 1, y: 0, duration: 0.7 }, 0.68);
    }, hero);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = journalFeaturedRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".journal-featured__image");
    const content = section.querySelector(".journal-featured__content");

    const ctx = gsap.context(() => {
      gsap.set(image, { opacity: 0, x: -40 });
      gsap.set(content, { opacity: 0, x: 40 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(image, { opacity: 1, x: 0, duration: 0.9 })
        .to(content, { opacity: 1, x: 0, duration: 0.8 }, "-=0.55");
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = journalArticlesRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const heading = section.querySelector(".section-heading");
    const filters = section.querySelector(".journal-filters");
    const cards = section.querySelectorAll(".journal-card");

    const ctx = gsap.context(() => {
      gsap.set(heading, { opacity: 0, y: 25 });
      gsap.set(filters, { opacity: 0, y: 20 });
      gsap.set(cards, { opacity: 0, y: 45 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 75%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(heading, { opacity: 1, y: 0, duration: 0.7 })
        .to(filters, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(cards, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12 }, "-=0.2");
    }, section);

    return () => ctx.revert();
  }, [filteredArticles.length]);

  useEffect(() => {
    const section = journalCtaRef.current;
    if (
      !section ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const image = section.querySelector(".journal-cta__image img");
    const overlay = section.querySelector(".journal-cta__overlay");
    const content = section.querySelector(".journal-cta__content");
    const eyebrow = content.querySelector(":scope > span");
    const heading = content.querySelector("h2");
    const button = content.querySelector("a");

    const ctx = gsap.context(() => {
      gsap.set(image, { scale: 1.08 });
      gsap.set(overlay, { opacity: 0 });
      gsap.set(content, { opacity: 0, y: 30 });
      gsap.set([eyebrow, heading, button], { opacity: 0, y: 20 });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 80%", once: true },
          defaults: { ease: "power3.out" },
        })
        .to(image, { scale: 1.03, duration: 1.4, ease: "power2.out" })
        .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
        .to(content, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
        .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
        .to(heading, { opacity: 1, y: 0, duration: 0.7 }, "-=0.25")
        .to(button, { opacity: 1, y: 0, duration: 0.55 }, "-=0.2");
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <main className="journal-page">
      <PageMeta
        title="Farm Journal"
        description="Stories, updates, lessons, and everyday moments from Mondol's Farm."
      />
      {/* HERO */}

      <section ref={journalHeroRef} className="journal-hero">
        <div className="journal-hero__image">
          <img src={featuredArticle.image} alt={featuredArticle.title} />
        </div>

        <div className="journal-hero__overlay"></div>

        <div className="container journal-hero__content">
          <span className="journal-hero__eyebrow">
            T H E &nbsp; J O U R N A L
          </span>

          <h1>
            Stories
            <br />
            from the farm.
          </h1>

          <p>
            Farming, food, countryside living, and the stories behind Mondol's
            Farm.
          </p>
        </div>
      </section>

      {/* FEATURED */}

      <section ref={journalFeaturedRef} className="journal-featured section">
        <div className="container">
          <div className="journal-featured__grid">
            <Link
              to={`/journal/${featuredArticle.slug}`}
              className="journal-featured__image"
            >
              <img src={featuredArticle.image} alt={featuredArticle.title} />
            </Link>

            <div className="journal-featured__content">
              <span>F R E A T U R E D &nbsp; S T O R Y</span>

              <small>
                {featuredArticle.category} · {featuredArticle.date}
              </small>

              <h2>{featuredArticle.title}</h2>

              <p>{featuredArticle.excerpt}</p>

              <Link
                to={`/journal/${featuredArticle.slug}`}
                className="journal-page__link"
              >
                Read Story
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLES */}

      <section ref={journalArticlesRef} className="journal-articles section">
        <div className="container">
          <SectionHeading
            eyebrow="F R O M &nbsp; T H E &nbsp; F A R M"
            title="Recent stories."
            description="Follow the seasons, projects, ideas, and everyday moments that shape life here."
          />

          <div className="journal-filters">
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

          <div className="journal-grid">
            {filteredArticles.map((article) => (
              <article className="journal-card" key={article.id}>
                <Link
                  to={`/journal/${article.slug}`}
                  className="journal-card__image"
                >
                  <img src={article.image} alt={article.title} loading="lazy" />
                </Link>

                <div className="journal-card__content">
                  <div className="journal-card__meta">
                    <span>{article.category}</span>

                    <span>{article.date}</span>
                  </div>

                  <h3>
                    <Link to={`/journal/${article.slug}`}>{article.title}</Link>
                  </h3>

                  <p>{article.excerpt}</p>

                  <Link
                    to={`/journal/${article.slug}`}
                    className="journal-page__link"
                  >
                    Read Story
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}

      <section ref={journalCtaRef} className="journal-cta">
        <div className="journal-cta__image">
          <img src={journalCta} alt="Countryside landscape" loading="lazy" />
        </div>

        <div className="journal-cta__overlay"></div>

        <div className="container journal-cta__content">
          <span>K E E P &nbsp; E X P L O R I N G</span>

          <h2>
            Come experience
            <br />
            the stories yourself.
          </h2>

          <Link to="/stay" className="button button--light">
            Stay With Us
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Journal;
