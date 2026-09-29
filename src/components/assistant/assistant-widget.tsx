"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Bot, SendHorizontal } from "lucide-react";
import { useSessionUser } from "@/components/layout/session-context";
import { Button, buttonClasses } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useI18n } from "@/i18n/provider";
import { apiFetch } from "@/lib/api-client";
import { DATA_INTENTS, detectIntent, INTENT_LINKS, type AssistantIntent } from "@/lib/assistant/intents";
import { currentMonthKey } from "@/lib/utils/date";
import { formatVND } from "@/lib/utils/money";
import type { CategoryBreakdownItem, PlanningDTO, SummaryDTO } from "@/types/finance";

interface ChatMessage {
  id: number;
  from: "user" | "bot";
  text: string;
  link?: string;
}

type StaticIntent = Exclude<AssistantIntent, "balance" | "safeToSpend" | "topCategory" | "budget">;

/**
 * Trợ lý hỗ trợ (SRS 3.12 – chatbot): nút nổi góc phải, mở khung hội thoại dạng sheet.
 * Câu hỏi về số liệu lấy từ API của chính user tại thời điểm hỏi; không gửi dữ liệu ra dịch vụ ngoài.
 */
export function AssistantWidget() {
  const user = useSessionUser();
  const { t, fmt } = useI18n();
  const l = t.assistant;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const nextId = useRef(1);
  const listRef = useRef<HTMLDivElement>(null);

  // Luôn cuộn tới tin nhắn mới nhất.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const push = (message: Omit<ChatMessage, "id">) => setMessages((prev) => [...prev, { ...message, id: nextId.current++ }]);

  /** Câu trả lời dựa trên số liệu tháng hiện tại của user. */
  const answerWithData = async (intent: AssistantIntent): Promise<string> => {
    const a = l.answers;
    const month = currentMonthKey();
    if (intent === "safeToSpend") {
      const plan = await apiFetch<PlanningDTO>("/api/planning");
      if (!plan.hasActivity) return a.safeToSpendEmpty;
      return a.safeToSpend(formatVND(plan.safeToSpend.daily), formatVND(plan.safeToSpend.spendable), plan.remainingDays);
    }
    if (intent === "topCategory") {
      const [top] = await apiFetch<CategoryBreakdownItem[]>(`/api/analytics/categories?month=${month}`);
      return top ? a.topCategory(fmt.category(top.name), formatVND(top.amount), Math.round(top.percentage)) : a.topCategoryEmpty;
    }
    const summary = await apiFetch<SummaryDTO>(`/api/analytics/summary?month=${month}`);
    if (intent === "balance") return a.balance(formatVND(summary.income), formatVND(summary.expense), formatVND(summary.balance));
    const budget = summary.budget;
    if (!budget || budget.limit <= 0) return a.budgetEmpty;
    const spent = budget.limit - budget.remaining;
    return budget.remaining < 0
      ? a.budgetOver(formatVND(spent), formatVND(budget.limit), formatVND(-budget.remaining))
      : a.budget(formatVND(spent), formatVND(budget.limit), Math.round(budget.percentage), formatVND(budget.remaining));
  };

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || busy) return;
    setInput("");
    push({ from: "user", text });
    const intent = detectIntent(text);
    if (!intent) return push({ from: "bot", text: l.fallback });
    const link = INTENT_LINKS[intent];
    if (!DATA_INTENTS.has(intent)) return push({ from: "bot", text: l.answers[intent as StaticIntent], link });
    setBusy(true);
    try {
      push({ from: "bot", text: await answerWithData(intent), link });
    } catch {
      push({ from: "bot", text: l.error });
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={l.open}
        title={l.open}
        aria-haspopup="dialog"
        className="fixed right-4 bottom-[calc(var(--mobile-nav-height)_+_env(safe-area-inset-bottom)_+_16px)] z-30 flex size-12 items-center justify-center rounded-full border border-border bg-surface text-primary-ink shadow-pop transition-transform hover:bg-surface-hover active:scale-95 md:right-6 md:bottom-6"
      >
        <Bot className="size-5.5" aria-hidden />
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        variant="sheet"
        title={l.title}
        description={l.description}
        footer={
          <form noValidate onSubmit={onSubmit} className="flex w-full gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={l.placeholder} aria-label={l.placeholder} maxLength={200} autoComplete="off" />
            <Button type="submit" size="icon" disabled={!input.trim() || busy} aria-label={l.send} className="shrink-0">
              <SendHorizontal />
            </Button>
          </form>
        }
      >
        <div ref={listRef} className="space-y-3" aria-live="polite">
          <BotBubble text={l.welcome(user.name)} label={l.bot} />
          {messages.map((m) =>
            m.from === "user" ? (
              <p key={m.id} className="ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">
                <span className="sr-only">{l.you}: </span>
                {m.text}
              </p>
            ) : (
              <BotBubble key={m.id} text={m.text} label={l.bot}>
                {m.link && (
                  <Link href={m.link} onClick={() => setOpen(false)} className={buttonClasses("secondary", "sm", "mt-2")}>
                    {l.openPage} <ArrowUpRight />
                  </Link>
                )}
              </BotBubble>
            )
          )}
          {busy && (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Spinner className="size-4" /> {l.thinking}
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {l.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void ask(s)}
                disabled={busy}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
}

function BotBubble({ text, label, children }: { text: string; label: string; children?: ReactNode }) {
  return (
    <div className="w-fit max-w-[85%] rounded-lg rounded-bl-sm border border-border bg-surface-secondary px-3 py-2 text-sm text-foreground">
      <span className="sr-only">{label}: </span>
      {text}
      {children && <div>{children}</div>}
    </div>
  );
}
