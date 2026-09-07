import { Link } from "react-router-dom";
import PageMeta from "../components/PageMeta";
import "./NotFound.css";

function NotFound() {
  return (
    <main className="not-found">
      <PageMeta
        title="Page Not Found"
        description="The page you're looking for could not be found."
      />

      <div className="container not-found__content">
        <span className="not-found__eyebrow">4 0 4</span>

        <h1>
          This path doesn't
          <br />
          lead anywhere.
        </h1>

        <p>
          The page you're looking for may have moved, been removed, or never
          existed.
        </p>

        <Link to="/" className="button button--primary">
          Back Home
          <span>→</span>
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
