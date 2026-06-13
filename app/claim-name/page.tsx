"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearPendingPin, getPendingPin, savePlayerSession } from "@/lib/auth";
import type { Player } from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

export default function ClaimNamePage() {
  const router = useRouter();
  const [pin, setPin] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pendingPin = getPendingPin();
    if (!pendingPin) {
      router.replace("/");
      return;
    }
    setPin(pendingPin);
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pin) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your name to claim this PIN.");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("players")
      .update({ name: trimmedName })
      .eq("pin", pin)
      .is("name", null)
      .select("*")
      .maybeSingle<Player>();

    setLoading(false);

    if (updateError || !data) {
      setError("This PIN has already been claimed. Go back and log in again.");
      return;
    }

    clearPendingPin();
    savePlayerSession({
      player_id: data.id,
      player_name: data.name ?? trimmedName,
      pin: data.pin
    });
    router.push("/predict");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center">
      <section className="panel w-full">
        <p className="badge mb-4 w-fit">Claim PIN {pin ?? ""}</p>
        <h1 className="text-3xl font-black text-white">Choose your name</h1>
        <p className="mt-2 text-sm leading-6 text-white/65">
          This name is permanently attached to your PIN for Version 1.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your display name"
            maxLength={80}
            required
          />
          {error ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
          <button className="button w-full" disabled={loading || !pin}>
            {loading ? "Saving..." : "Claim name"}
          </button>
        </form>
      </section>
    </div>
  );
}
