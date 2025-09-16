# tic-tac-toe-10714-10812

This workspace contains the Tic Tac Toe React web application under tictactoeWebApp/. See that folder's README for usage, features, and architecture.

Backend integration: the SPA now calls a configurable backend to persist and load moves.
- Configure environment in tictactoeWebApp/.env (see .env.example)
- Endpoints used:
  - GET {REACT_APP_BACKEND_URL}/games/{game_id}/moves
  - POST {REACT_APP_BACKEND_URL}/games/{game_id}/moves
  - DELETE {REACT_APP_BACKEND_URL}/games/{game_id}/moves (optional reset)