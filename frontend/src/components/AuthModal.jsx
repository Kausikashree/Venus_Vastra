import { useState } from "react";
import { api } from "../api";

export default function AuthModal({ mode, onClose, onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      onAuthenticated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <span className="eyebrow">VENUS VASTRA</span>
        <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
        <p className="muted">Save favourites and enjoy a smoother shopping experience.</p>
        <form onSubmit={submit} className="auth-form">
          {!isLogin && (
            <label>Name<input required minLength="2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          )}
          <label>Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Password<input required minLength="8" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <div className="form-error">{error}</div>}
          <button className="btn btn-primary" disabled={loading}>{loading ? "Please wait…" : isLogin ? "Sign in" : "Create account"}</button>
        </form>
        <button className="text-button" onClick={() => { setError(""); setIsLogin(!isLogin); }}>
          {isLogin ? "New to Venus Vastra? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
