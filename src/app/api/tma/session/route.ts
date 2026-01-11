import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verifyTelegramInitData } from "@/lib/tg/verifyInitData";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function secretKey() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing");
  return new TextEncoder().encode(s);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const initData = body?.initData as string | undefined;

  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  const v = verifyTelegramInitData(initData || "", botToken);

  if (!("ok" in v) || v.ok !== true) {
    return NextResponse.json({ ok: false, error: (v as any).error ?? "verify_failed" }, { status: 401 });
  }

  const tgId = v.user.id;
  const username = v.user.username ?? null;
  const fullName = `${v.user.first_name ?? ""} ${v.user.last_name ?? ""}`.trim() || null;

  // app_users: upsert (telegram_id bo‘yicha)
  const up = await supabaseAdmin
    .from("app_users")
    .upsert(
      {
        telegram_id: tgId,
        telegram_username: username,
        full_name: fullName,
        role: "user",
      },
      { onConflict: "telegram_id" }
    )
    .select("id,role")
    .single();

  if (up.error || !up.data) {
    return NextResponse.json({ ok: false, error: "db_upsert_failed", details: up.error?.message }, { status: 500 });
  }

  const appUserId = up.data.id as string;
  const role = up.data.role as string;

  // JWT session (cookie ichida)
  const token = await new SignJWT({
    typ: "tfc_session",
    appUserId,
    telegramId: tgId,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());

  const res = NextResponse.json({ ok: true, appUserId, role });

  // cookie
  res.cookies.set({
    name: "tfc_session",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
