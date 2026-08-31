import "./GalleryItem.css";

function GalleryItem({ title, category, image, size }) {
  return (
    <figure className={`gallery-item gallery-item--${size}`}>
      <img src={image} alt={title} loading="lazy" />

      <figcaption className="gallery-item__caption">
        <span>{category}</span>

        <strong>{title}</strong>
      </figcaption>
    </figure>
  );
}

export default GalleryItem;
