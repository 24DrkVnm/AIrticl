"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { formatBytes } from "@/lib/utils";
import {
  UploadCloud,
  FileText,
  Trash2,
  Sparkles,
  ClipboardList,
  AlertCircle,
  FilePlus,
  Info,
  CheckCircle2,
} from "lucide-react";

interface SourceUploaderProps {
  onExtract: (files: File[], rawText: string) => Promise<void>;
  isLoading: boolean;
}

const ACCEPTED_EXTENSIONS = [".txt", ".pdf", ".docx", ".vtt", ".srt"];
const MAX_FILES = 5;
const MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_RAW_TEXT_CHARS = 120000; // 120,000 chars

export function SourceUploader({ onExtract, isLoading }: SourceUploaderProps) {
  const [activeTab, setActiveTab] = useState<"files" | "paste">("files");
  const [files, setFiles] = useState<File[]>([]);
  const [rawText, setRawText] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const sizePercentage = Math.min(100, Math.round((totalBytes / MAX_TOTAL_SIZE_BYTES) * 100));
  const filePercentage = Math.min(100, Math.round((files.length / MAX_FILES) * 100));
  const charPercentage = Math.min(100, Math.round((rawText.length / MAX_RAW_TEXT_CHARS) * 100));

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validCandidates: File[] = [];
    const incoming = Array.from(newFiles);

    for (const file of incoming) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        setErrorMessage(
          `Unsupported file format: ${file.name}. Allowed: .txt, .pdf, .docx, .vtt, .srt`
        );
        return;
      }
      validCandidates.push(file);
    }

    const merged = [...files, ...validCandidates];

    if (merged.length > MAX_FILES) {
      setErrorMessage(`Maximum limit of ${MAX_FILES} files exceeded.`);
      return;
    }

    const mergedTotalSize = merged.reduce((acc, f) => acc + f.size, 0);
    if (mergedTotalSize > MAX_TOTAL_SIZE_BYTES) {
      setErrorMessage(
        `Total payload size exceeds 10MB limit (Current: ${formatBytes(mergedTotalSize)}).`
      );
      return;
    }

    setFiles(merged);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setErrorMessage(null);
  };

  const loadSampleKochiData = () => {
    // English, Hindi & Malayalam field notes sample
    setRawText(`[KOCHI PORT & GREEN CORRIDOR BRIEFING - FIELD NOTES]
- K. V. Radhakrishnan (CMD, Cochin Port Authority): "Kochi is positioned to become South Asia's first certified green ammonia bunkering destination by late 2027. We are linking 600 MW dedicated offshore wind with electrolysis berths."
- പാരിസ്ഥിതിക അനുമതി: വേമ്പനാട്ട് കായലിലെ ജൈവവൈവിധ്യത്തിന് കോട്ടം തട്ടാത്ത രീതിയിലാണ് ഡ്രെഡ്ജിംഗ് ആസൂത്രണം ചെയ്തിട്ടുള്ളത് എന്ന് ഡോ. അനിത ചാക്കോ (NIO) വ്യക്തമാക്കി.
- कोच्चि पत्तन परियोजना: ₹15,000 करोड़ ($1.8B) की ग्रीन हाइड्रोजन परियोजना से एर्नाकुलम और अलप्पुझा में 4,200 कुशल रोजगार सृजित होंगे।`);

    const sampleFile1 = new File(
      [
        "Cochin Port Authority Tripartite Accord: Phase 1 ₹6,500 Crore subsea cable installation roadmap.",
      ],
      "kochi_port_masterplan_2026.pdf",
      { type: "application/pdf" }
    );
    const sampleFile2 = new File(
      [
        "Technical Interconnector Spec: 600 MW HVDC line specifications and ecological zero-discharge protocol.",
      ],
      "technical_interconnector_spec.docx",
      { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
    );

    setFiles([sampleFile1, sampleFile2]);
    setErrorMessage(null);
  };

  const handleRunExtraction = async () => {
    if (files.length === 0 && (!rawText || rawText.trim().length === 0)) {
      setErrorMessage("Please attach at least one source file or paste reporter notes.");
      return;
    }
    if (rawText.length > MAX_RAW_TEXT_CHARS) {
      setErrorMessage(`Raw text exceeds 120,000 characters limit.`);
      return;
    }
    setErrorMessage(null);
    await onExtract(files, rawText.trim());
  };

  const getFormatBadge = (filename: string) => {
    const ext = filename.split(".").pop()?.toUpperCase() || "DOC";
    let color = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    if (ext === "PDF") color = "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900";
    if (ext === "DOCX") color = "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900";
    if (ext === "VTT" || ext === "SRT") color = "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900";
    if (ext === "TXT") color = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900";

    return (
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
        {ext}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Tabs */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Stage 1: Source Materials Ingestion
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload interview recordings, documents, or paste notes in EN, HI, or ML
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadSampleKochiData}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 font-medium rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            Load Sample Kochi Materials
          </button>

          <div className="flex items-center rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === "files"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Files ({files.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`px-3 py-1 rounded-md transition ${
                activeTab === "paste"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Paste Notes
            </button>
          </div>
        </div>
      </div>

      {/* Capacity Guardrails Visual Bars */}
      <div className="px-5 py-2.5 bg-slate-100/50 dark:bg-slate-950 border-b border-slate-200/60 dark:border-slate-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* File Count Limit Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>
              Files: <strong className="text-slate-700 dark:text-slate-200">{files.length}</strong> / {MAX_FILES} max
            </span>
            <span>{filePercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                filePercentage >= 100 ? "bg-rose-500" : filePercentage >= 80 ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${filePercentage}%` }}
            />
          </div>
        </div>

        {/* Total File Size Limit Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>
              Size: <strong className="text-slate-700 dark:text-slate-200">{formatBytes(totalBytes)}</strong> / 10 MB max
            </span>
            <span>{sizePercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                sizePercentage >= 100 ? "bg-rose-500" : sizePercentage >= 80 ? "bg-amber-500" : "bg-blue-600"
              }`}
              style={{ width: `${sizePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 flex-1 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === "files" ? (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                dragActive
                  ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/40 dark:bg-slate-900/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.docx,.vtt,.srt"
                className="hidden"
                onChange={handleFileInputChange}
              />
              <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Drop interview recordings, transcripts, or notes here
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports <span className="font-mono font-medium">.txt, .pdf, .docx, .vtt, .srt</span> (Max 5 files, 10MB total)
              </p>
              <span className="mt-3 inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                <FilePlus className="w-3.5 h-3.5 mr-1" /> Browse Local Files
              </span>
            </div>

            {/* Ingested File List */}
            {files.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      {getFormatBadge(file.name)}
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </span>
                      <span className="text-slate-400 text-[11px] shrink-0">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Paste Raw Transcript Tab */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                Raw Interview Audio Transcript & Reporter Notes (EN / HI / ML)
              </label>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>
                  <strong>{rawText.length.toLocaleString()}</strong> / {MAX_RAW_TEXT_CHARS.toLocaleString()} chars
                </span>
                <div className="w-14 bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${charPercentage >= 95 ? "bg-rose-500" : "bg-blue-600"}`}
                    style={{ width: `${charPercentage}%` }}
                  />
                </div>
              </div>
            </div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw audio transcripts, press briefing notes, or translated interview records here (Supports English, Hindi, and Malayalam)..."
              className="w-full text-xs font-mono p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none leading-relaxed"
            />
          </div>
        )}
      </div>

      {/* Extraction CTA Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Stage 1 outputs structured entity, fact & quote claims.</span>
        </div>

        <button
          type="button"
          onClick={handleRunExtraction}
          disabled={isLoading || (files.length === 0 && rawText.trim().length === 0)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
            isLoading || (files.length === 0 && rawText.trim().length === 0)
              ? "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/20"
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Extracting Facts & Entities...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>Run Feature Extraction</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
