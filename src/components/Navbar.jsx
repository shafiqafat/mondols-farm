import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo" onClick={closeMenu}>
          MONDOL'S FARM
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar__links">
          <Link to="/farm">Farm</Link>
          <Link to="/stay">Stay</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/journal">Journal</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        {/* Desktop CTA */}
        <Link to="/stay" className="navbar__cta">
          Book a Stay
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="navbar__menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}>
        <nav className="mobile-menu__links">
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          <Link to="/farm" onClick={closeMenu}>
            Farm
          </Link>

          <Link to="/stay" onClick={closeMenu}>
            Stay
          </Link>

          <Link to="/shop" onClick={closeMenu}>
            Shop
          </Link>

          <Link to="/journal" onClick={closeMenu}>
            Journal
          </Link>

          <Link to="/about" onClick={closeMenu}>
            About
          </Link>

          <Link to="/contact" onClick={closeMenu}>
            Contact
          </Link>
        </nav>

        <Link to="/stay" className="mobile-menu__cta" onClick={closeMenu}>
          Book a Stay
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
