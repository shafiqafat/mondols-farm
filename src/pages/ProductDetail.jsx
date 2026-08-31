import { Link, useParams } from "react-router-dom";

import products from "../data/products";

import "./ProductDetail.css";

function ProductDetail() {
  const { slug } = useParams();

  const product = products.find((item) => item.slug === slug);

  // Product doesn't exist
  if (!product) {
    return (
      <main className="product-not-found">
        <div className="container">
          <span>PRODUCT NOT FOUND</span>

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

  return (
    <main className="product-detail">
      {/* ========================================
          PRODUCT
      ======================================== */}

      <section className="product-detail__main section">
        <div className="container">
          <Link to="/shop" className="product-detail__back">
            ← Back to Produce
          </Link>

          <div className="product-detail__grid">
            {/* Image */}

            <div className="product-detail__image">
              <img src={product.image} alt={product.name} />
            </div>

            {/* Information */}

            <div className="product-detail__content">
              <span className="product-detail__category">
                {product.category}
              </span>

              <h1>{product.name}</h1>

              <div className="product-detail__price">
                <strong>{product.price}</strong>

                <span>/ {product.unit}</span>
              </div>

              <div
                className={`product-detail__availability ${product.availability
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {product.availability}
              </div>

              <p className="product-detail__description">
                {product.description}
              </p>

              {/* Order */}

              <div className="product-detail__order">
                <h2>Interested in this produce?</h2>

                <p>
                  Send us an inquiry and we'll confirm availability, quantity,
                  and delivery details with you.
                </p>

                <div className="product-detail__actions">
                  <a
                    href={`https://wa.me/8801000000000?text=Hello%20Mondol's%20Farm,%20I'm%20interested%20in%20${encodeURIComponent(
                      product.name,
                    )}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="button"
                  >
                    Order via WhatsApp
                  </a>

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
          FARM STORY
      ======================================== */}

      <section className="product-story section">
        <div className="container product-story__grid">
          <div>
            <span className="product-story__eyebrow">FROM OUR FARM</span>

            <h2>Grown with care.</h2>
          </div>

          <div>
            <p>
              We believe good produce starts with paying attention to the land,
              the season, and the way we grow.
            </p>

            <p>
              Availability changes throughout the year, so every product you see
              here reflects what's currently growing or being produced on the
              farm.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================
          BACK TO SHOP
      ======================================== */}

      <section className="product-detail__cta">
        <div className="container">
          <span>EXPLORE MORE</span>

          <h2>
            See what's growing
            <br />
            right now.
          </h2>

          <Link to="/shop" className="button button--light">
            Explore All Produce
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ProductDetail;
