// These map 1:1 with the Supabase enums in supabase/schema.sql.
// If you add a sport here, add it to the DB constraint too.

export type Sport = 'cricket' | 'basketball' | 'badminton' | 'football' | 'other';

export type SkillLevel = 'casual' | 'intermediate' | 'competitive';

export type GameStatus = 'open' | 'full' | 'cancelled' | 'completed';

/** Row shape from the `games` table. */
export interface Game {
  id: string;
  sport: Sport;
  location_name: string;
  location_url: string | null;
  date_time: string;
  max_players: number;
  skill_level: SkillLevel;
  notes: string | null;
  organizer_name: string;
  status: GameStatus;
  created_at: string;
  share_code: string;
}

/** Row shape from the `players` table. */
export interface Player {
  id: string;
  game_id: string;
  name: string;
  phone: string | null;
  joined_at: string;
  is_waitlist: boolean;
}

/** Convenience type — game with its player list already joined. */
export interface GameWithPlayers extends Game {
  players: Player[];
}

/** What the Create Game form collects before we send it to Supabase. */
export interface CreateGameInput {
  sport: Sport;
  location_name: string;
  location_url?: string;
  date_time: string;
  max_players: number;
  skill_level: SkillLevel;
  notes?: string;
  organizer_name: string;
}

export interface JoinGameInput {
  game_id: string;
  name: string;
  phone?: string;
}

// --- UI constants ---
// Used by SportSelector, Browse filters, etc.

export const SPORTS: { value: Sport; label: string; emoji: string }[] = [
  { value: 'cricket', label: 'Cricket', emoji: '🏏' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀' },
  { value: 'badminton', label: 'Badminton', emoji: '🏸' },
  { value: 'football', label: 'Football', emoji: '⚽' },
  { value: 'other', label: 'Other', emoji: '🎯' },
];

export const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'casual', label: 'Casual' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'competitive', label: 'Competitive' },
];

// Sensible defaults — these pre-fill when a user picks a sport.
// Cricket gets 22 (two full teams), basketball gets 10 (5v5), etc.
export const DEFAULT_MAX_PLAYERS: Record<Sport, number> = {
  cricket: 22,
  basketball: 10,
  badminton: 4,
  football: 14,
  other: 10,
};
