import { Link } from "react-router-dom";
import "./Button.css";

function Button({ children, to, variant = "primary", className = "" }) {
  const buttonClass = `button button--${variant} ${className}`;

  if (to) {
    return (
      <Link to={to} className={buttonClass}>
        {children}
      </Link>
    );
  }

  return <button className={buttonClass}>{children}</button>;
}

export default Button;
