// App — route definitions.
// Four real pages + a catch-all 404. All wrapped in Layout.
// Using BrowserRouter (not HashRouter) because Vercel handles
// SPA fallback routing out of the box.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import CreateGamePage from './pages/CreateGamePage';
import GamePage from './pages/GamePage';
import BrowsePage from './pages/BrowsePage';
import MyGamesPage from './pages/MyGamesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateGamePage />} />
          <Route path="/game/:shareCode" element={<GamePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/my-games" element={<MyGamesPage />} />
          <Route
            path="*"
            element={
              <div className="max-w-lg mx-auto px-4 py-20 text-center">
                <p className="text-4xl mb-4">🤷</p>
                <h1 className="font-display text-xl font-bold text-surface-900 mb-2">
                  Page not found
                </h1>
                <p className="text-surface-500 text-sm">
                  The page you're looking for doesn't exist.
                </p>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
