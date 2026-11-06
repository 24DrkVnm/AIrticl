import {
  ExtractionResponse,
  FactDossier,
  GenerationPayload,
  TargetLanguageCode,
  SSEEvent,
  Fact,
  ExtractedQuote,
  Entity,
  ChronologyEvent,
} from "@/types/pipeline";
import { generateId } from "./utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "dev-local-key";

const MAX_FILES = 5;
const MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_RAW_TEXT_CHARS = 120000; // 120,000 chars

/**
 * Rich mock ExtractionResponse centered on the Kochi Green Hydrogen & Maritime Logistics Hub.
 * Contains 3 entities, 4 facts (1 'low' confidence unchecked by default),
 * 3 quotes (2 substr_verified, 1 unverified/paraphrased for UI warning badge), and 3 chronology items.
 */
export const MOCK_EXTRACTION_RESPONSE: ExtractionResponse = {
  extraction_id: "ext_kochi_maritime_2026_09",
  source_language: "en",
  total_chars_processed: 38450,
  warnings: [
    "One low-confidence claim flagged regarding unconfirmed private equity concession.",
    "Quote quote-kochi-3 was flagged as unverified (paraphrased or partial match in source materials).",
  ],
  dossier: {
    story_headline_suggestion:
      "Kochi Secures ₹15,000-Crore Green Hydrogen Maritime Hub and Offshore Energy Corridor",
    entities: [
      {
        id: "ent-kochi-1",
        name: "K. V. Radhakrishnan",
        role: "Chairman & Managing Director",
        organization: "Cochin Port Authority & Green Marine Taskforce",
        origin: "extracted",
        included: true,
      },
      {
        id: "ent-kochi-2",
        name: "Dr. Anita Chacko",
        role: "Lead Marine Ecological Assessor",
        organization: "National Institute of Oceanography (NIO)",
        origin: "extracted",
        included: true,
      },
      {
        id: "ent-kochi-3",
        name: "Tariq Mansoor",
        role: "Vice President of Global Infrastructure",
        organization: "Indo-Nordic Maritime Clean Energy Syndicate",
        origin: "extracted",
        included: true,
      },
    ],
    key_facts: [
      {
        id: "fact-kochi-1",
        claim:
          "The Ministry of Ports and Cochin Port Authority have ratified a ₹15,000-crore ($1.8 billion) Green Marine Logistics Hub by late 2028.",
        supporting_context:
          "Tripartite charter signed between central maritime ministry, Kerala state logistics board, and sovereign wealth syndicates in Kochi.",
        source_document: "kochi_port_masterplan_2026.pdf",
        confidence: "high",
        origin: "extracted",
        included: true,
      },
      {
        id: "fact-kochi-2",
        claim:
          "A dedicated 600 MW subsea transmission cable will connect offshore wind arrays with Cochin Port electrolysis berths.",
        supporting_context:
          "High-voltage direct current (HVDC) corridor will prevent regional curtailment and feed direct green hydrogen electrolysis.",
        source_document: "technical_interconnector_spec.docx",
        confidence: "high",
        origin: "extracted",
        included: true,
      },
      {
        id: "fact-kochi-3",
        claim:
          "The hub will generate 4,200 high-skill maritime engineering positions across Ernakulam and Alappuzha districts.",
        supporting_context:
          "State economic impact assessment presented by the Department of Industries and Commerce.",
        source_document: "kerala_employment_forecast.pdf",
        confidence: "medium",
        origin: "extracted",
        included: true,
      },
      {
        id: "fact-kochi-4",
        claim:
          "An undisclosed private refinery consortium is rumored to be negotiating a 30% backdoor equity buyout in public terminal berths.",
        supporting_context:
          "Unverified reporter rumor mentioned in anonymous industry leak transcript; disputed by port leadership.",
        source_document: "press_corridor_whispers.txt",
        confidence: "low",
        origin: "extracted",
        included: false, // Default false for low confidence
      },
    ],
    extracted_quotes: [
      {
        quote_id: "quote-kochi-1",
        speaker: "K. V. Radhakrishnan",
        verbatim_text:
          "Kochi is positioned to become South Asia's first certified green ammonia bunkering destination by late 2027.",
        source_language: "en",
        context: "Official keynote delivered during the plenary address at the Kochi Maritime Conclave",
        source_document: "conclave_plenary_audio.vtt",
        substr_verified: true,
        origin: "extracted",
        included: true,
      },
      {
        quote_id: "quote-kochi-2",
        speaker: "Dr. Anita Chacko",
        verbatim_text:
          "Marine biodiversity impact assessments in the Vembanad estuary have established zero-discharge protocols for the brine effluent.",
        source_language: "en",
        context: "Scientific panel remarks on coastal ecosystem resilience",
        source_document: "environmental_clearance_briefing.pdf",
        substr_verified: true,
        origin: "extracted",
        included: true,
      },
      {
        quote_id: "quote-kochi-3",
        speaker: "Tariq Mansoor",
        verbatim_text:
          "Initial sovereign risk guarantees have been verbally conceded by the central ministry during pre-feasibility meetings.",
        source_language: "en",
        context: "Closed-door investor briefing excerpt recorded on tape",
        source_document: "investor_roundtable_field_notes.txt",
        substr_verified: false, // Demonstrates UI warning badge for unverified/paraphrased in source
        origin: "extracted",
        included: true,
      },
    ],
    chronology: [
      {
        id: "chron-kochi-1",
        timestamp_or_date: "09:30 IST, 14 Nov 2026",
        event:
          "Kerala Maritime Board and Cochin Port Authority finalize the tripartite Green Marine Corridor charter.",
        origin: "extracted",
        included: true,
      },
      {
        id: "chron-kochi-2",
        timestamp_or_date: "12:00 IST, 14 Nov 2026",
        event:
          "Union Ministry of Ports, Shipping and Waterways formally notifies the fast-track environmental clearance desk.",
        origin: "extracted",
        included: true,
      },
      {
        id: "chron-kochi-3",
        timestamp_or_date: "15:30 IST, 14 Nov 2026",
        event:
          "Indo-Nordic Syndicate syndicates ₹6,500 crore Phase 1 equity tranche at the Kochi International Maritime Conclave.",
        origin: "extracted",
        included: true,
      },
    ],
  },
};

