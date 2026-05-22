"use client";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, User, Wrench, Brain, Loader2, RefreshCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const TOOL_LABELS: Record<string, string> = {
  get_dashboard_summary: "Checking dashboard",
  list_stores: "Listing stores",
  get_store_details: "Getting store details",
  get_performance_ranking: "Ranking performance",
  get_low_stock_items: "Checking stock levels",
  get_tasks: "Reading tasks",
  create_task: "Creating task",
  mark_task_done: "Completing task",
  get_attendance: "Checking attendance",
  get_staff_ratings: "Pulling staff ratings",
};

const SUGGESTED_PROMPTS = [
  "Give me a morning briefing",
  "Which stores are underperforming this month?",
  "What's running low on stock?",
  "Show me all pending tasks",
];

export function AIChatClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [tools, setTools] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, tools]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setTools([]);
    setThinking(false);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(0, -1) }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "text") {
              assistantText += evt.text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            } else if (evt.type === "tool_use") {
              setTools((prev) => [...prev, evt.name]);
            } else if (evt.type === "thinking_start") {
              setThinking(true);
            } else if (evt.type === "thinking") {
              // Thinking summary tokens — not displayed verbatim, just keep indicator on
            } else if (evt.type === "done") {
              setThinking(false);
            } else if (evt.type === "error") {
              assistantText += `\n\n⚠️ ${evt.message}`;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Connection error";
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${msg}` };
        return copy;
      });
    } finally {
      setStreaming(false);
      setThinking(false);
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setMessages([]);
    setTools([]);
    setThinking(false);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #D97756, #C86645)",
              boxShadow: "0 0 16px rgba(217,119,86,0.35)",
            }}
          >
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#D97756]/80 uppercase tracking-widest">Claude</p>
            <h1 className="text-lg font-bold text-stone-100 leading-tight">AI Assistant</h1>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={reset}
            className="p-2 text-stone-500 hover:text-stone-300 hover:bg-white/[0.04] rounded-lg transition-colors"
            title="New chat"
          >
            <RefreshCcw size={15} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-6">
            <div
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #D97756, #C86645)",
                boxShadow: "0 8px 32px rgba(217,119,86,0.30)",
              }}
            >
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-100 mb-1">Ask me anything</h2>
              <p className="text-sm text-stone-500">
                I can check stores, staff, stock, performance, and tasks — and create tasks for you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto pt-4">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left px-4 py-3 rounded-xl border border-white/[0.07] bg-[#262220] hover:border-[#D97756]/30 hover:bg-[#2E2420] transition-colors text-sm text-stone-300"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-white/[0.06] border border-white/[0.10]" : ""
              }`}
              style={
                m.role === "assistant"
                  ? { background: "linear-gradient(135deg, #D97756, #C86645)" }
                  : {}
              }
            >
              {m.role === "user" ? (
                <User size={13} className="text-stone-400" />
              ) : (
                <Sparkles size={13} className="text-white" />
              )}
            </div>
            <div className={`flex-1 min-w-0 ${m.role === "user" ? "text-right" : ""}`}>
              {m.role === "user" ? (
                <div className="inline-block px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-stone-100 text-left"
                  style={{ background: "rgba(217,119,86,0.14)", border: "1px solid rgba(217,119,86,0.20)" }}>
                  {m.content}
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-stone-200 leading-relaxed">
                  {/* Tool indicators above the latest streaming message */}
                  {i === messages.length - 1 && (tools.length > 0 || thinking) && (
                    <div className="flex flex-wrap gap-1.5 mb-3 not-prose">
                      {thinking && (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.07] text-stone-400">
                          <Brain size={11} className="text-[#D97756]" /> thinking…
                        </span>
                      )}
                      {tools.map((t, idx) => (
                        <span
                          key={`${t}-${idx}`}
                          className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.07] text-stone-400"
                        >
                          <Wrench size={11} className="text-[#D97756]" />
                          {TOOL_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  )}
                  {m.content ? (
                    <ReactMarkdown
                      components={{
                        table: ({ children }) => (
                          <div className="overflow-x-auto my-3">
                            <table className="text-sm border-collapse">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => (
                          <th className="text-left px-3 py-2 border-b border-white/[0.10] font-semibold text-stone-300 text-xs uppercase tracking-wide">{children}</th>
                        ),
                        td: ({ children }) => (
                          <td className="px-3 py-2 border-b border-white/[0.05] text-stone-300">{children}</td>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#E8926A] text-xs">{children}</code>
                        ),
                        a: ({ children, href }) => (
                          <a href={href} className="text-[#D97756] underline">{children}</a>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-stone-100 font-semibold">{children}</strong>
                        ),
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : streaming && i === messages.length - 1 ? (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Loader2 size={14} className="animate-spin text-[#D97756]" />
                      Working on it…
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-4 md:p-5">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask about stores, performance, stock, tasks…"
            disabled={streaming}
            rows={1}
            className="w-full bg-[#262220] border border-white/[0.08] rounded-2xl pl-4 pr-12 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-[#D97756]/40 resize-none disabled:opacity-50"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            className="absolute right-2 bottom-2 w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{
              background: "linear-gradient(135deg, #D97756, #C86645)",
              boxShadow: !input.trim() || streaming ? "none" : "0 4px 16px rgba(217,119,86,0.30)",
            }}
          >
            {streaming ? (
              <Loader2 size={15} className="text-white animate-spin" />
            ) : (
              <Send size={14} className="text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-stone-700 mt-2 text-center">
          Powered by Claude · can query and update your business data
        </p>
      </div>
    </div>
  );
}
