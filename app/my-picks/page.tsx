"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerSession, type StoredPlayer } from "@/lib/auth";
import { getPredictionStatus, RESULT_LABELS } from "@/lib/scoring";
import type { PredictionWithFixture } from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

function groupPicks(predictions: PredictionWithFixture[]) {
  return predictions.reduce<Record<string, PredictionWithFixture[]>>((groups, prediction) => {
    const fixture = prediction.fixtures;
    if (!fixture) return groups;
    const date = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(fixture.kickoff_at));
    const key = `${date} - ${fixture.stage}`;
    groups[key] = [...(groups[key] ?? []), prediction];
    return groups;
  }, {});
}

export default function MyPicksPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [predictions, setPredictions] = useState<PredictionWithFixture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getPlayerSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setPlayer(session);
  }, [router]);

  useEffect(() => {
    if (!player) return;

    async function loadPicks() {
      setLoading(true);
      const { data } = await supabase
        .from("predictions")
        .select("*, fixtures(*)")
        .eq("player_id", player.player_id);

      const nextPredictions = ((data ?? []) as PredictionWithFixture[]).sort((a, b) => {
        const first = a.fixtures ? new Date(a.fixtures.kickoff_at).getTime() : 0;
        const second = b.fixtures ? new Date(b.fixtures.kickoff_at).getTime() : 0;
        return first - second;
      });
      setPredictions(nextPredictions);
      setLoading(false);
    }

    loadPicks();
  }, [player]);

  const groupedPicks = useMemo(() => groupPicks(predictions), [predictions]);

  if (loading) return <p className="text-white/70">Loading picks...</p>;

  return (
    <div className="space-y-5">
      <section className="panel">
        <p className="badge mb-2 w-fit">{player?.player_name}</p>
        <h1 className="text-2xl font-black text-white">My Picks</h1>
      </section>

      {Object.entries(groupedPicks).map(([group, groupItems]) => (
        <section key={group} className="space-y-3">
          <h2 className="px-1 text-sm font-black uppercase tracking-wide text-white/55">{group}</h2>
          {groupItems.map((prediction) => {
            const fixture = prediction.fixtures;
            if (!fixture) return null;
            const status = getPredictionStatus(fixture.kickoff_at, prediction.prediction, fixture.actual_result);

            return (
              <article key={prediction.id} className="panel grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_0.5fr_1fr] md:items-center">
                <div>
                  <p className="text-lg font-black text-white">
                    {fixture.home_team} vs {fixture.away_team}
                  </p>
                  <p className="text-sm text-white/50">{fixture.stage}</p>
                </div>
                <p className="text-sm text-white/70">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                    new Date(fixture.kickoff_at)
                  )}
                </p>
                <p className="font-bold text-grass-300">{RESULT_LABELS[prediction.prediction]}</p>
                <p className="font-black text-white">{prediction.points}</p>
                <p className="badge w-fit">{status}</p>
              </article>
            );
          })}
        </section>
      ))}

      {!predictions.length ? <p className="panel text-white/65">No picks saved yet.</p> : null}
    </div>
  );
}
