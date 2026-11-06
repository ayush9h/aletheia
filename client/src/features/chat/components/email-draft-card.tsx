"use client";

import { useState } from "react";
import { Check, Loader2, Mail, Send } from "lucide-react";

import { BASE_PATH } from "@/lib/site";
import type { EmailDraft } from "@/types/user-message";

const FIELD =
  "w-full min-w-0 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100";

type Status = "draft" | "sending" | "sent" | "discarded";

export default function EmailDraftCard({ draft }: { draft: EmailDraft }) {
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [status, setStatus] = useState<Status>("draft");
  const [error, setError] = useState("");

  const send = async () => {
    setStatus("sending");
    setError("");
    try {
      const response = await fetch(`${BASE_PATH}/api/connectors/gmail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), subject, body }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const detail = typeof data?.detail === "string" ? data.detail : null;
        throw new Error(
          detail ?? (response.status === 422 ? "Check the recipient address." : "Couldn't send the email."),
        );
      }
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the email.");
      setStatus("draft");
    }
  };

  if (status === "sent" || status === "discarded") {
    return (
      <p className="font-paragraph my-2 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
        {status === "sent" ? <Check className="size-3.5 text-emerald-600" /> : <Mail className="size-3.5" />}
        {status === "sent" ? `Email sent to ${to}` : "Draft discarded"}
      </p>
    );
  }

  const busy = status === "sending";

  return (
    <section
      aria-label="Email draft"
      className="font-paragraph my-3 overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-700/50 dark:bg-stone-900"
    >
      <header className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 dark:border-stone-700/50 dark:bg-stone-950 dark:text-stone-300">
        <Mail className="size-3.5" />
        Draft email · review before sending
      </header>

      <div className="divide-y divide-stone-200 dark:divide-stone-700/50">
        <label className="flex items-center gap-2 px-3 py-2">
          <span className="w-14 shrink-0 text-xs text-stone-500">To</span>
          <input value={to} onChange={(e) => setTo(e.target.value)} disabled={busy} type="email" className={FIELD} />
        </label>
        <label className="flex items-center gap-2 px-3 py-2">
          <span className="w-14 shrink-0 text-xs text-stone-500">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} disabled={busy} className={FIELD} />
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={busy}
          aria-label="Email body"
          rows={Math.min(12, Math.max(4, body.split("\n").length + 1))}
          className={`${FIELD} block resize-y px-3 py-2 leading-6`}
        />
      </div>

      <footer className="flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-700/50 dark:bg-stone-950">
        {error && (
          <span role="alert" className="mr-auto text-xs text-red-600 dark:text-red-400">
            {error}
          </span>
        )}
        <button
          type="button"
          onClick={() => setStatus("discarded")}
          disabled={busy}
          className="h-8 cursor-pointer rounded-lg px-3 text-[13px] font-medium text-stone-600 hover:bg-stone-200 disabled:cursor-not-allowed dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Discard
        </button>
        <button
          type="button"
          onClick={send}
          disabled={busy || !to.trim() || !body.trim()}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-[13px] font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          {busy ? "Sending" : "Send"}
        </button>
      </footer>
    </section>
  );
}
