# Tic Tac Toe React SPA

A responsive, accessible, and extensible Tic Tac Toe game built with React. Local two-player mode, strict turn order, immediate feedback, animations, sound with toggle, winning highlight, draw detection, and reset/new game.

## Quick Start

- npm install
- npm start
- npm test
- npm run build

Open http://localhost:3000

## Features

- Responsive 3x3 board with keyboard, mouse, and touch support
- WCAG 2.1 AA: focus outlines, aria-live announcements, roles/labels
- Real-time state updates using a Game Context
- Win/draw detection and winning-line highlight
- New Game and Reset controls
- Sound effects with toggle (no binary assets, generated tones)
- Smooth animations and visual feedback
- Test IDs ready for E2E (e.g., Cypress): board, cell-N, status-bar, controls
- Modular codebase for future AI/multiplayer extensions

## Architecture

src/
- components/
  - Game.jsx: Composes StatusBar, Board, Controls
  - ThemeToggle.jsx
  - board/
    - Board.jsx
    - Cell.jsx
  - status/
    - StatusBar.jsx
  - controls/
    - Controls.jsx
- context/
  - GameContext.js: Centralized state and game actions
- logic/
  - gameUtils.js: Pure logic for winner detection, draws, next player
  - gameUtils.test.js
- hooks/
  - useSound.js: Small tones via AudioContext; toggle via context
- App.js, App.css, index.css

## Accessibility

- role="grid", role="row", role="gridcell" for the board
- aria-labels on cells and buttons
- aria-live polite region for status announcements
- Visible focus indicators and keyboard navigation (Enter/Space + arrow keys)
- High color contrast themes

## Testing

- Unit tests for core logic in logic/gameUtils.test.js
- Basic render and interaction tests in App.test.js
- Data attributes:
  - data-testid="board"
  - data-testid="cell-INDEX"
  - data-testid="status-bar"
  - data-testid="btn-newgame", "btn-reset", "btn-sound", "btn-theme"

## Extensibility

- Add AI by introducing a strategy into GameContext after each X/O move
- Add online play by abstracting makeMove to sync with a backend
- The modular structure keeps UI and logic separated

## Security and Safety

- Prevents invalid moves and blocks moves after game over
- Sanitized, no user-generated content
- No external services or persistent storage by default
