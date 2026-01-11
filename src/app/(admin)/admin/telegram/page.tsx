"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminTelegramPage() {
  const [text, setText] = useState(
    "📢 TFC LIGALARI\nBugungi matchlar bo‘yicha yangiliklar..."
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    setMsg(null);
    setSending(true);

    const res = await fetch("/api/telegram/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, parse_mode: "HTML" }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.ok) {
      setMsg(`Xato: ${json?.error ?? "send failed"} ${json?.details ? JSON.stringify(json.details) : ""}`);
      setSending(false);
      return;
    }

    setMsg("Telegramga yuborildi ✅");
    setSending(false);
  }

  return (
    <main className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Telegram Announcement</h1>
        <Link className="underline" href="/admin/matches">
          ← Matches
        </Link>
      </div>

      {msg && <div className="text-sm">{msg}</div>}

      <textarea
        className="border rounded w-full p-2 min-h-[200px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="border rounded px-3 py-2"
        onClick={send}
        disabled={sending}
      >
        {sending ? "Yuborilyapti..." : "Telegramga yuborish"}
      </button>

      <div className="text-xs text-gray-500">
        Eslatma: kanal public bo‘lsa TELEGRAM_CHAT_ID = @channelusername bo‘lsa yetadi.
      </div>
    </main>
  );
}
