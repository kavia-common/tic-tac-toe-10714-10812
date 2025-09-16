import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSound } from '../hooks/useSound';

// PUBLIC_INTERFACE
export const GameContext = createContext({
  /** Current 3x3 board as array of 9 "X" | "O" | null */
  board: Array(9).fill(null),
  /** "X" | "O" - whose turn it is */
  currentPlayer: 'X',
  /** 'playing' | 'won' | 'draw' */
  status: 'playing',
  /** Array of three cell indexes forming a win, or [] */
  winningLine: [],
  /** Make a move at index (0..8) if valid */
  makeMove: (_index) => {},
  /** Reset the current game (leave sound/theme settings intact) */
  resetGame: () => {},
  /** Start a brand new game (alias of reset in backend model) */
  newGame: () => {},
  /** Toggle sound effects on/off */
  toggleSound: () => {},
  /** Is sound enabled */
  soundEnabled: true,
  /** Screen reader live announcement text */
  announcement: '',
  /** Last backend message or error */
  message: '',
  /** Loading state for network ops */
  loading: false,
});

/**
 * Helper to safely parse backend response JSON and normalize fields.
 * Expected backend /game, /move, /reset shape:
 * {
 *   board: string[] (length 9 with "X"|"O"|null),
 *   current_player: "X"|"O",
 *   status: "playing"|"won"|"draw",
 *   winning_line: number[],
 *   message?: string
 * }
 */
function normalizeGameState(json) {
  return {
    board: Array.isArray(json.board) ? json.board : Array(9).fill(null),
    currentPlayer: json.current_player ?? 'X',
    status: json.status ?? 'playing',
    winningLine: Array.isArray(json.winning_line) ? json.winning_line : [],
    message: json.message || '',
  };
}

// PUBLIC_INTERFACE
export function GameProvider({ children }) {
  /** Central, accessible game state manager backed by FastAPI service */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'draw'
  const [winningLine, setWinningLine] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [announcement, setAnnouncement] = useState('Loading game from server…');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const announceTimeout = useRef(null);

  // Backend base URL
  const API_BASE = 'http://localhost:8000';

  // Sounds
  const { playPlace, playWin, playDraw, playReset, playInvalid } = useSound(soundEnabled);

  const announce = useCallback((msg) => {
    setAnnouncement('');
    clearTimeout(announceTimeout.current);
    announceTimeout.current = setTimeout(() => setAnnouncement(msg), 50);
  }, []);

  useEffect(() => () => clearTimeout(announceTimeout.current), []);

  const applyState = useCallback((state, { playSounds = true, wasMove = false } = {}) => {
    setBoard(state.board);
    setCurrentPlayer(state.currentPlayer);
    setStatus(state.status);
    setWinningLine(state.winningLine);
    setMessage(state.message || '');

    if (!playSounds) return;
    if (state.status === 'won') {
      announce(`Player ${state.board[state.winningLine[0]]} wins!`);
      playWin();
      return;
    }
    if (state.status === 'draw') {
      announce('Game ended in a draw.');
      playDraw();
      return;
    }
    if (wasMove) {
      playPlace();
      announce(`Player ${state.currentPlayer}'s turn.`);
    }
  }, [announce, playDraw, playPlace, playWin]);

  // PUBLIC_INTERFACE
  const fetchGame = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/game`, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Failed to load game (${res.status})`);
      const json = await res.json();
      const normalized = normalizeGameState(json);
      applyState(normalized, { playSounds: false });
      announce(`Game loaded. Player ${normalized.currentPlayer} begins.`);
    } catch (e) {
      const errMsg = `Error loading game: ${e.message}`;
      setMessage(errMsg);
      announce(errMsg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, announce, applyState]);

  // Initial load
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  // PUBLIC_INTERFACE
  const makeMove = useCallback(async (index) => {
    if (status !== 'playing' || index < 0 || index > 8) {
      playInvalid();
      return;
    }
    // Do not allow clicking filled cells (UI should already prevent)
    if (board[index]) {
      announce('Invalid move. Cell is already occupied.');
      playInvalid();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ index }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = json?.message || `Move failed (${res.status})`;
        setMessage(errMsg);
        announce(errMsg);
        playInvalid();
        return;
      }
      const normalized = normalizeGameState(json);
      applyState(normalized, { playSounds: true, wasMove: true });
    } catch (e) {
      const errMsg = `Network error while making move: ${e.message}`;
      setMessage(errMsg);
      announce(errMsg);
      playInvalid();
    } finally {
      setLoading(false);
    }
  }, [API_BASE, announce, applyState, board, playInvalid, status]);

  // PUBLIC_INTERFACE
  const resetGame = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`Reset failed (${res.status})`);
      const json = await res.json();
      const normalized = normalizeGameState(json);
      applyState(normalized, { playSounds: false });
      playReset();
      announce('Board reset. Player X begins.');
    } catch (e) {
      const errMsg = `Error resetting game: ${e.message}`;
      setMessage(errMsg);
      announce(errMsg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, announce, applyState, playReset]);

  // PUBLIC_INTERFACE
  const newGame = useCallback(async () => {
    // Alias to reset backend game
    await resetGame();
  }, [resetGame]);

  // PUBLIC_INTERFACE
  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => !v);
  }, []);

  const value = useMemo(() => ({
    board,
    currentPlayer,
    status,
    winningLine,
    makeMove,
    resetGame,
    newGame,
    toggleSound,
    soundEnabled,
    announcement,
    message,
    loading,
  }), [
    announcement,
    board,
    currentPlayer,
    loading,
    makeMove,
    message,
    newGame,
    resetGame,
    soundEnabled,
    status,
    toggleSound,
    winningLine
  ]);

  return (
    <GameContext.Provider value={value}>
      {/* aria-live region for SR announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="aria-live-region"
      >
        {announcement}
      </div>
      {children}
    </GameContext.Provider>
  );
}
