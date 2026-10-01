import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

export default function Home() {
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(null);
  const [favourites, setFavourites] = useState([]);
  const [products, setProducts] = useState([]);

  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [contactStatus, setContactStatus] = useState("");

  useEffect(() => {
    api.products().then(setProducts).catch(() => setProducts([]));

    const token = localStorage.getItem("vv_token");

    if (!token) return;

    api
      .me(token)
      .then(setUser)
      .catch(() => localStorage.removeItem("vv_token"));
  }, []);

  const featuredProducts = products
    .filter((product) => product.is_featured && product.category !== "Kalyani Cotton")
    .slice(0, 4);
  const cottonProducts = products
    .filter((product) => product.category === "Kalyani Cotton")
    .slice(0, 6);
  const editProducts = [
    ...products.filter((product) => product.category !== "Kalyani Cotton").slice(0, 3),
    ...products.filter((product) => product.category === "Kalyani Cotton").slice(0, 3),
  ];

  const firstName = useMemo(
    () => user?.name?.split(" ")[0],
    [user]
  );

  function onAuthenticated(data) {
    localStorage.setItem("vv_token", data.access_token);
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
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function submitContact(e) {
    e.preventDefault();

    setContactStatus("Sending…");

    try {
      const res = await api.contact(contact);

      setContactStatus(res.message);

      setContact({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      setContactStatus(err.message);
    }
  }

  return (
    <>
      <header className="site-header">
        <Link className="wordmark" to="/">
          VENUS <span>V</span>ASTRA
        </Link>

        <nav>
          <Link to="/collection">
            Collection
          </Link>

          <a href="#story">
            Our Story
          </a>

          <a href="#concierge">
            Concierge
          </a>
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

      <main id="top">

        {/* HERO */}

        <section className="hero section-shell">

          <div className="hero-copy">

            <span className="eyebrow">
              THE SIGNATURE EDIT
            </span>

            <h1>
              Drape a little{" "}
              <em>luxury</em>{" "}
              into every moment.
            </h1>

            <p>
              Thoughtfully curated sarees in luminous
              silks, rich violets and glowing amber
              tones—made for celebrations that deserve
              to be remembered.
            </p>

            <div className="hero-actions">

              <Link
                className="btn btn-primary"
                to="/collection"
              >
                Explore sarees
              </Link>

              <a
                className="btn btn-secondary"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Chat on WhatsApp"
              >
                Chat on WhatsApp
              </a>

              <a
                className="btn btn-secondary"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="View Venus Vastra on Instagram"
              >
                View on Instagram
              </a>

            </div>

            <div className="hero-stats">

              <div>
                <strong>Curated</strong>
                <span>Soft silk edits</span>
              </div>

              <div>
                <strong>Personal</strong>
                <span>Style assistance</span>
              </div>

              <div>
                <strong>Direct</strong>
                <span>WhatsApp support</span>
              </div>

            </div>
          </div>

          <div className="hero-visual">

            <div className="arch-card">
              <ProductImage
                src="/images/Home_page_Saree.png"
                alt="Venus Vastra featured saree"
              />
            </div>

            <div className="halo halo-one"></div>
            <div className="halo halo-two"></div>

            <div className="floating-note">
              <span>
                SIGNATURE SOFT SILK
              </span>

              <strong>
                Quietly opulent.
              </strong>
            </div>

          </div>

        </section>

        <section className="shop-edits section-shell" id="edits">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Find your drape</span>
              <h2>Shop by edit</h2>
            </div>
            <div className="edit-section-actions">
              <Link className="text-link" to="/collection">Browse all sarees <span>↗</span></Link>
            </div>
          </div>
          <div className="edit-carousel" aria-label="Shop by edit">
            <div className="edit-tile-track">
              {[0, 1].map((copyIndex) => (
                <div className="edit-tile-grid" key={copyIndex} aria-hidden={copyIndex === 1}>
                  {editProducts.map((product, index) => (
                    <Link
                      className="edit-tile"
                      key={`${copyIndex}-${product.id}`}
                      to={`/collection?category=${encodeURIComponent(product.category)}`}
                      tabIndex={copyIndex === 1 ? -1 : undefined}
                      style={{ "--tile-index": index }}
                    >
                      <ProductImage src={product.image_url} alt={copyIndex === 1 ? "" : product.name} />
                      <span className="edit-tile-label">
                        <small>{product.category}</small>
                        <strong>{product.name}</strong>
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MARQUEE */}

        <section className="marquee">
          <span>SOFT SILK</span>
          <i>✦</i>

          <span>FESTIVE EDIT</span>
          <i>✦</i>

          <span>TIMELESS DRAPES</span>
          <i>✦</i>

          <span>VENUS VASTRA</span>
        </section>

        {/* FEATURED PRODUCTS */}

        <section
          id="collection"
          className="collection section-shell"
        >

          <div className="section-heading">

            <div>
              <span className="eyebrow">
                CURATED FOR YOU
              </span>

              <h2>
                Soft silks, made to be noticed.
              </h2>
            </div>

            <p>
              A restrained palette, graceful fall and
              statement borders—presented with a premium
              boutique experience.
            </p>

          </div>

          <div className="featured-product-grid">

            {featuredProducts.map((p) => (

              <article
                className="product-card featured-product-card"
                key={p.id}
              >

                <div className="product-image">

                  <ProductImage
                    src={p.image_url}
                    alt={p.name}
                  />

                  <button
                    className={`heart ${
                      favourites.includes(p.id)
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      toggleFavourite(p.id)
                    }
                    aria-label="Favourite"
                  >
                    ♡
                  </button>

                </div>

                <div className="product-info">

                  <div>
                    <span>
                      {p.note}
                    </span>

                    <h3>
                      {p.name}
                    </h3>
                  </div>

                  <ProductPrice product={p} />

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

          </div>

          {/* VIEW ALL */}

          <div className="view-all-wrap">
            <Link
              to="/collection"
              className="view-all-btn"
            >
              View All Sarees
            </Link>
          </div>

        </section>

        <section className="cotton-edit section-shell" id="kalyani-cotton">
          <div className="section-heading">
            <div>
              <span className="eyebrow">The Kalyani edit</span>
              <h2>Kalyani cotton</h2>
            </div>
            <p>Fresh cotton sarees, with current and original prices shown whenever confirmed.</p>
          </div>
          <div className="cotton-product-grid">
            {cottonProducts.map((product) => (
              <article className="product-card cotton-product-card" key={product.id}>
                <div className="product-image"><ProductImage src={product.image_url} alt={product.name} /></div>
                <div className="product-info">
                  <div><span>{product.note || product.category}</span><h3>{product.name}</h3></div>
                  <ProductPrice product={product} />
                </div>
                <a className="product-cta" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Enquire on WhatsApp <span>↗</span></a>
              </article>
            ))}
          </div>
          <div className="view-all-wrap"><Link to="/collection?category=Kalyani%20Cotton" className="view-all-btn">View Kalyani cotton</Link></div>
        </section>

        {/* STORY */}

        <section
          id="story"
          className="story section-shell"
        >

          <div className="story-panel">

            <span className="eyebrow light">
              THE VENUS VASTRA WAY
            </span>

            <h2>
              Modern elegance, rooted in the
              ritual of draping.
            </h2>

            <p>
              We believe a saree should feel
              as special as the memory attached
              to it. Every Venus Vastra edit
              is selected to balance colour,
              comfort and occasion-ready presence.
            </p>

            <a href="#concierge">
              Talk to our style concierge →
            </a>

          </div>

          <div className="story-art">

            <img
              src="/images/logo.png"
              alt="Venus Vastra emblem"
            />

            <div className="orb"></div>

          </div>

        </section>

        {/* CONCIERGE */}

        <section
          id="concierge"
          className="concierge section-shell"
        >

          <div>

            <span className="eyebrow">
              PERSONAL STYLE CONCIERGE
            </span>

            <h2>
              Need help choosing your saree?
            </h2>

            <p>
              Tell us the occasion, preferred
              colours and what you are looking for.
              Your enquiry will reach Venus Vastra
              directly by email.
            </p>

            <a
              className="whatsapp-inline"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
            >
              Prefer WhatsApp? Chat instantly ↗
            </a>

          </div>

          <form
            onSubmit={submitContact}
            className="contact-form"
          >

            <div className="form-row">

              <label>
                Name

                <input
                  required
                  value={contact.name}
                  onChange={(e) =>
                    setContact({
                      ...contact,
                      name: e.target.value,
                    })
                  }
                />

              </label>

              <label>
                Email

                <input
                  required
                  type="email"
                  value={contact.email}
                  onChange={(e) =>
                    setContact({
                      ...contact,
                      email: e.target.value,
                    })
                  }
                />

              </label>

            </div>

            <label>
              Phone

              <input
                value={contact.phone}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    phone: e.target.value,
                  })
                }
              />

            </label>

            <label>
              Message

              <textarea
                required
                rows="5"
                placeholder="I am looking for a saree for…"
                value={contact.message}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    message: e.target.value,
                  })
                }
              />

            </label>

            <button
              className="btn btn-primary"
              type="submit"
            >
              Send enquiry
            </button>

            {contactStatus && (
              <div className="form-status">
                {contactStatus}
              </div>
            )}

          </form>

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

          <Link to="/collection">
            Collection
          </Link>

          <a href="#story">
            Story
          </a>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
          >
            WhatsApp
          </a>

          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
            Instagram
          </a>

          <Link to="/admin">Admin</Link>

        </div>

        <span>
          © {new Date().getFullYear()} Venus Vastra
        </span>

      </footer>

      {/* FLOATING WHATSAPP */}

    

      {/* LOGIN MODAL */}

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