/**
 * 3-Language Publication-Grade Mock Store for English, Hindi, and Malayalam.
 */
const MOCK_LOCALIZED_ARTICLES: Record<TargetLanguageCode, { base: string; originalQuotes: Record<string, string> }> = {
  en: {
    base: `# Kochi Secures ₹15,000-Crore Green Maritime Hub and Offshore Energy Corridor

**KOCHI —** In a decisive push to establish South Asia’s first zero-carbon transshipment cluster, the Cochin Port Authority and the Union Ministry of Ports, Shipping and Waterways on Thursday ratified a ₹15,000-crore ($1.8 billion) clean energy infrastructure pact. The strategic initiative establishes high-capacity green hydrogen bunkering and an offshore wind logistics terminal along the Arabian Sea corridor by late 2028.

## High-Capacity Bunkering and Grid Integration
Under the ratified tripartite agreement, a dedicated 600-megawatt subsea transmission cable will link deep-sea offshore wind berths directly with Cochin port's green electrolysis infrastructure. The project is projected to create over 4,200 high-skill maritime engineering jobs across Ernakulam and Alappuzha districts.

> "Kochi is positioned to become South Asia's first certified green ammonia bunkering destination by late 2027," stated K. V. Radhakrishnan, Chairman of the Cochin Port Authority. "This agreement provides both sovereign policy backing and verified debt syndication."

## Environmental Due Diligence and Wetland Protection
Addressing ecological concerns regarding the fragile Vembanad wetland network, marine scientists confirmed that strict zero-discharge benchmarks have been codified into the project blueprint.

> "Marine biodiversity impact assessments in the Vembanad estuary have established zero-discharge protocols for the brine effluent," affirmed Dr. Anita Chacko, Lead Marine Ecological Assessor at the National Institute of Oceanography.

With sovereign underwriting guaranteed, construction on the primary hydrogen storage terminal is scheduled to commence in early 2027.`,
    originalQuotes: {
      q1: "Kochi is positioned to become South Asia's first certified green ammonia bunkering destination by late 2027.",
      q2: "Marine biodiversity impact assessments in the Vembanad estuary have established zero-discharge protocols for the brine effluent.",
    },
  },

  hi: {
    base: `# कोच्चि में ₹15,000 करोड़ का हरित समुद्री हब और ऊर्जा गलियारा स्थापित होगा

**कोच्चि:** दक्षिण एशिया के समुद्री व्यापार को कार्बन-मुक्त बनाने की दिशा में एक ऐतिहासिक कदम उठाते हुए कोच्चि पत्तन प्राधिकरण और केंद्रीय पत्तन, पोत परिवहन एवं जलमार्ग मंत्रालय ने गुरुवार को ₹15,000 करोड़ ($1.8 अरब) के हरित ऊर्जा समझौते पर हस्ताक्षर किए। इस बहुआयामी परियोजना के तहत 2028 तक अरब सागर तट पर ग्रीन हाइड्रोजन बंकरिंग और अपतटीय पवन ऊर्जा लॉजिस्टिक्स हब तैयार किया जाएगा।

## ग्रिड संयोजन और रोजगार सृजन
समझौते के अंतर्गत 600 मेगावाट की अत्याधुनिक सब-सी ट्रांसमिशन केबल विझिंजम और कोचीन पोर्ट के इलेक्ट्रोलाइज़र संयंत्रों को सीधे जोड़ेगी। इस परियोजना से एर्नाकुलम और अलप्पुझा में 4,200 से अधिक उच्च-कुशल समुद्री इंजीनियरिंग रोजगार उत्पन्न होंगे।

> “कोच्चि 2027 के अंत तक दक्षिण एशिया का पहला प्रमाणित ग्रीन अमोनिया बंकरिंग केंद्र बनने के लिए पूरी तरह तैयार है,” कोच्चि पत्तन प्राधिकरण के अध्यक्ष के. वी. राधाकृष्णन ने कहा। “यह समझौता संप्रभु नीतिगत समर्थन और संस्थागत वित्तपोषण सुनिश्चित करता है।”

## पर्यावरणीय संतुलन और शून्य-अपशिष्ट मानक
वेम्बनाड आर्द्रभूमि के संरक्षण पर प्रकाश डालते हुए वैज्ञानिकों ने स्पष्ट किया कि समुद्री जैव विविधता को सुरक्षित रखने के लिए कड़े नियम लागू किए गए हैं।

> “वेम्बनाड मुहाने पर किए गए पर्यावरणीय प्रभाव आकलन में खारे अपशिष्ट के लिए शून्य-निस्तारण प्रोटोकॉल तय किए गए हैं,” राष्ट्रीय समुद्र विज्ञान संस्थान की प्रमुख पर्यावरण विशेषज्ञ डॉ. अनीता चाको ने स्पष्ट किया।

परियोजना के पहले चरण का निर्माण कार्य वर्ष 2027 की पहली तिमाही से प्रारंभ होगा।`,
    originalQuotes: {
      q1: "Kochi is positioned to become South Asia's first certified green ammonia bunkering destination by late 2027.",
      q2: "Marine biodiversity impact assessments in the Vembanad estuary have established zero-discharge protocols for the brine effluent.",
    },
  },

  ml: {
    base: `# കൊച്ചിയിൽ 15,000 കോടിയുടെ ഗ്രീൻ ഹൈഡ്രജൻ മാരിടൈം ഹബ്ബ് യാഥാർഥ്യമാകുന്നു

**കൊച്ചി:** ദക്ഷിണേഷ്യയിലെ പ്രഥമ കാർബൺ രഹിത കപ്പൽ ഗതാഗത ഇടനാഴിക്ക് തുടക്കമിട്ട് കൊച്ചിയിൽ 15,000 കോടി രൂപയുടെ ഗ്രീൻ ഹൈഡ്രജൻ-ഓഫ്ഷോർ വിൻഡ് എനർജി പദ്ധതിക്ക് ഔദ്യോഗിക അംഗീകാരം. വ്യാഴാഴ്ച കൊച്ചിൻ പോർട്ട് അതോറിറ്റിയും കേന്ദ്ര തുറമുഖ മന്ത്രാലയവും സംയുക്തമായാണ് കരാർ ഒപ്പുവെച്ചത്. 2028 അവസാനത്തോടെ പദ്ധതിയോടെ പൂർണതോതിൽ കമ്മീഷൻ ചെയ്യും.

## സബ്-സീ കേബിളും തൊഴിലവസരങ്ങളും
വിഴിഞ്ഞം മുതൽ കൊച്ചി വരെയുള്ള ഓഫ്ഷോർ കാറ്റാടിപ്പാടങ്ങളിൽനിന്നുള്ള 600 മെഗാവാട്ട് വൈദ്യുതി പ്രത്യേക സമുദ്രാന്തര കേബിൾ വഴി തുറമുഖത്തെ ഇലക്ട്രോലൈസർ പ്ലാന്റുകളിലേക്ക് എത്തിക്കും. എറണാകുളം, ആലപ്പുഴ ജില്ലകളിലായി 4,200 ലധികം ഉയർന്ന സാങ്കേതിക തൊഴിലവസരങ്ങൾ ഇതുവഴി സൃഷ്ടിക്കപ്പെടും.

> “2027 അവസാനത്തോടെ ദക്ഷിണേഷ്യയിലെ ആദ്യത്തെ സർട്ടിഫൈഡ് ഗ്രീൻ അമോണിയ ബങ്കറിംഗ് കേന്ദ്രമായി കൊച്ചി മാറും,” എന്ന് കൊച്ചിൻ പോർട്ട് അതോറിറ്റി ചെയർമാൻ കെ. വി. രാധാകൃഷ്ണൻ വ്യക്തമാക്കി.

## വേമ്പനാട് കായൽ സംരക്ഷണവും കർശന പാരിസ്ഥിതിക മാനദണ്ഡങ്ങളും
പാരിസ്ഥിതിക ആശങ്കകൾ പരിഹരിച്ചുകൊണ്ട് വേമ്പനാട്ട് കായലിലെ ആവാസവ്യവസ്ഥയ്ക്ക് യാതൊരു കോട്ടവും തട്ടാത്ത രീതിയിലാണ് ഡ്രെഡ്ജിംഗ് മാലിന്യ നിർമാർജനം ആസൂത്രണം ചെയ്തിട്ടുള്ളതെന്ന് സമുദ്രഗവേഷകർ ചൂണ്ടിക്കാട്ടി.

> “വേമ്പനാട് അഴിമുഖത്തെ ജൈവവൈവിധ്യ പഠനങ്ങളുടെ അടിസ്ഥാനത്തിൽ പുറന്തള്ളുന്ന അവശിഷ്ടങ്ങൾക്ക് സീറോ-ഡിസ്ചാർജ് നിബന്ധന ഏർപ്പെടുത്തിയിട്ടുണ്ട്,” എന്ന് നാഷണൽ ഇൻസ്റ്റിറ്റ്യൂട്ട് ഓഫ് ഓഷ്യാനോഗ്രഫിയിലെ മുഖ്യ ഗവേഷക ഡോ. അനിത ചാക്കോ പറഞ്ഞു.

നിർമാണത്തിന്റെ ഒന്നാം ഘട്ടം 2027 ആദ്യപാദത്തിൽ ആരംഭിക്കുമെന്ന് തുറമുഖ വൃത്തങ്ങൾ അറിയിച്ചു.`,
    originalQuotes: {
      q1: "Kochi is positioned to become South Asia's first certified green ammonia bunkering destination by late 2027.",
      q2: "Marine biodiversity impact assessments in the Vembanad estuary have established zero-discharge protocols for the brine effluent.",
    },
  },
};

