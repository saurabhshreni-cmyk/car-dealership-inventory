"""Request/response schemas for authentication."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Payload for POST /api/auth/register. Unknown fields (e.g. role) are ignored."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserOut(BaseModel):
    """Public user representation."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    role: str


class LoginRequest(BaseModel):
    """Payload for POST /api/auth/login."""

    email: EmailStr
    password: str = Field(max_length=72)


class TokenOut(BaseModel):
    """Login response: bearer token plus the authenticated user."""

    access_token: str
    token_type: str = "bearer"
    user: UserOut
