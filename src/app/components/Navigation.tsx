import React, { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import eisLogo from '../../assets/images/EIS_LOGO.png';

interface NavigationProps {
  onSearchOpen: () => void;
  onPhoneClick: () => void;
  categories?: Array<{ name: string; slug: string }>;
}

const fallbackCategories = [
  { name: 'Home', slug: 'home' },
  { name: 'Drinkwares', slug: 'drinkware' },
  { name: 'Kitchenwares', slug: 'kitchenware' },
  { name: 'Umbrellas & Bags', slug: 'umbrellasAndBags' },
  { name: 'Caps & Apparel', slug: 'capsAndApparel' },
  { name: 'Notebooks & Pens', slug: 'notebooksAndPens' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Digital & Large Format', slug: 'digital' },
  { name: 'Sets & Bundles', slug: 'setsAndBundles' },
  { name: 'About Us', slug: 'about' },
];

export function Navigation({ onSearchOpen, onPhoneClick, categories }: NavigationProps) {
  const [navOpen, setNavOpen] = useState(false);
  // Always render the original top-level categories in the original order
  const navItems = fallbackCategories;

  const toggleNav = () => setNavOpen((current) => !current);
  const closeNav = () => setNavOpen(false);

  return (
    <nav className="navbar navbar-dark navbar-expand-md fixed-top">
      <div className="container-fluid d-flex align-items-center">
        <a className="navbar-brand me-4" href="#home" onClick={closeNav}>
          <img
            src={eisLogo}
            alt="EIS Logo"
            style={{ height: '40px' }}
          />
        </a>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
          onClick={toggleNav}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${navOpen ? ' show' : ''}`} id="navbarNav">
          <ul className="navbar-nav mx-auto">
            {navItems.map((item) => {
              const href = item.slug === 'home' ? '#home' : `#${item.slug}`;
              return (
                <li key={item.slug} className="nav-item">
                  <a className="nav-link text-uppercase" href={href} onClick={closeNav}>{item.name}</a>
                </li>
              );
            })}
          </ul>
          <div className="d-flex gap-3 ms-auto d-md-none">
            <button className="btn btn-link text-dark" aria-label="Search" onClick={() => { onSearchOpen(); closeNav(); }}>
              <i className="bi bi-search"></i>
            </button>
            <button className="btn btn-link text-dark" aria-label="Phone" onClick={() => { onPhoneClick(); closeNav(); }}>
              <i className="bi bi-telephone"></i>
            </button>
          </div>
        </div>
        <div className="d-none d-md-flex gap-3 ms-auto">
          <button className="btn btn-link text-dark" aria-label="Search" onClick={onSearchOpen}>
            <i className="bi bi-search"></i>
          </button>
          <button className="btn btn-link text-dark" aria-label="Phone" onClick={onPhoneClick}>
            <i className="bi bi-telephone"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
