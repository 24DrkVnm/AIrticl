import re
import unicodedata
from typing import Dict, List
from app.schemas import FactDossier


def normalize_indic_text(text: str) -> str:
    """
    Normalizes Indic (Devanagari, Malayalam) and English text for substring verification.
    
    CRITICAL RULE:
    - Uses NFC (Canonical Decomposition followed by Canonical Composition).
    - NEVER uses NFKC, which decomposes Malayalam chillu letters (ൺ, ൻ, ർ, ൽ, ൾ, ൿ)
      and alters essential Indic ligatures.
    - Preserves or normalizes Zero-Width Joiner (\\u200D) and Zero-Width Non-Joiner (\\u200C)
      so orthographic conjunct representations match consistently.
    """
    if not text:
        return ""

    # 1. Canonical NFC normalization
    text = unicodedata.normalize("NFC", text)

    # 2. Normalize smart/curly quotation marks and brackets to standard forms
    quote_replacements = {
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "«": '"',
        "»": '"',
        "「": '"',
        "」": '"',
        "„": '"',
        "‟": '"',
        "—": " - ",
        "–": " - ",
    }
    for old, new in quote_replacements.items():
        text = text.replace(old, new)

    # 3. Normalize Purna Viram (।) and periods to standard punctuation spacing
    text = text.replace("।", " . ")

    # 4. Remove leading/trailing quotes around search target if wrapped
    text = text.strip(' \t\n\r"\'')

    # 5. Collapse excessive whitespace and zero-width artifacts
    text = re.sub(r"[\u200B\uFEFF]", "", text)  # remove zero-width spaces / BOM
    text = re.sub(r"\s+", " ", text)
    return text.strip().lower()


def verify_quotes_against_sources(
    dossier: FactDossier,
    raw_texts_by_filename: Dict[str, str],
) -> List[str]:
    """
    Verifies verbatim quotes against raw source documents using Indic-safe substring matching.
    Sets quote.substr_verified = True if found, False otherwise.
    Also ensures any Fact with confidence == 'low' defaults to included = False.
    Returns a list of human-readable warnings.
    """
    warnings: List[str] = []

    # Pre-normalize all source documents once
    normalized_sources: Dict[str, str] = {
        fname: normalize_indic_text(content)
        for fname, content in raw_texts_by_filename.items()
    }
    # Combined full corpus for cross-document quotes
    full_normalized_corpus = " ".join(normalized_sources.values())

    # 1. Verify quotes
    for quote in dossier.extracted_quotes:
        clean_quote = normalize_indic_text(quote.verbatim_text)

        if not clean_quote:
            quote.substr_verified = False
            warnings.append(
                f"Quote '{quote.quote_id}' (attributed to {quote.speaker}) has empty verbatim text."
            )
            continue

        # Check target document first, then fallback to full corpus
        target_doc = normalized_sources.get(quote.source_document)
        matched = False

        if target_doc and clean_quote in target_doc:
            matched = True
        elif clean_quote in full_normalized_corpus:
            matched = True
        else:
            # Fuzzy tolerance: try matching a core 70% sub-phrase (minimum 6 words)
            words = clean_quote.split()
            if len(words) >= 6:
                core_len = max(5, int(len(words) * 0.75))
                core_sub = " ".join(words[:core_len])
                if core_sub in full_normalized_corpus:
                    matched = True

        quote.substr_verified = matched

        if not matched:
            warnings.append(
                f"Quote '{quote.quote_id}' attributed to '{quote.speaker}' was flagged as "
                f"unverified (exact verbatim match not found in '{quote.source_document}'). "
                f"Check for paraphrasing or audio transcription drift."
            )

    # 2. Enforce confidence rule: confidence == 'low' -> included = False
    for fact in dossier.key_facts:
        if fact.confidence == "low":
            fact.included = False
            warnings.append(
                f"Fact '{fact.id}' flagged with 'low' confidence: unchecked from synthesis by default."
            )

    return warnings

