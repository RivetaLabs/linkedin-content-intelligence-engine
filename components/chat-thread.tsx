"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatMessage {
  role: string;
  content: string;
  type?: string;
}

interface ChatThreadProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  onSelectFramework?: (name: string, steps: string[]) => void;
  onSelectHook?: (hookText: string) => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatThread({
  messages,
  onSend,
  onSelectFramework,
  onSelectHook,
  streaming,
  disabled,
  placeholder = "Refine your post... (Enter to send, Shift+Enter for newline)",
}: ChatThreadProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || streaming || disabled) return;
    onSend(trimmed);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  return (
    <div>
      {/* Messages */}
      {messages.length > 0 && (
        <div className="max-h-[300px] overflow-y-auto p-3">
          <div className="space-y-2">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isSystem =
                msg.type === "tip_apply" ||
                msg.type === "condense" ||
                msg.role === "system";

              if (isSystem) {
                return (
                  <div key={i} className="text-center">
                    <span className="text-[10px] text-text-secondary">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              // v3: Framework options — render as clickable cards
              if (msg.type === "framework_build") {
                try {
                  const data = JSON.parse(
                    msg.content.match(/\{[\s\S]*\}/)?.[0] || "{}",
                  );
                  if (data.options) {
                    return (
                      <div key={i} className="space-y-2">
                        <p className="text-xs text-text-secondary">
                          Pick a framework name:
                        </p>
                        {data.options.map(
                          (
                            opt: {
                              name: string;
                              type: string;
                              steps: string[];
                            },
                            j: number,
                          ) => (
                            <button
                              key={j}
                              onClick={() =>
                                onSelectFramework?.(opt.name, opt.steps)
                              }
                              className="w-full text-left p-3 rounded-lg border border-border hover:border-accent transition-colors"
                            >
                              <div className="text-sm font-medium text-text">
                                {opt.name}
                              </div>
                              <div className="text-[10px] text-text-secondary mt-1">
                                {opt.type.replace("_", " + ")} —{" "}
                                {opt.steps.length} steps
                              </div>
                              <div className="text-[10px] text-text-secondary mt-0.5">
                                {opt.steps.join(" → ")}
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                    );
                  }
                } catch {
                  // Fall through to normal text rendering if JSON parse fails
                }
              }

              // v3: Hook variations — render as clickable options
              if (msg.type === "hook_variation") {
                try {
                  const data = JSON.parse(
                    msg.content.match(/\{[\s\S]*\}/)?.[0] || "{}",
                  );
                  if (data.variations) {
                    return (
                      <div key={i} className="space-y-2">
                        <p className="text-xs text-text-secondary">
                          Pick a hook:
                        </p>
                        {data.variations.map(
                          (
                            v: {
                              hook: string;
                              category: string;
                              bucket: string;
                            },
                            j: number,
                          ) => (
                            <button
                              key={j}
                              onClick={() => onSelectHook?.(v.hook)}
                              className="w-full text-left p-3 rounded-lg border border-border hover:border-accent transition-colors"
                            >
                              <div className="text-xs text-text leading-relaxed">
                                {v.hook}
                              </div>
                              <div className="text-[10px] text-text-secondary mt-1">
                                <span className="capitalize">{v.category}</span>
                                {" — "}
                                <span
                                  className={
                                    v.bucket === "proven"
                                      ? "text-emerald-400"
                                      : v.bucket === "adjacent"
                                        ? "text-amber-400"
                                        : "text-rose-400"
                                  }
                                >
                                  {v.bucket}
                                </span>
                              </div>
                            </button>
                          ),
                        )}
                      </div>
                    );
                  }
                } catch {
                  // Fall through to normal text rendering
                }
              }

              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                      isUser
                        ? "bg-accent/10 text-text"
                        : "bg-surface-hover text-text"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              );
            })}

            {streaming && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-lg bg-surface-hover px-3 py-2 text-xs text-text-secondary">
                  <Loader2 size={12} className="animate-spin" />
                  Thinking...
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div
        className={`flex items-end gap-2 border-t border-border p-3 ${messages.length === 0 ? "border-t-0" : ""}`}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={streaming || disabled}
          rows={1}
          className="max-h-[120px] min-h-[36px] flex-1 resize-none rounded-md border border-border bg-bg px-3 py-2 text-xs text-text placeholder-text-secondary outline-none transition-colors focus:border-accent disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || streaming || disabled}
          className="flex h-[36px] w-[36px] items-center justify-center rounded-md bg-accent text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
