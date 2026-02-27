// Tracks which games the current user has created or joined.
//
// Since we have no auth, Supabase can't tell who "you" are.
// So we store just the IDs locally — the bare minimum to link
// this browser to the right player records. All actual game
// data stays in Supabase where it belongs.

const STORAGE_KEY = 'pickup-my-games';

export interface MyGameRef {
  gameId: string;
  shareCode: string;
  playerId: string;
  role: 'organizer' | 'player';
}

function getRefs(): MyGameRef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRefs(refs: MyGameRef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(refs));
}

/** Save a reference after creating or joining a game. */
export function trackGame(ref: MyGameRef): void {
  const refs = getRefs();

  // don't duplicate
  const exists = refs.some(
    (r) => r.gameId === ref.gameId && r.playerId === ref.playerId
  );
  if (exists) return;

  refs.unshift(ref); // newest first
  saveRefs(refs);
}

/** Remove tracking when someone leaves a game. */
export function untrackGame(gameId: string): void {
  const refs = getRefs().filter((r) => r.gameId !== gameId);
  saveRefs(refs);
}

/** Get all tracked game refs, newest first. */
export function getMyGameRefs(): MyGameRef[] {
  return getRefs();
}

/** Check if the user is involved in a specific game. */
export function getMyRefForGame(gameId: string): MyGameRef | null {
  return getRefs().find((r) => r.gameId === gameId) || null;
}
