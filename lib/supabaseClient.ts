import { createClient } from "@supabase/supabase-js";

export type ResultPick = "HOME" | "DRAW" | "AWAY";

export type Player = {
  id: string;
  pin: string;
  name: string | null;
  created_at: string;
};

export type Fixture = {
  id: string;
  home_team: string;
  away_team: string;
  stage: string;
  kickoff_at: string;
  actual_result: ResultPick | null;
  created_at: string;
};

export type Prediction = {
  id: string;
  player_id: string;
  fixture_id: string;
  prediction: ResultPick;
  points: number;
  created_at: string;
  updated_at: string;
};

export type PredictionWithFixture = Prediction & {
  fixtures: Fixture | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Missing Supabase environment variables.");
}

export const supabase = createClient(
  supabaseUrl ?? "https://example.supabase.co",
  supabaseAnonKey ?? "missing-anon-key"
);
