import React, { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import eisLogo from '../../assets/images/EIS_LOGO.png';

interface NavigationProps {
  onSearchOpen: () => void;
  onPhoneClick: () => void;
}

export function Navigation({ onSearchOpen, onPhoneClick }: NavigationProps) {
  const [navOpen, setNavOpen] = useState(false);

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
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#home" onClick={closeNav}>Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#drinkware" onClick={closeNav}>Drinkwares</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#kitchenware" onClick={closeNav}>Kitchenwares</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#umbrellasAndBags" onClick={closeNav}>Umbrellas & Bags</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#capsAndApparel" onClick={closeNav}>Caps & Apparel</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#notebooksAndPens" onClick={closeNav}>Notebooks & Pens</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#accessories" onClick={closeNav}>Accessories</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#digital" onClick={closeNav}>Digital & Large Format</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#setsAndBundles" onClick={closeNav}>Sets & Bundles</a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-uppercase" href="#about" onClick={closeNav}>About Us</a>
            </li>
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
