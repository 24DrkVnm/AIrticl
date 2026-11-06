from pydantic import BaseModel, Field
from typing import List, Literal

ItemOrigin = Literal["extracted", "user_edited", "user_added"]
ConfidenceLevel = Literal["high", "medium", "low"]
TargetLanguageCode = Literal["en", "hi", "ml"]
EditorialStyle = Literal["hard_news", "investigative", "financial", "feature"]
PublicationTarget = Literal["AP_PTI_Standard", "Regional_Print_Formal", "Digital_Brief"]
QuoteHandling = Literal["translate_only", "bilingual_parenthetical"]


class Entity(BaseModel):
    id: str
    name: str
    role: str
    organization: str
    origin: ItemOrigin = "extracted"
    included: bool = True


class Fact(BaseModel):
    id: str
    claim: str
    supporting_context: str
    source_document: str
    confidence: ConfidenceLevel = "high"
    origin: ItemOrigin = "extracted"
    included: bool = True


class ExtractedQuote(BaseModel):
    quote_id: str
    speaker: str
    verbatim_text: str
    source_language: TargetLanguageCode = Field(
        "en", description="ISO code of the source quote: 'en', 'hi', or 'ml'"
    )
    context: str
    source_document: str
    substr_verified: bool = False
    origin: ItemOrigin = "extracted"
    included: bool = True


class ChronologyEvent(BaseModel):
    id: str
    timestamp_or_date: str
    event: str
    origin: ItemOrigin = "extracted"
    included: bool = True


class FactDossier(BaseModel):
    story_headline_suggestion: str
    entities: List[Entity]
    key_facts: List[Fact]
    extracted_quotes: List[ExtractedQuote]
    chronology: List[ChronologyEvent]


class ExtractionResponse(BaseModel):
    extraction_id: str
    source_language: TargetLanguageCode
    total_chars_processed: int
    warnings: List[str] = []
    dossier: FactDossier


class GenerationPayload(BaseModel):
    dossier: FactDossier
    target_language: TargetLanguageCode
    editorial_style: EditorialStyle = "hard_news"
    publication_target: PublicationTarget = "AP_PTI_Standard"
    quote_handling: QuoteHandling = "translate_only"

