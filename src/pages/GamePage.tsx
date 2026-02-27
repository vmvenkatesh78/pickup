// GamePage — the most important screen in the app.
//
// This is what someone sees when they tap a shared link in WhatsApp.
// It needs to load fast, show the game details clearly, and let them
// join with just their name. The player list updates in real-time
// via Supabase subscriptions so everyone can see who's in.
//
// Edge cases handled:
// - Stale sessionStorage (player was deleted but ID still stored)
// - Game full race condition (re-checks spots before inserting)
// - Double-submit prevention (disabled state + early return)
// - Long names truncated to prevent layout breaking
// - Expired games show proper messaging
// - Network errors shown inline

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Users,
  Trophy,
  StickyNote,
  Share2,
  Loader2,
  UserPlus,
  LogOut,
  ExternalLink,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react';
import { getGameByShareCode, joinGame, leaveGame, updateGameStatus, subscribeToGamePlayers } from '../lib/api';
import { formatGameDate, getSportEmoji, shareGame, isGameExpired } from '../lib/utils';
import { trackGame, untrackGame } from '../lib/my-games';
import type { Game, Player } from '../types';

export default function GamePage() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // join form
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // copy link feedback
  const [copied, setCopied] = useState(false);

  // track the current user's player ID in sessionStorage
  const [myPlayerId, setMyPlayerId] = useState<string | null>(() => {
    if (!shareCode) return null;
    return sessionStorage.getItem(`pickup-player-${shareCode}`);
  });

  // prevent double-submit on join — useRef so it doesn't cause re-renders
  const joinLock = useRef(false);

  // fetch game data
  useEffect(() => {
    if (!shareCode) return;

    async function fetchGame() {
      try {
        const data = await getGameByShareCode(shareCode!);
        setGame(data);
        setPlayers(data.players);

        // edge case: sessionStorage says we're joined, but our player
        // record was deleted (maybe organizer removed us, or DB was cleared).
        // If so, clean up the stale reference.
        const storedPlayerId = sessionStorage.getItem(`pickup-player-${shareCode}`);
        if (storedPlayerId && !data.players.some((p) => p.id === storedPlayerId)) {
          sessionStorage.removeItem(`pickup-player-${shareCode}`);
          setMyPlayerId(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Game not found');
      } finally {
        setLoading(false);
      }
    }

    fetchGame();
  }, [shareCode]);

  // real-time player subscription
  useEffect(() => {
    if (!game?.id) return;

    const unsubscribe = subscribeToGamePlayers(game.id, (updatedPlayers) => {
      setPlayers(updatedPlayers);

      // flip game status based on count
      if (updatedPlayers.length >= game.max_players && game.status === 'open') {
        updateGameStatus(game.id, 'full');
        setGame((prev) => prev ? { ...prev, status: 'full' } : null);
      } else if (updatedPlayers.length < game.max_players && game.status === 'full') {
        updateGameStatus(game.id, 'open');
        setGame((prev) => prev ? { ...prev, status: 'open' } : null);
      }
    });

    return unsubscribe;
  }, [game?.id, game?.max_players, game?.status]);

  const handleJoin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !playerName.trim()) return;

    // double-submit guard
    if (joinLock.current) return;
    joinLock.current = true;

    setJoinError(null);
    setJoining(true);

    // client-side race condition check — are spots actually available?
    if (players.length >= game.max_players) {
      setJoinError('This game just filled up — no spots left.');
      setJoining(false);
      joinLock.current = false;
      return;
    }

    try {
      const player = await joinGame(game.id, playerName.trim(), playerPhone.trim() || undefined);
      setMyPlayerId(player.id);
      sessionStorage.setItem(`pickup-player-${shareCode}`, player.id);

      trackGame({
        gameId: game.id,
        shareCode: game.share_code,
        playerId: player.id,
        role: 'player',
      });

      setPlayerName('');
      setPlayerPhone('');
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join. Try again.');
    } finally {
      setJoining(false);
      joinLock.current = false;
    }
  }, [game, playerName, playerPhone, shareCode, players.length]);

  const handleLeave = useCallback(async () => {
    if (!myPlayerId || !shareCode || !game) return;

    try {
      await leaveGame(myPlayerId);
      setMyPlayerId(null);
      sessionStorage.removeItem(`pickup-player-${shareCode}`);
      untrackGame(game.id);
    } catch (err) {
      console.error('Failed to leave:', err);
    }
  }, [myPlayerId, shareCode, game]);

  const handleShare = useCallback(() => {
    if (!game) return;
    shareGame(game.sport, game.date_time, game.share_code);
  }, [game]);

  const handleCopyLink = useCallback(async () => {
    if (!game) return;
    const url = `${window.location.origin}/game/${game.share_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API failed — fall through silently
    }
  }, [game]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-200 rounded-lg w-2/3" />
          <div className="h-4 bg-surface-100 rounded w-1/3" />
          <div className="bg-white rounded-2xl border border-surface-200 p-5 space-y-3">
            <div className="h-4 bg-surface-100 rounded w-full" />
            <div className="h-4 bg-surface-100 rounded w-3/4" />
            <div className="h-4 bg-surface-100 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error || !game) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">😕</p>
        <h1 className="font-display text-xl font-bold text-surface-900 mb-2">
          Game not found
        </h1>
        <p className="text-surface-500 text-sm mb-6">
          This game may have been removed or the link is incorrect.
        </p>
        <Link
          to="/browse"
          className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-600 transition-colors no-underline text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Games
        </Link>
      </div>
    );
  }

  const spotsLeft = game.max_players - players.length;
  const isFull = spotsLeft <= 0;
  const expired = isGameExpired(game.date_time);
  const hasJoined = myPlayerId && players.some((p) => p.id === myPlayerId);
  const canJoin = !isFull && !expired && !hasJoined && game.status === 'open';

  const statusConfig = {
    open: { label: 'Open', className: 'bg-green-50 text-green-700 border-green-200' },
    full: { label: 'Full', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' },
    completed: { label: 'Completed', className: 'bg-surface-100 text-surface-600 border-surface-200' },
  };

  const effectiveStatus = expired && game.status === 'open' ? 'completed' : game.status;
  const { label: statusLabel, className: statusClass } = statusConfig[effectiveStatus];

  // progress bar for spots filled
  const fillPercent = Math.min((players.length / game.max_players) * 100, 100);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{getSportEmoji(game.sport)}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
          <h1 className="font-display text-2xl font-extrabold text-surface-950 capitalize">
            Pickup {game.sport}
          </h1>
          <p className="text-sm text-surface-400 mt-0.5">
            Organized by <span className="text-surface-600">{game.organizer_name}</span>
          </p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 bg-green-50 text-green-700 font-semibold text-sm px-3 py-2 rounded-xl hover:bg-green-100 transition-colors cursor-pointer border border-green-200"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Game Details */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 space-y-3.5 mb-5">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-surface-900 truncate">
              {game.location_name}
            </p>
            {game.location_url && (
              <a
                href={game.location_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-500 hover:text-primary-600 inline-flex items-center gap-1 mt-0.5"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-surface-400 shrink-0" />
          <p className="text-sm font-medium text-surface-900">
            {formatGameDate(game.date_time)}
          </p>
        </div>

        {/* Spots with progress bar */}
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-surface-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900 mb-1.5">
              <span className={isFull ? 'text-amber-600' : 'text-primary-600'}>
                {players.length}/{game.max_players}
              </span>{' '}
              players
              {!isFull && (
                <span className="text-surface-400 font-normal">
                  {' '}· {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                </span>
              )}
            </p>
            <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-amber-500' : 'bg-primary-500'
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Trophy className="w-4 h-4 text-surface-400 shrink-0" />
          <p className="text-sm font-medium text-surface-900 capitalize">
            {game.skill_level}
          </p>
        </div>

        {game.notes && (
          <div className="flex items-start gap-3">
            <StickyNote className="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
            <p className="text-sm text-surface-600 break-words">{game.notes}</p>
          </div>
        )}
      </div>

      {/* Player List */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5 mb-5">
        <h2 className="font-display text-sm font-bold text-surface-900 mb-3">
          Players ({players.length})
        </h2>
        {players.length === 0 ? (
          <p className="text-sm text-surface-400 py-2">
            No players yet. Be the first to join!
          </p>
        ) : (
          <div className="space-y-2">
            {players.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                  player.id === myPlayerId
                    ? 'bg-primary-50 border border-primary-200'
                    : 'bg-surface-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-6 h-6 bg-surface-200 rounded-full flex items-center justify-center text-xs font-bold text-surface-600 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-surface-900 truncate">
                    {player.name}
                    {i === 0 && (
                      <span className="text-xs text-surface-400 font-normal ml-1.5">
                        (organizer)
                      </span>
                    )}
                    {player.id === myPlayerId && (
                      <span className="text-xs text-primary-600 font-normal ml-1.5">
                        (you)
                      </span>
                    )}
                  </span>
                </div>
                {player.id === myPlayerId && !expired && (
                  <button
                    onClick={handleLeave}
                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Leave
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Form */}
      {canJoin && (
        <form
          onSubmit={handleJoin}
          className="bg-white rounded-2xl border-2 border-primary-200 p-5 mb-5"
        >
          <h2 className="font-display text-sm font-bold text-surface-900 mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary-500" />
            Join this game
          </h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your name *"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={50}
              required
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={playerPhone}
              onChange={(e) => setPlayerPhone(e.target.value)}
              className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
            />
            {joinError && (
              <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-100">
                {joinError}
              </div>
            )}
            <button
              type="submit"
              disabled={joining || !playerName.trim()}
              className="w-full bg-primary-500 text-white font-semibold py-2.5 rounded-xl hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Join Game
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Status Messages */}
      {hasJoined && !expired && (
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 text-center mb-5">
          <p className="text-sm font-medium text-primary-700 mb-2">
            You're in! 🎉 Share this game to get more players.
          </p>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Link copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy game link
              </>
            )}
          </button>
        </div>
      )}

      {isFull && !hasJoined && !expired && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center mb-5">
          <p className="text-sm font-medium text-amber-700">
            This game is full. Check back later — a spot might open up.
          </p>
        </div>
      )}

      {expired && (
        <div className="bg-surface-100 border border-surface-200 rounded-2xl p-4 text-center mb-5">
          <p className="text-sm font-medium text-surface-500">
            This game has already happened.
          </p>
        </div>
      )}
    </div>
  );
}
