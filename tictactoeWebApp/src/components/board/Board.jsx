import React, { useContext, useMemo } from 'react';
import { GameContext } from '../../context/GameContext';
import Cell from './Cell';

const makeGrid = (board) => {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    rows.push(board.slice(r * 3, r * 3 + 3));
  }
  return rows;
};

// PUBLIC_INTERFACE
export default function Board() {
  /** Accessible 3x3 grid with mouse, touch, and keyboard support */
  const { board, winningLine } = useContext(GameContext);

  const grid = useMemo(() => makeGrid(board), [board]);

  return (
    <section
      className="board"
      role="grid"
      aria-label="Tic Tac Toe Board"
      data-testid="board"
    >
      {grid.map((row, rIdx) => (
        <div
          role="row"
          className="board-row"
          key={`row-${rIdx}`}
          data-testid={`board-row-${rIdx}`}
        >
          {row.map((value, cIdx) => {
            const index = rIdx * 3 + cIdx;
            const isWinCell = winningLine.includes(index);
            return (
              <Cell
                key={`cell-${index}`}
                index={index}
                value={value}
                isWinning={isWinCell}
              />
            );
          })}
        </div>
      ))}
    </section>
  );
}
