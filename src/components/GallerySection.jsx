import { Link } from "react-router-dom";

import SectionHeading from "./SectionHeading";
import GalleryItem from "./GalleryItem";

import galleryImages from "../data/gallery";

import "./GallerySection.css";

function GallerySection({ home = false }) {
  return (
    <section
      className={`gallery-section section ${
        home ? "gallery-section--home" : ""
      }`}
    >
      <div className="container">
        <div className="gallery-section__header">
          <SectionHeading
            eyebrow="F A R M &nbsp; M E M O R I E S"
            title="Life between the fields."
            description="A collection of moments, seasons, people, and everyday life from around the farm."
          />
        </div>

        <div className="gallery-section__grid">
          {galleryImages.slice(0, 5).map((image) => (
            <GalleryItem key={image.id} {...image} />
          ))}
        </div>

        <div className="gallery-section__footer">
          <Link to="/gallery">
            View All Memories
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
