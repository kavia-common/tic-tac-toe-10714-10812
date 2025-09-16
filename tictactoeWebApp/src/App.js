import React from 'react';
import './App.css';
import './index.css';
import { GameProvider } from './context/GameContext';
import Game from './components/Game';
import ThemeToggle from './components/ThemeToggle';

// PUBLIC_INTERFACE
export default function App() {
  /** Root App includes Theme toggle and provides Game context. */
  return (
    <div className="App" data-testid="app-root">
      <GameProvider>
        <ThemeToggle />
        <Game />
      </GameProvider>
    </div>
  );
}
