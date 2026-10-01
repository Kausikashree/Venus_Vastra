import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const emptyProduct = {
  name: "",
  category: "Soft Silk",
  note: "",
  description: "",
  image_url: "",
  price: "",
  compare_at_price: "",
  is_active: true,
  is_featured: false,
};

function productPayload(form) {
  return {
    ...form,
    price: form.price ? Number(form.price) : null,
    compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
  };
}

function formatPrice(price) {
  return price == null ? "Not set" : `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem("vv_admin_token"));
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadProducts(accessToken) {
    const currentUser = await api.me(accessToken);
    if (!currentUser.is_admin) throw new Error("This account does not have administrator access.");
    const catalogue = await api.adminProducts(accessToken);
    setProducts(catalogue);
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    loadProducts(token)
      .catch((err) => {
        localStorage.removeItem("vv_admin_token");
        setToken(null);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function signIn(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await api.login({ email, password });
      if (!result.user.is_admin) throw new Error("This account does not have administrator access.");
      localStorage.setItem("vv_admin_token", result.access_token);
      setToken(result.access_token);
      setProducts(await api.adminProducts(result.access_token));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({
      ...product,
      price: product.price ?? "",
      compare_at_price: product.compare_at_price ?? "",
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (editingId) {
        await api.updateProduct(token, editingId, productPayload(form));
        setNotice("Product updated.");
      } else {
        await api.createProduct(token, productPayload(form));
        setNotice("Product created.");
      }
      setProducts(await api.adminProducts(token));
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    setError("");
    try {
      await api.deleteProduct(token, product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingId === product.id) resetForm();
      setNotice("Product deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await api.uploadProductImage(token, file);
      setForm((current) => ({ ...current, image_url: result.image_url }));
      setNotice("Image uploaded.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function signOut() {
    localStorage.removeItem("vv_admin_token");
    setToken(null);
    setProducts([]);
    resetForm();
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <Link className="wordmark" to="/">VENUS <span>V</span>ASTRA</Link>
        <div className="admin-header-actions">
          <span>Store administration</span>
          {token && <button className="ghost-button" onClick={signOut}>Sign out</button>}
          <Link to="/">View storefront ↗</Link>
        </div>
      </header>

      {!token ? (
        <section className="admin-login">
          <span className="eyebrow">Venus Vastra</span>
          <h1>Administrator sign in</h1>
          <p>Use the administrator email and password configured for this deployment.</p>
          <form onSubmit={signIn}>
            <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            {error && <p className="admin-error" role="alert">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
        </section>
      ) : loading ? (
        <p className="admin-loading">Loading catalogue…</p>
      ) : (
        <div className="admin-content">
          <section className="admin-intro">
            <div><span className="eyebrow">Catalogue</span><h1>Products</h1></div>
            <p>{products.length} products · Manage prices, images, and storefront visibility</p>
          </section>

          <div className="admin-layout">
            <section className="admin-form-panel">
              <div className="admin-panel-heading"><h2>{editingId ? "Edit product" : "Add product"}</h2>{editingId && <button className="admin-text-button" onClick={resetForm}>Cancel edit</button>}</div>
              <form className="admin-product-form" onSubmit={saveProduct}>
                <label>Product name<input required minLength="2" maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
                <div className="admin-form-row">
                  <label>Category<input required list="product-categories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /><datalist id="product-categories"><option>Soft Silk</option><option>Kalyani Cotton</option></datalist></label>
                  <label>Collection note<input maxLength="160" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></label>
                </div>
                <label>Description<textarea rows="3" maxLength="2000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
                <div className="admin-form-row">
                  <label>Current price (₹)<input type="number" min="1" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Leave empty until confirmed" /></label>
                  <label>Original price (₹)<input type="number" min="1" step="1" value={form.compare_at_price} onChange={(event) => setForm({ ...form, compare_at_price: event.target.value })} placeholder="Optional strike-through price" /></label>
                </div>
                <label>Product image path<input required maxLength="500" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="/images/product-name.jpg" /></label>
                <label className="admin-upload">Upload a product image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} /><span>{uploading ? "Uploading…" : "JPG, PNG or WebP · up to 8 MB"}</span></label>
                {form.image_url && <img className="admin-image-preview" src={form.image_url} alt="Product preview" />}
                <div className="admin-switches">
                  <label><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> Visible in store</label>
                  <label><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} /> Feature on home page</label>
                </div>
                {error && <p className="admin-error" role="alert">{error}</p>}
                {notice && <p className="admin-notice" role="status">{notice}</p>}
                <button className="btn btn-primary" type="submit" disabled={busy || uploading}>{busy ? "Saving…" : editingId ? "Save changes" : "Create product"}</button>
              </form>
            </section>

            <section className="admin-catalogue">
              <div className="admin-panel-heading"><h2>Store catalogue</h2><span>{products.filter((product) => product.is_active).length} visible</span></div>
              <div className="admin-product-list">
                {products.map((product) => (
                  <article className="admin-product-row" key={product.id}>
                    <img src={product.image_url} alt="" />
                    <div className="admin-product-summary"><span>{product.category}{!product.is_active && " · Hidden"}</span><strong>{product.name}</strong><small>{formatPrice(product.price)}{product.compare_at_price ? ` · Was ${formatPrice(product.compare_at_price)}` : ""}</small></div>
                    <div className="admin-product-actions"><button type="button" onClick={() => editProduct(product)}>Edit</button><button type="button" className="admin-delete" onClick={() => deleteProduct(product)}>Delete</button></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}