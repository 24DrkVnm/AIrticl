import {
  TargetLanguageCode,
  EditorialStyle,
  PublicationTarget,
  QuoteHandling,
} from "@/types/pipeline";

export interface ExporterConfig {
  language: TargetLanguageCode;
  style: EditorialStyle;
  target: PublicationTarget;
  quoteHandling: QuoteHandling;
  factCount: number;
  verifiedQuoteCount: number;
}

export function slugifyTitle(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    // Preserve English, Devanagari (\u0900-\u097F), and Malayalam (\u0D00-\u0D7F) characters
    .replace(/[^\w\u0900-\u097F\u0D00-\u0D7F-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "") || "news-article";
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function exportStandaloneHtml(
  title: string,
  sanitizedHtml: string,
  config: ExporterConfig
): void {
  const slug = slugifyTitle(title || "news-article");
  const filename = `${slug}_${config.language}.html`;

  const dateLocaleMap: Record<TargetLanguageCode, string> = {
    en: "en-IN",
    hi: "hi-IN",
    ml: "ml-IN",
  };

  const currentDate = new Date().toLocaleDateString(dateLocaleMap[config.language] || "en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString(dateLocaleMap[config.language] || "en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const languageLabelMap: Record<TargetLanguageCode, string> = {
    en: "English (AP / PTI Standard)",
    hi: "हिन्दी (मानक पत्रकारिता)",
    ml: "മലയാളം (പത്രഭാഷ / അച്ചടി ശൈലി)",
  };

  const standaloneHtml = `<!DOCTYPE html>
<html lang="${config.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title || "Synthesized News Story")}</title>
  
  <!-- Indic & Editorial Google Fonts Preconnect -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600;700&family=Noto+Serif+Malayalam:wght@400;600;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #111827;
      --muted-color: #64748b;
      --border-color: #e2e8f0;
      --badge-bg: #f1f5f9;
      --verified-bg: #ecfdf5;
      --verified-border: #10b981;
      --verified-text: #065f46;
      --quote-bg: #f8fafc;
      --quote-border: #2563eb;
      --font-body: "Noto Serif", Georgia, Charter, serif;
      --line-height-body: 1.75;
    }

    /* Indic Script Specific Typography Adjustments */
    html[lang="hi"] {
      --font-body: "Noto Serif Devanagari", "Kohinoor Devanagari", "Mangal", "Kokila", Georgia, serif;
      --line-height-body: 1.85; /* Generous breathing room for Devanagari Matras */
    }

    html[lang="ml"] {
      --font-body: "Noto Serif Malayalam", "Manjari", "Chilanka", "Rachana", "Gayathri", Georgia, serif;
      --line-height-body: 1.9; /* Generous vertical clearance for Malayalam Koottaksharam */
    }

    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0b0f17;
        --text-color: #f3f4f6;
        --muted-color: #94a3b8;
        --border-color: #1e293b;
        --badge-bg: #1e293b;
        --verified-bg: #064e3b;
        --verified-border: #059669;
        --verified-text: #a7f3d0;
        --quote-bg: #0f172a;
        --quote-border: #38bdf8;
      }
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: var(--font-body);
      line-height: var(--line-height-body);
      font-size: 1.2rem;
      padding: 3rem 1.25rem;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }

    .article-container {
      max-width: 740px;
      margin: 0 auto;
    }

    /* Verification Header */
    .metadata-card {
      font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 0.8125rem;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 1.25rem;
      margin-bottom: 2rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.625rem;
      color: var(--muted-color);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .pill-verified {
      background: var(--verified-bg);
      color: var(--verified-text);
      border: 1px solid var(--verified-border);
    }

    .pill-style {
      background: var(--badge-bg);
      color: var(--text-color);
    }

    .timestamp {
      margin-left: auto;
      font-size: 0.8rem;
    }

    /* Editorial Typography */
    h1 {
      font-size: 2.25rem;
      line-height: 1.3;
      font-weight: 700;
      margin-bottom: 1.5rem;
      letter-spacing: -0.015em;
    }

    h2 {
      font-size: 1.5rem;
      line-height: 1.35;
      font-weight: 700;
      margin-top: 2.25rem;
      margin-bottom: 1rem;
    }

    p {
      margin-bottom: 1.5rem;
    }

    blockquote {
      margin: 1.75rem 0;
      padding: 1.1rem 1.4rem;
      background: var(--quote-bg);
      border-left: 4px solid var(--quote-border);
      border-radius: 0 0.5rem 0.5rem 0;
      font-style: italic;
    }

    blockquote p {
      margin-bottom: 0;
    }

    ul, ol {
      margin: 1.25rem 0 1.5rem 1.75rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    strong {
      font-weight: 700;
    }

    footer.editorial-footer {
      margin-top: 3.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      font-family: "Inter", sans-serif;
      font-size: 0.8125rem;
      color: var(--muted-color);
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    /* Print Stylesheet */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        font-size: 11pt;
        line-height: 1.6;
        padding: 0;
      }
      .article-container {
        max-width: 100% !important;
      }
      blockquote {
        background: none !important;
        border-left: 3px solid #000000 !important;
      }
    }
  </style>
</head>
<body>
  <main class="article-container">
    <div class="metadata-card">
      <span class="pill pill-verified">
        ✓ Verified (${config.factCount} Facts / ${config.verifiedQuoteCount} Quotes)
      </span>
      <span class="pill pill-style">
        ${escapeHtml(config.style.replace("_", " "))}
      </span>
      <span class="pill pill-style">
        ${escapeHtml(config.target.replace(/_/g, " "))}
      </span>
      <span class="timestamp">${currentDate} • ${currentTime}</span>
    </div>

    <article class="article-content">
      ${sanitizedHtml}
    </article>

    <footer class="editorial-footer">
      <div>
        <strong>NewsSynth Studio</strong> • Multilingual Editorial Synthesis Engine
      </div>
      <div>
        ${languageLabelMap[config.language] || config.language.toUpperCase()} • Quote Policy: ${config.quoteHandling}
      </div>
    </footer>
  </main>
</body>
</html>`;

  // Trigger browser download via Blob
  const blob = new Blob([standaloneHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
