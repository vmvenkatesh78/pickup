// CreateGamePage — the game creation form.
//
// Goal: let someone set up a game in under 30 seconds.
// Sport selection auto-fills a sensible max player count (10 for basketball,
// 22 for cricket, etc.) so they're not guessing. On submit we insert
// into Supabase and redirect straight to the game page with its share link.

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { createGame } from '../lib/api';
import { trackGame } from '../lib/my-games';
import { SPORTS, SKILL_LEVELS, DEFAULT_MAX_PLAYERS } from '../types';
import type { Sport, SkillLevel } from '../types';

export default function CreateGamePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  const [sport, setSport] = useState<Sport>('basketball');
  const [locationName, setLocationName] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_MAX_PLAYERS.basketball);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('casual');
  const [notes, setNotes] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');

  function handleSportChange(s: Sport) {
    setSport(s);
    setMaxPlayers(DEFAULT_MAX_PLAYERS[s]);
  }

  function getMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // prevent double-submit (spam clicking)
    if (submitted.current || loading) return;

    if (!locationName.trim()) {
      setError('Location is required');
      return;
    }
    if (!dateTime) {
      setError('Date and time are required');
      return;
    }
    // make sure the date is actually in the future
    if (new Date(dateTime) <= new Date()) {
      setError('Game date must be in the future');
      return;
    }
    if (!organizerName.trim()) {
      setError('Your name is required');
      return;
    }
    if (maxPlayers < 2 || maxPlayers > 100) {
      setError('Max players must be between 2 and 100');
      return;
    }

    submitted.current = true;
    setLoading(true);
    try {
      const { game, player } = await createGame(
        {
          sport,
          location_name: locationName.trim(),
          location_url: locationUrl.trim() || undefined,
          date_time: new Date(dateTime).toISOString(),
          max_players: maxPlayers,
          skill_level: skillLevel,
          notes: notes.trim() || undefined,
          organizer_name: organizerName.trim(),
        },
        organizerPhone.trim() || undefined
      );

      // mark ourselves as joined so the game page shows "You're in!"
      sessionStorage.setItem(`pickup-player-${game.share_code}`, player.id);

      // remember this game so it shows up in "My Games"
      trackGame({
        gameId: game.id,
        shareCode: game.share_code,
        playerId: player.id,
        role: 'organizer',
      });

      navigate(`/game/${game.share_code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      submitted.current = false;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-extrabold text-surface-950 mb-1">
        Create a Game
      </h1>
      <p className="text-surface-500 text-sm mb-6">
        Set up your game in 30 seconds. Share the link and start playing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Sport Selector */}
        <fieldset>
          <legend className="text-sm font-semibold text-surface-700 mb-2">
            Sport
          </legend>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {SPORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleSportChange(s.value)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all text-center cursor-pointer min-w-18 shrink-0 ${
                  sport === s.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-medium text-surface-700">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Location *
          </label>
          <input
            id="location"
            type="text"
            placeholder='e.g. "Marina Beach Court 3"'
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            maxLength={100}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Google Maps Link (optional) */}
        <div>
          <label
            htmlFor="locationUrl"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Google Maps Link{' '}
            <span className="font-normal text-surface-400">(optional)</span>
          </label>
          <input
            id="locationUrl"
            type="url"
            placeholder="https://maps.google.com/..."
            value={locationUrl}
            onChange={(e) => setLocationUrl(e.target.value)}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Date & Time */}
        <div>
          <label
            htmlFor="datetime"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Date & Time *
          </label>
          <input
            id="datetime"
            type="datetime-local"
            value={dateTime}
            min={getMinDateTime()}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Max Players */}
        <div>
          <label
            htmlFor="maxPlayers"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Max Players
          </label>
          <input
            id="maxPlayers"
            type="number"
            min={2}
            max={100}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Skill Level */}
        <fieldset>
          <legend className="text-sm font-semibold text-surface-700 mb-2">
            Skill Level
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSkillLevel(level.value)}
                className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                  skillLevel === level.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Notes{' '}
            <span className="font-normal text-surface-400">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            placeholder='"Bring your own bat", "Indoor court", etc.'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={200}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all resize-none"
          />
        </div>

        {/* Organizer Name */}
        <div>
          <label
            htmlFor="organizer"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Your Name *
          </label>
          <input
            id="organizer"
            type="text"
            placeholder="What should players call you?"
            value={organizerName}
            onChange={(e) => setOrganizerName(e.target.value)}
            maxLength={50}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Organizer Phone */}
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-semibold text-surface-700 mb-1.5"
          >
            Your Phone Number{' '}
            <span className="font-normal text-surface-400">(optional — visible to players)</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={organizerPhone}
            onChange={(e) => setOrganizerPhone(e.target.value)}
            maxLength={15}
            className="w-full bg-white border border-surface-200 rounded-xl px-4 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm font-medium px-4 py-2.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Game'
          )}
        </button>
      </form>
    </div>
  );
}
