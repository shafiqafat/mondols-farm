import { useEffect } from "react";

function PageMeta({ title, description, image = "/og-image.jpg" }) {
  useEffect(() => {
    const fullTitle = `${title} — Mondol's Farm`;
    const fallbackDescription = "Mondol's Farm — Growing With Nature.";

    document.title = fullTitle;

    const updateMeta = (selector, attribute, value) => {
      let element = document.querySelector(selector);

      if (!element) {
        element = document.createElement("meta");
        document.head.appendChild(element);
      }

      element.setAttribute(attribute, value);
    };

    updateMeta(
      'meta[name="description"]',
      "name",
      description || fallbackDescription,
    );

    updateMeta('meta[property="og:title"]', "property", fullTitle);

    updateMeta(
      'meta[property="og:description"]',
      "property",
      description || fallbackDescription,
    );

    updateMeta('meta[property="og:image"]', "property", image);

    updateMeta('meta[name="twitter:title"]', "name", fullTitle);

    updateMeta(
      'meta[name="twitter:description"]',
      "name",
      description || fallbackDescription,
    );

    updateMeta('meta[name="twitter:image"]', "name", image);
  }, [title, description, image]);

  return null;
}

export default PageMeta;