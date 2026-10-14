import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../api/client";
function AuthLayout({ eyebrow, title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">⌂</span> airbnb<span>homes</span>
        </div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </section>
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          <span className="eyebrow">A LITTLE SPACE, A LOT OF POSSIBILITY</span>
          <h2>
            Travel is better
            <br />
            when you feel
            <br />
            <em>at home.</em>
          </h2>
          <p>Discover places made memorable by the people who welcome you.</p>
          <div className="aside-stamp">
            stay curious <span>✦</span>
          </div>
        </div>
      </aside>
    </main>
  );
}
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(values);
      navigate(location.state?.from || (user.role === "host" ? "/host" : "/"), {
        replace: true,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout
      eyebrow="WELCOME BACK"
      title="Good to see you."
      subtitle="Sign in to pick up where you left off."
    >
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
            value={values.password}
            onChange={(e) => setValues({ ...values, password: e.target.value })}
          />
        </label>
        <button className="btn btn-dark full" disabled={busy}>
          {busy ? "Signing in…" : "Log in"} <span>→</span>
        </button>
      </form>
      <p className="auth-switch">
        New around here? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(values);

      navigate("/verify-email", {
        state: { email: values.email.trim().toLowerCase() },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout
      eyebrow="COME ON IN"
      title="Make yourself at home."
      subtitle="Create an account to explore stays or host your own."
    >
      <form className="form-stack" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}
        <div className="form-two">
          <label>
            First name
            <input
              name="firstname"
              required
              minLength="2"
              value={values.firstname}
              onChange={change}
              placeholder="First name"
            />
          </label>
          <label>
            Last name
            <input
              name="lastname"
              value={values.lastname}
              onChange={change}
              placeholder="Last name"
            />
          </label>
        </div>
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            value={values.email}
            onChange={change}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            value={values.password}
            onChange={change}
            placeholder="Uppercase, lowercase, number & ! @ or &"
          />
        </label>
        <label>
          Confirm password
          <input
            name="confirmPassword"
            type="password"
            required
            value={values.confirmPassword}
            onChange={change}
            placeholder="Repeat your password"
          />
        </label>
        <fieldset className="role-field">
          <legend>I want to…</legend>
          <label
            className={`role-option ${values.role === "user" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="role"
              value="user"
              checked={values.role === "user"}
              onChange={change}
            />
            <span>Explore stays</span>
          </label>
          <label
            className={`role-option ${values.role === "host" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="role"
              value="host"
              checked={values.role === "host"}
              onChange={change}
            />
            <span>Host a home</span>
          </label>
        </fieldset>
        <button className="btn btn-dark full" disabled={busy}>
          {busy ? "Creating account…" : "Create account"} <span>→</span>
        </button>
      </form>
      <p className="auth-switch">
        Already a member? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
export function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the complete 6-digit verification code.");
      return;
    }

    if (!normalizedEmail) {
      setError("Enter the email address used to create your account.");
      return;
    }

    setBusy(true);

    try {
      await api.post("/auth/verify-email", {
        email: normalizedEmail,
        otp,
      });

      navigate("/login", {
        replace: true,
        state: {
          notice: "Email verified successfully. You can now log in.",
          email: normalizedEmail,
        },
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="ONE QUICK CHECK"
      title="Verify your email."
      subtitle="Enter the 6-digit code we sent to your email address."
    >
      <form className="form-stack" onSubmit={submit}>
        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="success-message" role="status">
            {message}
          </div>
        )}

        <label>
          Email address
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <label>
          Verification code
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Six-digit email verification code"
            placeholder="123456"
            required
            maxLength={6}
            pattern="[0-9]{6}"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
          />
        </label>

        <button
          className="btn btn-dark full"
          type="submit"
          disabled={busy || otp.length !== 6 || !email.trim()}
        >
          {busy ? "Verifying…" : "Verify email"}
          <span>→</span>
        </button>
      </form>

      <p className="auth-switch">
        Used the wrong email? <Link to="/signup">Create an account again</Link>
      </p>
    </AuthLayout>
  );
}
