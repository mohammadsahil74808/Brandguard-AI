from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.database import init_db

from app.api.v1.auth import router as auth_router
from app.api.v1.guidelines import router as guidelines_router
from app.api.v1.facts import router as facts_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.audits import router as audits_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.analytics import router as analytics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed Acme Audio defaults automatically on startup
    init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Pre-publication brand governance & content intelligence platform",
    lifespan=lifespan
)

# Enable CORS for local Vite dev and cloud production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "sqlite_local" if "sqlite" in settings.DATABASE_URL else "postgresql_supabase"
    }

# Register Sub-Routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(guidelines_router, prefix="/api/v1/guidelines", tags=["Brand Knowledge Hub"])
app.include_router(facts_router, prefix="/api/v1/facts", tags=["Facts & Terminology"])
app.include_router(submissions_router, prefix="/api/v1/submissions", tags=["Content Submissions"])
app.include_router(audits_router, prefix="/api/v1", tags=["Audits & Findings"])
app.include_router(reviews_router, prefix="/api/v1/reviews", tags=["Human Review Workflow"])
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["Brand Intelligence Analytics"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
