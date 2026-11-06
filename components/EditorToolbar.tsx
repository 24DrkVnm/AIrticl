"use client";

import React from "react";
import type { Editor } from "@tiptap/react";
import { PipelineStatus } from "@/types/pipeline";
import { calculateReadingTime } from "@/lib/utils";
import {
  Sparkles,
  Download,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  Undo2,
  Redo2,
  Clock,
  FileCheck,
  StopCircle,
  Type,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
  status: PipelineStatus;
  canGenerate: boolean;
  contentHtml: string;
  onGenerate: () => void;
  onAbort: () => void;
  onExport: () => void;
}

export function EditorToolbar({
  editor,
  status,
  canGenerate,
  contentHtml,
  onGenerate,
  onAbort,
  onExport,
}: EditorToolbarProps) {
  const isStreaming = status === "Streaming Article...";
  const { words, chars, minutes } = calculateReadingTime(contentHtml);
  const hasContent = Boolean(contentHtml && contentHtml.replace(/<[^>]*>/g, "").trim().length > 0);

  const fmtBtn = (
    label: string,
    icon: React.ReactNode,
    action: () => void,
    isActive?: boolean
  ) => (
    <button
      type="button"
      onClick={action}
      disabled={isStreaming || !editor}
      title={label}
      className={`p-1.5 rounded transition disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive
          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3">
      {/* Primary Generate / Stop CTA */}
      <div className="flex items-center gap-2">
        {isStreaming ? (
          <button
            type="button"
            onClick={onAbort}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition active:scale-[0.99]"
          >
            <StopCircle className="w-4 h-4" />
            <span>Stop Generating</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
              canGenerate
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.99]"
                : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Generate Localized Article</span>
          </button>
        )}

        <button
          type="button"
          onClick={onExport}
          disabled={!hasContent || isStreaming}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition ${
            hasContent && !isStreaming
              ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs"
              : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed"
          }`}
          title="Download self-contained HTML with Indic typography, dark mode, and print styles"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Standalone HTML</span>
        </button>
      </div>

      {/* Formatting Action Buttons */}
      <div className="flex items-center gap-0.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1 rounded-lg shadow-2xs">
        {fmtBtn(
          "Heading 1",
          <Heading1 className="w-4 h-4" />,
          () => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          editor?.isActive("heading", { level: 1 })
        )}
        {fmtBtn(
          "Heading 2",
          <Heading2 className="w-4 h-4" />,
          () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          editor?.isActive("heading", { level: 2 })
        )}
        {fmtBtn(
          "Heading 3",
          <Heading3 className="w-4 h-4" />,
          () => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
          editor?.isActive("heading", { level: 3 })
        )}
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
        {fmtBtn(
          "Bold (Ctrl+B)",
          <Bold className="w-4 h-4" />,
          () => editor?.chain().focus().toggleBold().run(),
          editor?.isActive("bold")
        )}
        {fmtBtn(
          "Italic (Ctrl+I)",
          <Italic className="w-4 h-4" />,
          () => editor?.chain().focus().toggleItalic().run(),
          editor?.isActive("italic")
        )}
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
        {fmtBtn(
          "Blockquote",
          <Quote className="w-4 h-4" />,
          () => editor?.chain().focus().toggleBlockquote().run(),
          editor?.isActive("blockquote")
        )}
        {fmtBtn(
          "Bullet List",
          <List className="w-4 h-4" />,
          () => editor?.chain().focus().toggleBulletList().run(),
          editor?.isActive("bulletList")
        )}
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 mx-0.5" />
        {fmtBtn(
          "Undo (Ctrl+Z)",
          <Undo2 className="w-4 h-4" />,
          () => editor?.chain().focus().undo().run()
        )}
        {fmtBtn(
          "Redo (Ctrl+Shift+Z)",
          <Redo2 className="w-4 h-4" />,
          () => editor?.chain().focus().redo().run()
        )}
      </div>

      {/* Article Metrics */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Type className="w-3.5 h-3.5 text-slate-400" />
          <span>{words.toLocaleString()}</span> words
        </span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <span>{chars.toLocaleString()} chars</span>
        <span className="text-slate-300 dark:text-slate-700">•</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          ~{minutes} min read
        </span>
      </div>
    </div>
  );
}
