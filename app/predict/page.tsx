"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlayerSession, type StoredPlayer } from "@/lib/auth";
import { isGroupStage, RESULT_LABELS } from "@/lib/scoring";
import type { Fixture, Prediction, ResultPick } from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

type PredictionMap = Record<string, Prediction>;
type SaveState = Record<string, "saving" | "saved" | "error">;

function groupFixtures(fixtures: Fixture[]) {
  return fixtures.reduce<Record<string, Fixture[]>>((groups, fixture) => {
    const date = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(fixture.kickoff_at));
    const key = `${date} - ${fixture.stage}`;
    groups[key] = [...(groups[key] ?? []), fixture];
    return groups;
  }, {});
}

export default function PredictPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<StoredPlayer | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [saveState, setSaveState] = useState<SaveState>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    async function loadData() {
      setLoading(true);
      const [fixturesResult, predictionsResult] = await Promise.all([
        supabase.from("fixtures").select("*").order("kickoff_at", { ascending: true }),
        supabase.from("predictions").select("*").eq("player_id", player.player_id)
      ]);

      if (fixturesResult.error || predictionsResult.error) {
        setError("Could not load fixtures. Check your Supabase configuration.");
      } else {
        setFixtures((fixturesResult.data ?? []) as Fixture[]);
        const nextMap = ((predictionsResult.data ?? []) as Prediction[]).reduce<PredictionMap>((map, prediction) => {
          map[prediction.fixture_id] = prediction;
          return map;
        }, {});
        setPredictions(nextMap);
      }
      setLoading(false);
    }

    loadData();
  }, [player]);

  const groupedFixtures = useMemo(() => groupFixtures(fixtures), [fixtures]);
  const predictionTargetCount = fixtures.filter((fixture) => isGroupStage(fixture.stage)).length;
  const predictedCount = fixtures.filter((fixture) => isGroupStage(fixture.stage) && predictions[fixture.id]).length;

  async function savePrediction(fixture: Fixture, pick: ResultPick) {
    if (!player) return;
    if (new Date(fixture.kickoff_at).getTime() <= Date.now()) return;

    setSaveState((current) => ({ ...current, [fixture.id]: "saving" }));
    const { data, error: saveError } = await supabase
      .from("predictions")
      .upsert(
        {
          player_id: player.player_id,
          fixture_id: fixture.id,
          prediction: pick,
          points: 0
        },
        { onConflict: "player_id,fixture_id" }
      )
      .select("*")
      .single<Prediction>();

    if (saveError || !data) {
      setSaveState((current) => ({ ...current, [fixture.id]: "error" }));
      return;
    }

    setPredictions((current) => ({ ...current, [fixture.id]: data }));
    setSaveState((current) => ({ ...current, [fixture.id]: "saved" }));
    window.setTimeout(() => {
      setSaveState((current) => {
        const next = { ...current };
        delete next[fixture.id];
        return next;
      });
    }, 1600);
  }

  if (loading) return <p className="text-white/70">Loading fixtures...</p>;

  return (
    <div className="space-y-5">
      <section className="panel flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="badge mb-2 w-fit">Hi {player?.player_name}</p>
          <h1 className="text-2xl font-black text-white">Predict matches</h1>
        </div>
        <p className="rounded-md border border-grass-500/25 bg-grass-500/10 px-3 py-2 text-sm font-bold text-grass-300">
          You have predicted {predictedCount} of {predictionTargetCount} matches.
        </p>
      </section>

      {error ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {Object.entries(groupedFixtures).map(([group, groupItems]) => (
        <section key={group} className="space-y-3">
          <h2 className="px-1 text-sm font-black uppercase tracking-wide text-white/55">{group}</h2>
          {groupItems.map((fixture) => {
            const locked = new Date(fixture.kickoff_at).getTime() <= Date.now();
            const selected = predictions[fixture.id]?.prediction;
            const state = saveState[fixture.id];
            const predictionOpen = isGroupStage(fixture.stage);

            return (
              <article key={fixture.id} className="panel">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
                        new Date(fixture.kickoff_at)
                      )}
                    </p>
                    <h3 className="mt-1 text-lg font-black text-white">
                      {fixture.home_team} vs {fixture.away_team}
                    </h3>
                  </div>
                  <div className="text-sm font-bold text-white/55">
                    {locked ? "Locked" : state === "saving" ? "Saving..." : state === "saved" ? "Saved" : state === "error" ? "Save failed" : ""}
                  </div>
                </div>

                {predictionOpen ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(["HOME", "DRAW", "AWAY"] as ResultPick[]).map((pick) => (
                      <button
                        key={pick}
                        className={selected === pick ? "button" : "button-secondary"}
                        disabled={locked || state === "saving"}
                        onClick={() => savePrediction(fixture, pick)}
                      >
                        {RESULT_LABELS[pick]}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-md border border-white/10 bg-black/20 p-3 text-sm text-white/60">
                    Predictions are only open for group-stage matches in Version 1.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ))}

      {!fixtures.length ? <p className="panel text-white/65">No fixtures yet. Ask the admin to add matches.</p> : null}
    </div>
  );
}
