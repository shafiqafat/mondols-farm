import { Link } from "react-router-dom";
import "./Button.css";

function Button({ children, to, variant = "primary", className = "" }) {
  const buttonClass = `button button--${variant} ${className}`;

  if (to) {
    return (
      <Link to={to} className={buttonClass}>
        {children}
        <span className="button__arrow">→</span>
      </Link>
    );
  }

  return (
    <button className={buttonClass}>
      {children}
      <span className="button__arrow">→</span>
    </button>
  );
}

export default Button;
