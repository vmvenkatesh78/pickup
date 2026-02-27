// HomePage — the landing page.
// Keep it simple: explain what this does, two clear CTAs (create / browse),
// and a quick "how it works" section. Nobody reads more than that.

import { Link } from 'react-router-dom';
import { ArrowRight, Users, Share2, Zap } from 'lucide-react';

const steps = [
  {
    icon: Zap,
    title: 'Create a Game',
    description: 'Pick a sport, set the time and place, and set the max players.',
  },
  {
    icon: Share2,
    title: 'Share the Link',
    description: 'Send the game link via WhatsApp. One tap, done.',
  },
  {
    icon: Users,
    title: 'Show Up and Play',
    description: 'Players join with just their name. Live count so you know who\'s in.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <span>🏐</span>
          No login. No app download. Just play.
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-surface-950 tracking-tight leading-[1.1] mb-4">
          Organize pickup games{' '}
          <span className="text-primary-500">in&nbsp;seconds</span>
        </h1>
        <p className="text-lg text-surface-500 max-w-md mx-auto mb-8 leading-relaxed">
          Create a game, share the link on WhatsApp, and people join with just their name.
          That's it.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-600 transition-colors no-underline text-base"
          >
            Create a Game
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/browse"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface-100 text-surface-700 font-semibold px-6 py-3 rounded-xl hover:bg-surface-200 transition-colors no-underline text-base"
          >
            Browse Games
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="font-display text-xl font-bold text-surface-900 text-center mb-8">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-surface-200 p-6 text-center"
            >
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="font-display font-bold text-surface-900 mb-1.5">
                {step.title}
              </h3>
              <p className="text-sm text-surface-500 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Sports */}
      <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <p className="text-surface-400 text-sm mb-3">Works for any sport</p>
        <div className="flex items-center justify-center gap-4 text-3xl">
          <span title="Cricket">🏏</span>
          <span title="Basketball">🏀</span>
          <span title="Badminton">🏸</span>
          <span title="Football">⚽</span>
          <span title="And more">🎯</span>
        </div>
      </section>
    </div>
  );
}
