import { Headset, MessageCircle, SendHorizonal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { apiClient, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
};

const quickPrompts = ["Where is my order?", "Prescription status", "Delivery fee", "Talk to a human"];

function newId() {
  return Math.random().toString(36).slice(2);
}

export function SupportChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm the MediCare assistant. Ask me about your orders or prescription status — I'll bring in a human agent when needed.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const push = (role: ChatMessage["role"], text: string) =>
    setMessages((current) => [...current, { id: newId(), role, text }]);

  const send = async (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || sending) return;
    setInput("");
    push("user", message);

    if (!user) {
      push(
        "bot",
        "Please sign in first so I can look up your orders securely. You can also reach our team on +91 98765 43210.",
      );
      return;
    }

    setSending(true);
    try {
      const { reply, needs_human } = await apiClient.support.chat(message);
      push("bot", reply);
      setHandoff(needs_human);
    } catch (error) {
      push("bot", apiErrorMessage(error));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const transfer = async () => {
    setSending(true);
    try {
      const lastUser = [...messages].reverse().find((m) => m.role === "user");
      const transcript = messages.map((m) => `${m.role}: ${m.text}`).join("\n");
      const ticket = await apiClient.support.handoff(
        lastUser?.text ?? "Customer requested a human agent",
        transcript,
      );
      push(
        "bot",
        `You're in the queue for a human agent — reference #${ticket.id.slice(0, 8)}. Our pharmacy team will reply to ${user?.email ?? "your account email"} shortly.`,
      );
      setHandoff(false);
    } catch (error) {
      push("bot", apiErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[30rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Headset className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">MediCare assistant</p>
                <p className="text-xs text-muted-foreground">Orders, prescriptions & handover</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-background/60 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-foreground"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {sending && (
              <p className="text-xs text-muted-foreground">Assistant is checking your account…</p>
            )}

            {handoff && (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  I can hand this conversation to a human support agent.
                </p>
                <Button size="sm" className="mt-2" onClick={transfer} disabled={sending}>
                  Transfer to a human agent
                </Button>
              </div>
            )}

            {!user && (
              <p className="text-xs text-muted-foreground">
                <Link to="/auth" className="font-medium text-primary underline-offset-4 hover:underline">
                  Sign in
                </Link>{" "}
                to let me look up your orders.
              </p>
            )}
          </div>

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-1.5">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void send();
                }}
                placeholder="Ask about an order…"
                className="flex-1 border-0 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                className="size-8 rounded-xl"
                onClick={() => void send()}
                disabled={sending || !input.trim()}
                aria-label="Send message"
              >
                <SendHorizonal className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className="size-14 rounded-full shadow-lg"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </Button>
    </div>
  );
}
