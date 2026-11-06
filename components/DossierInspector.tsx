"use client";

import React, { useState } from "react";
import {
  FactDossier,
  Fact,
  ExtractedQuote,
  Entity,
  ChronologyEvent,
  ItemOrigin,
  ConfidenceLevel,
} from "@/types/pipeline";
import { generateId } from "@/lib/utils";
import {
  ShieldCheck,
  Quote,
  Users,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Heading,
  Check,
  BadgeAlert,
  UserCheck,
  Edit2,
  FileCheck,
} from "lucide-react";

interface DossierInspectorProps {
  dossier: FactDossier;
  onChange: (dossier: FactDossier) => void;
}

type TabType = "facts" | "quotes" | "entities" | "chronology";

export function DossierInspector({ dossier, onChange }: DossierInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("facts");

  // Headline update
  const handleHeadlineChange = (headline: string) => {
    onChange({
      ...dossier,
      story_headline_suggestion: headline,
    });
  };

  // Facts Management
  const updateFact = (id: string, updates: Partial<Fact>) => {
    onChange({
      ...dossier,
      key_facts: dossier.key_facts.map((f) => {
        if (f.id === id) {
          const nextOrigin: ItemOrigin =
            f.origin === "user_added" ? "user_added" : "user_edited";
          return {
            ...f,
            ...updates,
            origin: updates.origin !== undefined ? updates.origin : nextOrigin,
          };
        }
        return f;
      }),
    });
  };

  const deleteFact = (id: string) => {
    onChange({
      ...dossier,
      key_facts: dossier.key_facts.filter((f) => f.id !== id),
    });
  };

  const addFact = () => {
    const newFact: Fact = {
      id: generateId("fact_manual"),
      claim: "Journalist-entered verified claim from interview notes.",
      supporting_context: "Manually cross-referenced with local field notes.",
      source_document: "Manual Journalist Entry",
      confidence: "high",
      origin: "user_added",
      included: true,
    };
    onChange({
      ...dossier,
      key_facts: [newFact, ...dossier.key_facts],
    });
  };

  // Quotes Management
  const updateQuote = (quoteId: string, updates: Partial<ExtractedQuote>) => {
    onChange({
      ...dossier,
      extracted_quotes: dossier.extracted_quotes.map((q) => {
        if (q.quote_id === quoteId) {
          const nextOrigin: ItemOrigin =
            q.origin === "user_added" ? "user_added" : "user_edited";
          // If text or speaker is edited manually, substr_verified becomes false unless explicitly set
          return {
            ...q,
            ...updates,
            origin: updates.origin !== undefined ? updates.origin : nextOrigin,
            substr_verified:
              updates.substr_verified !== undefined
                ? updates.substr_verified
                : q.origin === "extracted" && updates.verbatim_text
                ? false
                : q.substr_verified,
          };
        }
        return q;
      }),
    });
  };

  const deleteQuote = (quoteId: string) => {
    onChange({
      ...dossier,
      extracted_quotes: dossier.extracted_quotes.filter((q) => q.quote_id !== quoteId),
    });
  };

  const addQuote = () => {
    const newQuote: ExtractedQuote = {
      quote_id: generateId("quote_manual"),
      speaker: "Source Name",
      verbatim_text: "Direct quote spoken during field interview.",
      source_language: "en",
      context: "Press briefing or recorded field exchange",
      source_document: "Manual Journalist Entry",
      substr_verified: false,
      origin: "user_added",
      included: true,
    };
    onChange({
      ...dossier,
      extracted_quotes: [newQuote, ...dossier.extracted_quotes],
    });
  };

  // Entities Management
  const updateEntity = (id: string, updates: Partial<Entity>) => {
    onChange({
      ...dossier,
      entities: dossier.entities.map((e) => {
        if (e.id === id) {
          const nextOrigin: ItemOrigin =
            e.origin === "user_added" ? "user_added" : "user_edited";
          return {
            ...e,
            ...updates,
            origin: updates.origin !== undefined ? updates.origin : nextOrigin,
          };
        }
        return e;
      }),
    });
  };

  const deleteEntity = (id: string) => {
    onChange({
      ...dossier,
      entities: dossier.entities.filter((e) => e.id !== id),
    });
  };

  const addEntity = () => {
    const newEntity: Entity = {
      id: generateId("ent_manual"),
      name: "Subject Name",
      role: "Official Designation",
      organization: "Affiliated Institution",
      origin: "user_added",
      included: true,
    };
    onChange({
      ...dossier,
      entities: [...dossier.entities, newEntity],
    });
  };

  // Chronology Management
  const updateChronology = (id: string, updates: Partial<ChronologyEvent>) => {
    onChange({
      ...dossier,
      chronology: dossier.chronology.map((c) => {
        if (c.id === id) {
          const nextOrigin: ItemOrigin =
            c.origin === "user_added" ? "user_added" : "user_edited";
          return {
            ...c,
            ...updates,
            origin: updates.origin !== undefined ? updates.origin : nextOrigin,
          };
        }
        return c;
      }),
    });
  };

  const deleteChronology = (id: string) => {
    onChange({
      ...dossier,
      chronology: dossier.chronology.filter((c) => c.id !== id),
    });
  };

  const addChronology = () => {
    const newEvent: ChronologyEvent = {
      id: generateId("chron_manual"),
      timestamp_or_date: "14 Nov 2026",
      event: "Key verified milestone or announcement.",
      origin: "user_added",
      included: true,
    };
    onChange({
      ...dossier,
      chronology: [...dossier.chronology, newEvent],
    });
  };

  // Summary counts
  const factsIncluded = dossier.key_facts.filter((f) => f.included).length;
  const quotesIncluded = dossier.extracted_quotes.filter((q) => q.included).length;
  const entitiesIncluded = dossier.entities.filter((e) => e.included).length;
  const chronologyIncluded = dossier.chronology.filter((c) => c.included).length;

  // Provenance Badge Renderer
  const renderOriginBadge = (origin: ItemOrigin) => {
    switch (origin) {
      case "user_added":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <UserCheck className="w-3 h-3" /> Manual Entry
          </span>
        );
      case "user_edited":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Edit2 className="w-3 h-3" /> Edited by Journalist
          </span>
        );
      case "extracted":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <FileCheck className="w-3 h-3" /> Extracted from Source
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Headline Editor */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Verified Fact Dossier Inspector
            </h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-300 dark:border-emerald-800">
            {factsIncluded + quotesIncluded} Verified Claims Active
          </span>
        </div>

        {/* Story Headline Suggestion Input */}
        <div>
          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Heading className="w-3.5 h-3.5 text-blue-600" />
            Headline Suggestion (Editable)
          </label>
          <input
            type="text"
            value={dossier.story_headline_suggestion}
            onChange={(e) => handleHeadlineChange(e.target.value)}
            className="w-full text-sm font-semibold px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-2xs"
            placeholder="Primary story headline..."
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-5 pt-3 pb-0 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-100/40 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveTab("facts")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
            activeTab === "facts"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-md"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Key Facts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {factsIncluded}/{dossier.key_facts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("quotes")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
            activeTab === "quotes"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-md"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Quote className="w-4 h-4 text-indigo-600" />
          <span>Extracted Quotes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {quotesIncluded}/{dossier.extracted_quotes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("entities")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
            activeTab === "entities"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-md"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>Entities</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {entitiesIncluded}/{dossier.entities.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chronology")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition -mb-[1px] whitespace-nowrap ${
            activeTab === "chronology"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-md"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Clock className="w-4 h-4 text-purple-600" />
          <span>Chronology</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {chronologyIncluded}/{dossier.chronology.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-5 flex-1 max-h-[520px] overflow-y-auto space-y-3.5">
        {/* --- KEY FACTS TAB --- */}
        {activeTab === "facts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Facts with low confidence are unchecked by default. Check items to include in synthesis.
              </p>
              <button
                type="button"
                onClick={addFact}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Verified Fact
              </button>
            </div>

            {dossier.key_facts.map((fact) => (
              <div
                key={fact.id}
                className={`p-3.5 rounded-lg border transition ${
                  fact.included
                    ? "bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs"
                    : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={fact.included}
                    onChange={(e) => updateFact(fact.id, { included: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Confidence Badge */}
                        {fact.confidence === "high" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> High Confidence
                          </span>
                        )}
                        {fact.confidence === "medium" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Medium Confidence
                          </span>
                        )}
                        {fact.confidence === "low" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            <BadgeAlert className="w-3 h-3" /> Low Confidence (Unverified)
                          </span>
                        )}

                        {/* Provenance Badge */}
                        {renderOriginBadge(fact.origin)}

                        {/* Document Source */}
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          <FileText className="w-3 h-3" /> {fact.source_document}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteFact(fact.id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete fact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={fact.claim}
                      onChange={(e) => updateFact(fact.id, { claim: e.target.value })}
                      placeholder="Fact claim..."
                      className="w-full text-xs font-medium p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <input
                      type="text"
                      value={fact.supporting_context}
                      onChange={(e) =>
                        updateFact(fact.id, { supporting_context: e.target.value })
                      }
                      placeholder="Supporting context / verification detail..."
                      className="w-full text-[11px] text-slate-600 dark:text-slate-400 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- EXTRACTED QUOTES TAB --- */}
        {activeTab === "quotes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct on-the-record quotes. Verified substring matches carry an authenticity badge.
              </p>
              <button
                type="button"
                onClick={addQuote}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Quote
              </button>
            </div>

            {dossier.extracted_quotes.map((quote) => (
              <div
                key={quote.quote_id}
                className={`p-3.5 rounded-lg border transition ${
                  quote.included
                    ? "bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 shadow-2xs"
                    : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={quote.included}
                    onChange={(e) =>
                      updateQuote(quote.quote_id, { included: e.target.checked })
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Substring Verified Badge */}
                        {quote.substr_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Exact Match Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" /> Unverified / Paraphrased in Source
                          </span>
                        )}

                        {/* Provenance Badge */}
                        {renderOriginBadge(quote.origin)}

                        <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {quote.source_document}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteQuote(quote.quote_id)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete quote"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Speaker:
                      </span>
                      <input
                        type="text"
                        value={quote.speaker}
                        onChange={(e) =>
                          updateQuote(quote.quote_id, { speaker: e.target.value })
                        }
                        className="text-xs font-semibold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex-1"
                      />
                    </div>

                    <div className="relative pl-3 border-l-2 border-indigo-500">
                      <textarea
                        rows={2}
                        value={quote.verbatim_text}
                        onChange={(e) =>
                          updateQuote(quote.quote_id, {
                            verbatim_text: e.target.value,
                          })
                        }
                        placeholder="Verbatim quotation..."
                        className="w-full text-xs italic font-serif p-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <input
                      type="text"
                      value={quote.context}
                      onChange={(e) =>
                        updateQuote(quote.quote_id, { context: e.target.value })
                      }
                      placeholder="Quote context (e.g. Press conference or conclave remarks)..."
                      className="w-full text-[11px] text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- ENTITIES TAB --- */}
        {activeTab === "entities" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Key leaders, organizations, and institutional stakeholders.
              </p>
              <button
                type="button"
                onClick={addEntity}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Entity
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {dossier.entities.map((entity) => (
                <div
                  key={entity.id}
                  className={`p-3 rounded-lg border flex flex-col justify-between transition ${
                    entity.included
                      ? "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs"
                      : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entity.included}
                          onChange={(e) =>
                            updateEntity(entity.id, { included: e.target.checked })
                          }
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={entity.name}
                          onChange={(e) =>
                            updateEntity(entity.id, { name: e.target.value })
                          }
                          className="text-xs font-bold px-1.5 py-0.5 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 bg-transparent text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        {renderOriginBadge(entity.origin)}
                        <button
                          type="button"
                          onClick={() => deleteEntity(entity.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete entity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 pl-5">
                      <input
                        type="text"
                        value={entity.role}
                        onChange={(e) =>
                          updateEntity(entity.id, { role: e.target.value })
                        }
                        placeholder="Role / Title"
                        className="w-full text-[11px] text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                      />
                      <input
                        type="text"
                        value={entity.organization}
                        onChange={(e) =>
                          updateEntity(entity.id, { organization: e.target.value })
                        }
                        placeholder="Organization"
                        className="w-full text-[11px] font-medium text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CHRONOLOGY TAB --- */}
        {activeTab === "chronology" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified chronology of treaty milestones, meetings, and ratifications.
              </p>
              <button
                type="button"
                onClick={addChronology}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Timeline Event
              </button>
            </div>

            <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 space-y-4">
              {dossier.chronology.map((c) => (
                <div key={c.id} className="relative group">
                  <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-purple-600"></div>

                  <div
                    className={`p-3 rounded-lg border transition ${
                      c.included
                        ? "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs"
                        : "bg-slate-50/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={c.included}
                          onChange={(e) =>
                            updateChronology(c.id, { included: e.target.checked })
                          }
                          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={c.timestamp_or_date}
                          onChange={(e) =>
                            updateChronology(c.id, {
                              timestamp_or_date: e.target.value,
                            })
                          }
                          className="text-xs font-bold text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-950/40"
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        {renderOriginBadge(c.origin)}
                        <button
                          type="button"
                          onClick={() => deleteChronology(c.id)}
                          className="text-slate-400 hover:text-rose-600 transition p-1"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={c.event}
                      onChange={(e) => updateChronology(c.id, { event: e.target.value })}
                      placeholder="Event milestone description..."
                      className="mt-2 w-full text-xs p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
