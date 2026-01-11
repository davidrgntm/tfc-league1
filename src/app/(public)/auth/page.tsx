"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+998");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    setStep("code");
    setMsg("SMS kod yuborildi ✅");
  }

  async function verify() {
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    setLoading(false);
    if (error) return setMsg(error.message);

    router.push("/me");
  }

  return (
    <main className="p-4 max-w-md mx-auto space-y-3">
      <div className="text-xl font-semibold">Kirish</div>
      {msg && <div className="text-sm">{msg}</div>}

      {step === "phone" ? (
        <div className="space-y-2">
          <label className="text-sm">
            Telefon raqam:
            <input
              className="border rounded w-full p-2 mt-1"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+99890xxxxxxx"
            />
          </label>

          <button className="border rounded px-3 py-2 w-full" onClick={sendOtp} disabled={loading}>
            {loading ? "Yuborilyapti..." : "SMS kod yuborish"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm">
            SMS kod:
            <input
              className="border rounded w-full p-2 mt-1"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </label>

          <button className="border rounded px-3 py-2 w-full" onClick={verify} disabled={loading}>
            {loading ? "Tekshirilmoqda..." : "Tasdiqlash"}
          </button>

          <button className="text-sm underline" onClick={() => setStep("phone")}>
            Telefonni o‘zgartirish
          </button>
        </div>
      )}
    </main>
  );
}
