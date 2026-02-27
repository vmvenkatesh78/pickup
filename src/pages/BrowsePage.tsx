// BrowsePage — discover what games are happening.
//
// Fetches upcoming games from Supabase, lets you filter by sport.
// The filter pills scroll horizontally on mobile (overflow-x-auto)
// because we'll likely add more sports later and don't want wrapping.

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Users, MapPin, Clock } from 'lucide-react';
import { getUpcomingGames } from '../lib/api';
import { formatGameDate, getSportEmoji } from '../lib/utils';
import { SPORTS } from '../types';
import type { Game } from '../types';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', emoji: '🏐' },
  ...SPORTS,
];

export default function BrowsePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState('all');

  useEffect(() => {
    async function fetchGames() {
      setLoading(true);
      try {
        const data = await getUpcomingGames(sportFilter);
        setGames(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load games');
      } finally {
        setLoading(false);
      }
    }
    fetchGames();
  }, [sportFilter]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold text-surface-950 mb-1">
        Browse Games
      </h1>
      <p className="text-surface-500 text-sm mb-6">
        Find pickup games happening near you.
      </p>

      {/* Sport Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => setSportFilter(option.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all cursor-pointer border ${
              sportFilter === option.value
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300'
            }`}
          >
            <span>{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && games.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🏟️</p>
          <h2 className="font-display text-lg font-bold text-surface-900 mb-1">
            No games yet
          </h2>
          <p className="text-sm text-surface-500 mb-4">
            Be the first to create one!
          </p>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-600 transition-colors no-underline text-sm"
          >
            Create a Game
          </Link>
        </div>
      )}

      {/* Game Cards */}
      {!loading && games.length > 0 && (
        <div className="space-y-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <Link
      to={`/game/${game.share_code}`}
      className="block bg-white rounded-2xl border border-surface-200 p-4 hover:border-surface-300 hover:shadow-sm transition-all no-underline"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{getSportEmoji(game.sport)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-bold text-surface-900 capitalize text-sm">
              Pickup {game.sport}
            </h3>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                game.status === 'open'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {game.status === 'open' ? 'Open' : 'Full'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-surface-500 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{game.location_name}</span>
            </p>
            <p className="text-xs text-surface-500 flex items-center gap-1.5">
              <Clock className="w-3 h-3 shrink-0" />
              {formatGameDate(game.date_time)}
            </p>
            <p className="text-xs text-surface-500 flex items-center gap-1.5">
              <Users className="w-3 h-3 shrink-0" />
              {game.max_players} spots · {game.skill_level}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
