import type { Sport } from '../types';

/**
 * Generates a short, URL-friendly share code like "k7m3px".
 *
 * We strip out ambiguous characters (0/O, 1/l/I) because people
 * will sometimes read these aloud or type them from a screenshot.
 * 6 chars gives us ~700M combinations — more than enough.
 */
export function generateShareCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Turns an ISO date string into something humans actually want to read.
 * Shows "Today at 5:30 PM" / "Tomorrow at 7:00 AM" when applicable,
 * otherwise falls back to "Sat, Mar 1 at 5:30 PM".
 *
 * Locale is en-IN since the app is built for Chennai, but this
 * works fine globally — just changes the time format slightly.
 */
export function formatGameDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;

  const dateStr = date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return `${dateStr} at ${timeStr}`;
}

/** Maps sport key to its emoji — used in cards, headers, etc. */
export function getSportEmoji(sport: Sport): string {
  const emojis: Record<Sport, string> = {
    cricket: '🏏',
    basketball: '🏀',
    badminton: '🏸',
    football: '⚽',
    other: '🎯',
  };
  return emojis[sport];
}

/**
 * Builds a wa.me URL with a pre-filled invite message.
 * This is the fallback when Web Share API isn't available
 * (basically desktop browsers).
 */
export function getWhatsAppShareUrl(
  sport: string,
  _dateTime: string,
  shareCode: string
): string {
  const gameUrl = `${window.location.origin}/game/${shareCode}`;
  const message = `Hey! I'm organizing pickup ${sport}. Join here: ${gameUrl}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Tries the native Web Share API first (works great on mobile),
 * falls back to opening WhatsApp if share is cancelled or unavailable.
 *
 * On most Android phones the share sheet pops up with WhatsApp,
 * Telegram, etc. On desktop it usually isn't supported so we
 * go straight to wa.me.
 */
export async function shareGame(
  sport: string,
  dateTime: string,
  shareCode: string
): Promise<void> {
  const gameUrl = `${window.location.origin}/game/${shareCode}`;
  const text = `Hey! I'm organizing pickup ${sport} — ${formatGameDate(dateTime)}. Join here:`;

  if (navigator.share) {
    try {
      await navigator.share({ title: `Pickup ${sport}`, text, url: gameUrl });
      return;
    } catch {
      // user hit cancel on the share sheet — not an error, just fall through
    }
  }

  window.open(getWhatsAppShareUrl(sport, dateTime, shareCode), '_blank');
}

/** Quick check — has the game's scheduled time already passed? */
export function isGameExpired(dateTime: string): boolean {
  return new Date(dateTime) < new Date();
}
