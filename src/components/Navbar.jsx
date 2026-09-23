import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navbarRef = useRef(null);
  const mobileMenuRef = useRef(null);

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

  useEffect(() => {
    const navbar = navbarRef.current;

    if (!navbar) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    gsap.fromTo(
      navbar,
      {
        y: -20,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
        delay: 0.1,
      },
    );
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
  };
    useEffect(() => {
      if (!menuOpen) return;

      const menu = mobileMenuRef.current;

      if (!menu) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const links = menu.querySelectorAll(".mobile-menu__links a");
      const cta = menu.querySelector(".mobile-menu__cta");

      gsap.fromTo(
        [...links, cta],
        {
          opacity: 0,
          y: 15,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.06,
          delay: 0.12,
          ease: "power3.out",
        },
      );
    }, [menuOpen]);

  return (
    <header
      ref={navbarRef}
      className={`navbar ${scrolled ? "navbar--scrolled" : ""}`}
    >
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
          <span>→</span>
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
      <div
        ref={mobileMenuRef}
        className={`mobile-menu ${menuOpen ? "mobile-menu--open" : ""}`}
      >
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
          <span>→</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
