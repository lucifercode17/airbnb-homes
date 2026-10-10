import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";
import { Landing, Homes, HomeDetails, Favourites } from "./pages/HomePages";
import { Login, Signup } from "./pages/AuthPages";
import { HostDashboard, HostHomeForm } from "./pages/HostPages";
function Protected({ children, host = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="loading">Getting things ready…</main>;
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (host && user.role !== "host") return <Navigate to="/" replace />;
  return children;
}
function Layout() {
  const { loading } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/homes" element={<Homes />} />
        <Route path="/homes/:id" element={<HomeDetails />} />
        <Route
          path="/login"
          element={
            loading ? (
              <main className="loading">Getting things ready…</main>
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/signup"
          element={
            loading ? (
              <main className="loading">Getting things ready…</main>
            ) : (
              <Signup />
            )
          }
        />
        <Route
          path="/favourites"
          element={
            <Protected>
              <Favourites />
            </Protected>
          }
        />
        <Route
          path="/host"
          element={
            <Protected host>
              <HostDashboard />
            </Protected>
          }
        />
        <Route
          path="/host/new"
          element={
            <Protected host>
              <HostHomeForm />
            </Protected>
          }
        />
        <Route
          path="/host/edit/:id"
          element={
            <Protected host>
              <HostHomeForm />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <main className="container page">
              <div className="empty-state">
                <h1>Page not found</h1>
                <p>Let's get you back to somewhere lovely.</p>
                <a className="btn btn-dark" href="/">
                  Go home
                </a>
              </div>
            </main>
          }
        />
      </Routes>
      <footer className="footer">
        <div className="container footer-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">⌂</span> airbnb<span>homes</span>
          </Link>
          <p>
            Find your place in the world. <span>© 2026 Airbnb Homes</span>
          </p>
        </div>
      </footer>
    </>
  );
}
export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
