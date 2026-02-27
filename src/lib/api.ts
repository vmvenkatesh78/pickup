import { supabase } from './supabase';
import { generateShareCode } from './utils';
import type { Game, Player, CreateGameInput, GameWithPlayers } from '../types';

// All the Supabase queries live here. Keeps the components clean —
// they just call these and handle loading/error states.

/**
 * Creates a new game AND auto-joins the organizer as the first player.
 * Returns both the game and the organizer's player record — the caller
 * needs the player ID to store in sessionStorage/localStorage.
 */
export async function createGame(
  input: CreateGameInput,
  organizerPhone?: string
): Promise<{ game: Game; player: Player }> {
  const share_code = generateShareCode();

  const { data: game, error: gameError } = await supabase
    .from('games')
    .insert({
      ...input,
      share_code,
      status: 'open',
      location_url: input.location_url || null,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (gameError) throw new Error(gameError.message);

  // auto-join the organizer so they don't have to join their own game
  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      game_id: game.id,
      name: input.organizer_name,
      phone: organizerPhone || null,
      is_waitlist: false,
    })
    .select()
    .single();

  if (playerError) throw new Error(playerError.message);

  return { game: game as Game, player: player as Player };
}

/**
 * Loads a game + its player list in two queries.
 *
 * We could do this with a Supabase join (`select('*, players(*)')`) but
 * keeping them separate makes it easier to refetch just the players
 * on real-time updates without re-fetching the game every time.
 */
export async function getGameByShareCode(shareCode: string): Promise<GameWithPlayers> {
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('share_code', shareCode)
    .single();

  if (gameError) throw new Error(gameError.message);

  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('game_id', game.id)
    .eq('is_waitlist', false)
    .order('joined_at', { ascending: true });

  if (playersError) throw new Error(playersError.message);

  return { ...game, players: players || [] } as GameWithPlayers;
}

/**
 * Adds a player to a game. No auth — just a name and optional phone.
 * This is a deliberate design choice: the friction cost of requiring
 * login far outweighs the risk of someone joining with a fake name.
 */
export async function joinGame(
  gameId: string,
  name: string,
  phone?: string
): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({
      game_id: gameId,
      name,
      phone: phone || null,
      is_waitlist: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Player;
}

/** Removes a player row. We track the player's ID in sessionStorage
 *  so they can only remove themselves, not other people. */
export async function leaveGame(playerId: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);

  if (error) throw new Error(error.message);
}

/** Flips a game between open/full/cancelled/completed. */
export async function updateGameStatus(
  gameId: string,
  status: Game['status']
): Promise<void> {
  const { error } = await supabase
    .from('games')
    .update({ status })
    .eq('id', gameId);

  if (error) throw new Error(error.message);
}

/**
 * Fetches upcoming games for the browse page.
 * Filters out anything in the past, caps at 50 results.
 * Optional sport filter — pass 'all' or undefined to skip it.
 */
export async function getUpcomingGames(sport?: string): Promise<Game[]> {
  let query = supabase
    .from('games')
    .select('*')
    .in('status', ['open', 'full'])
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(50);

  if (sport && sport !== 'all') {
    query = query.eq('sport', sport);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data || []) as Game[];
}

/** Head-only count query — avoids fetching full rows when we just need a number. */
export async function getPlayerCount(gameId: string): Promise<number> {
  const { count, error } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('is_waitlist', false);

  if (error) throw new Error(error.message);
  return count || 0;
}

/**
 * Sets up a Supabase real-time subscription on the players table for a
 * specific game. Whenever someone joins or leaves, we re-fetch the full
 * player list and push it through the callback.
 *
 * Yeah, re-fetching the whole list on every change isn't the most
 * efficient approach — but for a game with max ~22 players it's
 * totally fine and way simpler than trying to merge individual row events.
 *
 * Returns an unsubscribe function for cleanup.
 */
export function subscribeToGamePlayers(
  gameId: string,
  callback: (players: Player[]) => void
) {
  // grab the initial list right away
  supabase
    .from('players')
    .select('*')
    .eq('game_id', gameId)
    .eq('is_waitlist', false)
    .order('joined_at', { ascending: true })
    .then(({ data }) => {
      if (data) callback(data as Player[]);
    });

  // then listen for any inserts/deletes/updates
  const channel = supabase
    .channel(`game-${gameId}-players`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`,
      },
      async () => {
        // re-fetch the whole list — simple and reliable
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId)
          .eq('is_waitlist', false)
          .order('joined_at', { ascending: true });

        if (data) callback(data as Player[]);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Fetch multiple games by their IDs in one query.
 * Used by the My Games page to hydrate the locally-stored refs
 * with real game data from Supabase.
 */
export async function getGamesByIds(gameIds: string[]): Promise<Game[]> {
  if (gameIds.length === 0) return [];

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .in('id', gameIds);

  if (error) throw new Error(error.message);
  return (data || []) as Game[];
}
