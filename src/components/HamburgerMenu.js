import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HamburgerMenu.module.css';

function HamburgerMenu({ isOpen, toggleMenu }) {
  return (
    <>
      <button 
        className={`${styles.hamburger} ${isOpen ? styles.open : ''}`} 
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* メニューの内容 */}
      <div className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}>
        <div className={styles.menuHeader}>
          <span className={styles.menuTitle}>メニュー</span>
          <button 
            className={styles.closeButton}
            onClick={toggleMenu}
          >
            ✕
          </button>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.menuList}>
            <li>
              <Link to="/send" className={styles.menuItem}>
                送金
              </Link>
            </li>
            <li>
              <Link to="/history" className={styles.menuItem}>
                取引履歴
              </Link>
            </li>
            <li>
              <Link to="/profile" className={styles.menuItem}>
                プロフィール
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* オーバーレイ */}
      {isOpen && (
        <div className={styles.overlay} onClick={toggleMenu}></div>
      )}
    </>
  );
}

export default HamburgerMenu;