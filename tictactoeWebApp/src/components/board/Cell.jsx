import React, { useContext, useRef } from 'react';
import { GameContext } from '../../context/GameContext';

// PUBLIC_INTERFACE
export default function Cell({ index, value, isWinning }) {
  /** Single board cell with keyboard and pointer interactions */
  const { makeMove, status, currentPlayer, loading } = useContext(GameContext);
  const btnRef = useRef(null);

  const handleActivate = () => {
    makeMove(index);
  };

  const handleKeyDown = (e) => {
    // Activate on Enter/Space; arrow keys navigate using browser default focus order
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
    // Optional: Arrow-key navigation among cells
    const nextIndex = (shift) => {
      const next = index + shift;
      const target = document.querySelector(`[data-testid="cell-${next}"]`);
      if (target) target.focus();
    };
    if (e.key === 'ArrowRight') {
      e.preventDefault(); nextIndex(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); nextIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); nextIndex(3);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); nextIndex(-3);
    }
  };

  const ariaLabel = value
    ? `Cell ${index + 1}, ${value}`
    : `Cell ${index + 1}, empty. Press Enter or Space to place ${currentPlayer}`;

  const isDisabled = status !== 'playing' || !!value || loading;

  return (
    <button
      ref={btnRef}
      className={`cell ${value ? 'filled' : ''} ${isWinning ? 'win' : ''}`}
      role="gridcell"
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      data-testid={`cell-${index}`}
    >
      <span className={`mark ${value ? 'show' : 'hide'} ${value === 'X' ? 'x' : 'o'}`}>
        {value ? value : ''}
      </span>
    </button>
  );
}
