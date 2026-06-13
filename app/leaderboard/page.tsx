"use client";

import { useEffect, useMemo, useState } from "react";
import type { Player, Prediction } from "@/lib/supabaseClient";
import { supabase } from "@/lib/supabaseClient";

type LeaderboardRow = {
  playerId: string;
  player: string;
  matchesPredicted: number;
  correctPicks: number;
  totalPoints: number;
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      const [playersResult, predictionsResult] = await Promise.all([
        supabase.from("players").select("*").not("name", "is", null).order("name", { ascending: true }),
        supabase.from("predictions").select("*")
      ]);

      setPlayers((playersResult.data ?? []) as Player[]);
      setPredictions((predictionsResult.data ?? []) as Prediction[]);
      setLoading(false);
    }

    loadLeaderboard();
  }, []);

  const rows = useMemo<LeaderboardRow[]>(() => {
    return players
      .map((player) => {
        const playerPredictions = predictions.filter((prediction) => prediction.player_id === player.id);
        return {
          playerId: player.id,
          player: player.name ?? "Unclaimed",
          matchesPredicted: playerPredictions.length,
          correctPicks: playerPredictions.filter((prediction) => prediction.points > 0).length,
          totalPoints: playerPredictions.reduce((total, prediction) => total + prediction.points, 0)
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints || b.correctPicks - a.correctPicks || a.player.localeCompare(b.player));
  }, [players, predictions]);

  if (loading) return <p className="text-white/70">Loading leaderboard...</p>;

  return (
    <div className="space-y-5">
      <section className="panel">
        <p className="badge mb-2 w-fit">Live table</p>
        <h1 className="text-2xl font-black text-white">Leaderboard</h1>
      </section>

      <section className="panel overflow-x-auto p-0">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
              <th className="p-4">Rank</th>
              <th className="p-4">Player</th>
              <th className="p-4">Matches Predicted</th>
              <th className="p-4">Correct Picks</th>
              <th className="p-4">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.playerId} className="border-b border-white/5 last:border-0">
                <td className="p-4 text-lg font-black text-grass-300">{index + 1}</td>
                <td className="p-4 font-bold text-white">{row.player}</td>
                <td className="p-4 text-white/70">{row.matchesPredicted}</td>
                <td className="p-4 text-white/70">{row.correctPicks}</td>
                <td className="p-4 text-lg font-black text-white">{row.totalPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <p className="p-4 text-white/65">No claimed players yet.</p> : null}
      </section>
    </div>
  );
}
