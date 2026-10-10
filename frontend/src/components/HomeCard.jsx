import { Link } from "react-router-dom";
export default function HomeCard({ home, favourite = false, onFavourite }) {
  const image = home.photo
  ? (/^https?:\/\//i.test(home.photo) || home.photo.startsWith("/")
      ? home.photo
      : `/${home.photo}`)
  : "";
  return (
    <article className="home-card">
      <Link to={`/homes/${home._id}`} className="card-image-wrap">
        {image ? (
          <img className="card-image" src={image} alt={home.houseName} />
        ) : (
          <div className="image-placeholder">⌂</div>
        )}
        <span className="rating">★ {home.rating || "New"}</span>
      </Link>
      <div className="card-body">
        <div className="card-title-row">
          <h3>{home.houseName}</h3>
          <button
            className={`heart ${favourite ? "active" : ""}`}
            onClick={() => onFavourite?.(home)}
            aria-label={favourite ? "Remove favourite" : "Add favourite"}
          >
            {favourite ? "♥" : "♡"}
          </button>
        </div>
        <p className="muted location">⌖ {home.location}</p>
        <p className="description">
          {home.description || "A comfortable place for your next stay."}
        </p>
        <div className="card-footer">
          <p>
            <strong>₹{Number(home.price).toLocaleString("en-IN")}</strong>{" "}
            <span className="muted">/ night</span>
          </p>
          <Link to={`/homes/${home._id}`} className="text-link">
            View details ↗
          </Link>
        </div>
      </div>
    </article>
  );
}
