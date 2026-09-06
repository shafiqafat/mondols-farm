import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";

import contactHero from "../assets/image/experiences/river.jpg";
import contactCta from "../assets/image/Memory/dust.jpg";
import "./Contact.css";

function Contact() {
  const [searchParams] = useSearchParams();

  const product = searchParams.get("product");
  const stay = searchParams.get("stay");
  return (
    <main className="contact-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="contact-hero">
        <div className="contact-hero__image">
          <img
            src={contactHero}
            alt="Countryside landscape at Mondol's Farm"
            loading="eager"
          />
        </div>

        <div className="contact-hero__overlay"></div>

        <div className="container contact-hero__content">
          <span>G E T &nbsp; I N &nbsp; T O U C H</span>

          <h1>
            Come
            <br />
            visit us.
          </h1>

          <p>
            Whether you're interested in staying at the farm, visiting, ordering
            produce, or simply learning more about what we're building, we'd
            love to hear from you.
          </p>
        </div>
      </section>

      {/* ========================================
          CONTACT INFORMATION
      ======================================== */}

      <section className="contact-info section">
        <div className="container">
          <div className="contact-info__grid">
            <div className="contact-info__intro">
              <span className="contact-eyebrow">C O N T A C T</span>

              <h2>
                Let's start
                <br />a conversation.
              </h2>
            </div>

            <div className="contact-details">
              <div className="contact-detail">
                <span>LOCATION</span>

                <p>
                  Mondol's Farm
                  <br />
                  Naogaon, Bangladesh
                </p>
              </div>

              <div className="contact-detail">
                <span>PHONE</span>

                <a href="tel:+8801534282793">+8801534282793</a>
              </div>

              <div className="contact-detail">
                <span>EMAIL</span>

                <a href="mailto:hello@mondolsfarm.com">hello@mondolsfarm.com</a>
              </div>

              <div className="contact-detail">
                <span>WHATSAPP</span>

                <a
                  href="https://wa.me/8801534282793"
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat with us →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          FORM
      ======================================== */}

      <section className="contact-form-section section">
        <div className="container">
          <div className="contact-form__grid">
            <div className="contact-form__heading">
              <span className="contact-eyebrow">
                S E N D &nbsp; A N &nbsp; I N Q U I R Y
              </span>

              <h2>
                How can we
                <br />
                help?
              </h2>

              <p>
                Tell us a little about what you're interested in and we'll get
                back to you.
              </p>
            </div>

            {product && (
              <div className="contact-form__product">
                <span>PRODUCT INQUIRY</span>

                <strong>{product}</strong>
              </div>
            )}
            {stay && (
              <div className="contact-form__product">
                <span>STAY INQUIRY</span>
                <strong>{stay}</strong>
              </div>
            )}

            <form className="contact-form">
              <div className="contact-form__row">
                <div className="contact-field">
                  <label htmlFor="name">Name</label>

                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your name"
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="phone">Phone</label>

                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div className="contact-field">
                <label htmlFor="email">Email</label>

                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Your email address"
                />
              </div>

              <div className="contact-field">
                <label htmlFor="interest">I'm interested in</label>

                <select
                  id="interest"
                  name="interest"
                  defaultValue={product ? "produce" : stay ? "homestay" : ""}
                >
                  <option value="" disabled>
                    Select an option
                  </option>

                  <option value="homestay">Homestay</option>

                  <option value="farm-visit">Farm Visit</option>

                  <option value="produce">Farm Produce</option>

                  <option value="other">Something Else</option>
                </select>
              </div>

              <div className="contact-field">
                <label htmlFor="message">Message</label>

                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  placeholder="Tell us what you're looking for..."
                ></textarea>
              </div>

              <button type="submit" className="button">
                Send Inquiry
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ========================================
          MAP
      ======================================== */}

      <section className="contact-location">
        <div className="container">
          <div className="contact-location__heading">
            <span className="contact-eyebrow">F I N D &nbsp; U S</span>

            <h2>
              Somewhere
              <br />
              worth visiting.
            </h2>
          </div>

          <div className="contact-location__map">
            {/* Temporary map placeholder */}

            <div className="contact-location__placeholder">
              <span>GOOGLE MAP</span>

              <p>Our exact farm location will be displayed here.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          CTA
      ======================================== */}

      <section className="contact-cta">
        <div className="contact-cta__image">
          <img
            src={contactCta}
            alt="Countryside at Mondol's Farm"
            loading="lazy"
          />
        </div>

        <div className="contact-cta__overlay"></div>

        <div className="container">
          <span>M O N D O L ' S &nbsp; F A R M</span>

          <h2>
            See you
            <br />
            at the farm.
          </h2>

          <div className="contact-cta__buttons">
            <Link to="/stay" className="button button--light">
              Book a Stay
              <span>→</span>
            </Link>

            <a
              href="https://wa.me/8801534282793"
              target="_blank"
              rel="noreferrer"
              className="button button--outline-light"
            >
              WhatsApp Us
              <span>→</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Contact;