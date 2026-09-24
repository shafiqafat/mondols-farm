import { Link, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import products from "../data/products";
import PageMeta from "../components/PageMeta";
import "./ProductDetail.css";

function ProductDetail() {
  const { slug } = useParams();

  const product = products.find((item) => item.slug === slug);

  const mainRef = useRef(null);
  const informationRef = useRef(null);
  const storyRef = useRef(null);
  const highlightsRef = useRef(null);
  const relatedRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    if (!product || !mainRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Product opening
      const main = mainRef.current.querySelector(".product-detail__main");
      const back = main?.querySelector(".product-detail__back");
      const image = main?.querySelector(".product-detail__image");
      const content = main?.querySelector(".product-detail__content");
      const category = main?.querySelector(".product-detail__category");
      const title = main?.querySelector("h1");
      const price = main?.querySelector(".product-detail__price");
      const availability = main?.querySelector(".product-detail__availability");
      const description = main?.querySelector(".product-detail__description");
      const order = main?.querySelector(".product-detail__order");
      const actions = main?.querySelector(".product-detail__actions");

      if (
        back &&
        image &&
        content &&
        category &&
        title &&
        price &&
        availability &&
        description &&
        order &&
        actions
      ) {
        gsap.set(back, { opacity: 0, y: 18 });
        gsap.set(image, { opacity: 0, x: -45, scale: 1.04 });
        gsap.set(content, { opacity: 0, x: 45 });
        gsap.set(
          [category, title, price, availability, description, order, actions],
          { opacity: 0, y: 20 },
        );

        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .to(back, { opacity: 1, y: 0, duration: 0.4 })
          .to(image, { opacity: 1, x: 0, scale: 1, duration: .8 }, "-=0.25")
          .to(content, { opacity: 1, x: 0, duration: 0.6 }, "-=0.7")
          .to(category, { opacity: 1, y: 0, duration: 0.3 }, "-=0.4")
          .to(title, { opacity: 1, y: 0, duration: 0.6 }, "-=0.2")
          .to(price, { opacity: 1, y: 0, duration: 0.35 }, "-=0.25")
          .to(availability, { opacity: 1, y: 0, duration: 0.3 }, "-=0.2")
          .to(description, { opacity: 1, y: 0, duration: 0.45 }, "-=0.15")
          .to(order, { opacity: 1, y: 0, duration: 0.45 }, "-=0.15")
          .to(actions, { opacity: 1, y: 0, duration: 0.4 }, "-=0.25");
      }

      // Product facts
      const information = informationRef.current;
      if (information) {
        const header = information.querySelector(
          ".product-information__header",
        );
        const facts = information.querySelectorAll(
          ".product-information__facts > div",
        );

        gsap.set(header, { opacity: 0, y: 25 });
        gsap.set(facts, { opacity: 0, y: 30 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: information,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(header, { opacity: 1, y: 0, duration: 0.5 })
          .to(
            facts,
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.07 },
            "-=0.25",
          );
      }

      // Product story
      const story = storyRef.current;
      if (story) {
        const left = story.querySelector(
          ".product-story__grid > div:first-child",
        );
        const contentBlock = story.querySelector(".product-story__content");
        const paragraphs = story.querySelectorAll(".product-story__content p");

        gsap.set(left, { opacity: 0, x: -40 });
        gsap.set(contentBlock, { opacity: 0, x: 40 });
        gsap.set(paragraphs, { opacity: 0, y: 20 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: story,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(left, { opacity: 1, x: 0, duration: 0.75 })
          .to(contentBlock, { opacity: 1, x: 0, duration: 0.75 }, "-=0.55")
          .to(
            paragraphs,
            { opacity: 1, y: 0, duration: 0.55, stagger: 0.12 },
            "-=0.3",
          );
      }

      // Highlights
      const highlights = highlightsRef.current;
      if (highlights) {
        const left = highlights.querySelector(
          ".product-highlights__grid > div:first-child",
        );
        const items = highlights.querySelectorAll(
          ".product-highlights__list > div",
        );

        gsap.set(left, { opacity: 0, x: -40 });
        gsap.set(items, { opacity: 0, x: 40 });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: highlights,
              start: "top 75%",
              once: true,
            },
            defaults: { ease: "power3.out" },
          })
          .to(left, { opacity: 1, x: 0, duration: 0.75 })
          .to(
            items,
            { opacity: 1, x: 0, duration: 0.55, stagger: 0.1 },
            "-=0.45",
          );
      }

      // Related produce
      const related = relatedRef.current;
      if (related) {
        const header = related.querySelector(".product-related__header");
        const cards = related.querySelectorAll(".product-related__card");

        gsap.set(header, { opacity: 0, y: 25 });
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
          .to(header, { opacity: 1, y: 0, duration: 0.7 })
          .to(
            cards,
            { opacity: 1, y: 0, duration: 0.65, stagger: 0.12 },
            "-=0.25",
          );
      }

      // Final CTA
      const cta = ctaRef.current;
      if (cta) {
        const image = cta.querySelector(".product-detail__cta-image img");
        const overlay = cta.querySelector(".product-detail__cta-overlay");
        const content = cta.querySelector(".product-detail__cta-content");
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
  }, [product]);

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
    <main ref={mainRef} className="product-detail">
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
      <section ref={informationRef} className="product-information section">
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
      <section ref={storyRef} className="product-story section">
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
        <section ref={highlightsRef} className="product-highlights section">
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
      <section ref={relatedRef} className="product-related section">
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
      <section ref={ctaRef} className="product-detail__cta">
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
