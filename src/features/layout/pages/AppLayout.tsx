import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import '../styles/AppLayout.css';

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigate = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <nav className="navbar navbar-expand-lg app-navbar">
          <div className="container-fluid d-flex align-items-center gap-3">
            <NavLink to="/feed" className="app-navbar__brand">
              BEERanking
            </NavLink>

            <button
              className="navbar-toggler ms-auto app-navbar__toggler"
              type="button"
              aria-controls="beeranking-navbar"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation"
              onClick={() => setIsMenuOpen((current) => !current)}
            >
              <span className="navbar-toggler-icon" />
            </button>

            <div className={`navbar-collapse app-navbar__collapse${isMenuOpen ? ' app-navbar__collapse--open' : ''}`} id="beeranking-navbar">
              <div className="navbar-nav gap-2 mx-lg-auto my-3 my-lg-0 align-items-stretch align-items-lg-center">
                <NavLink to="/feed" onClick={handleNavigate} className={({ isActive }) => `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`}>
                  Feed
                </NavLink>
                <NavLink to="/my-posts" onClick={handleNavigate} className={({ isActive }) => `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`}>
                  My posts
                </NavLink>
                <NavLink to="/create-post" onClick={handleNavigate} className={({ isActive }) => `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`}>
                  Create post
                </NavLink>
                <NavLink to="/profile" onClick={handleNavigate} className={({ isActive }) => `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`}>
                  Profile
                </NavLink>
              </div>
            </div>

            <img src="/beer-cheers.png" alt="BEERanking beers" className="app-navbar__logo" />
          </div>
        </nav>
      </header>

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;