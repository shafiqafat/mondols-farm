import { useEffect, useRef, useState } from "react";
import "./GalleryItem.css";

function GalleryItem({ title, category, image }) {
  const cursorRef = useRef(null);

  const targetPosition = useRef({ x: 0, y: 0 });
  const currentPosition = useRef({ x: 0, y: 0 });
  const animationFrame = useRef(null);

  const [isHovering, setIsHovering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const animateCursor = () => {
      const ease = 0.08;

      currentPosition.current.x +=
        (targetPosition.current.x - currentPosition.current.x) * ease;

      currentPosition.current.y +=
        (targetPosition.current.y - currentPosition.current.y) * ease;

      if (cursorRef.current) {
        cursorRef.current.style.left = `${currentPosition.current.x}px`;
        cursorRef.current.style.top = `${currentPosition.current.y}px`;
      }

      animationFrame.current = requestAnimationFrame(animateCursor);
    };

    animationFrame.current = requestAnimationFrame(animateCursor);

    return () => {
      cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();

    targetPosition.current.x = event.clientX - rect.left;
    targetPosition.current.y = event.clientY - rect.top;
  };

  return (
    <>
      <figure
        className="gallery-item"
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();

          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          targetPosition.current.x = x;
          targetPosition.current.y = y;

          currentPosition.current.x = x;
          currentPosition.current.y = y;

          setIsHovering(true);
        }}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex="0"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            setIsOpen(true);
          }
        }}
      >
        <img src={image} alt={title} loading="lazy" />

        <span
          ref={cursorRef}
          className={`gallery-item__cursor ${
            isHovering ? "gallery-item__cursor--visible" : ""
          }`}
        >
          View Memory
        </span>

        <figcaption className="gallery-item__caption">
          <span>{category}</span>
          <strong>{title}</strong>
        </figcaption>
      </figure>

      {isOpen && (
        <div className="gallery-lightbox" onClick={() => setIsOpen(false)}>
          <button
            type="button"
            className="gallery-lightbox__close"
            onClick={() => setIsOpen(false)}
            aria-label="Close image"
          >
            ×
          </button>

          <div
            className="gallery-lightbox__content"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={image} alt={title} />

            <div className="gallery-lightbox__info">
              <span>{category}</span>
              <strong>{title}</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GalleryItem;