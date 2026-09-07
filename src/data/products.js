import quailMeat from "../assets/image/products/quail-meat.jpg";
import quailEggs from "../assets/image/products/quail-eggs.jpg";
import mustardOil from "../assets/image/products/mustard-oil.jpg";
import harivangaMangoes from "../assets/image/products/mango.jpg";

const products = [
  {
    id: 1,
    slug: "mustard-oil",
    name: "Mustard Oil",
    category: "O i l s",
    description:
      "Cold-pressed mustard oil made from our farm-grown mustard seeds, known for its pungent flavor and distinctive character.",
    price: "৳300",
    unit: "per Litter",
    availability: "Available",
    image: mustardOil,

    details: {
      source: "",
      rawMaterial: "Farm-grown mustard seeds",
      productionMethod: "Cold-pressed",
      season: "Winter",
      availableQuantity: "",
      packaging: "",
    },

    about:
      "Our mustard oil is produced from mustard grown as part of our seasonal farm activities. The project connects what we grow in the field with what eventually reaches the kitchen.",

    highlights: [
      "Made from farm-grown mustard",
      "Cold-pressed production",
      "Seasonal farm connection",
    ],
  },

  {
    id: 2,
    slug: "chicken-eggs",
    name: "Chicken Eggs",
    category: "E g g s",
    description:
      "Fresh eggs from our small-scale poultry project, collected regularly to ensure quality and freshness.",
    price: "৳160",
    unit: "per dozen",
    availability: "Available",
    image:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=1200&q=85",

    details: {
      source: "Our chicken rearing project",
      breed: "Deshi Chicken",
      currentProduction: "",
      collectionFrequency: "",
      packaging: "Dozen",
      storage: "",
    },

    about:
      "These eggs come from our small-scale chicken rearing project. As the poultry project develops, our aim is to provide fresh eggs produced and collected directly from the farm.",

    highlights: [
      "From our small-scale poultry project",
      "Freshly collected",
      "Available by the dozen",
    ],
  },

  {
    id: 3,
    slug: "harivanga-mangoes",
    name: "Harivanga Mangoes",
    category: "F r u i t s",
    description:
      "A rare and aromatic mango variety known for its unique flavor and fragrance, grown seasonally on our farm.",
    price: "৳75",
    unit: "per kg",
    availability: "Seasonal",
    image: harivangaMangoes,

    details: {
      variety: "Harivanga",
      season: "Summer",
      farmArea: "",
      harvestPeriod: "",
      currentAvailability: "",
      averageSize: "",
    },

    about:
      "Harivanga mangoes are one of the seasonal fruits associated with the farm. Their availability follows the natural growing season, making them a product that is enjoyed for a limited period each year.",

    highlights: [
      "Seasonal farm produce",
      "Harivanga variety",
      "Naturally harvested in season",
    ],
  },

  {
    id: 4,
    slug: "farm-raised-goat-meat",
    name: "Farm-Raised Goat Meat",
    category: "M e a t",
    description:
      "Fresh goat meat from our small-scale goat rearing project, raised with care and attention to quality.",
    price: "৳950",
    unit: "per kg",
    availability: "Limited",
    image:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=85",

    details: {
      source: "Our goat rearing project",
      breed: "",
      currentAvailability: "",
      averageWeight: "",
      rearingMethod: "",
      processing: "",
    },

    about:
      "Our goat meat comes from the farm's small-scale goat rearing project. The livestock project is being developed gradually, so availability remains limited and depends on the farm's current stock.",

    highlights: [
      "From our goat rearing project",
      "Small-scale production",
      "Limited seasonal availability",
    ],
  },

  {
    id: 5,
    slug: "quail-meat",
    name: "Quail Meat",
    category: "M e a t",
    description:
      "Fresh quail meat from our small-scale quail farming project, known for its tenderness and flavor.",
    price: "৳450",
    unit: "per 500g",
    availability: "Limited",
    image: quailMeat,

    details: {
      source: "Our quail farming project",
      breed: "",
      averageWeight: "",
      currentAvailability: "",
      processing: "",
      packaging: "500g",
    },

    about:
      "Quail meat is produced as part of our small-scale quail farming project. The project is being developed gradually, with production kept at a manageable scale.",

    highlights: [
      "From our quail farming project",
      "Small-scale production",
      "Available in limited quantities",
    ],
  },

  {
    id: 6,
    slug: "quail-eggs",
    name: "Quail Eggs",
    category: "E g g s",
    description:
      "Fresh quail eggs from our small-scale quail farming project, known for their delicate flavor and nutritional value.",
    price: "৳40",
    unit: "per dozen",
    availability: "Available",
    image: quailEggs,

    details: {
      source: "Our quail farming project",
      breed: "",
      currentProduction: "",
      collectionFrequency: "",
      packaging: "Dozen",
      storage: "",
    },

    about:
      "Our quail eggs come directly from the farm's small-scale quail project. The project focuses on maintaining healthy birds while producing fresh eggs at a manageable scale.",

    highlights: [
      "From our quail farming project",
      "Freshly collected",
      "Available by the dozen",
    ],
  },
];

export default products;
