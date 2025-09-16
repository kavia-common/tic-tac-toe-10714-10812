import React, { useContext } from 'react';
import { GameContext } from '../../context/GameContext';

// PUBLIC_INTERFACE
export default function Controls() {
  /** Control bar with Reset, New Game and Sound toggle */
  const { resetGame, newGame, soundEnabled, toggleSound, status } = useContext(GameContext);

  return (
    <div className="controls" aria-label="Game controls">
      <button
        type="button"
        className="btn"
        onClick={newGame}
        data-testid="btn-newgame"
        aria-label="Start new game"
      >
        New Game
      </button>
      <button
        type="button"
        className="btn secondary"
        onClick={resetGame}
        data-testid="btn-reset"
        aria-label="Reset current game"
      >
        Reset
      </button>
      <button
        type="button"
        className="btn ghost"
        onClick={toggleSound}
        aria-pressed={soundEnabled}
        data-testid="btn-sound"
        aria-label={`Sound ${soundEnabled ? 'on' : 'off'}`}
        title="Toggle sound effects"
      >
        {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
      </button>
      <span className={`badge ${status}`} aria-hidden="true">{status}</span>
    </div>
  );
}
