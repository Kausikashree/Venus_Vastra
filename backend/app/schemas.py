from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


# =========================================================
# LOGIN
# =========================================================

class LoginRequest(BaseModel):
    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128
    )


# =========================================================
# USER OUTPUT
# =========================================================

class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    is_admin: bool = False

    class Config:
        from_attributes = True


# =========================================================
# AUTH RESPONSE
# =========================================================

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# =========================================================
# CONTACT / ENQUIRY
# =========================================================

class ContactRequest(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120
    )

    email: EmailStr

    phone: str = Field(
        default="",
        max_length=30
    )

    message: str = Field(
        min_length=3,
        max_length=3000
    )


class ProductFields(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    category: str = Field(min_length=2, max_length=80)
    note: str = Field(default="", max_length=160)
    description: str = Field(default="", max_length=2000)
    image_url: str = Field(min_length=1, max_length=500)
    price: int | None = Field(default=None, gt=0)
    compare_at_price: int | None = Field(default=None, gt=0)
    is_active: bool = True
    is_featured: bool = False


class ProductCreate(ProductFields):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    note: str | None = Field(default=None, max_length=160)
    description: str | None = Field(default=None, max_length=2000)
    image_url: str | None = Field(default=None, min_length=1, max_length=500)
    price: int | None = Field(default=None, gt=0)
    compare_at_price: int | None = Field(default=None, gt=0)
    is_active: bool | None = None
    is_featured: bool | None = None


class ProductOut(ProductFields):
    model_config = ConfigDict(from_attributes=True)
    id: int