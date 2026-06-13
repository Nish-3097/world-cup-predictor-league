"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clearPendingPin, savePendingPin, savePlayerSession } from "@/lib/auth";
import type { Player } from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const normalizedPin = pin.trim();
    const { data, error: lookupError } = await supabase
      .from("players")
      .select("*")
      .eq("pin", normalizedPin)
      .maybeSingle<Player>();

    setLoading(false);

    if (lookupError || !data) {
      setError("Invalid PIN. Ask admin for your PIN.");
      return;
    }

    if (!data.name) {
      savePendingPin(normalizedPin);
      router.push("/claim-name");
      return;
    }

    clearPendingPin();
    savePlayerSession({
      player_id: data.id,
      player_name: data.name,
      pin: data.pin
    });
    router.push("/predict");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center">
      <section className="panel w-full">
        <p className="badge mb-4 w-fit">Friends only</p>
        <h1 className="text-3xl font-black text-white">Enter your PIN</h1>
        <p className="mt-2 text-sm leading-6 text-white/65">
          Use the private PIN shared by the admin to join the World Cup Predictor League.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            className="input text-center text-xl font-black tracking-[0.35em]"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN"
            autoComplete="one-time-code"
            required
          />
          {error ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          <button className="button w-full" disabled={loading}>
            {loading ? "Checking..." : "Continue"}
          </button>
        </form>
      </section>
    </div>
  );
}
