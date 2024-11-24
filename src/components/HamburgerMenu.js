import React from 'react';

function HamburgerMenu({ isOpen, toggleMenu }) {
  return (
    <button className={`hamburger ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
      <span></span>
      <span></span>
      <span></span>
    </button>
  );
}

export default HamburgerMenu;