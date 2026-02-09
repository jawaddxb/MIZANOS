"use client";

import { useState, useCallback, useRef } from "react";
import type { AIChatMessage } from "@/lib/types";

interface UseAIChatStreamOptions {
  onChunk: (content: string, messageId: string) => void;
  onError: (error: string) => void;
}

export function useAIChatStream({ onChunk, onError }: UseAIChatStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const streamMessage = useCallback(
    async (
      sessionId: string,
      contextMessages: AIChatMessage[],
      assistantMsgId: string,
    ) => {
      setIsStreaming(true);
      let content = "";

      try {
        abortRef.current = new AbortController();
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || "/api"}/ai/chat/sessions/${sessionId}/stream`;

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: contextMessages.slice(-20).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment.");
          }
          throw new Error(`Request failed with status ${response.status}`);
        }

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                content += delta;
                onChunk(content, assistantMsgId);
              }
            } catch {
              // incomplete JSON
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        onError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [onChunk, onError],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { isStreaming, streamMessage, cancelStream };
}
