from typing import List, Optional
from fastapi import APIRouter, File, Form, HTTPException, Request, Security, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.security.api_key import APIKeyHeader

from app.config import settings
from app.schemas import ExtractionResponse, GenerationPayload
from app.services.parser import process_incoming_sources, clean_xml_injection
from app.services.extractor import extract_fact_dossier
from app.services.synthesizer import synthesize_article_stream

router = APIRouter(prefix="/api/v1", tags=["news-synthesis"])

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: Optional[str] = Security(api_key_header)):
    """Verifies client X-API-Key against configured API key."""
    if not settings.api_key:
        return True
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing X-API-Key header.",
        )
    return True


@router.post(
    "/extract",
    response_model=ExtractionResponse,
    summary="Stage 1: Multi-file ingestion and structured Fact Dossier extraction",
)
async def extract_sources(
    files: List[UploadFile] = File(...),
    raw_text: Optional[str] = Form(None),
    authenticated: bool = Security(verify_api_key),
):
    """
    Ingests interview transcripts, documents (.txt, .pdf, .docx, .vtt, .srt),
    enforces 5-file / 10MB / 120k-char limits, verifies against scanned PDFs,
    and returns a grounded Fact Dossier with Indic-safe quote verification.
    """
    raw_texts_by_filename, xml_corpus, total_chars = await process_incoming_sources(files)

    # If extra raw_text was submitted via form field
    if raw_text and raw_text.strip():
        cleaned_notes = clean_xml_injection(raw_text.strip())
        raw_texts_by_filename["pasted_reporter_notes.txt"] = cleaned_notes
        xml_corpus += f'\n\n<source_document name="pasted_reporter_notes.txt">\n{cleaned_notes}\n</source_document>'
        total_chars += len(cleaned_notes)

    response = await extract_fact_dossier(
        xml_corpus=xml_corpus,
        raw_texts_by_filename=raw_texts_by_filename,
        total_chars=total_chars,
    )
    return response


@router.post(
    "/generate",
    summary="Stage 2: Editorial news synthesis via Server-Sent Events (SSE)",
)
async def generate_article(
    payload: GenerationPayload,
    request: Request,
    authenticated: bool = Security(verify_api_key),
):
    """
    Receives verified FactDossier, target language (en, hi, ml), and editorial style,
    streaming a localized news story token-by-token over Server-Sent Events (SSE).
    """
    generator = synthesize_article_stream(payload=payload, request=request)

    return StreamingResponse(
        generator,
        media_type="text/event-stream; charset=utf-8",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream; charset=utf-8",
        },
    )

