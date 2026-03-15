import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import '../styles/AppLayout.css';

type CommentsLocationState = {
  returnTo?: string;
};

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const locationState = location.state as CommentsLocationState | null;

  const resolveLinkClassName = (targetPath: string) => {
    const isDirectMatch = location.pathname === targetPath || location.pathname.startsWith(`${targetPath}/`);
    const isCommentsMatch = location.pathname.startsWith('/posts/') && location.pathname.endsWith('/comments') && (locationState?.returnTo ?? '/feed') === targetPath;
    const isActive = isDirectMatch || isCommentsMatch;

    return `app-navbar__link${isActive ? ' app-navbar__link--active' : ''}`;
  };

  const handleNavigate = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Navbar expand="lg" expanded={isMenuOpen} className="app-navbar">
          <Container fluid className="gap-3">
            <Navbar.Brand as={NavLink} to="/feed" className="app-navbar__brand">
              BEERanking
            </Navbar.Brand>

            <Navbar.Toggle
              className="ms-auto app-navbar__toggler"
              aria-controls="beeranking-navbar"
              onClick={() => setIsMenuOpen((current) => !current)}
            />

            <Navbar.Collapse id="beeranking-navbar" className="app-navbar__collapse">
              <Nav className="gap-2 mx-lg-auto my-3 my-lg-0 align-items-stretch align-items-lg-center">
                <NavLink to="/feed" onClick={handleNavigate} className={() => resolveLinkClassName('/feed')}>
                  Feed
                </NavLink>
                <NavLink to="/my-posts" onClick={handleNavigate} className={() => resolveLinkClassName('/my-posts')}>
                  My posts
                </NavLink>
                <NavLink to="/create-post" onClick={handleNavigate} className={() => resolveLinkClassName('/create-post')}>
                  Create post
                </NavLink>
                <NavLink to="/profile" onClick={handleNavigate} className={() => resolveLinkClassName('/profile')}>
                  Profile
                </NavLink>
              </Nav>
            </Navbar.Collapse>

            <img src="/beer-cheers.png" alt="BEERanking beers" className="app-navbar__logo" />
          </Container>
        </Navbar>
      </header>

      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;