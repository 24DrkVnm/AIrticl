import io
import re
from typing import Dict, List, Tuple
from fastapi import HTTPException, UploadFile
import pypdf
import docx
import webvtt
from app.config import settings


def sanitize_filename(name: str) -> str:
    """Sanitize filename to prevent directory traversal and injection."""
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    return cleaned or "document.txt"


def clean_xml_injection(text: str) -> str:
    """
    Strip literal <source_document> or </source_document> tags
    to prevent prompt-injection delimiter escapes.
    """
    text = re.sub(r"<\s*/?\s*source_document[^>]*>", "", text, flags=re.IGNORECASE)
    return text


def parse_vtt_or_srt(content_bytes: bytes) -> str:
    """Parse VTT/SRT subtitle files into clean, timestamp-annotated transcript text."""
    text_content = content_bytes.decode("utf-8-sig", errors="replace")
    try:
        buffer = io.StringIO(text_content)
        vtt = webvtt.read_buffer(buffer)
        lines = []
        for caption in vtt:
            cue_text = caption.text.strip().replace("\n", " ")
            if cue_text:
                lines.append(f"[{caption.start} -> {caption.end}] {cue_text}")
        if lines:
            return "\n".join(lines)
    except Exception:
        pass

    # Fallback: clean standard srt/vtt timestamps manually
    clean_lines = []
    for line in text_content.splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.isdigit() or "-->" in trimmed or trimmed.startswith("WEBVTT"):
            continue
        clean_lines.append(trimmed)
    return "\n".join(clean_lines)


def parse_pdf(content_bytes: bytes, filename: str) -> str:
    """
    Extract text from PDF using pypdf.
    Raises HTTP 422 if the PDF has an average of < 50 characters per page (scanned image without OCR).
    """
    try:
        reader = pypdf.PdfReader(io.BytesIO(content_bytes))
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to parse PDF '{filename}': {str(e)}. File may be corrupted or password-protected.",
        )

    num_pages = len(reader.pages)
    if num_pages == 0:
        raise HTTPException(
            status_code=422,
            detail=f"PDF '{filename}' has 0 pages.",
        )

    page_texts = []
    total_chars = 0
    for page_idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        total_chars += len(text.strip())
        page_texts.append(f"--- Page {page_idx + 1} ---\n{text}")

    avg_chars = total_chars / num_pages
    if avg_chars < 50:
        raise HTTPException(
            status_code=422,
            detail=(
                f"PDF '{filename}' appears to be a scanned document lacking an OCR text layer "
                f"(average {avg_chars:.1f} characters/page; minimum required is 50). "
                f"Please run OCR on the document before submitting."
            ),
        )

    return "\n\n".join(page_texts)


def parse_docx(content_bytes: bytes, filename: str) -> str:
    """Extract paragraphs and tables from DOCX using python-docx."""
    try:
        doc = docx.Document(io.BytesIO(content_bytes))
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Unable to parse Word document '{filename}': {str(e)}",
        )

    parts: List[str] = []
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt:
            parts.append(txt)

    for table in doc.tables:
        for row in table.rows:
            row_txt = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
            if row_txt:
                parts.append(row_txt)

    return "\n\n".join(parts)


async def process_incoming_sources(
    files: List[UploadFile],
) -> Tuple[Dict[str, str], str, int]:
    """
    Enforces ingestion guardrails and returns:
    1. raw_texts_by_filename: Dict[safe_filename, text] (for quote verification)
    2. xml_corpus: string of all sources wrapped in <source_document> tags
    3. total_chars: integer character count
    """
    if len(files) > settings.max_files:
        raise HTTPException(
            status_code=413,
            detail=f"Maximum limit of {settings.max_files} files exceeded (received {len(files)} files).",
        )

    total_bytes = 0
    raw_texts_by_filename: Dict[str, str] = {}
    total_chars = 0

    for file in files:
        content = await file.read()
        total_bytes += len(content)

        if total_bytes > settings.max_total_bytes:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Combined payload size exceeds the 10MB limit "
                    f"({total_bytes / (1024 * 1024):.2f}MB processed so far)."
                ),
            )

        filename = file.filename or "uploaded_file.txt"
        safe_name = sanitize_filename(filename)
        ext = safe_name.split(".")[-1].lower() if "." in safe_name else "txt"

        if ext in ["txt"]:
            # Strict UTF-8 with BOM support for Devanagari and Malayalam text
            text = content.decode("utf-8-sig", errors="replace")
        elif ext in ["vtt", "srt"]:
            text = parse_vtt_or_srt(content)
        elif ext in ["pdf"]:
            text = parse_pdf(content, safe_name)
        elif ext in ["docx"]:
            text = parse_docx(content, safe_name)
        else:
            # Fallback to UTF-8 text decode
            text = content.decode("utf-8-sig", errors="replace")

        # Sanitize against prompt delimiter injection
        text = clean_xml_injection(text).strip()
        raw_texts_by_filename[safe_name] = text
        total_chars += len(text)

        if total_chars > settings.max_text_chars:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Total combined document characters ({total_chars:,}) exceed the "
                    f"{settings.max_text_chars:,} character ceiling."
                ),
            )

    if not raw_texts_by_filename or total_chars == 0:
        raise HTTPException(
            status_code=422,
            detail="No readable textual content could be extracted from the uploaded files.",
        )

    # Wrap each document securely into XML boundaries
    xml_corpus_parts = []
    for fname, text in raw_texts_by_filename.items():
        xml_corpus_parts.append(
            f'<source_document name="{fname}">\n{text}\n</source_document>'
        )

    xml_corpus = "\n\n".join(xml_corpus_parts)
    return raw_texts_by_filename, xml_corpus, total_chars

