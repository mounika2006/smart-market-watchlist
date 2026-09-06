import hashlib
import secrets
from datetime import datetime, timedelta

from jose import jwt


SECRET_KEY = "smart-market-watchlist-secret-key"
ALGORITHM = "HS256"


def hash_password(password):
    salt = secrets.token_hex(16)

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt.encode(),
        100000
    )

    return f"{salt}${hashed.hex()}"


def verify_password(password, stored_password):
    salt, stored_hash = stored_password.split("$")

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt.encode(),
        100000
    )

    return secrets.compare_digest(
        hashed.hex(),
        stored_hash
    )


def create_token(user_id):
    expiration = datetime.utcnow() + timedelta(days=7)

    payload = {
        "user_id": user_id,
        "exp": expiration
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_token(token):
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=[ALGORITHM]
    )