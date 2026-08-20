import { createFileRoute } from "@tanstack/react-router";
import { MessageSquareText, SendHorizonal, Phone, ShieldCheck, Sparkles, Clock3 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Customer Support — MediCare Pharmacy" },
      {
        name: "description",
        content: "Get help with prescriptions, orders, and pharmacy support.",
      },
      { property: "og:title", content: "Customer Support — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Get help with prescriptions, orders, and pharmacy support.",
      },
    ],
  }),
  component: SupportPage,
});

const quickPrompts = [
  "Track my order",
  "Prescription help",
  "Refund / cancellation",
  "Delivery issue",
];

const initialMessages = [
  {
    id: 1,
    sender: "bot",
    text: "Hi! I’m the MediCare support assistant. How can I help you today?",
  },
  {
    id: 2,
    sender: "user",
    text: "I need help with my prescription order.",
  },
  {
    id: 3,
    sender: "bot",
    text: "Sure — upload your prescription or tell me your order ID, and I’ll guide you to the next step.",
  },
];

function SupportPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmed,
    };

    const botReply = {
      id: Date.now() + 1,
      sender: "bot",
      text: "Thanks for your message. Our pharmacy team will review this and get back to you soon.",
    };

    setMessages((current) => [...current, userMessage, botReply]);
    setInput("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Customer Support</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Open chat</h1>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          Online now
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageSquareText className="size-5" />
              </div>
              <div>
                <p className="font-semibold">MediCare Pharmacy</p>
                <p className="text-xs text-muted-foreground">Usually replies in a few minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 className="size-4" />
              Live support
            </div>
          </div>

          <div className="flex h-[500px] flex-col justify-between bg-background/60">
            <div className="space-y-4 overflow-y-auto p-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setInput(prompt)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="inline-flex items-center justify-center rounded-xl bg-primary p-2.5 text-primary-foreground transition hover:bg-primary/90"
                  aria-label="Send message"
                >
                  <SendHorizonal className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Phone className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Call support</p>
                <p className="text-sm text-muted-foreground">+91 98765 43210</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-semibold">Why patients trust us</p>
                <p className="text-sm text-muted-foreground">Licensed pharmacy guidance and quick assistance</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <span>Prescription checks by trained professionals</span>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 text-primary" />
                <span>Fast turnaround for order and delivery concerns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}