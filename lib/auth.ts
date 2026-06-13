export type StoredPlayer = {
  player_id: string;
  player_name: string;
  pin: string;
};

const STORAGE_KEY = "wc_predictor_player";

export function savePlayerSession(player: StoredPlayer) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
}

export function getPlayerSession(): StoredPlayer | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPlayer>;
    if (!parsed.player_id || !parsed.player_name || !parsed.pin) return null;
    return {
      player_id: parsed.player_id,
      player_name: parsed.player_name,
      pin: parsed.pin
    };
  } catch {
    return null;
  }
}

export function clearPlayerSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function savePendingPin(pin: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("wc_predictor_pending_pin", pin);
}

export function getPendingPin() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wc_predictor_pending_pin");
}

export function clearPendingPin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("wc_predictor_pending_pin");
}
