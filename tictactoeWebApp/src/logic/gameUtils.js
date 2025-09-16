export const NEW_BOARD = Array(9).fill(null);

export const LINES = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // cols
  [0,4,8], [2,4,6],          // diagonals
];

// PUBLIC_INTERFACE
export function calculateWinner(board) {
  /** Returns { winner: 'X' | 'O' | null, line: number[] } */
  for (const [a,b,c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a,b,c] };
    }
  }
  return { winner: null, line: [] };
}

// PUBLIC_INTERFACE
export function isBoardFull(board) {
  /** true if no nulls remain */
  return board.every(cell => cell !== null);
}

// PUBLIC_INTERFACE
export function nextPlayer(current) {
  /** Toggle X/O turn */
  return current === 'X' ? 'O' : 'X';
}
