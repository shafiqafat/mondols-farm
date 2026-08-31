import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";

import products from "../data/products";

import "./ProduceSection.css";
import { Link } from "react-router-dom";

function ProduceSection() {
  return (
    <section className="produce section">
      <div className="container">
        <div className="produce__header">
          <SectionHeading
            eyebrow="F R O M &nbsp; T H E &nbsp; F A R M"
            title="Fresh from our farm."
            description="Seasonal produce grown, raised, and harvested with care."
          />
          

          <span className="produce__season">SEASONAL AVAILABILITY</span>
        </div>

        <div className="produce__grid">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div className="produce__footer">
          <Link to="/shop">
            Explore Our Produce
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default ProduceSection;
