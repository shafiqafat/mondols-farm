import { useState } from "react";
import { Link } from "react-router-dom";

import SectionHeading from "../components/SectionHeading";

import journalArticles from "../data/journal";
import journalCta from "../assets/image/journal/journal-cta.jpg";
import PageMeta from "../components/PageMeta";

import "./Journal.css";

function Journal() {
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

  return (
    <main className="journal-page">
      <PageMeta
        title="Farm Journal"
        description="Stories, updates, lessons, and everyday moments from Mondol's Farm."
      />
      {/* HERO */}

      <section className="journal-hero">
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

      <section className="journal-featured section">
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

      <section className="journal-articles section">
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

      <section className="journal-cta">
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
