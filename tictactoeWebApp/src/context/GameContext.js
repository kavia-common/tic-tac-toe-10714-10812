import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSound } from '../hooks/useSound';
import { calculateWinner, isBoardFull, nextPlayer } from '../logic/gameUtils';

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
 * Reconstruct board and status from a list of moves [{index, player}]
 */
function buildStateFromMoves(moves) {
  const board = Array(9).fill(null);
  let current = 'X';
  for (const m of moves || []) {
    if (m && typeof m.index === 'number' && (m.player === 'X' || m.player === 'O') && m.index >= 0 && m.index < 9 && !board[m.index]) {
      board[m.index] = m.player;
      current = nextPlayer(m.player);
    }
  }
  const { winner, line } = calculateWinner(board);
  let status = 'playing';
  if (winner) status = 'won';
  else if (isBoardFull(board)) status = 'draw';
  const currentPlayer = status === 'playing' ? current : nextPlayer(current); // after a win/draw, next turn label isn't used
  return { board, currentPlayer, status, winningLine: line };
}

// PUBLIC_INTERFACE
export function GameProvider({ children }) {
  /** Central, accessible game state manager backed by backend moves API */
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'draw'
  const [winningLine, setWinningLine] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [announcement, setAnnouncement] = useState('Loading game from server…');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const announceTimeout = useRef(null);

  // Backend config via env
  const API_BASE = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
  const GAME_ID = (process.env.REACT_APP_GAME_ID || 'default').toString();

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
    // do not overwrite message unless explicitly provided
    if (state.message) setMessage(state.message);

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

  /**
   * Fetch all moves and rebuild local game state
   */
  // PUBLIC_INTERFACE
  const fetchGame = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/games/${encodeURIComponent(GAME_ID)}/moves`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`Failed to load moves (${res.status})`);
      const json = await res.json();
      const moves = Array.isArray(json?.moves) ? json.moves : json; // support {moves: []} or [] shapes
      const state = buildStateFromMoves(moves);
      applyState(state, { playSounds: false });
      announce(`Game loaded. Player ${state.currentPlayer} begins.`);
    } catch (e) {
      const errMsg = `Error loading game: ${e.message}`;
      setMessage(errMsg);
      announce(errMsg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, GAME_ID, announce, applyState]);

  // Initial load
  useEffect(() => {
    fetchGame();
  }, [fetchGame]);

  /**
   * Post a move; if game_id is new, backend should initialize empty list.
   * Body: { index, player }
   */
  // PUBLIC_INTERFACE
  const makeMove = useCallback(async (index) => {
    if (status !== 'playing' || index < 0 || index > 8) {
      playInvalid();
      return;
    }
    if (board[index]) {
      announce('Invalid move. Cell is already occupied.');
      playInvalid();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/games/${encodeURIComponent(GAME_ID)}/moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ index, player: currentPlayer }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = json?.message || `Move failed (${res.status})`;
        setMessage(errMsg);
        announce(errMsg);
        playInvalid();
        return;
      }
      // After successful POST, re-fetch moves to guarantee sync with backend
      await fetchGame();
      // Sounds and announcements handled in applyState(fetch) but ensure place sound for immediate feedback
      playPlace();
    } catch (e) {
      const errMsg = `Network error while making move: ${e.message}`;
      setMessage(errMsg);
      announce(errMsg);
      playInvalid();
    } finally {
      setLoading(false);
    }
  }, [API_BASE, GAME_ID, announce, board, currentPlayer, fetchGame, playInvalid, playPlace, status]);

  /**
   * Reset: client-side clears board but also expects backend to clear moves list.
   * If backend lacks a reset endpoint, we can simulate by posting a special command;
   * here we assume backend supports DELETE to clear moves, else fallback to local reset only.
   */
  // PUBLIC_INTERFACE
  const resetGame = useCallback(async () => {
    setLoading(true);
    try {
      // Try DELETE /games/{id}/moves to clear history
      const res = await fetch(`${API_BASE}/games/${encodeURIComponent(GAME_ID)}/moves`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        // If DELETE isn't supported, we fallback: show message and still refetch
        setMessage('Reset not supported by backend; attempting to reload moves.');
      }
      await fetchGame();
      playReset();
      announce('Board reset. Player X begins.');
    } catch (e) {
      const errMsg = `Error resetting game: ${e.message}`;
      setMessage(errMsg);
      announce(errMsg);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, GAME_ID, announce, fetchGame, playReset]);

  // PUBLIC_INTERFACE
  const newGame = useCallback(async () => {
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
