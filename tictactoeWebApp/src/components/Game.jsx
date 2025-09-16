import React, { useContext } from 'react';
import { GameContext } from '../context/GameContext';
import Board from './board/Board';
import StatusBar from './status/StatusBar';
import Controls from './controls/Controls';

// PUBLIC_INTERFACE
export default function Game() {
  /** High-level composition of status, board, and controls */
  const { status } = useContext(GameContext);

  return (
    <main className="game-container" role="main">
      <h1 className="title" aria-label="Tic Tac Toe">Tic Tac Toe</h1>
      <StatusBar />
      <Board />
      <Controls />
      <p className="sr-note" aria-hidden="true">
        {status === 'playing' ? 'Game in progress' : 'Game finished'}
      </p>
    </main>
  );
}
