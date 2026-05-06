"""
StudyLabs unified backend (FastAPI) -- replaces the two Express servers.

Mounts the same route prefixes the Express server used so every endpoint
keeps its method + path + request shape + response shape. The original
Express backend put all logic inline in the route files (no controllers/
layer); we mirror that 1:1 here -- routes/ modules contain the handlers.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from this directory so behaviour is identical regardless of cwd.
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from middleware.auth import APIError, verify_auth, verify_mentor
from fastapi import Depends

from config.redis_config import cache
from routes import auth         as auth_routes
from routes import subjects     as subjects_routes
from routes import vault_files  as vault_files_routes
from routes import vault_links  as vault_links_routes
from routes import mentor       as mentor_routes
from routes import study        as study_routes
from routes import student      as student_routes


app = FastAPI(title="StudyLabs Backend (FastAPI)")

# CORS: same wide-open default as Express's `cors()` in server.js.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Translate APIError (raised inside middleware/handlers) into the Express
# response shape: {"error": "..."} body with the right status code.
@app.exception_handler(APIError)
def _api_error_handler(_request: Request, exc: APIError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.message})


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "redis": "up" if cache.is_connected else "down"}


# Public auth router: no middleware (Express mounted /api/auth without verifyAuth).
app.include_router(auth_routes.router,        prefix="/api/auth")

# Authenticated routers: verifyAuth applied at router level.
app.include_router(
    subjects_routes.router,
    prefix="/api/subjects",
    dependencies=[Depends(verify_auth)],
)
app.include_router(
    vault_files_routes.router,
    prefix="/api/vault-files",
    dependencies=[Depends(verify_auth)],
)
app.include_router(
    vault_links_routes.router,
    prefix="/api/vault-links",
    dependencies=[Depends(verify_auth)],
)
app.include_router(
    study_routes.router,
    prefix="/api/study",
    dependencies=[Depends(verify_auth)],
)
app.include_router(
    student_routes.router,
    prefix="/api/student",
    dependencies=[Depends(verify_auth)],
)

# Mentor router: verifyMentor applied at router level.
app.include_router(
    mentor_routes.router,
    prefix="/api/mentor",
    dependencies=[Depends(verify_mentor)],
)


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 3000))
    print(f"StudyLabs backend (FastAPI) running on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