/**
 * Normalizes incoming JSON response ensuring strict low-confidence unchecking.
 */
function normalizeExtractionResponse(raw: any): ExtractionResponse {
  const dossier = raw.dossier || {};
  return {
    extraction_id: raw.extraction_id || generateId("ext"),
    source_language: raw.source_language || "en",
    total_chars_processed: raw.total_chars_processed || 0,
    warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
    dossier: {
      story_headline_suggestion:
        dossier.story_headline_suggestion?.trim() ||
        "Kochi Secures ₹15,000-Crore Green Maritime Hub and Offshore Energy Corridor",
      entities: (dossier.entities || []).map((e: any, idx: number): Entity => ({
        id: e.id || generateId(`ent_${idx}`),
        name: e.name || "Unnamed Entity",
        role: e.role || "Official Representative",
        organization: e.organization || "Public Entity",
        origin: e.origin || "extracted",
        included: e.included !== false,
      })),
      key_facts: (dossier.key_facts || []).map((f: any, idx: number): Fact => {
        const confidence = (f.confidence === "low" || f.confidence === "medium" || f.confidence === "high")
          ? f.confidence
          : "high";
        return {
          id: f.id || generateId(`fact_${idx}`),
          claim: f.claim || "",
          supporting_context: f.supporting_context || "",
          source_document: f.source_document || (f.origin === "user_added" ? "Manual Journalist Entry" : "Uploaded Source Document"),
          confidence,
          origin: f.origin || "extracted",
          // Strict requirement: confidence === 'low' defaults to included: false, while high and medium default to true
          included: f.included !== undefined ? f.included : confidence !== "low",
        };
      }),
      extracted_quotes: (dossier.extracted_quotes || []).map((q: any, idx: number): ExtractedQuote => ({
        quote_id: q.quote_id || generateId(`quote_${idx}`),
        speaker: q.speaker || "Spokesperson",
        verbatim_text: q.verbatim_text || "",
        source_language: q.source_language || "en",
        context: q.context || "",
        source_document: q.source_document || "Ingested Audio/Document",
        substr_verified: q.substr_verified !== false,
        origin: q.origin || "extracted",
        included: q.included !== false,
      })),
      chronology: (dossier.chronology || []).map((c: any, idx: number): ChronologyEvent => ({
        id: c.id || generateId(`chron_${idx}`),
        timestamp_or_date: c.timestamp_or_date || "Date Unspecified",
        event: c.event || "",
        origin: c.origin || "extracted",
        included: c.included !== false,
      })),
    },
  };
}

