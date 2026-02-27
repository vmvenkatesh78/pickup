// MyGamesPage — shows games you've created or joined.
//
// localStorage only stores game/player IDs and your role.
// Actual game data (sport, location, time, status) comes from
// Supabase on every load — so it's always fresh.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Crown, Users, Loader2 } from 'lucide-react';
import { getMyGameRefs } from '../lib/my-games';
import { getGamesByIds } from '../lib/api';
import { formatGameDate, getSportEmoji } from '../lib/utils';
import type { Game } from '../types';
import type { MyGameRef } from '../lib/my-games';

// Combines the local ref (role, playerId) with the real game data from Supabase
interface MyGameWithDetails extends MyGameRef {
  game: Game;
}

export default function MyGamesPage() {
  const [games, setGames] = useState<MyGameWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGames() {
      const refs = getMyGameRefs();
      if (refs.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const gameIds = refs.map((r) => r.gameId);
        const gamesData = await getGamesByIds(gameIds);

        // merge local refs with Supabase data, preserving newest-first order
        const merged: MyGameWithDetails[] = [];
        for (const ref of refs) {
          const game = gamesData.find((g) => g.id === ref.gameId);
          if (game) {
            merged.push({ ...ref, game });
          }
          // if a game was deleted from Supabase, it just won't show up — that's fine
        }

        setGames(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setLoading(false);
      }
    }

    loadGames();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold text-surface-950 mb-1">
        My Games
      </h1>
      <p className="text-surface-500 text-sm mb-6">
        Games you've created or joined on this device.
      </p>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100 mb-4">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && games.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🎮</p>
          <h2 className="font-display text-lg font-bold text-surface-900 mb-1">
            No games yet
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            Create or join a game and it'll show up here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-600 transition-colors no-underline text-sm"
            >
              Create a Game
            </Link>
            <Link
              to="/browse"
              className="inline-flex items-center gap-2 bg-surface-100 text-surface-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-surface-200 transition-colors no-underline text-sm"
            >
              Browse Games
            </Link>
          </div>
        </div>
      )}

      {/* Game Cards */}
      {!loading && games.length > 0 && (
        <div className="space-y-3">
          {games.map((entry) => (
            <Link
              key={entry.gameId}
              to={`/game/${entry.shareCode}`}
              className="block bg-white rounded-2xl border border-surface-200 p-4 hover:border-surface-300 hover:shadow-sm transition-all no-underline"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">
                  {getSportEmoji(entry.game.sport)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-surface-900 capitalize text-sm">
                      Pickup {entry.game.sport}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                        entry.role === 'organizer'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-primary-50 text-primary-700 border-primary-200'
                      }`}
                    >
                      {entry.role === 'organizer' ? (
                        <>
                          <Crown className="w-3 h-3" />
                          Organizer
                        </>
                      ) : (
                        <>
                          <Users className="w-3 h-3" />
                          Joined
                        </>
                      )}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-surface-500 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{entry.game.location_name}</span>
                    </p>
                    <p className="text-xs text-surface-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {formatGameDate(entry.game.date_time)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
