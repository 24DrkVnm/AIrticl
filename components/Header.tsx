"use client";

import React from "react";
import {
  PipelineStatus,
  TargetLanguageCode,
  EditorialStyle,
  PublicationTarget,
  QuoteHandling,
  SUPPORTED_LANGUAGES,
  EDITORIAL_STYLES,
  PUBLICATION_TARGETS,
  QUOTE_POLICIES,
} from "@/types/pipeline";
import {
  Newspaper,
  Globe,
  SlidersHorizontal,
  Layers,
  Quote,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Database,
  Radio,
  StopCircle,
} from "lucide-react";

interface HeaderProps {
  status: PipelineStatus;
  targetLanguage: TargetLanguageCode;
  onLanguageChange: (lang: TargetLanguageCode) => void;
  editorialStyle: EditorialStyle;
  onStyleChange: (style: EditorialStyle) => void;
  publicationTarget: PublicationTarget;
  onPublicationTargetChange: (target: PublicationTarget) => void;
  quoteHandling: QuoteHandling;
  onQuoteHandlingChange: (policy: QuoteHandling) => void;
  useMock: boolean;
  onToggleMock: (useMock: boolean) => void;
}

export function Header({
  status,
  targetLanguage,
  onLanguageChange,
  editorialStyle,
  onStyleChange,
  publicationTarget,
  onPublicationTargetChange,
  quoteHandling,
  onQuoteHandlingChange,
  useMock,
  onToggleMock,
}: HeaderProps) {
  const renderStatusBadge = () => {
    switch (status) {
      case "Extracting Facts...":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Extracting Facts...
          </span>
        );
      case "Review Ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Review Ready
          </span>
        );
      case "Streaming Article...":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Streaming Article...
          </span>
        );
      case "Stopped":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            <StopCircle className="w-3.5 h-3.5" />
            Stopped
          </span>
        );
      case "Error":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5" />
            Error
          </span>
        );
      case "Idle":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Idle
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 transition-colors">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Pipeline Status */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center shadow-xs">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  NewsSynth Studio
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Multilingual AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                English (en) • हिन्दी (hi) • മലയാളം (ml)
              </p>
            </div>
          </div>

          <div className="hidden md:block pl-2 border-l border-slate-200 dark:border-slate-800">
            {renderStatusBadge()}
          </div>
        </div>

        {/* Global Controls & 4 Pipeline Selectors */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* 1. Target Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-2xs">
            <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="flex flex-col text-left">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Language
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => onLanguageChange(e.target.value as TargetLanguageCode)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option
                    key={lang.code}
                    value={lang.code}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {lang.flag} {lang.label} ({lang.nativeLabel}) — {lang.regionalNote}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Editorial Style Selector */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-2xs">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="flex flex-col text-left">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Style
              </label>
              <select
                value={editorialStyle}
                onChange={(e) => onStyleChange(e.target.value as EditorialStyle)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                {EDITORIAL_STYLES.map((style) => (
                  <option
                    key={style.id}
                    value={style.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Publication Target Selector */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-2xs">
            <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="flex flex-col text-left">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Target Format
              </label>
              <select
                value={publicationTarget}
                onChange={(e) => onPublicationTargetChange(e.target.value as PublicationTarget)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                {PUBLICATION_TARGETS.map((target) => (
                  <option
                    key={target.id}
                    value={target.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {target.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Quote Policy Selector */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-2xs">
            <Quote className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <div className="flex flex-col text-left">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                Quote Policy
              </label>
              <select
                value={quoteHandling}
                onChange={(e) => onQuoteHandlingChange(e.target.value as QuoteHandling)}
                className="bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
              >
                {QUOTE_POLICIES.map((policy) => (
                  <option
                    key={policy.id}
                    value={policy.id}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {policy.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mock Mode Developer Switch */}
          <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onToggleMock(!useMock)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition border ${
                useMock
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
              title={
                useMock
                  ? "Currently using realistic mock data (Kochi Green Maritime Hub)"
                  : "Currently targeting live FastAPI backend at localhost:8000"
              }
            >
              {useMock ? (
                <>
                  <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Mock Mode</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <span>Live FastAPI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
