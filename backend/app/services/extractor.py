import os
import uuid
import logging
from typing import Dict, List

os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

try:
    import litellm
    litellm.telemetry = False
    litellm.suppress_debug_info = True
except ImportError:
    litellm = None  # type: ignore

try:
    import instructor
except ImportError:
    instructor = None  # type: ignore
from app.config import settings
from app.schemas import FactDossier, ExtractionResponse, TargetLanguageCode
from app.prompts.templates import EXTRACTION_SYSTEM_PROMPT, EXTRACTION_USER_TEMPLATE
from app.services.verifier import verify_quotes_against_sources

logger = logging.getLogger(__name__)


def setup_api_keys():
    """Ensure litellm finds configured provider API keys."""
    if settings.gemini_api_key:
        os.environ["GEMINI_API_KEY"] = settings.gemini_api_key
        os.environ["GOOGLE_API_KEY"] = settings.gemini_api_key
    if settings.openai_api_key:
        os.environ["OPENAI_API_KEY"] = settings.openai_api_key
    if settings.anthropic_api_key:
        os.environ["ANTHROPIC_API_KEY"] = settings.anthropic_api_key


async def extract_fact_dossier(
    xml_corpus: str,
    raw_texts_by_filename: Dict[str, str],
    total_chars: int,
    source_language: TargetLanguageCode = "en",
) -> ExtractionResponse:
    """
    Executes Stage 1: LLM extraction followed by the Indic-safe quote verifier pass.
    """
    setup_api_keys()
    if litellm is None or instructor is None:
        raise RuntimeError(
            "Required packages 'litellm' and 'instructor' are not installed. "
            "Please run: pip install -r requirements.txt"
        )
    extraction_id = f"ext_{uuid.uuid4().hex[:12]}"
    user_prompt = EXTRACTION_USER_TEMPLATE.format(xml_corpus=xml_corpus)

    dossier: FactDossier

    extra_kwargs = {}
    if "gemini" in settings.model_name.lower() and settings.gemini_api_key:
        extra_kwargs["api_key"] = settings.gemini_api_key
    elif "openai" in settings.model_name.lower() and settings.openai_api_key:
        extra_kwargs["api_key"] = settings.openai_api_key
    elif "anthropic" in settings.model_name.lower() and settings.anthropic_api_key:
        extra_kwargs["api_key"] = settings.anthropic_api_key

    try:
        # Patch litellm with instructor for guaranteed Pydantic output
        client = instructor.from_litellm(litellm.acompletion)

        dossier = await client.chat.completions.create(
            model=settings.model_name,
            response_model=FactDossier,
            messages=[
                {"role": "system", "content": EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=settings.extraction_temperature,
            max_tokens=settings.extraction_max_tokens,
            **extra_kwargs,
        )
    except Exception as e:
        logger.warning(
            f"LLM fact extraction encountered an issue ({e}). Checking fallback..."
        )
        # If API key is not set or network fails in dev environment, construct fallback dossier
        raise RuntimeError(
            f"LLM extraction service failed with model '{settings.model_name}': {str(e)}. "
            f"Please verify your API key in backend/.env"
        )

    # Run the Indic-safe quote verifier pass
    warnings = verify_quotes_against_sources(dossier, raw_texts_by_filename)

    return ExtractionResponse(
        extraction_id=extraction_id,
        source_language=source_language,
        total_chars_processed=total_chars,
        warnings=warnings,
        dossier=dossier,
    )

