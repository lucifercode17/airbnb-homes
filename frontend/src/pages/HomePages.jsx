import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import HomeCard from "../components/HomeCard";

export function Landing() {
  const [homes, setHomes] = useState([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    api
      .get("/homes")
      .then((r) => {
      const data = r.data?.homes;
      setHomes(Array.isArray(data) ? data : []);
    })
    .catch((err) => {
      console.error("Failed to fetch homes:", err);
      setHomes([]);
    });
}, []);

const filtered = homes.filter((h) =>
  `${h.houseName ?? ""} ${h.location ?? ""}`
    .toLowerCase()
    .includes(query.toLowerCase()),
);
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">YOUR NEXT GETAWAY STARTS HERE</span>
          <h1>
            Find a place
            <br />
            to <em>belong.</em>
          </h1>
          <p>Discover thoughtfully hosted homes for every kind of trip.</p>
          <div className="search-bar">
            <span>⌕</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by destination or home name"
            />
            <a href="#stays" className="search-button">
              Explore
            </a>
          </div>
          <div className="hero-note">
            <span>✦ Carefully listed homes</span>
            <span>✦ Simple, welcoming stays</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-sun" />
          <div className="art-house">
            <div className="roof" />
            <div className="house-body">
              <div className="window w1" />
              <div className="window w2" />
              <div className="door" />
            </div>
          </div>
          <div className="art-card">
            <span>✦ Guest favourite</span>
            <strong>Make room for a little wonder.</strong>
          </div>
        </div>
      </section>
      <section className="section container" id="stays">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HANDPICKED FOR YOU</span>
            <h2>Places worth staying for</h2>
            <p className="muted">Explore homes hosted by people who care.</p>
          </div>
          <Link className="text-link" to="/homes">
            See all homes ↗
          </Link>
        </div>
        {filtered.length ? (
          <div className="home-grid">
            {filtered.slice(0, 6).map((home) => (
              <HomeCard key={home._id} home={home} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>⌂</span>
            <h3>No homes found just yet</h3>
            <p>Try another search, or check back soon.</p>
          </div>
        )}
      </section>
      <section className="host-banner container">
        <div>
          <span className="eyebrow">HAVE A PLACE TO SHARE?</span>
          <h2>
            Your home could be
            <br />
            someone’s favourite trip.
          </h2>
          <p>Become a host and share what makes your place special.</p>
        </div>
        <Link to="/signup" className="btn btn-light">
          Become a host <span>↗</span>
        </Link>
      </section>
    </>
  );
}
export function Homes() {
  const [homes, setHomes] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    api
      .get("/homes")
      .then((r) => setHomes(r.data.homes))
      .catch((e) => setError(errorMessage(e)));
  }, []);
  const favourite = async (home) => {
    if (!user) return navigate("/login");
    try {
      await api.post(`/favourites/${home._id}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const filtered = homes.filter((h) =>
    `${h.houseName} ${h.location}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main className="container page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE COLLECTION</span>
          <h1>Explore all homes</h1>
          <p className="muted">Find a space that feels like yours.</p>
        </div>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search homes or locations…"
        />
      </div>
      {error && <p className="alert">{error}</p>}
      {filtered.length ? (
        <div className="home-grid">
          {filtered.map((home) => (
            <HomeCard key={home._id} home={home} onFavourite={favourite} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>⌂</span>
          <h3>No homes to show</h3>
          <p>There are no matching homes yet.</p>
        </div>
      )}
    </main>
  );
}
export function HomeDetails() {
  const { id } = useParams();
  const [home, setHome] = useState(null);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    api
      .get(`/homes/${id}`)
      .then((r) => setHome(r.data.home))
      .catch((e) => setError(errorMessage(e)));
  }, [id]);
  const addFavourite = async () => {
    if (!user) return navigate("/login");
    try {
      const r = await api.post(`/favourites/${id}`);
      setError(r.data.message);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  if (error && !home)
    return (
      <main className="container page">
        <div className="alert">{error}</div>
        <Link to="/homes" className="text-link">
          ← Back to homes
        </Link>
      </main>
    );
  if (!home)
    return (
      <main className="container page">
        <div className="loading">Finding your stay…</div>
      </main>
    );
  const image = home.photo
  ? (/^https?:\/\//i.test(home.photo) || home.photo.startsWith("/")
      ? home.photo
      : `/${home.photo}`)
  : "";
  return (
    <main className="container page details-page">
      <Link to="/homes" className="text-link">
        ← Back to homes
      </Link>
      <div className="details-grid">
        <div className="details-photo">
          {image && <img src={image} alt={home.houseName} />}
        </div>
        <section className="details-info">
          <span className="eyebrow">A PLACE TO CALL YOURS</span>
          <h1>{home.houseName}</h1>
          <p className="muted">⌖ {home.location}</p>
          <p className="detail-rating">
            ★ {home.rating} <span className="muted">/ 5 rating</span>
          </p>
          <div className="thin-line" />
          <h3>About this place</h3>
          <p className="detail-description">
            {home.description || "A welcoming home for your next adventure."}
          </p>
          <div className="price-box">
            <div>
              <strong>₹{Number(home.price).toLocaleString("en-IN")}</strong>
              <span className="muted"> / night</span>
            </div>
            <button className="btn btn-dark" onClick={addFavourite}>
              ♡ Save to favourites
            </button>
          </div>
          {error && <p className="success-message">{error}</p>}
        </section>
      </div>
    </main>
  );
}
export function Favourites() {
  const [homes, setHomes] = useState([]);
  const [error, setError] = useState("");
  const load = () =>
    api
      .get("/favourites")
      .then((r) => setHomes(r.data.homes))
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);
  const remove = async (home) => {
    try {
      await api.delete(`/favourites/${home._id}`);
      setHomes((old) => old.filter((h) => h._id !== home._id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <main className="container page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SAVED PLACES</span>
          <h1>Favourites</h1>
          <p className="muted">Keep the stays you love close by.</p>
        </div>
      </div>
      {error && <p className="alert">{error}</p>}
      {homes.length ? (
        <div className="home-grid">
          {homes.map((home) => (
            <HomeCard
              key={home._id}
              home={home}
              favourite
              onFavourite={remove}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>♡</span>
          <h3>Your favourites live here</h3>
          <p>Save a home you love and it will show up here.</p>
          <Link className="btn btn-dark" to="/homes">
            Explore homes
          </Link>
        </div>
      )}
    </main>
  );
}
