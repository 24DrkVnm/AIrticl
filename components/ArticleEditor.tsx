"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import DOMPurify from "dompurify";
import { Marked } from "marked";
import { TargetLanguageCode, PipelineStatus } from "@/types/pipeline";
import { EditorToolbar } from "./EditorToolbar";
import { Code2, Eye, Sparkles } from "lucide-react";

interface ArticleEditorProps {
  streamingMarkdown: string;
  isStreaming: boolean;
  targetLanguage: TargetLanguageCode;
  status: PipelineStatus;
  canGenerate: boolean;
  onHtmlChange: (html: string) => void;
  onGenerate: () => void;
  onAbort: () => void;
  onExport: () => void;
}

/**
 * Returns script-aware CSS classes for editorial typography
 * based on the active target language.
 */
function getScriptClasses(lang: TargetLanguageCode): string {
  switch (lang) {
    case "hi":
      return "font-[Noto_Serif_Devanagari,Kohinoor_Devanagari,Mangal,Kokila,Georgia,serif] leading-[1.85]";
    case "ml":
      return "font-[Noto_Serif_Malayalam,Manjari,Chilanka,Rachana,Gayathri,Georgia,serif] leading-[1.9]";
    case "en":
    default:
      return "font-serif leading-[1.75]";
  }
}

export function ArticleEditor({
  streamingMarkdown,
  isStreaming,
  targetLanguage,
  status,
  canGenerate,
  onHtmlChange,
  onGenerate,
  onAbort,
  onExport,
}: ArticleEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<"visual" | "html">("visual");
  const prevMarkdownLenRef = useRef(0);

  // Keep track of html for the toolbar/export even when using raw HTML view
  const [currentHtml, setCurrentHtml] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configure marked for synchronous operation
  const markedInstance = useMemo(() => {
    const m = new Marked();
    m.setOptions({
      async: false,
      gfm: true,
      breaks: false,
    });
    return m;
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder:
          "Synthesized article will stream here in real time... Or start drafting directly.",
      }),
    ],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `article-editor-content focus:outline-none min-h-[520px] max-w-none prose dark:prose-invert prose-headings:font-serif ${getScriptClasses(targetLanguage)}`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!isStreaming) {
        const html = ed.getHTML();
        setCurrentHtml(html);
        onHtmlChange(html);
      }
    },
  });

  // Toggle editability based on streaming state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isStreaming);
    }
  }, [editor, isStreaming]);

  // Update editor attributes when language changes so typography classes switch live
  useEffect(() => {
    if (editor) {
      const scriptClasses = getScriptClasses(targetLanguage);
      editor.setOptions({
        editorProps: {
          attributes: {
            class: `article-editor-content focus:outline-none min-h-[520px] max-w-none prose dark:prose-invert prose-headings:font-serif ${scriptClasses}`,
          },
        },
      });
    }
  }, [editor, targetLanguage]);

  // Markdown-to-HTML streaming bridge
  // Converts accumulated streamingMarkdown to sanitized HTML and pushes into Tiptap
  useEffect(() => {
    if (!editor || !isStreaming) return;
    if (streamingMarkdown.length === 0) {
      prevMarkdownLenRef.current = 0;
      return;
    }

    // Only re-parse if markdown actually changed (avoid infinite loops)
    if (streamingMarkdown.length === prevMarkdownLenRef.current) return;
    prevMarkdownLenRef.current = streamingMarkdown.length;

    try {
      const rawHtml = markedInstance.parse(streamingMarkdown) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true },
        ADD_TAGS: ["h1", "h2", "h3", "blockquote", "ul", "ol", "li", "p", "strong", "em", "br"],
        ADD_ATTR: ["class"],
      });

      // Push sanitized HTML into the editor without emitting an onUpdate
      editor.commands.setContent(cleanHtml, false);
      setCurrentHtml(cleanHtml);
    } catch {
      // Fallback: insert raw markdown as a paragraph
      editor.commands.setContent(`<p>${streamingMarkdown}</p>`, false);
    }
  }, [editor, streamingMarkdown, isStreaming, markedInstance]);

  // When streaming completes, sync final HTML to parent
  useEffect(() => {
    if (!isStreaming && editor && streamingMarkdown.length > 0) {
      const finalHtml = editor.getHTML();
      setCurrentHtml(finalHtml);
      onHtmlChange(finalHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  const hasContent = Boolean(currentHtml && currentHtml.replace(/<[^>]*>/g, "").trim().length > 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Editorial Toolbar */}
      <EditorToolbar
        editor={editor}
        status={status}
        canGenerate={canGenerate}
        contentHtml={currentHtml}
        onGenerate={onGenerate}
        onAbort={onAbort}
        onExport={onExport}
      />

      {/* View Switcher */}
      <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Canvas:</span>
          <div className="flex items-center rounded-md bg-slate-200/60 dark:bg-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setActiveView("visual")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                activeView === "visual"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Publication Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveView("html")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                activeView === "html"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Raw HTML Source
            </button>
          </div>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            Receiving SSE stream ({targetLanguage.toUpperCase()})...
          </div>
        )}
      </div>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 min-h-[560px]">
        {!hasContent && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-96 text-center max-w-md mx-auto space-y-3 text-slate-400 dark:text-slate-500 p-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              Synthesis Canvas is Empty
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Run feature extraction on the left pane, verify and curate the fact dossier,
              select your target language (EN / HI / ML), then click &ldquo;Generate Localized Article&rdquo;
              to start streaming.
            </p>
          </div>
        )}

        {mounted && activeView === "visual" && (
          <div className={`p-6 sm:p-8 ${!hasContent && !isStreaming ? "hidden" : "block"}`}>
            <EditorContent editor={editor} />
          </div>
        )}

        {mounted && activeView === "html" && (
          <div className="p-4">
            <textarea
              value={currentHtml}
              onChange={(e) => {
                const val = e.target.value;
                setCurrentHtml(val);
                onHtmlChange(val);
                if (editor && !isStreaming) {
                  editor.commands.setContent(val, false);
                }
              }}
              readOnly={isStreaming}
              className="w-full min-h-[500px] font-mono text-xs p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
}
