import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app and board', () => {
  render(<App />);
  expect(screen.getByTestId('board')).toBeInTheDocument();
  expect(screen.getByTestId('status-bar')).toBeInTheDocument();
});

test('has controls', () => {
  render(<App />);
  expect(screen.getByTestId('btn-newgame')).toBeInTheDocument();
  expect(screen.getByTestId('btn-reset')).toBeInTheDocument();
  expect(screen.getByTestId('btn-sound')).toBeInTheDocument();
});
