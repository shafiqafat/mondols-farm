import { Link, useParams } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import stays from "../data/stays";

import "./StayDetail.css";

function StayDetail() {
  const { slug } = useParams();

  const stay = stays.find((item) => item.slug === slug);

  if (!stay) {
    return (
      <main className="stay-detail stay-detail--not-found">
        <div className="container">
          <span>S T A Y &nbsp; N O T &nbsp; F O U N D</span>

          <h1>
            We couldn't find
            <br />
            that accommodation.
          </h1>

          <Link to="/stay" className="button">
            Back to Stay
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="stay-detail">
      <PageMeta title={stay.name} description={stay.description} />
      
      {/* ========================================
          HOUSE INTRO
          ======================================== */}

      <section className="stay-detail__main section">
        <div className="container">
          <Link to="/stay" className="stay-detail__back">
            ← Back to Stay
          </Link>

          <div className="stay-detail__grid">
            {/* IMAGE */}

            <div className="stay-detail__image">
              <img src={stay.image} alt={stay.name} />
            </div>

            {/* INFORMATION */}

            <div className="stay-detail__content">
              <span className="stay-detail__category">
                A C C O M M O D A T I O N
              </span>

              <h1>{stay.name}</h1>

              <div className="stay-detail__price">
                <strong>{stay.price}</strong>
                <span>/ {stay.unit}</span>
              </div>

              <p className="stay-detail__description">{stay.description}</p>

              <div className="stay-detail__actions">
                <Link
                  to={`/contact?stay=${encodeURIComponent(stay.name)}`}
                  className="button button--primary"
                >
                  Check Availability
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          HOUSE DETAILS
          ======================================== */}

      <section className="stay-detail__facts section">
        <div className="container">
          <div className="stay-detail__section-heading">
            <span>H O U S E &nbsp; D E T A I L S</span>

            <h2>
              Know the
              <br />
              essentials.
            </h2>
          </div>

          <div className="stay-detail__facts-grid">
            {Object.entries(stay.details).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (char) => char.toUpperCase());

              return (
                <div key={key} className="stay-detail__fact">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================
          ABOUT THE HOUSE
          ======================================== */}

      <section className="stay-detail__about section">
        <div className="container stay-detail__about-grid">
          <div className="stay-detail__about-label">
            <span>A B O U T &nbsp; T H E &nbsp; H O U S E</span>
          </div>

          <div className="stay-detail__about-content">
            <h2>
              A place to
              <br />
              slow down.
            </h2>

            <p>{stay.about}</p>

            <p>{stay.experience}</p>
          </div>
        </div>
      </section>

      {/* ========================================
          SERVICES
          ======================================== */}

      <section className="stay-detail__services section">
        <div className="container">
          <div className="stay-detail__services-heading">
            <div>
              <span>S T A Y &nbsp; S E R V I C E S</span>

              <h2>
                More than
                <br />a room.
              </h2>
            </div>

            <p>
              Your stay is connected to the farm. Some things are part of the
              experience, while others can be arranged according to what you
              need.
            </p>
          </div>

          <div className="stay-detail__services-grid">
            {/* INCLUDED */}

            <div className="stay-detail__service-group">
              <span className="stay-detail__service-number">01</span>

              <h3>Included</h3>

              <ul>
                {stay.services.included.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>

            {/* ON REQUEST */}

            <div className="stay-detail__service-group">
              <span className="stay-detail__service-number">02</span>

              <h3>Available on Request</h3>

              <ul>
                {stay.services.availableOnRequest.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          PRACTICAL INFO
          ======================================== */}

      <section className="stay-detail__practical section">
        <div className="container">
          <div className="stay-detail__section-heading">
            <span>P R A C T I C A L &nbsp; I N F O</span>

            <h2>
              Before you
              <br />
              arrive.
            </h2>
          </div>

          <div className="stay-detail__facts-grid">
            {Object.entries(stay.practical).map(([key, value]) => {
              if (!value) return null;

              const label = key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (char) => char.toUpperCase());

              return (
                <div key={key} className="stay-detail__fact">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* ========================================
          HIGHLIGHTS
          ======================================== */}

      <section className="stay-detail__highlights section">
        <div className="container">
          <div className="stay-detail__highlights-heading">
            <span>
              W H A T &nbsp; M A K E S &nbsp; I T &nbsp; S P E C I A L
            </span>

            <h2>
              Why stay
              <br />
              here?
            </h2>
          </div>

          <div className="stay-detail__highlights-list">
            {stay.highlights.map((highlight, index) => (
              <article key={index} className="stay-detail__highlight">
                <span>{String(index + 1).padStart(2, "0")}</span>

                <h3>{highlight}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          HOUSE GALLERY
          ======================================== */}

      <section className="stay-detail__gallery section">
        <div className="container">
          <div className="stay-detail__gallery-heading">
            <span>G A L L E R Y</span>

            <h2>
              A closer look
              <br />
              at the stay.
            </h2>
          </div>

          <div className="stay-detail__gallery-grid">
            {stay.gallery.map((image, index) => (
              <div key={index} className="stay-detail__gallery-item">
                <img
                  src={image}
                  alt={`${stay.name} view ${index + 1}`}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          OTHER STAY
          ======================================== */}

      <section className="stay-detail__other section">
        <div className="container">
          <div className="stay-detail__other-heading">
            <span>A N O T H E R &nbsp; W A Y &nbsp; T O &nbsp; S T A Y</span>

            <h2>
              Looking for
              <br />
              another stay?
            </h2>
          </div>

          <div className="stay-detail__other-grid">
            {stays
              .filter((item) => item.id !== stay.id)
              .map((otherStay) => (
                <Link
                  key={otherStay.id}
                  to={`/stay/${otherStay.slug}`}
                  className="stay-detail__other-card"
                >
                  <div className="stay-detail__other-image">
                    <img
                      src={otherStay.image}
                      alt={otherStay.name}
                      loading="lazy"
                    />

                    <div className="stay-detail__other-overlay">
                      <span>View Stay</span>
                      <span>↗</span>
                    </div>
                  </div>

                  <div className="stay-detail__other-content">
                    <div>
                      <span>{otherStay.guests}</span>
                      <h3>{otherStay.name}</h3>
                    </div>

                    <div className="stay-detail__other-price">
                      <strong>{otherStay.price}</strong>
                      <span>/ {otherStay.unit}</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
          ======================================== */}

      <section className="stay-detail__cta">
        <div
          className="stay-detail__cta-image"
          style={{ backgroundImage: `url(${stay.image})` }}
        ></div>

        <div className="stay-detail__cta-overlay"></div>

        <div className="container stay-detail__cta-content">
          <span>R E A D Y &nbsp; T O &nbsp; S T A Y ?</span>

          <h2>
            Stay for a while.
            <br />
            Remember it longer.
          </h2>

          <Link
            to={`/contact?stay=${encodeURIComponent(stay.name)}`}
            className="button button--light"
          >
            Check Availability
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default StayDetail;
