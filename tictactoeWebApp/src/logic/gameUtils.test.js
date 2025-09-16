import { calculateWinner, isBoardFull, nextPlayer } from './gameUtils';

test('nextPlayer toggles correctly', () => {
  expect(nextPlayer('X')).toBe('O');
  expect(nextPlayer('O')).toBe('X');
});

test('detects row win', () => {
  const board = ['X','X','X', null,null,null, null,null,null];
  const { winner, line } = calculateWinner(board);
  expect(winner).toBe('X');
  expect(line).toEqual([0,1,2]);
});

test('detects diagonal win', () => {
  const board = ['O',null,null, null,'O',null, null,null,'O'];
  const { winner, line } = calculateWinner(board);
  expect(winner).toBe('O');
  expect(line).toEqual([0,4,8]);
});

test('board full detection', () => {
  const board = ['X','O','X','X','O','O','O','X','X'];
  expect(isBoardFull(board)).toBe(true);
});
