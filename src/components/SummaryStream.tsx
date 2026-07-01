"use client";

import React, { useEffect, useState, useRef } from "react";
import { renderAndSanitizeMarkdown } from "../utils/sanitize";

interface SummaryStreamProps {
  taskId: string;
}

export function SummaryStream({ taskId }: SummaryStreamProps) {
  const [summaryText, setSummaryText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSummaryText("");
    setStreamError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function startSSEStream() {
      try {
        const response = await fetch(`http://localhost:4000/api/tasks/${taskId}/summary`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Failed to initialize summary connection stream.");
        if (!response.body) throw new Error("Readable stream not supported by runtime.");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedMarkdown = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const rawJsonStr = line.slice(6).trim();
            if (rawJsonStr === "end" || rawJsonStr === '"end"') break;

            try {
              const textSegment = JSON.parse(rawJsonStr);
              accumulatedMarkdown += textSegment;
              setSummaryText(accumulatedMarkdown);
            } catch {
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Summary stream processing error:", err);
          setStreamError(err.message || "An error occurred while streaming data.");
        }
      } finally {
        setIsStreaming(false);
      }
    }

    startSSEStream();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [taskId]);

  const securedHtmlOutput = renderAndSanitizeMarkdown(summaryText);

  return (
    <div className="mt-2 flex min-h-[180px] min-w-0 flex-col rounded-[20px] border border-white/10 bg-slate-950/70 p-4">
      {streamError && (
        <div className="text-xs bg-red-950/40 border border-red-900 text-red-400 p-2 rounded mb-3">
          ⚠️ Stream connection error: {streamError}
        </div>
      )}

      {summaryText.length === 0 && isStreaming && (
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 animate-pulse">
          <span>🔄 Accessing secure AI infrastructure models...</span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-[18px] border border-white/10 bg-slate-950/80 p-3">
        <div
          className="prose prose-invert prose-sm max-w-full break-words text-xs leading-relaxed text-slate-300 selection:bg-cyan-500/40
  prose-p:my-1.5 prose-p:text-slate-300
  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-1 prose-h2:text-sm
  prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5 prose-strong:font-semibold prose-strong:text-cyan-300
  prose-pre:overflow-auto prose-pre:whitespace-pre-wrap prose-pre:break-words prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-slate-950/80 prose-pre:p-3 prose-pre:shadow-inner prose-pre:min-h-[2rem]
  prose-code:rounded prose-code:bg-slate-950/80 prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-[11px] prose-code:text-emerald-400 prose-code:break-all"
          dangerouslySetInnerHTML={{ __html: securedHtmlOutput }}
        />
      </div>

      {isStreaming && summaryText.length > 0 && (
        <span className="ml-1 mt-2 inline-block h-4 w-1.5 animate-pulse bg-cyan-400 align-middle" />
      )}
    </div>
  );
}