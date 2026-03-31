import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatbot() {
  const { actor } = useActor();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your safety assistant. Ask me anything about staying safe.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      let reply =
        "I'm here to help with your safety questions. Please stay in well-lit areas and keep emergency contacts handy.";
      if (actor) {
        reply = await actor.askChatbot(userMsg);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Trust your instincts — if you feel unsafe, move to a crowded area and call for help.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg flex items-center justify-center transition-all active:scale-95"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-40 right-4 z-50 w-80 h-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-violet-600">
            <MessageCircle className="w-4 h-4 text-white" />
            <span className="font-semibold text-sm text-white">
              Safety Assistant
            </span>
            <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-2">
            <div className="flex flex-col gap-2">
              {messages.map((m, i) => (
                <div
                  key={String(i)}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-violet-600 text-white rounded-br-none"
                        : "bg-secondary text-foreground rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary px-3 py-2 rounded-xl rounded-bl-none flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-border">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a safety question..."
              className="h-8 text-xs bg-secondary border-0"
              disabled={loading}
            />
            <Button
              size="icon"
              className="h-8 w-8 bg-violet-600 hover:bg-violet-700 shrink-0"
              onClick={send}
              disabled={loading || !input.trim()}
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
