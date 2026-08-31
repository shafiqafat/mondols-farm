import { useState } from "react";
import { Link } from "react-router-dom";

import galleryItems from "../data/gallery";

import "./Gallery.css";

function Gallery() {
  const categories = [
    "All",
    "Farm Life",
    "Animals",
    "Harvest",
    "Homestay",
    "Countryside",
  ];

  const [activeCategory, setActiveCategory] = useState("All");

  const [selectedImage, setSelectedImage] = useState(null);

  const filteredItems =
    activeCategory === "All"
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeCategory);

  return (
    <main className="gallery-page">
      {/* ========================================
          HERO
      ======================================== */}

      <section className="gallery-hero">
        <div className="container gallery-hero__content">
          <span>FARM MEMORIES</span>

          <h1>
            Life,
            <br />
            as it happens.
          </h1>

          <p>
            A collection of moments from the fields, the farm, the countryside,
            and the people who make this place what it is.
          </p>
        </div>
      </section>

      {/* ========================================
          FEATURED MEMORY
      ======================================== */}

      {/* <section className="gallery-featured section">
        <div className="container">
          <button
            type="button"
            className="gallery-featured__image"
            onClick={() => setSelectedImage(galleryItems[0])}
          >
            <img src={galleryItems[0].image} alt={galleryItems[0].title} />

            <div className="gallery-featured__label">
              <span>FEATURED MEMORY</span>

              <strong>{galleryItems[0].title}</strong>
            </div>
          </button>
        </div>
      </section> */}

      {/* ========================================
          GALLERY
      ======================================== */}

      <section className="gallery-section section">
        <div className="container">
          <div className="gallery-heading">
            <div>
              <span className="gallery-eyebrow">FROM THE FARM</span>

              <h2>Farm memories.</h2>
            </div>

            <p>
              Every season brings something different. Here's a glimpse of life
              at Mondol's Farm.
            </p>
          </div>

          {/* FILTERS */}

          <div className="gallery-filters">
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

          {/* GRID */}

          <div className="gallery-grid">
            {filteredItems.map((item) => (
              <button
                type="button"
                className="gallery-item"
                key={item.id}
                onClick={() => setSelectedImage(item)}
              >
                <img src={item.image} alt={item.title} loading="lazy" />

                <div className="gallery-item__overlay">
                  <span>{item.category}</span>

                  <strong>{item.title}</strong>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          QUOTE
      ======================================== */}

      {/* <section className="gallery-quote">
        <div className="container">
          <p>"The best memories are often found in the simplest moments."</p>
        </div>
      </section> */}

      {/* ========================================
          CTA
      ======================================== */}

      <section className="gallery-cta">
        <div className="container">
          <span>EXPERIENCE THE FARM</span>

          <h2>
            Some moments
            <br />
            are better lived.
          </h2>

          <Link to="/stay" className="button button--light">
            Stay With Us
          </Link>
        </div>
      </section>

      {/* ========================================
          LIGHTBOX
      ======================================== */}

      {selectedImage && (
        <div
          className="gallery-lightbox"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="gallery-lightbox__close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            ×
          </button>

          <div
            className="gallery-lightbox__content"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={selectedImage.image} alt={selectedImage.title} />

            <div>
              <span>{selectedImage.category}</span>

              <strong>{selectedImage.title}</strong>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Gallery;
