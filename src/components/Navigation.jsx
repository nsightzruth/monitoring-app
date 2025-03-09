import { useState, useEffect, useRef } from 'react';
import '../styles/Navigation.css';

const Navigation = ({ user, currentPage, onNavigation, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavClick = (page) => {
    onNavigation(page);
    setMenuOpen(false);
  };

  return (
    <nav className="app-navigation">
      <div className="nav-logo">
        <img src="/nsightz-logo.png" alt="Nsightz Logo" className="logo-image" />
      </div>
      
      {user && (
        <div className="nav-menu-container" ref={menuRef}>
          <button className="hamburger-button" onClick={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          {menuOpen && (
            <div className="dropdown-menu">
              <button 
                className={`nav-link ${currentPage === 'referrals' ? 'active' : ''}`}
                onClick={() => handleNavClick('referrals')}
              >
                Referrals
              </button>
              <button 
                className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
                onClick={() => handleNavClick('admin')}
              >
                Admin
              </button>
              <div className="menu-divider"></div>
              <button onClick={onLogout} className="logout-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;