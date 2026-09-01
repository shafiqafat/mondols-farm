import { Link, useParams } from "react-router-dom";

import journalArticles from "../data/journal";

import "./JournalDetail.css";

function JournalDetail() {
  const { slug } = useParams();

  const article = journalArticles.find((item) => item.slug === slug);

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
    <main className="journal-detail">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="journal-detail__hero">
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

      <section className="journal-detail__cover">
        <div className="container">
          <div className="journal-detail__cover-image">
            <img src={article.image} alt={article.title} />
          </div>
        </div>
      </section>

      {/* ========================================
          ARTICLE
      ======================================== */}

      <section className="journal-detail__article section">
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
        <section className="journal-detail__related section">
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

      <section className="journal-detail__cta">
        <div className="container">
          <span>E X P E R I E N C E &nbsp; I T &nbsp; Y O U R S E L F</span>

          <h2>
            Come slow down
            <br />
            with us.
          </h2>

          <Link to="/stay" className="button button--light">
            Stay With Us
          </Link>
        </div>
      </section>
    </main>
  );
}

export default JournalDetail;
