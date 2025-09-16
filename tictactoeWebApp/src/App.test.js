import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders app and board', () => {
  render(<App />);
  expect(screen.getByTestId('board')).toBeInTheDocument();
  expect(screen.getByTestId('status-bar')).toBeInTheDocument();
});

test('allows a move and updates status', () => {
  render(<App />);
  const cell0 = screen.getByTestId('cell-0');
  fireEvent.click(cell0);
  expect(cell0).toBeDisabled();
  const status = screen.getByTestId('status-bar');
  expect(status.textContent).toMatch(/Player O's turn|Player O’s turn/);
});

test('has controls', () => {
  render(<App />);
  expect(screen.getByTestId('btn-newgame')).toBeInTheDocument();
  expect(screen.getByTestId('btn-reset')).toBeInTheDocument();
  expect(screen.getByTestId('btn-sound')).toBeInTheDocument();
});
