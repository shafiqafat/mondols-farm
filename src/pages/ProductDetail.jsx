import { Link, useParams } from "react-router-dom";
import products from "../data/products";
import PageMeta from "../components/PageMeta";
import "./ProductDetail.css";

function ProductDetail() {
  const { slug } = useParams();

  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return (
      <main className="product-not-found">
        <div className="container">
          <span>P R O D U C T &nbsp; N O T &nbsp; F O U N D</span>

          <h1>
            We couldn't find
            <br />
            that produce.
          </h1>

          <Link to="/shop" className="button">
            Back to Produce
          </Link>
        </div>
      </main>
    );
  }

  const relatedProducts = products
    .filter((item) => item.id !== product.id)
    .slice(0, 3);

  const details = product.details || {};

  const productFacts = [
    { label: "Availability", value: product.availability },
    { label: "Price", value: `${product.price} / ${product.unit}` },
    { label: "Source", value: details.source },
    { label: "Raw Material", value: details.rawMaterial },
    { label: "Production", value: details.productionMethod },
    { label: "Season", value: details.season },
    { label: "Variety", value: details.variety },
    { label: "Breed", value: details.breed },
    { label: "Farm Area", value: details.farmArea },
    { label: "Harvest Period", value: details.harvestPeriod },
    { label: "Current Production", value: details.currentProduction },
    { label: "Collection", value: details.collectionFrequency },
    { label: "Available Quantity", value: details.availableQuantity },
    { label: "Packaging", value: details.packaging },
    { label: "Storage", value: details.storage },
    { label: "Average Weight", value: details.averageWeight },
    { label: "Rearing Method", value: details.rearingMethod },
    { label: "Processing", value: details.processing },
  ].filter((item) => item.value);

  return (
    <main className="product-detail">
      <PageMeta title={product.name} description={product.description} />
      {/* ========================================
          PRODUCT INTRO
      ======================================== */}
      <section className="product-detail__main section">
        <div className="container">
          <Link to="/shop" className="product-detail__back">
            ← Back to Produce
          </Link>

          <div className="product-detail__grid">
            <div className="product-detail__image">
              <img src={product.image} alt={product.name} />
            </div>

            <div className="product-detail__content">
              <span className="product-detail__category">
                {product.category}
              </span>

              <h1>{product.name}</h1>

              <div className="product-detail__price">
                <strong>{product.price}</strong>
                <span>/ {product.unit}</span>
              </div>

              <span
                className={`product-detail__availability ${product.availability
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {product.availability}
              </span>

              <p className="product-detail__description">
                {product.description}
              </p>

              <div className="product-detail__order">
                <h2>Interested in this produce?</h2>

                <p>
                  Send us an inquiry and we'll confirm availability, quantity,
                  and delivery details with you.
                </p>

                <div className="product-detail__actions">
                  <Link
                    to={`/contact?product=${encodeURIComponent(product.name)}`}
                    className="button button--primary"
                  >
                    Order Now
                    <span>→</span>
                  </Link>

                  <Link to="/contact" className="button button--outline">
                    Send Inquiry
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========================================
          PRODUCT DETAILS
      ======================================== */}
      <section className="product-information section">
        <div className="container">
          <div className="product-information__header">
            <span>P R O D U C T &nbsp; D E T A I L S</span>

            <h2>
              The details
              <br />
              behind the produce.
            </h2>
          </div>

          {productFacts.length > 0 && (
            <div className="product-information__facts">
              {productFacts.map((fact) => (
                <div key={fact.label}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      {/* ========================================
          ABOUT PRODUCT
      ======================================== */}
      <section className="product-story section">
        <div className="container product-story__grid">
          <div>
            <span className="product-story__eyebrow">
              A B O U T &nbsp; T H E &nbsp; P R O D U C T
            </span>

            <h2>Grown with purpose.</h2>
          </div>

          <div className="product-story__content">
            <p>{product.about}</p>

            <p>
              We keep our production at a scale that allows us to stay close to
              the process, understand what we're producing, and gradually
              improve as the farm grows.
            </p>
          </div>
        </div>
      </section>
      {/* ========================================
          PRODUCT HIGHLIGHTS
      ======================================== */}
      {product.highlights?.length > 0 && (
        <section className="product-highlights section">
          <div className="container">
            <div className="product-highlights__grid">
              <div>
                <span className="product-highlights__eyebrow">
                  F R O M &nbsp; O U R &nbsp; F A R M
                </span>

                <h2>
                  What makes
                  <br />
                  it special.
                </h2>
              </div>

              <div className="product-highlights__list">
                {product.highlights.map((item, index) => (
                  <div key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>

                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      {/* ========================================
          RELATED PRODUCE
      ======================================== */}
      <section className="product-related section">
        <div className="container">
          <div className="product-related__header">
            <div>
              <span>M O R E &nbsp; F R O M &nbsp; T H E &nbsp; F A R M</span>

              <h2>Other produce.</h2>
            </div>

            <Link to="/shop" className="product-related__link">
              Explore All Produce
              <span>→</span>
            </Link>
          </div>

          <div className="product-related__grid">
            {relatedProducts.map((item) => (
              <article key={item.id} className="product-related__card">
                <Link
                  to={`/shop/${item.slug}`}
                  className="product-related__image"
                >
                  <img src={item.image} alt={item.name} loading="lazy" />
                </Link>

                <div className="product-related__content">
                  <div className="product-related__meta">
                    <span>{item.category}</span>

                    <span>
                      {item.price} / {item.unit}
                    </span>
                  </div>

                  <h3>
                    <Link to={`/shop/${item.slug}`}>{item.name}</Link>
                  </h3>

                  <p>{item.description}</p>

                  <Link
                    to={`/shop/${item.slug}`}
                    className="product-related__read"
                  >
                    View Produce
                    <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* ========================================
          CTA
      ======================================== */}
      <section className="product-detail__cta">
        <div className="product-detail__cta-image">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85"
            alt="Countryside farmland"
            loading="lazy"
          />
        </div>

        <div className="product-detail__cta-overlay"></div>

        <div className="container product-detail__cta-content">
          <span>E X P L O R E &nbsp; M O R E</span>

          <h2>
            See what's growing
            <br />
            right now.
          </h2>

          <Link to="/shop" className="button button--light">
            Explore All Produce
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ProductDetail;
