import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api/client";
const blank = {
  houseName: "",
  price: "",
  location: "",
  rating: "5",
  description: "",
};
export function HostDashboard() {
  const [homes, setHomes] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const load = () =>
    api
      .get("/host/homes")
      .then((r) => setHomes(r.data.homes))
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);
  const remove = async (home) => {
    if (!window.confirm(`Delete “${home.houseName}”? This cannot be undone.`))
      return;
    try {
      await api.delete(`/host/homes/${home._id}`);
      setHomes((old) => old.filter((h) => h._id !== home._id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <main className="container page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SPACE, YOUR STORY</span>
          <h1>Host dashboard</h1>
          <p className="muted">
            Manage your listings and keep your homes up to date.
          </p>
        </div>
        <Link className="btn btn-dark" to="/host/new">
          ＋ Add a home
        </Link>
      </div>
      {error && <p className="alert">{error}</p>}
      {homes.length ? (
        <div className="host-list">
          {homes.map((home) => (
            <article className="host-row" key={home._id}>
              <img src={home.photo} alt={home.houseName} />
              <div className="host-row-info">
                <h3>{home.houseName}</h3>
                <p className="muted">{home.location}</p>
                <p>
                  <strong>₹{Number(home.price).toLocaleString("en-IN")}</strong>{" "}
                  / night · ★ {home.rating}
                </p>
              </div>
              <div className="host-row-actions">
                <Link
                  className="btn btn-outline small"
                  to={`/host/edit/${home._id}`}
                >
                  Edit
                </Link>
                <button
                  className="btn btn-danger small"
                  onClick={() => remove(home)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span>⌂</span>
          <h3>Your hosting journey starts here</h3>
          <p>Add your first home to show it to travellers.</p>
          <Link to="/host/new" className="btn btn-dark">
            List your first home
          </Link>
        </div>
      )}
    </main>
  );
}
export function HostHomeForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState(blank);
  const [photo, setPhoto] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (editing)
      api
        .get(`/homes/${id}`)
        .then(({ data }) => {
          const h = data.home;
          setValues({
            houseName: h.houseName || "",
            price: h.price ?? "",
            location: h.location || "",
            rating: h.rating ?? 5,
            description: h.description || "",
          });
          setCurrentPhoto(h.photo || "");
        })
        .catch((e) => setError(errorMessage(e)));
  }, [id, editing]);
  const change = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body = new FormData();
      Object.entries(values).forEach(([k, v]) => body.append(k, v));
      if (photo) body.append("photo", photo);
      if (editing) {
        await api.put(`/host/homes/${id}`, body);
      } else {
        await api.post("/host/homes", body);
      }
      navigate("/host");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="container page form-page">
      <Link to="/host" className="text-link">
        ← Back to dashboard
      </Link>
      <section className="property-form">
        <span className="eyebrow">HOST YOUR PLACE</span>
        <h1>{editing ? "Edit your home" : "List a new home"}</h1>
        <p className="muted">
          Share the details that help guests picture their stay.
        </p>
        <form className="form-stack" onSubmit={submit}>
          {error && <div className="alert">{error}</div>}
          <label>
            Home name
            <input
              name="houseName"
              required
              value={values.houseName}
              onChange={change}
              placeholder="e.g. Sunny garden apartment"
            />
          </label>
          <div className="form-two">
            <label>
              Price per night (₹)
              <input
                name="price"
                type="number"
                min="0"
                required
                value={values.price}
                onChange={change}
                placeholder="2500"
              />
            </label>
            <label>
              Rating (0–5)
              <input
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                required
                value={values.rating}
                onChange={change}
              />
            </label>
          </div>
          <label>
            Location
            <input
              name="location"
              required
              value={values.location}
              onChange={change}
              placeholder="City, neighbourhood"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              rows="4"
              value={values.description}
              onChange={change}
              placeholder="What makes your home special?"
            />
          </label>
          <label>
            Property photo{" "}
            <span className="muted">
              (JPG or PNG)
              {editing
                ? " · optional when keeping the current photo"
                : " · required"}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              required={!editing}
              onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />
          </label>
          {currentPhoto && !photo && (
            <img
              className="current-photo"
              src={currentPhoto}
              alt="Current property"
            />
          )}
          {photo && <p className="muted">Selected: {photo.name}</p>}
          <button className="btn btn-dark full" disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Publish home"}{" "}
            <span>→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
