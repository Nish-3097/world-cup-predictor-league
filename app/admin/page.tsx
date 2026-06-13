"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { calculatePoints, RESULT_LABELS } from "@/lib/scoring";
import type { Fixture, Player, Prediction, ResultPick } from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

type FixtureForm = {
  home_team: string;
  away_team: string;
  stage: string;
  kickoff_at: string;
};

const emptyFixtureForm: FixtureForm = {
  home_team: "",
  away_team: "",
  stage: "Group Stage",
  kickoff_at: ""
};

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCsvLine(lines[0] ?? "").map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index]?.trim() ?? "";
      return row;
    }, {});
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [form, setForm] = useState<FixtureForm>(emptyFixtureForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

  async function loadAdminData() {
    const [playersResult, fixturesResult] = await Promise.all([
      supabase.from("players").select("*").order("pin", { ascending: true }),
      supabase.from("fixtures").select("*").order("kickoff_at", { ascending: true })
    ]);

    setPlayers((playersResult.data ?? []) as Player[]);
    setFixtures((fixturesResult.data ?? []) as Fixture[]);
  }

  useEffect(() => {
    if (authenticated) {
      loadAdminData();
    }
  }, [authenticated]);

  const claimedCount = useMemo(() => players.filter((player) => player.name).length, [players]);

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (expectedPassword && password === expectedPassword) {
      setAuthenticated(true);
      setMessage("");
    } else {
      setMessage("Incorrect admin password.");
    }
  }

  async function createFixture(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("fixtures").insert({
      home_team: form.home_team.trim(),
      away_team: form.away_team.trim(),
      stage: form.stage.trim(),
      kickoff_at: new Date(form.kickoff_at).toISOString()
    });

    setLoading(false);

    if (error) {
      setMessage("Could not create fixture.");
      return;
    }

    setForm(emptyFixtureForm);
    setMessage("Fixture created.");
    loadAdminData();
  }

  async function uploadCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage("");
    const text = await file.text();
    const rows = parseCsv(text)
      .filter((row) => row.home_team && row.away_team && row.stage && row.kickoff_at)
      .map((row) => ({
        home_team: row.home_team,
        away_team: row.away_team,
        stage: row.stage,
        kickoff_at: new Date(row.kickoff_at).toISOString()
      }));

    if (!rows.length) {
      setLoading(false);
      setMessage("CSV did not contain any valid fixtures.");
      return;
    }

    const { error } = await supabase.from("fixtures").insert(rows);
    setLoading(false);

    if (error) {
      setMessage("Could not upload fixtures.");
      return;
    }

    setMessage(`Uploaded ${rows.length} fixtures.`);
    loadAdminData();
  }

  async function updateResult(fixture: Fixture, actualResult: ResultPick) {
    setLoading(true);
    setMessage("");

    const { error: fixtureError } = await supabase.from("fixtures").update({ actual_result: actualResult }).eq("id", fixture.id);

    if (fixtureError) {
      setLoading(false);
      setMessage("Could not save result.");
      return;
    }

    const { data, error: predictionsError } = await supabase.from("predictions").select("*").eq("fixture_id", fixture.id);

    if (predictionsError) {
      setLoading(false);
      setMessage("Result saved, but predictions could not be recalculated.");
      loadAdminData();
      return;
    }

    const predictions = (data ?? []) as Prediction[];
    await Promise.all(
      predictions.map((prediction) =>
        supabase
          .from("predictions")
          .update({ points: calculatePoints(fixture.stage, prediction.prediction, actualResult) })
          .eq("id", prediction.id)
      )
    );

    setLoading(false);
    setMessage("Result saved and points recalculated.");
    loadAdminData();
  }

  if (!authenticated) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-md items-center">
        <section className="panel w-full">
          <p className="badge mb-4 w-fit">Admin</p>
          <h1 className="text-3xl font-black text-white">Admin password</h1>
          <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
            {message ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{message}</p> : null}
            <button className="button w-full">Enter admin</button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="panel">
        <p className="badge mb-2 w-fit">Version 1 admin</p>
        <h1 className="text-2xl font-black text-white">Admin</h1>
        <p className="mt-2 text-sm text-white/60">
          {claimedCount} of {players.length} PINs claimed.
        </p>
      </section>

      {message ? <p className="rounded-md border border-grass-500/25 bg-grass-500/10 p-3 text-sm font-bold text-grass-300">{message}</p> : null}

      <section className="panel">
        <h2 className="text-xl font-black text-white">Players and PINs</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {players.map((player) => (
            <div key={player.id} className="rounded-md border border-white/10 bg-black/20 p-3">
              <p className="font-black text-white">PIN {player.pin}</p>
              <p className="text-sm text-white/60">{player.name ? player.name : "Unclaimed"}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <form onSubmit={createFixture} className="panel space-y-3">
          <h2 className="text-xl font-black text-white">Create fixture</h2>
          <input className="input" value={form.home_team} onChange={(event) => setForm({ ...form, home_team: event.target.value })} placeholder="Home team" required />
          <input className="input" value={form.away_team} onChange={(event) => setForm({ ...form, away_team: event.target.value })} placeholder="Away team" required />
          <input className="input" value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value })} placeholder="Stage" required />
          <input className="input" type="datetime-local" value={form.kickoff_at} onChange={(event) => setForm({ ...form, kickoff_at: event.target.value })} required />
          <button className="button w-full" disabled={loading}>
            Create fixture
          </button>
        </form>

        <section className="panel">
          <h2 className="text-xl font-black text-white">Upload fixtures CSV</h2>
          <p className="mt-2 text-sm text-white/60">Required headers: home_team, away_team, stage, kickoff_at.</p>
          <input className="input mt-4" type="file" accept=".csv,text/csv" onChange={uploadCsv} disabled={loading} />
        </section>
      </section>

      <section className="space-y-3">
        <h2 className="px-1 text-sm font-black uppercase tracking-wide text-white/55">Fixtures and results</h2>
        {fixtures.map((fixture) => (
          <article key={fixture.id} className="panel">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-white/45">
                  {fixture.stage} - {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(fixture.kickoff_at))}
                </p>
                <h3 className="mt-1 text-lg font-black text-white">
                  {fixture.home_team} vs {fixture.away_team}
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(["HOME", "DRAW", "AWAY"] as ResultPick[]).map((pick) => (
                  <button
                    key={pick}
                    className={fixture.actual_result === pick ? "button" : "button-secondary"}
                    disabled={loading}
                    onClick={() => updateResult(fixture, pick)}
                  >
                    {RESULT_LABELS[pick]}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
