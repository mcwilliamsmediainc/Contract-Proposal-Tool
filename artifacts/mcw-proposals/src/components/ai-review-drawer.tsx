import { useEffect, useRef, useState, KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Sparkles, RotateCcw, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReviewType = "proposal" | "contract" | "onboarding";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface AiReviewDrawerProps {
  open: boolean;
  onClose: () => void;
  reviewType: ReviewType;
  data: Record<string, unknown>;
  title?: string;
  storageKey?: string;
}

const TYPE_LABELS: Record<ReviewType, string> = {
  proposal: "Proposal Review",
  contract: "Contract Review",
  onboarding: "Onboarding Review",
};

const PROSE = [
  "prose prose-sm prose-slate max-w-none",
  "prose-headings:font-bold prose-headings:text-[#0a0a0a]",
  "prose-h2:text-base prose-h2:mt-6 prose-h2:mb-2 prose-h2:border-b prose-h2:border-gray-100 prose-h2:pb-1",
  "prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-1",
  "prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3",
  "prose-li:text-gray-700 prose-li:leading-relaxed",
  "prose-ul:my-2 prose-ol:my-2",
  "prose-strong:text-[#0a0a0a] prose-strong:font-semibold",
  "prose-blockquote:border-l-[#d4af37] prose-blockquote:bg-amber-50/60 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:rounded-r",
  "prose-code:text-[#d4af37] prose-code:bg-gray-50 prose-code:px-1 prose-code:rounded",
  "prose-hr:border-gray-100",
].join(" ");

export function AiReviewDrawer({ open, onClose, reviewType, data, title, storageKey }: AiReviewDrawerProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatStream, setChatStream] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const chatAbortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  };

  const runReview = async (clearChat = false) => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setContent("");
    setError(false);
    setLoading(true);
    if (clearChat) {
      setChatMessages([]);
      setChatStream("");
    }

    try {
      const res = await fetch("/api/gemini/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: reviewType, data }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setError(true);
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      setLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as { content?: string; done?: boolean };
            if (parsed.content) {
              full += parsed.content;
              setContent(full);
              scrollToBottom();
            }
          } catch { /* skip */ }
        }
      }

      if (storageKey && full) {
        try { localStorage.setItem(`ai-review:${storageKey}`, full); } catch { /* ignore */ }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(true);
        setLoading(false);
      }
    }
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading || !content) return;

    if (chatAbortRef.current) chatAbortRef.current.abort();
    const ctrl = new AbortController();
    chatAbortRef.current = ctrl;

    setChatInput("");
    setChatLoading(true);
    setChatStream("");

    const historyForBackend: ChatMessage[] = [
      { role: "assistant", content },
      ...chatMessages,
    ];

    setChatMessages(prev => [...prev, { role: "user", content: msg }]);

    try {
      const res = await fetch("/api/gemini/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: reviewType,
          data,
          history: historyForBackend,
          userMessage: msg,
        }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        setChatMessages(prev => [...prev, { role: "assistant", content: "*Something went wrong. Please try again.*" }]);
        setChatLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6)) as { content?: string; done?: boolean };
            if (parsed.content) {
              full += parsed.content;
              setChatStream(full);
              scrollToBottom();
            }
          } catch { /* skip */ }
        }
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: full }]);
      setChatStream("");
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setChatMessages(prev => [...prev, { role: "assistant", content: "*Something went wrong. Please try again.*" }]);
      }
    } finally {
      setChatLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendChatMessage();
    }
  };

  useEffect(() => {
    if (!open) return;

    if (content) {
      setTimeout(() => chatInputRef.current?.focus(), 150);
      return;
    }

    if (storageKey) {
      try {
        const cached = localStorage.getItem(`ai-review:${storageKey}`);
        if (cached) {
          setContent(cached);
          setTimeout(() => chatInputRef.current?.focus(), 150);
          return;
        }
      } catch { /* ignore */ }
    }

    void runReview();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const label = title ?? TYPE_LABELS[reviewType];
  const showChat = !!content && !loading;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40 transition-opacity" onClick={onClose} />
      )}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#0a0a0a] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#d4af37]" />
            <h2 className="font-bold text-white text-base">{label}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void runReview(true)}
              disabled={loading || chatLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all disabled:opacity-50"
              title="Re-run review"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Re-run
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading && !content && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#d4af37]/30 border-t-[#d4af37] animate-spin" />
                <Sparkles className="w-5 h-5 text-[#d4af37] absolute inset-0 m-auto" />
              </div>
              <p className="text-sm font-medium">Analyzing…</p>
            </div>
          )}

          {error && !content && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <p className="text-sm">Something went wrong. Try re-running the review.</p>
              <button
                onClick={() => void runReview(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          )}

          {content && (
            <div className={PROSE}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}

          {loading && content && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Thinking…</span>
            </div>
          )}

          {chatMessages.length > 0 && (
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-4">
              {chatMessages.map((msg, i) => (
                msg.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="bg-[#0a1f5c] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className={cn(PROSE, "!text-sm")}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )
              ))}
              {chatLoading && chatStream && (
                <div className={cn(PROSE, "!text-sm")}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{chatStream}</ReactMarkdown>
                </div>
              )}
              {chatLoading && !chatStream && (
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking…</span>
                </div>
              )}
            </div>
          )}

          {showChat && <div className="h-2" />}
        </div>

        {showChat ? (
          <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a follow-up question…"
                disabled={chatLoading}
                className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#0a1f5c]/30 focus:border-[#0a1f5c]/40 transition-all placeholder:text-gray-400 disabled:opacity-50"
              />
              <button
                onClick={() => void sendChatMessage()}
                disabled={!chatInput.trim() || chatLoading}
                className="flex-shrink-0 p-2.5 rounded-xl bg-[#0a1f5c] hover:bg-[#0d3494] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <p className="text-[11px] text-muted-foreground/60 text-center">
              AI-generated review · Always use your own judgment
            </p>
          </div>
        )}
      </div>
    </>
  );
}
