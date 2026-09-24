import { Link, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import journalArticles from "../data/journal";
import PageMeta from "../components/PageMeta";
import journalCta from "../assets/image/journal/journal-cta.jpg";

import "./JournalDetail.css";

function JournalDetail() {
  const { slug } = useParams();

  const article = journalArticles.find((item) => item.slug === slug);

  const mainRef = useRef(null);
  const heroRef = useRef(null);
  const coverRef = useRef(null);
  const articleRef = useRef(null);
  const relatedRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!article || !mainRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Hero: editorial title entrance
      const hero = heroRef.current;
      if (hero) {
        const back = hero.querySelector(".journal-detail__back");
        const meta = hero.querySelector(".journal-detail__meta");
        const heading = hero.querySelector("h1");

        gsap.set(back, { opacity: 0, y: 18 });
        gsap.set(meta, { opacity: 0, y: 18 });
        gsap.set(heading, { opacity: 0, y: 35 });

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(back, { opacity: 1, y: 0, duration: 0.5 })
          .to(meta, { opacity: 1, y: 0, duration: 0.45 }, "-=0.25")
          .to(heading, { opacity: 1, y: 0, duration: 0.85 }, "-=0.15");
      }

      // Cover image: cinematic reveal
      const cover = coverRef.current;
      if (cover) {
        const image = cover.querySelector(".journal-detail__cover-image");
        const img = cover.querySelector("img");

        gsap.set(image, { opacity: 0, y: 30 });
        gsap.set(img, { scale: 1.08 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: cover,
              start: "top 85%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(image, { opacity: 1, y: 0, duration: 0.85 })
          .to(img, { scale: 1, duration: 1.3, ease: "power2.out" }, "-=0.7");
      }

      // Article: metadata and reading content
      const articleSection = articleRef.current;
      if (articleSection) {
        const aside = articleSection.querySelector(".journal-detail__aside");
        const content = articleSection.querySelector(
          ".journal-detail__content",
        );
        const paragraphs = articleSection.querySelectorAll(
          ".journal-detail__content p",
        );

        gsap.set(aside, { opacity: 0, x: -35 });
        gsap.set(content, { opacity: 0, x: 35 });
        gsap.set(paragraphs, { opacity: 0, y: 22 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: articleSection,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(aside, { opacity: 1, x: 0, duration: 0.7 })
          .to(content, { opacity: 1, x: 0, duration: 0.75 }, "-=0.55")
          .to(
            paragraphs,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.09 },
            "-=0.35",
          );
      }

      // Related stories
      const related = relatedRef.current;
      if (related) {
        const heading = related.querySelector(
          ".journal-detail__related-heading",
        );
        const cards = related.querySelectorAll(".journal-detail__related-card");

        gsap.set(heading, { opacity: 0, y: 25 });
        gsap.set(cards, { opacity: 0, y: 40 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: related,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(heading, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            cards,
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.13 },
            "-=0.25",
          );
      }

      // Final CTA
      const cta = ctaRef.current;
      if (cta) {
        const image = cta.querySelector(".journal-detail__cta-image img");
        const overlay = cta.querySelector(".journal-detail__cta-overlay");
        const content = cta.querySelector(".journal-detail__cta-content");
        const eyebrow = content?.querySelector(":scope > span");
        const heading = content?.querySelector("h2");
        const button = content?.querySelector(".button");

        if (image && overlay && content && eyebrow && heading && button) {
          gsap.set(image, { scale: 1.08 });
          gsap.set(overlay, { opacity: 0 });
          gsap.set(content, { opacity: 0, y: 30 });
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
            .to(image, { scale: 1.03, duration: 1.4, ease: "power2.out" })
            .to(overlay, { opacity: 1, duration: 0.8 }, 0.1)
            .to(content, { opacity: 1, y: 0, duration: 0.7 }, 0.2)
            .to(eyebrow, { opacity: 1, y: 0, duration: 0.5 }, "-=0.35")
            .to(heading, { opacity: 1, y: 0, duration: 0.75 }, "-=0.2")
            .to(button, { opacity: 1, y: 0, duration: 0.55 }, "-=0.15");
        }
      }
    }, mainRef);

    return () => ctx.revert();
  }, [article]);

  if (!article) {
    return (
      <main className="journal-not-found">
        <div className="container">
          <span>A R T I C L E &nbsp; N O T &nbsp; F O U N D</span>

          <h1>
            We couldn't find
            <br />
            that story.
          </h1>

          <Link to="/journal" className="button">
            Back to Journal
          </Link>
        </div>
      </main>
    );
  }

  // Get related articles from the same category
  const relatedArticles = journalArticles
    .filter(
      (item) => item.id !== article.id && item.category === article.category,
    )
    .slice(0, 2);

  return (
    <main ref={mainRef} className="journal-detail">
      <PageMeta title={article.title} description={article.excerpt} />

      {/* ========================================
          HERO
      ======================================== */}

      <section ref={heroRef} className="journal-detail__hero">
        <div className="container">
          <Link to="/journal" className="journal-detail__back">
            ← Back to Journal
          </Link>

          <div className="journal-detail__meta">
            <span>{article.category}</span>

            <span>{article.date}</span>
          </div>

          <h1>{article.title}</h1>
        </div>
      </section>

      {/* ========================================
          HERO IMAGE
      ======================================== */}

      <section ref={coverRef} className="journal-detail__cover">
        <div className="container">
          <div className="journal-detail__cover-image">
            <img src={article.image} alt={article.title} />
          </div>
        </div>
      </section>

      {/* ========================================
          ARTICLE
      ======================================== */}

      <section ref={articleRef} className="journal-detail__article section">
        <div className="container">
          <div className="journal-detail__article-grid">
            <aside className="journal-detail__aside">
              <span>T H E &nbsp; J O U R N A L</span>

              <div>{article.category}</div>

              <div>{article.date}</div>
            </aside>

            <article className="journal-detail__content">
              <p className="journal-detail__intro">{article.excerpt}</p>

              {article.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>
          </div>
        </div>
      </section>

      {/* ========================================
          RELATED STORIES
      ======================================== */}

      {relatedArticles.length > 0 && (
        <section ref={relatedRef} className="journal-detail__related section">
          <div className="container">
            <div className="journal-detail__related-heading">
              <span>K E E P &nbsp; R E A D I N G</span>

              <h2>More from the farm.</h2>
            </div>

            <div className="journal-detail__related-grid">
              {relatedArticles.map((relatedArticle) => (
                <article
                  key={relatedArticle.id}
                  className="journal-detail__related-card"
                >
                  <Link
                    to={`/journal/${relatedArticle.slug}`}
                    className="journal-detail__related-image"
                  >
                    <img
                      src={relatedArticle.image}
                      alt={relatedArticle.title}
                      loading="lazy"
                    />
                  </Link>

                  <div className="journal-detail__related-content">
                    <div>
                      <span>{relatedArticle.category}</span>

                      <span>{relatedArticle.date}</span>
                    </div>

                    <h3>
                      <Link to={`/journal/${relatedArticle.slug}`}>
                        {relatedArticle.title}
                      </Link>
                    </h3>

                    <p>{relatedArticle.excerpt}</p>

                    <Link
                      to={`/journal/${relatedArticle.slug}`}
                      className="journal-detail__read"
                    >
                      Read Story →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================
          CTA
      ======================================== */}

      <section ref={ctaRef} className="journal-detail__cta">
        <div className="journal-detail__cta-image">
          <img src={journalCta} alt="Countryside landscape" loading="lazy" />
        </div>

        <div className="journal-detail__cta-overlay"></div>

        <div className="container journal-detail__cta-content">
          <span>E X P E R I E N C E &nbsp; I T &nbsp; Y O U R S E L F</span>

          <h2>
            Come slow down
            <br />
            with us.
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

export default JournalDetail;
