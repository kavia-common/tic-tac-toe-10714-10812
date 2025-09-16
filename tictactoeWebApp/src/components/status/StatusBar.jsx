import React, { useContext, useMemo } from 'react';
import { GameContext } from '../../context/GameContext';

// PUBLIC_INTERFACE
export default function StatusBar() {
  /** Real-time status indicator, accessible and distinct; mirrors backend state */
  const { currentPlayer, status, winningLine, board, message, loading } = useContext(GameContext);

  const computedMessage = useMemo(() => {
    if (message) return message;
    if (loading) return 'Working…';
    if (status === 'won') {
      const winner = board[winningLine[0]];
      return `Player ${winner} wins!`;
    }
    if (status === 'draw') return 'Draw! No more moves.';
    return `Player ${currentPlayer}'s turn`;
  }, [currentPlayer, status, winningLine, board, message, loading]);

  const statusClass = status === 'won' ? 'status won'
    : status === 'draw' ? 'status draw'
    : 'status playing';

  return (
    <div className={statusClass} role="status" aria-live="polite" data-testid="status-bar">
      <span>{computedMessage}</span>
    </div>
  );
}