/**
 * Stage 1: Fact Extraction with Client-Side Guardrails and Error Handling.
 */
export async function extractFacts(
  files: File[],
  rawText: string,
  useMock = false
): Promise<ExtractionResponse> {
  // Client-side Guardrails
  if (files.length > MAX_FILES) {
    throw new Error(`Maximum limit of ${MAX_FILES} files exceeded (provided: ${files.length}).`);
  }

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  if (totalBytes > MAX_TOTAL_SIZE_BYTES) {
    throw new Error(
      `Total file size exceeds 10MB limit (provided: ${(totalBytes / (1024 * 1024)).toFixed(2)}MB).`
    );
  }

  if (rawText && rawText.length > MAX_RAW_TEXT_CHARS) {
    throw new Error(
      `Raw text transcript exceeds 120,000 characters limit (provided: ${rawText.length.toLocaleString()} characters).`
    );
  }

  if (files.length === 0 && (!rawText || rawText.trim().length === 0)) {
    throw new Error("Please attach at least one source file or paste reporter notes.");
  }

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Deep clone the mock response
    const mock = JSON.parse(JSON.stringify(MOCK_EXTRACTION_RESPONSE)) as ExtractionResponse;

    // If custom raw text was provided, insert a dynamic verified claim
    if (rawText && rawText.trim().length > 20) {
      const excerpt = rawText.trim().slice(0, 150);
      mock.dossier.key_facts.unshift({
        id: generateId("fact_custom"),
        claim: `Direct Transcript Field Extraction: "${excerpt}..."`,
        supporting_context: "Extracted directly from reporter's live entered field notes.",
        source_document: "pasted_field_notes.txt",
        confidence: "high",
        origin: "extracted",
        included: true,
      });
    }

    return normalizeExtractionResponse(mock);
  }

  // Live FastAPI Backend Call
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.name);
    });

    if (rawText && rawText.trim().length > 0) {
      const textBlob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
      formData.append("files", textBlob, "transcript_pasted.txt");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/extract`, {
      method: "POST",
      headers: {
        "X-API-Key": API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorDetail = `Backend extraction error HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorDetail =
            typeof errorJson.detail === "string"
              ? errorJson.detail
              : JSON.stringify(errorJson.detail);
        }
      } catch {
        // Fall back to default error text
      }

      if (response.status === 413) {
        throw new Error(`File or payload too large (413): ${errorDetail}`);
      }
      if (response.status === 422) {
        throw new Error(`Unprocessable entity / Scanned document without OCR (422): ${errorDetail}`);
      }
      throw new Error(errorDetail);
    }

    const json = await response.json();
    return normalizeExtractionResponse(json);
  } catch (error) {
    if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
      throw new Error(
        `Cannot connect to FastAPI backend at ${API_BASE_URL}. Ensure your backend server is running on port 8000 (cd backend && python -m uvicorn app.main:app --port 8000).`
      );
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(String(error));
  }
}

