import os
import json
import logging
from typing import AsyncGenerator
from fastapi import Request

os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"

try:
    import litellm
    litellm.telemetry = False
    litellm.suppress_debug_info = True
except ImportError:
    litellm = None  # type: ignore
from app.config import settings
from app.schemas import GenerationPayload
from app.prompts.templates import build_synthesis_prompt
from app.services.extractor import setup_api_keys

logger = logging.getLogger(__name__)


async def synthesize_article_stream(
    payload: GenerationPayload,
    request: Request,
) -> AsyncGenerator[str, None]:
    """
    Stage 2: Server-Sent Events (SSE) streaming with active disconnect detection
    and ensure_ascii=False for native Hindi (Devanagari) & Malayalam characters.
    """
    setup_api_keys()
    if litellm is None:
        err_data = json.dumps(
            {"error": "Required package 'litellm' is not installed. Please run: pip install litellm"},
            ensure_ascii=False,
        )
        yield f"data: {err_data}\n\n"
        return

    # Filter dossier to only include items marked as included
    filtered_dossier = payload.dossier.model_copy(deep=True)
    filtered_dossier.entities = [e for e in filtered_dossier.entities if e.included]
    filtered_dossier.key_facts = [f for f in filtered_dossier.key_facts if f.included]
    filtered_dossier.extracted_quotes = [q for q in filtered_dossier.extracted_quotes if q.included]
    filtered_dossier.chronology = [c for c in filtered_dossier.chronology if c.included]

    dossier_json = filtered_dossier.model_dump_json(indent=2)

    system_prompt, user_prompt = build_synthesis_prompt(
        dossier_json=dossier_json,
        target_language=payload.target_language,
        editorial_style=payload.editorial_style,
        publication_target=payload.publication_target,
        quote_handling=payload.quote_handling,
    )

    extra_kwargs = {}
    if "gemini" in settings.model_name.lower() and settings.gemini_api_key:
        extra_kwargs["api_key"] = settings.gemini_api_key
    elif "openai" in settings.model_name.lower() and settings.openai_api_key:
        extra_kwargs["api_key"] = settings.openai_api_key
    elif "anthropic" in settings.model_name.lower() and settings.anthropic_api_key:
        extra_kwargs["api_key"] = settings.anthropic_api_key

    try:
        response = await litellm.acompletion(
            model=settings.model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=True,
            temperature=settings.synthesis_temperature,
            max_tokens=settings.synthesis_max_tokens,
            **extra_kwargs,
        )

        async for chunk in response:
            # Check if client disconnected or aborted connection
            if await request.is_disconnected():
                logger.info("Client disconnected. Terminating synthesis LLM stream.")
                break

            delta = ""
            if hasattr(chunk, "choices") and chunk.choices:
                choice = chunk.choices[0]
                if hasattr(choice, "delta") and hasattr(choice.delta, "content"):
                    delta = choice.delta.content or ""
                elif hasattr(choice, "text"):
                    delta = choice.text or ""

            if delta:
                # CRITICAL: ensure_ascii=False avoids escaping Devanagari & Malayalam into \uXXXX
                sse_data = json.dumps({"delta": delta}, ensure_ascii=False)
                yield f"data: {sse_data}\n\n"

        # Emit completion token
        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        logger.error(f"Error during article synthesis stream: {e}", exc_info=True)
        err_data = json.dumps({"error": f"Synthesis engine error: {str(e)}"}, ensure_ascii=False)
        yield f"data: {err_data}\n\n"

