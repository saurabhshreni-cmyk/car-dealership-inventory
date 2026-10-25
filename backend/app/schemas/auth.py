"""Request/response schemas for authentication."""
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


MAX_PASSWORD_BYTES = 72  # bcrypt ignores/refuses input beyond 72 bytes


class RegisterRequest(BaseModel):
    """Payload for POST /api/auth/register. Unknown fields (e.g. role) are ignored."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=MAX_PASSWORD_BYTES)

    @field_validator("password")
    @classmethod
    def _fits_bcrypt(cls, password: str) -> str:
        """Reject passwords whose UTF-8 encoding exceeds bcrypt's 72-byte limit."""
        if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
            raise ValueError(f"password must be at most {MAX_PASSWORD_BYTES} bytes when UTF-8 encoded")
        return password


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