/**
 * Stage 2: Resilient SSE Client with Multi-Byte UTF-8 Stream Buffering
 * Specifically engineered for 3-byte UTF-8 Devanagari (Hindi) and Malayalam scripts.
 */
export async function streamArticleGeneration(
  payload: GenerationPayload,
  callbacks: {
    onDelta: (mdChunk: string) => void;
    onComplete: () => void;
    onError: (message: string) => void;
  },
  signal: AbortSignal,
  useMock = false
): Promise<void> {
  // Filter payload so only items with included: true are sent
  const filteredPayload: GenerationPayload = {
    ...payload,
    dossier: {
      story_headline_suggestion: payload.dossier.story_headline_suggestion,
      entities: payload.dossier.entities.filter((e) => e.included),
      key_facts: payload.dossier.key_facts.filter((f) => f.included),
      extracted_quotes: payload.dossier.extracted_quotes.filter((q) => q.included),
      chronology: payload.dossier.chronology.filter((c) => c.included),
    },
  };

  if (useMock) {
    const lang = filteredPayload.target_language || "en";
    const localized = MOCK_LOCALIZED_ARTICLES[lang] || MOCK_LOCALIZED_ARTICLES.en;
    let articleText = localized.base;

    // Apply quote handling policy
    if (filteredPayload.quote_handling === "bilingual_parenthetical" && lang !== "en") {
      // Append original English quotes parenthetically
      articleText = articleText.replace(
        /(“[^”]+”|"[^"]+")/g,
        `$1 [Original: "${localized.originalQuotes.q1 || "Direct quote..."}"]`
      );
    }

    // Split into token chunks (words, markdown tags, whitespace) preserving multibyte characters
    const tokenRegex = /<[^>]+>|[^\s\p{P}]+|[\p{P}\s]+/gu;
    const tokens = articleText.match(tokenRegex) || [articleText];

    let index = 0;
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (signal.aborted) {
          clearInterval(interval);
          resolve();
          return;
        }

        if (index >= tokens.length) {
          clearInterval(interval);
          callbacks.onComplete();
          resolve();
          return;
        }

        const burst = Math.floor(Math.random() * 3) + 1;
        const chunk = tokens.slice(index, index + burst).join("");
        index += burst;
        callbacks.onDelta(chunk);
      }, 24);
    });
  }

  // Live FastAPI SSE Stream with Multi-Byte UTF-8 Buffer
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify(filteredPayload),
      signal,
    });

    if (!response.ok) {
      let errorMsg = `Server error HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // use default
      }
      callbacks.onError(errorMsg);
      return;
    }

    if (!response.body) {
      callbacks.onError("No response body received from generation endpoint.");
      return;
    }

    const reader = response.body.getReader();
    // Multi-Byte TextDecoder with stream mode enabled to avoid chopping 3-byte Indic UTF-8 code points
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Flush any remaining bytes in the decoder
        buffer += decoder.decode();
        break;
      }

      // stream: true preserves partial multi-byte UTF-8 sequences between read() calls
      buffer += decoder.decode(value, { stream: true });

      // SSE standard splits events by double newlines \n\n
      const parts = buffer.split("\n\n");
      // Keep the last part in buffer as it may be incomplete
      buffer = parts.pop() || "";

      for (const part of parts) {
        const lines = part.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(":")) {
            // Heartbeat comment
            continue;
          }

          if (trimmed.startsWith("data:")) {
            const dataStr = trimmed.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") {
              callbacks.onComplete();
              return;
            }

            try {
              const event: SSEEvent = JSON.parse(dataStr);
              if ("delta" in event && event.delta) {
                callbacks.onDelta(event.delta);
              } else if ("error" in event && event.error) {
                callbacks.onError(event.error);
                return;
              } else if ("done" in event && event.done) {
                callbacks.onComplete();
                return;
              }
            } catch {
              // Direct string delta fallback
              callbacks.onDelta(dataStr);
            }
          }
        }
      }
    }

    // Process any remaining event in buffer
    if (buffer.trim()) {
      const lines = buffer.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data:")) {
          const dataStr = trimmed.replace(/^data:\s*/, "");
          if (dataStr === "[DONE]") {
            callbacks.onComplete();
            return;
          }
          try {
            const event: SSEEvent = JSON.parse(dataStr);
            if ("delta" in event) callbacks.onDelta(event.delta);
          } catch {
            callbacks.onDelta(dataStr);
          }
        }
      }
    }

    callbacks.onComplete();
  } catch (err: unknown) {
    if (signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      // Abort is user-initiated; do not trigger onError
      return;
    }
    if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
      callbacks.onError(
        `Cannot connect to FastAPI backend at ${API_BASE_URL}. Ensure the backend is running on port 8000.`
      );
      return;
    }
    callbacks.onError(err instanceof Error ? err.message : String(err));
  }
}
