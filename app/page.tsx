"use client";

import React, { useState, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { SourceUploader } from "@/components/SourceUploader";
import { DossierInspector } from "@/components/DossierInspector";
import { ArticleEditor } from "@/components/ArticleEditor";
import {
  FactDossier,
  PipelineStatus,
  TargetLanguageCode,
  EditorialStyle,
  PublicationTarget,
  QuoteHandling,
  GenerationPayload,
  ExtractionResponse,
} from "@/types/pipeline";
import {
  extractFacts,
  streamArticleGeneration,
  MOCK_EXTRACTION_RESPONSE,
} from "@/lib/api";
import { exportStandaloneHtml } from "@/lib/exporter";
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

export default function NewsStudioPage() {
  // ── Global Pipeline Configuration ──────────────────────────────
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>("Idle");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguageCode>("en");
  const [editorialStyle, setEditorialStyle] = useState<EditorialStyle>("hard_news");
  const [publicationTarget, setPublicationTarget] =
    useState<PublicationTarget>("AP_PTI_Standard");
  const [quoteHandling, setQuoteHandling] = useState<QuoteHandling>("translate_only");
  const [useMock, setUseMock] = useState<boolean>(true);

  // ── Stage 1: Fact Dossier ──────────────────────────────────────
  const [dossier, setDossier] = useState<FactDossier | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionWarnings, setExtractionWarnings] = useState<string[]>([]);

  // ── Stage 2: Article Content & Streaming ───────────────────────
  const [streamingMarkdown, setStreamingMarkdown] = useState<string>("");
  const [finalHtml, setFinalHtml] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── Toast Notification ─────────────────────────────────────────
  const [toast, setToast] = useState<{
    type: "info" | "success" | "error" | "warning";
    message: string;
  } | null>(null);

  const showToast = useCallback(
    (type: "info" | "success" | "error" | "warning", message: string) => {
      setToast({ type, message });
      setTimeout(() => setToast(null), 5000);
    },
    []
  );

  // ── Stage 1: Feature Extraction ────────────────────────────────
  const handleExtractFacts = useCallback(
    async (files: File[], rawText: string) => {
      try {
        setIsExtracting(true);
        setPipelineStatus("Extracting Facts...");
        setExtractionWarnings([]);
        showToast(
          "info",
          `Processing ${files.length} document(s) and field notes for AI fact extraction...`
        );

        const response: ExtractionResponse = await extractFacts(
          files,
          rawText,
          useMock
        );

        setDossier(response.dossier);
        setExtractionWarnings(response.warnings);
        setPipelineStatus("Review Ready");

        const lowConfidenceCount = response.dossier.key_facts.filter(
          (f) => f.confidence === "low"
        ).length;
        const unverifiedQuoteCount = response.dossier.extracted_quotes.filter(
          (q) => !q.substr_verified
        ).length;

        let successMsg = `Extracted ${response.dossier.key_facts.length} facts and ${response.dossier.extracted_quotes.length} quotes.`;
        if (lowConfidenceCount > 0) {
          successMsg += ` ${lowConfidenceCount} low-confidence claim(s) excluded by default.`;
        }
        if (unverifiedQuoteCount > 0) {
          successMsg += ` ${unverifiedQuoteCount} quote(s) flagged as unverified.`;
        }

        showToast(
          response.warnings.length > 0 ? "warning" : "success",
          successMsg
        );
      } catch (err: unknown) {
        console.error("Extraction error:", err);
        setPipelineStatus("Error");
        showToast(
          "error",
          err instanceof Error
            ? err.message
            : "Failed to extract facts from source files."
        );
      } finally {
        setIsExtracting(false);
      }
    },
    [useMock, showToast]
  );

  // ── Stage 2: Editorial Synthesis Streaming ─────────────────────
  const handleGenerateArticle = useCallback(async () => {
    if (!dossier) return;

    const activeFacts = dossier.key_facts.filter((f) => f.included);
    const activeQuotes = dossier.extracted_quotes.filter((q) => q.included);

    if (activeFacts.length === 0 && activeQuotes.length === 0) {
      showToast(
        "error",
        "Please select at least one verified fact or quote in the dossier before generating."
      );
      return;
    }

    const payload: GenerationPayload = {
      dossier,
      target_language: targetLanguage,
      editorial_style: editorialStyle,
      publication_target: publicationTarget,
      quote_handling: quoteHandling,
    };

    setIsStreaming(true);
    setPipelineStatus("Streaming Article...");
    setStreamingMarkdown("");
    setFinalHtml("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await streamArticleGeneration(
        payload,
        {
          onDelta: (chunk: string) => {
            setStreamingMarkdown((prev) => prev + chunk);
          },
          onComplete: () => {
            setIsStreaming(false);
            setPipelineStatus("Review Ready");
            showToast(
              "success",
              `Synthesis complete in ${targetLanguage.toUpperCase()}. Ready for editorial review and export.`
            );
          },
          onError: (errMsg: string) => {
            setIsStreaming(false);
            setPipelineStatus("Error");
            showToast("error", `Stream error: ${errMsg}`);
          },
        },
        controller.signal,
        useMock
      );
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.name === "AbortError" || controller.signal.aborted)
      ) {
        // User-initiated abort, handled elsewhere
        return;
      }
      setIsStreaming(false);
      setPipelineStatus("Error");
      showToast(
        "error",
        err instanceof Error
          ? err.message
          : "Could not initialize article generation stream."
      );
    }
  }, [
    dossier,
    targetLanguage,
    editorialStyle,
    publicationTarget,
    quoteHandling,
    useMock,
    showToast,
  ]);

  const handleAbortGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setPipelineStatus("Stopped");
    showToast("info", "Article generation stream stopped by journalist.");
  }, [showToast]);

  // ── Stage 3: Standalone HTML Export ────────────────────────────
  const handleExport = useCallback(() => {
    if (!finalHtml || !dossier) return;

    const factCount = dossier.key_facts.filter((f) => f.included).length;
    const verifiedQuoteCount = dossier.extracted_quotes.filter(
      (q) => q.included && q.substr_verified
    ).length;

    exportStandaloneHtml(dossier.story_headline_suggestion, finalHtml, {
      language: targetLanguage,
      style: editorialStyle,
      target: publicationTarget,
      quoteHandling,
      factCount,
      verifiedQuoteCount,
    });

    showToast("success", "Standalone HTML exported with Indic typography.");
  }, [
    finalHtml,
    dossier,
    targetLanguage,
    editorialStyle,
    publicationTarget,
    quoteHandling,
    showToast,
  ]);

  // ── Workspace Reset ────────────────────────────────────────────
  const handleResetWorkspace = useCallback(() => {
    if (
      !window.confirm(
        "Are you sure you want to reset the workspace? Ingested sources, dossier, and article canvas will be cleared."
      )
    ) {
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setDossier(null);
    setStreamingMarkdown("");
    setFinalHtml("");
    setExtractionWarnings([]);
    setPipelineStatus("Idle");
    setIsStreaming(false);
    setIsExtracting(false);
    showToast("info", "Workspace reset to initial state.");
  }, [showToast]);

  // ── Compute canGenerate ────────────────────────────────────────
  const canGenerate = Boolean(
    dossier &&
      !isStreaming &&
      (dossier.key_facts.some((f) => f.included) ||
        dossier.extracted_quotes.some((q) => q.included))
  );

  // ── Toast badge color helper ───────────────────────────────────
  const toastColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-emerald-900/90 text-emerald-100 border-emerald-700";
      case "error":
        return "bg-rose-900/90 text-rose-100 border-rose-700";
      case "warning":
        return "bg-amber-900/90 text-amber-100 border-amber-700";
      default:
        return "bg-slate-900/90 text-slate-100 border-slate-700";
    }
  };

  const toastIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950">
      {/* ── Top Navigation & Global Controls ───────────────── */}
      <Header
        status={pipelineStatus}
        targetLanguage={targetLanguage}
        onLanguageChange={setTargetLanguage}
        editorialStyle={editorialStyle}
        onStyleChange={setEditorialStyle}
        publicationTarget={publicationTarget}
        onPublicationTargetChange={setPublicationTarget}
        quoteHandling={quoteHandling}
        onQuoteHandlingChange={setQuoteHandling}
        useMock={useMock}
        onToggleMock={setUseMock}
      />

      {/* ── Toast Notification Banner (Fixed Bottom Right) ─── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg border flex items-center gap-3 text-xs font-medium ${toastColor(toast.type)}`}
          >
            {toastIcon(toast.type)}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-white/50 hover:text-white text-sm font-bold px-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── Main Studio Split Layout ───────────────────────── */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Workflow Breadcrumb & Quick Actions */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Newsroom Workflow:
            </span>
            <span>1. Ingest Sources (EN / HI / ML)</span>
            <span>&rarr;</span>
            <span>2. Verify Fact Dossier</span>
            <span>&rarr;</span>
            <span>3. Stream Localized Article</span>
          </div>

          <div className="flex items-center gap-2">
            {!dossier && (
              <button
                type="button"
                onClick={() => {
                  setDossier(
                    JSON.parse(
                      JSON.stringify(MOCK_EXTRACTION_RESPONSE.dossier)
                    )
                  );
                  setExtractionWarnings(MOCK_EXTRACTION_RESPONSE.warnings);
                  setPipelineStatus("Review Ready");
                  showToast(
                    "info",
                    "Loaded Kochi Green Maritime Hub demo dossier."
                  );
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 font-medium transition shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Quick Load Demo Dossier
              </button>
            )}

            {(dossier || streamingMarkdown || finalHtml) && (
              <button
                type="button"
                onClick={handleResetWorkspace}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 font-medium transition shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Workspace
              </button>
            )}
          </div>
        </div>

        {/* Extraction Warnings Banner */}
        {extractionWarnings.length > 0 && dossier && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Extraction Pipeline Notices ({extractionWarnings.length})
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-amber-700 dark:text-amber-300">
              {extractionWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ── 50/50 Desktop Two-Pane Grid ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ─ Left Pane: Ingestion & Dossier Inspector ── */}
          <div className="space-y-6 flex flex-col">
            <SourceUploader
              onExtract={handleExtractFacts}
              isLoading={isExtracting}
            />

            {dossier && (
              <DossierInspector dossier={dossier} onChange={setDossier} />
            )}
          </div>

          {/* ─ Right Pane: Article Editor ─────────────── */}
          <div className="h-full">
            <ArticleEditor
              streamingMarkdown={streamingMarkdown}
              isStreaming={isStreaming}
              targetLanguage={targetLanguage}
              status={pipelineStatus}
              canGenerate={canGenerate}
              onHtmlChange={setFinalHtml}
              onGenerate={handleGenerateArticle}
              onAbort={handleAbortGeneration}
              onExport={handleExport}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
