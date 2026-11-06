export type PipelineStatus =
  | 'Idle'
  | 'Extracting Facts...'
  | 'Review Ready'
  | 'Streaming Article...'
  | 'Stopped'
  | 'Error';

export type ItemOrigin = 'extracted' | 'user_edited' | 'user_added';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type TargetLanguageCode = 'en' | 'hi' | 'ml';
export type EditorialStyle = 'hard_news' | 'investigative' | 'financial' | 'feature';
export type PublicationTarget = 'AP_PTI_Standard' | 'Regional_Print_Formal' | 'Digital_Brief';
export type QuoteHandling = 'translate_only' | 'bilingual_parenthetical';

export interface Entity {
  id: string;
  name: string;
  role: string;
  organization: string;
  origin: ItemOrigin;
  included: boolean;
}

export interface Fact {
  id: string;
  claim: string;
  supporting_context: string;
  source_document: string; // "Manual Journalist Entry" when origin === 'user_added'
  confidence: ConfidenceLevel;
  origin: ItemOrigin;
  included: boolean; // Default false if confidence === 'low'
}

export interface ExtractedQuote {
  quote_id: string;
  speaker: string;
  verbatim_text: string;
  source_language: TargetLanguageCode;
  context: string;
  source_document: string;
  substr_verified: boolean; // True if exact match in source; false if paraphrased/edited/added
  origin: ItemOrigin;
  included: boolean;
}

export interface ChronologyEvent {
  id: string;
  timestamp_or_date: string;
  event: string;
  origin: ItemOrigin;
  included: boolean;
}

export interface FactDossier {
  story_headline_suggestion: string;
  entities: Entity[];
  key_facts: Fact[];
  extracted_quotes: ExtractedQuote[];
  chronology: ChronologyEvent[];
}

export interface ExtractionResponse {
  extraction_id: string;
  source_language: TargetLanguageCode;
  total_chars_processed: number;
  warnings: string[];
  dossier: FactDossier;
}

export interface GenerationPayload {
  dossier: FactDossier;
  target_language: TargetLanguageCode;
  editorial_style: EditorialStyle;
  publication_target: PublicationTarget;
  quote_handling: QuoteHandling;
}

export type SSEEvent =
  | { delta: string }
  | { done: true }
  | { error: string };

export interface LanguageOption {
  code: TargetLanguageCode;
  label: string;
  nativeLabel: string;
  regionalNote: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    regionalNote: 'AP / PTI Style',
    flag: '🌐',
  },
  {
    code: 'hi',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    regionalNote: 'मानक पत्रकारिता / देवनागरी',
    flag: '🇮🇳',
  },
  {
    code: 'ml',
    label: 'Malayalam',
    nativeLabel: 'മലയാളം',
    regionalNote: 'പത്രഭാഷ / അച്ചടി ശൈലി',
    flag: '🌴',
  },
];

export const EDITORIAL_STYLES: { id: EditorialStyle; label: string; description: string }[] = [
  {
    id: 'hard_news',
    label: 'Hard News',
    description: 'Inverted pyramid, urgent dateline lede, objective attribution',
  },
  {
    id: 'investigative',
    label: 'Investigative Report',
    description: 'Deep evidential timeline, audit records, cross-examined testimony',
  },
  {
    id: 'financial',
    label: 'Financial Brief',
    description: 'Fiscal KPIs, investment syndication, market liquidity impact',
  },
  {
    id: 'feature',
    label: 'Feature Narrative',
    description: 'Human-centered framing, atmospheric scene pacing, rich quotes',
  },
];

export const PUBLICATION_TARGETS: { id: PublicationTarget; label: string; description: string }[] = [
  {
    id: 'AP_PTI_Standard',
    label: 'AP / PTI Standard',
    description: 'Wire agency baseline with standard dateline conventions',
  },
  {
    id: 'Regional_Print_Formal',
    label: 'Regional Print Formal',
    description: 'High-register literary grammar, native script typography (Mathrubhumi / Dainik Jagran)',
  },
  {
    id: 'Digital_Brief',
    label: 'Digital Brief',
    description: 'Scannable takeaways, concise paragraphs, high mobile readability',
  },
];

export const QUOTE_POLICIES: { id: QuoteHandling; label: string; description: string }[] = [
  {
    id: 'translate_only',
    label: 'Translate Only',
    description: 'Direct translation into target language only',
  },
  {
    id: 'bilingual_parenthetical',
    label: 'Bilingual Parenthetical',
    description: 'Translated quote followed by verbatim [Original: "..."] citation',
  },
];
