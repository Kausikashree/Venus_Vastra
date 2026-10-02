import os
import uuid

from pathlib import Path

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Response,
    status,
    UploadFile,
    File,
    Request,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from dotenv import load_dotenv


load_dotenv()


from . import models, schemas, auth
from .database import engine, get_db, SessionLocal
from .emailer import send_enquiry_email


# =========================================================
# DATABASE
# =========================================================

models.Base.metadata.create_all(bind=engine)


def initialize_database():
    with engine.begin() as connection:
        user_columns = {
            column["name"]
            for column in inspect(engine).get_columns("users")
        }

        if "is_admin" not in user_columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN is_admin BOOLEAN "
                    "NOT NULL DEFAULT 0"
                )
            )

    admin_email = (
        os.getenv("ADMIN_EMAIL", "")
        .strip()
        .lower()
    )

    admin_password = os.getenv(
        "ADMIN_PASSWORD",
        "",
    )

    if bool(admin_email) != bool(admin_password):
        raise RuntimeError(
            "Set both ADMIN_EMAIL and ADMIN_PASSWORD "
            "to configure the admin account."
        )

    if admin_email:
        if len(admin_password) < 12:
            raise RuntimeError(
                "ADMIN_PASSWORD must be at least "
                "12 characters long."
            )

        if len(
            admin_password.encode("utf-8")
        ) > 72:
            raise RuntimeError(
                "ADMIN_PASSWORD must not exceed "
                "72 UTF-8 bytes."
            )

        with SessionLocal() as db:
            admin = (
                db.query(models.User)
                .filter(
                    models.User.email == admin_email
                )
                .first()
            )

            if admin is None:
                admin = models.User(
                    name="Store Administrator",
                    email=admin_email,
                    password_hash=auth.hash_password(
                        admin_password
                    ),
                    is_admin=True,
                )

                db.add(admin)

            else:
                admin.is_admin = True
                admin.password_hash = (
                    auth.hash_password(
                        admin_password
                    )
                )

            db.commit()

    seed_products()


def seed_products():
    products = [
        (
            "Amber Dawn Soft Silk",
            "Soft Silk · Festive",
            "soft_silk_1.jpeg",
            1900,
        ),
        (
            "Royal Dusk Soft Silk",
            "Soft Silk · Limited",
            "soft_silk_2.jpeg",
            3499,
        ),
        (
            "Sunset Glow Soft Silk",
            "Soft Silk · Signature Edit",
            "soft_silk_3.jpeg",
            3299,
        ),
        (
            "Lavender Grace Soft Silk",
            "Soft Silk · Premium",
            "soft_silk_4.jpeg",
            3599,
        ),
        (
            "Golden Plum Soft Silk",
            "Soft Silk · Festive Luxe",
            "soft_silk_5.jpeg",
            3799,
        ),
        (
            "Royal Amber Soft Silk",
            "Soft Silk · Exclusive",
            "soft_silk_6.jpeg",
            3999,
        ),
        (
            "Violet Bloom Soft Silk",
            "Soft Silk · Signature",
            "soft_silk_7.jpeg",
            3699,
        ),
        (
            "Azure Grace Soft Silk",
            "Soft Silk · Premium",
            "soft_silk_8.jpeg",
            3499,
        ),
    ]

    with SessionLocal() as db:
        if (
            db.query(models.Product)
            .count()
            == 0
        ):
            for index, (
                name,
                note,
                image,
                price,
            ) in enumerate(products):
                db.add(
                    models.Product(
                        name=name,
                        category="Soft Silk",
                        note=note,
                        image_url=(
                            f"/images/{image}"
                        ),
                        price=price,
                        is_featured=index < 2,
                    )
                )

            db.commit()

        if (
            db.query(models.Product)
            .filter(
                models.Product.category
                == "Kalyani Cotton"
            )
            .count()
            == 0
        ):
            cotton_images = [
                "kalyaani_cotton.jpeg",
                *[
                    f"kalyaani_cotton_{index}.jpeg"
                    for index in range(1, 20)
                ],
            ]

            for index, image in enumerate(
                cotton_images,
                start=1,
            ):
                db.add(
                    models.Product(
                        name=(
                            f"Kalyani Cotton "
                            f"{index:02d}"
                        ),
                        category="Kalyani Cotton",
                        note="Kalyani Cotton",
                        image_url=(
                            f"/images/{image}"
                        ),
                        price=None,
                        compare_at_price=None,
                    )
                )

            db.commit()


initialize_database()


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Venus Vastra API",
    version="1.0.0",
)


# =========================================================
# UPLOADS
# =========================================================

UPLOAD_DIRECTORY = (
    Path(__file__)
    .resolve()
    .parent
    .parent
    / "uploads"
)

UPLOAD_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOAD_DIRECTORY
    ),
    name="uploads",
)


# =========================================================
# CORS
# =========================================================

# Exact origins
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://venus-vastra.vercel.app",
]

# Optional extra origins from Render env
extra_origins = os.getenv(
    "FRONTEND_ORIGIN",
    "",
)

if extra_origins:
    allowed_origins.extend(
        [
            origin.strip()
            for origin in extra_origins.split(",")
            if origin.strip()
        ]
    )


app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    # Allows Vercel preview URLs such as:
    # https://venus-vastra-xxxx-kausi2.vercel.app
    allow_origin_regex=(
        r"^https://venus-vastra"
        r"(?:-[a-zA-Z0-9-]+)?"
        r"\.vercel\.app$"
    ),

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "message": (
            "Venus Vastra API is running"
        )
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "ok"
    }


# =========================================================
# REGISTER
# =========================================================

