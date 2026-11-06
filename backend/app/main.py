from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router

app = FastAPI(
    title="NewsSynth Studio Backend API",
    description="Multilingual News Synthesis & Fact Grounding API for English, Hindi, and Malayalam.",
    version="2.0.0",
)

# CORS Middleware allowing the Next.js frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=settings.origins_list or ["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(router)


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "online",
        "service": "NewsSynth Studio Backend",
        "supported_languages": ["en", "hi", "ml"],
        "model_configured": settings.model_name,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

