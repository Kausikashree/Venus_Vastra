import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthModal from "../components/AuthModal";
import { api } from "../api";

const WHATSAPP_URL =
  "https://wa.me/917010031532?text=Hi%2CCan%20I%20get%20more%20info%20about%20this%3F";
const INSTAGRAM_URL =
  "https://www.instagram.com/venus_vastra?utm_source=qr&stkn=dm1qYTVxNjVoZzF6";

function ProductPrice({ product }) {
  if (product.price == null) return <strong className="price-on-request">Price on request</strong>;

  return (
    <span className="product-price-stack">
      {product.compare_at_price > product.price && (
        <s>₹{Number(product.compare_at_price).toLocaleString("en-IN")}</s>
      )}
      <strong>₹{Number(product.price).toLocaleString("en-IN")}</strong>
    </span>
  );
}

function ProductImage({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="image-fallback">
        <span>Add {src.split("/").pop()}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

export default function Collection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [submittedSearch, setSubmittedSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    api.products().then(setProducts).catch((error) => setLoadError(error.message));

    const token =
      localStorage.getItem("vv_token");

    if (!token) return;

    api
      .me(token)
      .then(setUser)
      .catch(() =>
        localStorage.removeItem("vv_token")
      );
  }, []);

  const categories = ["All", ...new Set(products.map((product) => product.category))];
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const query = submittedSearch.trim().toLowerCase();
    const matchesSearch = !query || `${product.name} ${product.note} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  function submitSearch(event) {
    event.preventDefault();
    setSubmittedSearch(searchTerm);
    const nextParams = {};
    if (selectedCategory !== "All") nextParams.category = selectedCategory;
    if (searchTerm.trim()) nextParams.search = searchTerm.trim();
    setSearchParams(nextParams);
  }

  function selectCategory(category) {
    setSelectedCategory(category);
    const nextParams = {};
    if (category !== "All") nextParams.category = category;
    if (submittedSearch.trim()) nextParams.search = submittedSearch.trim();
    setSearchParams(nextParams);
  }

  const firstName = useMemo(
    () => user?.name?.split(" ")[0],
    [user]
  );

  function onAuthenticated(data) {
    localStorage.setItem(
      "vv_token",
      data.access_token
    );

    setUser(data.user);
    setAuthMode(null);
  }

  function logout() {
    localStorage.removeItem("vv_token");
    setUser(null);
  }

  function toggleFavourite(id) {
    if (!user) {
      setAuthMode("login");
      return;
    }

    setFavourites((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  }

  return (
    <>

      {/* HEADER */}

      <header className="site-header">

        <Link
          className="wordmark"
          to="/"
        >
          VENUS <span>V</span>ASTRA
        </Link>

        <nav>

          <Link
            className="active-nav"
            to="/collection"
          >
            Collection
          </Link>

          <Link to="/">
            Home
          </Link>

        </nav>

        <div className="header-actions">

          {user ? (
            <>

              <span className="hello">
                Hi, {firstName}
              </span>

              <button
                className="ghost-button"
                onClick={logout}
              >
                Logout
              </button>

            </>
          ) : (
            <button
              className="ghost-button"
              onClick={() =>
                setAuthMode("login")
              }
            >
              Sign in
            </button>
          )}

          <div className="header-socials">
            <a className="header-social-link" href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="View Venus Vastra on Instagram" title="Instagram">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" stroke="currentColor" strokeWidth="1.7"/><circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.7"/><circle cx="17.7" cy="6.5" r="1.1" fill="currentColor"/></svg>
            </a>
            <a className="header-social-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Chat with Venus Vastra on WhatsApp" title="WhatsApp">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="M9 8.3c.2-.4.4-.4.7-.4h.4c.2 0 .3.1.4.4l.6 1.4c.1.2 0 .4-.1.6l-.5.6c-.2.2-.1.4 0 .6.4.7 1 1.2 1.7 1.6.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.3.6c.3.1.4.3.4.5 0 .3-.2 1-.6 1.3-.4.4-1 .6-1.5.5-1-.2-2.2-.8-3.3-1.8-1.2-1.1-1.9-2.3-2.1-3.2-.2-.7.2-1.4.8-1.8Z" fill="currentColor"/></svg>
            </a>
          </div>

          <img
            className="header-logo"
            src="/images/logo.png"
            alt="Venus Vastra logo"
          />

        </div>

      </header>

      <main>

        {/* COLLECTION HERO */}

        <section className="collection-page-hero">

          <div className="section-shell">

            <Link
              to="/"
              className="back-home"
            >
              ← Back to Home
            </Link>

            <span className="eyebrow">
              VENUS VASTRA COLLECTION
            </span>

            <h1>
              Sarees for moments worth remembering.
            </h1>

            <p>
              Explore our complete collection of
              elegant soft silk sarees curated in
              statement colours, graceful textures
              and timeless drapes.
            </p>

          </div>

        </section>

        {/* ALL PRODUCTS */}

        <section className="collection-page-products">

          <div className="section-shell">

            <div className="collection-page-heading">

              <div>

                <span className="eyebrow">
                  ALL SAREES
                </span>

                <h2>
                  Explore the collection
                </h2>

              </div>

              <span className="product-count">
                {filteredProducts.length} Products
              </span>

            </div>

            <div className="collection-controls">
              <form className="collection-search" onSubmit={submitSearch} role="search">
                <label className="sr-only" htmlFor="collection-search">Search sarees</label>
                <input id="collection-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search sarees or fabric" />
                <button type="submit" aria-label="Search collection">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="1.6"/><path d="m16 16 4.3 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                </button>
              </form>
              <div className="category-filters" aria-label="Filter by category">
                {categories.map((category) => (
                  <button key={category} type="button" className={selectedCategory === category ? "selected" : ""} onClick={() => selectCategory(category)}>{category}</button>
                ))}
              </div>
            </div>

            {loadError && <p className="collection-error" role="alert">Unable to load products: {loadError}</p>}

            <div className="all-products-grid">

              {filteredProducts.map((product) => (

                <article
                  className="product-card"
                  key={product.id}
                >

                  <div className="product-image">

                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                    />

                    <button
                      className={`heart ${
                        favourites.includes(
                          product.id
                        )
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        toggleFavourite(
                          product.id
                        )
                      }
                      aria-label="Favourite"
                    >
                      ♡
                    </button>

                  </div>

                  <div className="product-info">

                    <div>

                      <span>{product.note || product.category}</span>

                      <h3>
                        {product.name}
                      </h3>

                    </div>

                    <ProductPrice product={product} />

                  </div>

                  <a
                    className="product-cta"
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enquire on WhatsApp
                    <span>↗</span>
                  </a>

                </article>

              ))}

              {filteredProducts.length === 0 && !loadError && (
                <p className="collection-empty">No products match these filters.</p>
              )}

            </div>

          </div>

        </section>

      </main>

      {/* FOOTER */}

      <footer>

        <div className="footer-brand">

          <img
            src="/images/logo.png"
            alt="Venus Vastra"
          />

          <div>

            <strong>
              VENUS VASTRA
            </strong>

            <span>
              Elegance, beautifully draped.
            </span>

          </div>

        </div>

        <div className="footer-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/collection">
            Collection
          </Link>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            
          >
            WhatsApp
          </a>

          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>

          <Link to="/admin">Admin</Link>

        </div>

        <span>
          © {new Date().getFullYear()} Venus Vastra
        </span>

      </footer>

      {/* WHATSAPP */}

      <a
        className="floating-whatsapp"
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
      >
        Chat on WhatsApp
      </a>

      {/* LOGIN */}

      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() =>
            setAuthMode(null)
          }
          onAuthenticated={
            onAuthenticated
          }
        />
      )}

    </>
  );
}