@app.post("/api/auth/register")
def register(
    payload: schemas.RegisterRequest,
    db: Session = Depends(get_db),
):
    email = (
        payload.email
        .lower()
        .strip()
    )

    existing_user = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    user = models.User(
        name=payload.name.strip(),
        email=email,
        password_hash=auth.hash_password(
            payload.password
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = auth.create_access_token(
        user.id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin,
        },
    }


# =========================================================
# LOGIN
# =========================================================

@app.post("/api/auth/login")
def login(
    payload: schemas.LoginRequest,
    db: Session = Depends(get_db),
):
    email = (
        payload.email
        .lower()
        .strip()
    )

    user = (
        db.query(models.User)
        .filter(
            models.User.email == email
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )

    password_valid = (
        auth.verify_password(
            payload.password,
            user.password_hash,
        )
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password."
            ),
        )

    token = auth.create_access_token(
        user.id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "is_admin": user.is_admin,
        },
    }


# =========================================================
# CURRENT USER
# =========================================================

@app.get("/api/auth/me")
def get_current_user(
    user=Depends(
        auth.get_current_user
    ),
):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
    }


# =========================================================
# PRODUCTS
# =========================================================

@app.get(
    "/api/products",
    response_model=list[
        schemas.ProductOut
    ],
)
def list_products(
    db: Session = Depends(get_db),
):
    return (
        db.query(models.Product)
        .filter(
            models.Product.is_active.is_(
                True
            )
        )
        .order_by(
            models.Product.id
        )
        .all()
    )


# =========================================================
# ADMIN PRODUCTS
# =========================================================

@app.get(
    "/api/admin/products",
    response_model=list[
        schemas.ProductOut
    ],
)
def list_admin_products(
    db: Session = Depends(get_db),
    _admin=Depends(
        auth.get_admin_user
    ),
):
    return (
        db.query(models.Product)
        .order_by(
            models.Product.id.desc()
        )
        .all()
    )


@app.post(
    "/api/admin/products",
    response_model=schemas.ProductOut,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    payload: schemas.ProductCreate,
    db: Session = Depends(get_db),
    _admin=Depends(
        auth.get_admin_user
    ),
):
    if (
        payload.compare_at_price
        is not None
        and payload.price
        is not None
        and payload.compare_at_price
        <= payload.price
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Original price must be greater "
                "than the current price."
            ),
        )

    product = models.Product(
        **payload.model_dump()
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@app.patch(
    "/api/admin/products/{product_id}",
    response_model=schemas.ProductOut,
)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(
        auth.get_admin_user
    ),
):
    product = db.get(
        models.Product,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    next_price = updates.get(
        "price",
        product.price,
    )

    next_compare_at_price = (
        updates.get(
            "compare_at_price",
            product.compare_at_price,
        )
    )

    if (
        next_compare_at_price
        is not None
        and next_price
        is not None
        and next_compare_at_price
        <= next_price
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Original price must be greater "
                "than the current price."
            ),
        )

    for field, value in updates.items():
        setattr(
            product,
            field,
            value,
        )

    db.commit()
    db.refresh(product)

    return product


@app.delete(
    "/api/admin/products/{product_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(
        auth.get_admin_user
    ),
):
    product = db.get(
        models.Product,
        product_id,
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found.",
        )

    db.delete(product)
    db.commit()

    return Response(
        status_code=(
            status.HTTP_204_NO_CONTENT
        )
    )


# =========================================================
# ADMIN IMAGE UPLOAD
# =========================================================

@app.post(
    "/api/admin/uploads",
    status_code=status.HTTP_201_CREATED,
)
async def upload_product_image(
    request: Request,
    image: UploadFile = File(...),
    _admin=Depends(
        auth.get_admin_user
    ),
):
    allowed_types = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    extension = allowed_types.get(
        image.content_type or ""
    )

    if extension is None:
        raise HTTPException(
            status_code=415,
            detail=(
                "Upload a JPG, PNG, "
                "or WebP image."
            ),
        )

    contents = await image.read(
        8 * 1024 * 1024 + 1
    )

    if len(contents) > (
        8 * 1024 * 1024
    ):
        raise HTTPException(
            status_code=413,
            detail=(
                "Images must be 8 MB "
                "or smaller."
            ),
        )

    valid_signature = (
        (
            image.content_type
            == "image/jpeg"
            and contents.startswith(
                b"\xff\xd8\xff"
            )
        )
        or (
            image.content_type
            == "image/png"
            and contents.startswith(
                b"\x89PNG\r\n\x1a\n"
            )
        )
        or (
            image.content_type
            == "image/webp"
            and contents.startswith(
                b"RIFF"
            )
            and contents[8:12]
            == b"WEBP"
        )
    )

    if not valid_signature:
        raise HTTPException(
            status_code=415,
            detail=(
                "The uploaded file is not "
                "a valid JPG, PNG, or WebP image."
            ),
        )

    filename = (
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )

    (
        UPLOAD_DIRECTORY
        / filename
    ).write_bytes(contents)

    return {
        "image_url": (
            f"{str(request.base_url).rstrip('/')}"
            f"/uploads/{filename}"
        )
    }


# =========================================================
# CONTACT / ENQUIRY
# =========================================================

@app.post("/api/contact")
def contact(
    payload: schemas.ContactRequest,
):
    try:
        send_enquiry_email(
            name=payload.name,
            email=payload.email,
            phone=payload.phone or "",
            message=payload.message,
        )

        return {
            "success": True,
            "message": (
                "Thank you! Your enquiry has been "
                "sent successfully."
            ),
        }

    except Exception as exc:
        print(
            "Venus Vastra email error:",
            str(exc),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to send your enquiry right now. "
                "Please try again or contact us on WhatsApp."
            ),
        )