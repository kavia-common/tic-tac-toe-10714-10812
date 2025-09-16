import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateWinner, isBoardFull, nextPlayer, NEW_BOARD } from '../logic/gameUtils';
import { useSound } from '../hooks/useSound';

// PUBLIC_INTERFACE
export const GameContext = createContext({
  /** Current 3x3 board as array of 9 "X" | "O" | null */
  board: NEW_BOARD,
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
  /** Start a brand new game */
  newGame: () => {},
  /** Toggle sound effects on/off */
  toggleSound: () => {},
  /** Is sound enabled */
  soundEnabled: true,
  /** Screen reader live announcement text */
  announcement: '',
});

// PUBLIC_INTERFACE
export function GameProvider({ children }) {
  /** Central, accessible game state manager */
  const [board, setBoard] = useState(NEW_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [status, setStatus] = useState('playing'); // 'playing' | 'won' | 'draw'
  const [winningLine, setWinningLine] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [announcement, setAnnouncement] = useState('Game started. Player X begins.');
  const announceTimeout = useRef(null);

  // Sounds
  const { playPlace, playWin, playDraw, playReset, playInvalid } = useSound(soundEnabled);

  const announce = useCallback((msg) => {
    // Update live region text to announce important changes
    setAnnouncement('');
    // Queue a small delay to retrigger aria-live announcements consistently
    clearTimeout(announceTimeout.current);
    announceTimeout.current = setTimeout(() => setAnnouncement(msg), 50);
  }, []);

  useEffect(() => {
    return () => clearTimeout(announceTimeout.current);
  }, []);

  const endGame = useCallback((winner, line) => {
    if (winner) {
      setStatus('won');
      setWinningLine(line);
      announce(`Player ${winner} wins!`);
      playWin();
    } else {
      setStatus('draw');
      setWinningLine([]);
      announce('Game ended in a draw.');
      playDraw();
    }
  }, [announce, playWin, playDraw]);

  // PUBLIC_INTERFACE
  const makeMove = useCallback((index) => {
    // Prevent moves after game end or invalid index
    if (status !== 'playing' || index < 0 || index > 8) {
      playInvalid();
      return;
    }
    // Prevent move on occupied cell
    if (board[index]) {
      announce('Invalid move. Cell is already occupied.');
      playInvalid();
      return;
    }
    // Apply move
    const next = board.slice();
    next[index] = currentPlayer;
    setBoard(next);
    playPlace();

    const result = calculateWinner(next);
    if (result.winner) {
      endGame(result.winner, result.line);
      return;
    }
    if (isBoardFull(next)) {
      endGame(null, []);
      return;
    }
    const np = nextPlayer(currentPlayer);
    setCurrentPlayer(np);
    announce(`Player ${np}'s turn.`);
  }, [board, currentPlayer, status, playPlace, playInvalid, endGame, announce]);

  // PUBLIC_INTERFACE
  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setStatus('playing');
    setWinningLine([]);
    setCurrentPlayer('X');
    playReset();
    announce('Board reset. Player X begins.');
  }, [announce, playReset]);

  // PUBLIC_INTERFACE
  const newGame = useCallback(() => {
    resetGame();
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
  }), [board, currentPlayer, status, winningLine, makeMove, resetGame, newGame, toggleSound, soundEnabled, announcement]);

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
