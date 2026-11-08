from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.utils.config import settings

import jwt
import time


def decode_jwt(token:str)->dict:
    """
    Decodes the signed-in JWT
    """
    try:
        decoded_token = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return decoded_token if decoded_token["expires"] >= time.time() else None
    except: 
        return {}


def sign_jwt(user_id:str) -> dict[str, str]:
    """
    Encodes the signed-in userId
    """
    payload = {
        "user_id": user_id,
        "expires": time.time() + 600
    }

    token = jwt.encode(payload=payload, key=settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"access_token": token}


class JWTBearer(HTTPBearer):
    """
    Validates the Authentication Scheme
    """
    def __init__(self, auto_error: bool = True):
        super(JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: HTTPAuthorizationCredentials = await super(JWTBearer, self).__call__(request)
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code = 403, detail = "Invalid authentication scheme")

            payload = decode_jwt(credentials.credentials)
            if not payload or not payload.get("user_id"):
                raise HTTPException(status_code=403, detail="Invalid token or expired token")

            # The verified user; endpoints must use this, never a userId from the request
            return str(payload["user_id"])
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization request")

# One shared instance so FastAPI decodes the token once per request,
# even when both a rate limiter and the endpoint depend on it
current_user_id = JWTBearer()
