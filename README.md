# Venus Vastra

Premium saree storefront prototype built with React + FastAPI + SQLite.

## Stack
- Frontend: React + Vite
- Backend: FastAPI
- Database: SQLite
- Auth: JWT + bcrypt password hashing
- Email: Gmail SMTP using an App Password
- WhatsApp: wa.me deep link to +91 7010031532

## Add your saree images
Place these files in `frontend/public/images/`:
- Existing Soft Silk and Kalyani Cotton images are loaded into the catalogue automatically.
- New products can use an image path under `/images/` or upload a JPG, PNG, or WebP from `/admin`.

## Backend setup
```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env
# macOS/Linux: cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Edit `.env` and set a Gmail App Password. Never put your normal Gmail password in the project.
Set `JWT_SECRET` to at least 32 random bytes (for example, generate one with `python -c "import secrets; print(secrets.token_hex(32))"`). Set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters to create the protected administrator account. The account password is read from this environment configuration at backend startup.

## Frontend setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The storefront is at `http://localhost:5173/`; the administrator sign-in is at `http://localhost:5173/admin`. Product edits require both frontend and backend services to be running. Search and category filters are on the collection page. Product prices are configured in rupees; set the current price and, for sale pricing, an original price greater than the current price.

The 20 Kalyani Cotton photos are registered as products with generic numbered labels. Their price fields intentionally start empty because no verified rates were provided; enter each confirmed current and original rate in `/admin` before advertising a discount. The existing eight Soft Silk names and prices are preserved.

For deployment, set `VITE_API_BASE` to the public backend URL when it is hosted separately, and include the frontend domain in backend `FRONTEND_ORIGIN`. Configure the frontend host to rewrite unknown paths to `index.html` so direct visits to `/admin` resolve to the React route. `frontend/public/_redirects` and `frontend/vercel.json` include SPA rewrites for Netlify and Vercel, respectively. Keep `JWT_SECRET` and administrator credentials in the host's secret environment settings, never in the frontend. The backend host needs persistent storage for its database and uploaded images; ephemeral serverless filesystems will not preserve catalogue uploads across restarts.
