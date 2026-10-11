import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      /* keep current page if request fails */
    }
  };
  return (
    <header className="nav-wrap">
      <nav className="navbar container">
        <Link className="brand" to="/">
          <span className="brand-mark">⌂</span> airbnb<span>homes</span>
        </Link>
        <div className="nav-links">
          <NavLink to="/homes">Explore stays</NavLink>
          {user && <NavLink to="/favourites">Favourites</NavLink>}
          {user?.role === "host" && (
            <NavLink to="/host">Host dashboard</NavLink>
          )}
        </div>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="welcome">Hi, {user.firstname}</span>
              {user.role === "host" && (
                <Link className="btn btn-outline small" to="/host/new">
                  List a home
                </Link>
              )}
              <button className="btn btn-outline small" onClick={signOut}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">
                Log in
              </Link>
              <Link to="/signup" className="btn btn-dark small">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
