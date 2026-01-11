import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_BOT_TOKEN yo‘q. .env.local ni tekshiring." },
        { status: 500 }
      );
    }
    if (!defaultChatId) {
      return NextResponse.json(
        { ok: false, error: "TELEGRAM_CHAT_ID yo‘q. .env.local ni tekshiring." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    const chat_id = String(body?.chat_id ?? defaultChatId).trim();
    const parse_mode = body?.parse_mode ?? "HTML";
    const disable_web_page_preview = body?.disable_web_page_preview ?? true;

    if (!text) {
      return NextResponse.json({ ok: false, error: "text bo‘sh." }, { status: 400 });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id,
        text,
        parse_mode,
        disable_web_page_preview,
      }),
    });

    const tgJson = await tgRes.json().catch(() => null);

    if (!tgRes.ok || !tgJson?.ok) {
      return NextResponse.json(
        { ok: false, error: "Telegram xato", details: tgJson },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, result: tgJson.result });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
