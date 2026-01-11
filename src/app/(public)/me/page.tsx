"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  telegram_id: number | null;
};

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/auth");
        return;
      }

      const p = await supabase.from("profiles").select("id,role,full_name,phone,telegram_id").eq("id", data.user.id).single();
      if (mounted) {
        if (p.error) setMsg(p.error.message);
        else setProfile(p.data as any);
      }
    }

    load();
    return () => { mounted = false; };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <main className="p-4 max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Shaxsiy kabinet</div>
        <button className="underline text-sm" onClick={signOut}>Chiqish</button>
      </div>

      {msg && <div className="text-sm text-red-600">{msg}</div>}

      {profile && (
        <div className="border rounded p-3 space-y-1 text-sm">
          <div><b>Role:</b> {profile.role}</div>
          <div><b>Phone:</b> {profile.phone ?? "-"}</div>
          <div><b>Telegram:</b> {profile.telegram_id ?? "-"}</div>
        </div>
      )}

      <div className="border rounded p-3 text-sm space-y-2">
        <div className="font-medium">Linklar</div>
        <Link className="underline block" href="/tournaments">Turnirlar</Link>
        <Link className="underline block" href="/me/follows">Obunalar</Link>
      </div>
    </main>
  );
}
