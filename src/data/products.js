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
      "Cold-pressed mustard oil made from our farm-grown mustard seeds, known for its pungent flavor and health benefits.",
    price: "৳300",
    unit: "per kg",
    availability: "Available",
    image:
      mustardOil,
  },

  {
    id: 2,
    slug: "chicken-eggs",
    name: "Chicken Eggs",
    category: "E g g s",
    description: "Fresh eggs from our small-scale poultry project, collected daily to ensure quality and freshness.",
    price: "৳160",
    unit: "per dozen",
    availability: "Available",
    image:
      "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=1200&q=85",
  },

  {
    id: 3,
    slug: "Harivanga-mangoes",
    name: "Harivanga Mangoes",
    category: "F r u i t s",
    description: "A rare and aromatic mango variety known for its unique flavor and fragrance, grown seasonally on our farm.",
    price: "৳75",
    unit: "per kg",
    availability: "Seasonal",
    image:
      harivangaMangoes,
  },

  {
    id: 4,
    slug: "farm-raised-goat-meat",
    name: "Farm-Raised Goat Meat",
    category: "M e a t",
    description: "Fresh goat meat from our small-scale goat rearing project, raised with care and attention to quality.",
    price: "৳950",
    unit: "per kg",
    availability: "Limited",
    image:
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=1200&q=85",
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
    image:
      quailMeat,
  },

  {
    id: 6,
    slug: "quail-eggs",
    name: "Quail Eggs",
    category: "E g g s",
    description: "Fresh quail eggs from our small-scale quail farming project, known for their delicate flavor and nutritional value.",
    price: "৳40",
    unit: "per dozens",
    availability: "Available",
    image:
      quailEggs,
  },
];

export default products;
