import { Link } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";

import stays from "../data/stays";
import contactHero from "../assets/image/experiences/river.jpg";
import contactCta from "../assets/image/Memory/dust.jpg";
import { openWhatsApp } from "../data/whatsapp";
import PageMeta from "../components/PageMeta";
import { getInvestmentOpportunityBySlug } from "../data/investmentUtils";

import "./Contact.css";

function Contact() {
  const [searchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [checkIn, setCheckIn] = useState("");

  const product = searchParams.get("product");
  const stay = searchParams.get("stay");
  const investment = searchParams.get("investment");
  
  const selectedStay = stays.find((item) => item.name === stay);
  const selectedInvestment = investment
    ? getInvestmentOpportunityBySlug(investment)
    : null;

  const maxGuests = selectedStay
    ? parseInt(selectedStay.guests.split("–").pop(), 10)
    : 10;

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name");
    const phone = formData.get("phone");
    const email = formData.get("email");
    const interest = formData.get("interest");
    const quantity = formData.get("quantity");
    const delivery = formData.get("delivery");
    const message = formData.get("message");

    let whatsappMessage = "Hello Mondol's Farm,\n\n";

    if (product) {
      whatsappMessage += `I'd like to place an order.\n\n`;
      whatsappMessage += `Product: ${product}\n`;
      whatsappMessage += `Quantity: ${quantity}\n`;
      whatsappMessage += `Delivery/Pickup: ${delivery}\n\n`;
    } else if (stay) {
      const checkIn = formData.get("checkIn");
      const checkOut = formData.get("checkOut");
      const guests = formData.get("guests");

      whatsappMessage += `I'd like to check availability for a stay.\n\n`;
      whatsappMessage += `Accommodation: ${stay}\n`;
      whatsappMessage += `Check-in: ${checkIn}\n`;
      whatsappMessage += `Check-out: ${checkOut}\n`;
      whatsappMessage += `Guests: ${guests}\n\n`;
    } else if (selectedInvestment) {
      whatsappMessage += `I'd like to learn more about an investment opportunity.\n\n`;
      whatsappMessage += `Opportunity: ${selectedInvestment.project.title}\n`;
      whatsappMessage += `Opportunity ID: ${selectedInvestment.slug}\n\n`;
    } else {
      whatsappMessage += `I'd like to get in touch.\n\n`;
      whatsappMessage += `Interest: ${interest}\n\n`;
    }

    whatsappMessage += `Name: ${name}\n`;
    whatsappMessage += `Phone: ${phone}\n`;

    if (email) {
      whatsappMessage += `Email: ${email}\n`;
    }

    if (message) {
      whatsappMessage += `\nMessage:\n${message}`;
    }

    openWhatsApp(whatsappMessage);
    setSubmitted(true);
  };

  return (
    <main className="contact-page">
      <PageMeta
        title="Contact"
        description="Get in touch with Mondol's Farm about stays, farm produce, projects, or general enquiries."
      />
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

        <div className="contact-hero__content">
          <div className="contact-hero__inner">
            <span>G E T &nbsp; I N &nbsp; T O U C H</span>

            <h1>
              Come
              <br />
              visit us.
            </h1>

            <p>
              Whether you're interested in staying at the farm, visiting,
              ordering produce, or simply learning more about what we're
              building, we'd love to hear from you.
            </p>
          </div>
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

            {selectedInvestment && (
              <div className="contact-form__investment">
                <span>INVESTMENT OPPORTUNITY</span>

                <strong>{selectedInvestment.project.title}</strong>

                <p>{selectedInvestment.projectBrief}</p>
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__row">
                <div className="contact-field">
                  <label htmlFor="name">Name</label>

                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="contact-field">
                  <label htmlFor="phone">Phone</label>

                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Your phone number"
                    required
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
                  defaultValue={
                    product
                      ? "produce"
                      : stay
                        ? "homestay"
                        : selectedInvestment
                          ? "investment"
                          : ""
                  }
                >
                  <option value="" disabled>
                    Select an option
                  </option>

                  <option value="homestay">Homestay</option>
                  <option value="farm-visit">Farm Visit</option>
                  <option value="produce">Farm Produce</option>
                  <option value="investment">Investment Opportunity</option>
                  <option value="other">Something Else</option>
                </select>
              </div>

              {/* STAY FIELDS */}

              {stay && (
                <>
                  <div className="contact-field">
                    <label htmlFor="checkIn">Check-in</label>

                    <input
                      type="date"
                      id="checkIn"
                      name="checkIn"
                      min={today}
                      value={checkIn}
                      onChange={(event) => setCheckIn(event.target.value)}
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="checkOut">Check-out</label>

                    <input
                      type="date"
                      id="checkOut"
                      name="checkOut"
                      min={checkIn || today}
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="guests">Guests</label>

                    <input
                      type="number"
                      id="guests"
                      name="guests"
                      min="1"
                      max={maxGuests}
                      placeholder={`Up to ${maxGuests} guests`}
                      required
                    />
                  </div>
                </>
              )}

              {/* PRODUCT FIELDS */}

              {product && (
                <>
                  <div className="contact-field">
                    <label htmlFor="quantity">Quantity</label>

                    <input
                      type="text"
                      id="quantity"
                      name="quantity"
                      placeholder="e.g. 2 kg, 1 dozen"
                      required
                    />
                  </div>

                  <div className="contact-field">
                    <label htmlFor="delivery">Delivery / Pickup</label>

                    <select
                      id="delivery"
                      name="delivery"
                      defaultValue=""
                      required
                    >
                      <option value="" disabled>
                        Select an option
                      </option>

                      <option value="delivery">Delivery</option>
                      <option value="farm-pickup">Farm Pickup</option>
                    </select>
                  </div>
                </>
              )}

              <div className="contact-field">
                <label htmlFor="message">Message</label>

                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  placeholder="Tell us what you're looking for..."
                ></textarea>
              </div>

              <button type="submit" className="button button--primary">
                {product
                  ? "Place Order"
                  : stay
                    ? "Check Availability"
                    : "Send Inquiry"}
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {submitted && (
        <p className="contact-form__success">
          {product
            ? "Your order details have been prepared. Please complete the conversation with us on WhatsApp."
            : stay
              ? "Your stay inquiry has been prepared. Please complete the conversation with us on WhatsApp."
              : "Your inquiry has been prepared. Please complete the conversation with us on WhatsApp."}
        </p>
      )}

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
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1572.1487872393052!2d88.91689445516735!3d25.073662098699195!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sbd!4v1788778496265!5m2!1sen!2sbd"
              title="Mondol's Farm location"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
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
