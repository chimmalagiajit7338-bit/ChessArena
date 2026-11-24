
import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import "./App.css";

const INITIAL_TIME = 10 * 60;

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

const pieceSymbols = {
  p: "♟",
  n: "♞",
  b: "♝",
  r: "♜",
  q: "♛",
};

function App() {
  const [game, setGame] = useState(() => new Chess());
  const [whiteTime, setWhiteTime] = useState(INITIAL_TIME);
  const [blackTime, setBlackTime] = useState(INITIAL_TIME);

  // Get current moves directly from the chess game
  const moves = game.history({ verbose: true });

  // Check whether the game has finished
  const gameFinished =
    game.isGameOver() || whiteTime <= 0 || blackTime <= 0;

  // Chess clock
  useEffect(() => {
    if (gameFinished) {
      return;
    }

    const timer = setInterval(() => {
      if (game.turn() === "w") {
        setWhiteTime((time) => Math.max(0, time - 1));
      } else {
        setBlackTime((time) => Math.max(0, time - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game, gameFinished]);

  // Move a chess piece
  function onPieceDrop({ sourceSquare, targetSquare }) {
    // Prevent moves after game over or timeout
    if (gameFinished) {
      return false;
    }

    // Create a fresh game copy
    const gameCopy = new Chess();

    // Restore previous moves
    game.history().forEach((move) => {
      gameCopy.move(move);
    });

    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (!move) return false;

      setGame(gameCopy);
      return true;
    } catch {
      return false;
    }
  }

  // Start a completely new game
  function resetGame() {
    const freshGame = new Chess();

    // Reset chessboard
    setGame(freshGame);

    // Reset both clocks
    setWhiteTime(INITIAL_TIME);
    setBlackTime(INITIAL_TIME);
  }

  // Undo last move
  function undoMove() {
    if (gameFinished) return;

    const history = game.history();

    if (history.length === 0) return;

    const gameCopy = new Chess();

    // Replay all moves except the last one
    history.slice(0, -1).forEach((move) => {
      gameCopy.move(move);
    });

    setGame(gameCopy);
  }

  // Captured pieces
  const capturedByWhite = moves
    .filter((move) => move.color === "w" && move.captured)
    .map((move) => pieceSymbols[move.captured]);

  const capturedByBlack = moves
    .filter((move) => move.color === "b" && move.captured)
    .map((move) => pieceSymbols[move.captured]);

  // Game status
  const status =
    whiteTime === 0
      ? "Time out! Black wins"
      : blackTime === 0
      ? "Time out! White wins"
      : game.isCheckmate()
      ? `Checkmate! ${game.turn() === "w" ? "Black" : "White"} wins`
      : game.isStalemate()
      ? "Draw by stalemate"
      : game.isDraw()
      ? "Game drawn"
      : game.isCheck()
      ? "Check!"
      : game.turn() === "w"
      ? "White to move"
      : "Black to move";

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">♟</span>
          <h1>ChessArena</h1>
        </div>
        <p>Think. Move. Conquer.</p>
      </header>

      <main className="dashboard">
        <section className="game-section">

          {/* Black Player */}
          <div className="player-card">
            <div className="player-avatar">♚</div>
            <div className="player-details">
              <h3>Black Player</h3>
              <span>Opponent</span>
            </div>
            <div
              className={`clock ${
                game.turn() === "b" && !gameFinished ? "active" : ""
              }`}
            >
              {formatTime(blackTime)}
            </div>
          </div>

          {/* Chessboard */}
          <div className="chessboard-container">
            <Chessboard
              options={{
                position: game.fen(),
                onPieceDrop,
                boardOrientation: "white",
              }}
            />
          </div>

          {/* White Player */}
          <div className="player-card">
            <div className="player-avatar white-avatar">♔</div>
            <div className="player-details">
              <h3>White Player</h3>
              <span>You</span>
            </div>
            <div
              className={`clock ${
                game.turn() === "w" && !gameFinished ? "active" : ""
              }`}
            >
              {formatTime(whiteTime)}
            </div>
          </div>

          {/* Game Status */}
          <div className="game-status">
            <span className="status-dot"></span>
            {status}
          </div>

          {/* Game Actions */}
          <div className="game-actions">
            <button
              onClick={resetGame}
              className="new-game-btn"
            >
              + New Game
            </button>

            <button
              onClick={undoMove}
              className="undo-btn"
              disabled={moves.length === 0 || gameFinished}
            >
              ↶ Undo Move
            </button>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="sidebar">

          {/* Game Overview */}
          <div className="sidebar-card">
            <h2>Game Overview</h2>
            <p className="section-subtitle">
              Your match information
            </p>

            <div className="overview-item">
              <span>Game mode</span>
              <strong>Local 2 Player</strong>
            </div>

            <div className="overview-item">
              <span>Moves played</span>
              <strong>{moves.length}</strong>
            </div>

            <div className="overview-item">
              <span>Current turn</span>
              <strong>
                {game.turn() === "w" ? "White" : "Black"}
              </strong>
            </div>
          </div>

          {/* Captured Pieces */}
          <div className="sidebar-card">
            <h2>Captured Pieces</h2>

            <div className="captured-row">
              <span>White captured</span>
              <strong>
                {capturedByWhite.join(" ") || "—"}
              </strong>
            </div>

            <div className="captured-row">
              <span>Black captured</span>
              <strong>
                {capturedByBlack.join(" ") || "—"}
              </strong>
            </div>
          </div>

          {/* Move History */}
          <div className="sidebar-card history-card">
            <h2>Move History</h2>
            <p className="section-subtitle">
              Your match moves
            </p>

            <div className="history-header">
              <span>#</span>
              <span>White</span>
              <span>Black</span>
            </div>

            <div className="history-list">
              {Array.from(
                { length: Math.ceil(moves.length / 2) },
                (_, index) => (
                  <div className="history-row" key={index}>
                    <span>{index + 1}</span>
                    <span>{moves[index * 2]?.san}</span>
                    <span>
                      {moves[index * 2 + 1]?.san || "..."}
                    </span>
                  </div>
                )
              )}

              {moves.length === 0 && (
                <p className="empty-history">
                  No moves played yet.
                </p>
              )}
            </div>
          </div>
        </aside>
      </main>

      <footer>
        ChessArena © 2026 | Every move matters.
      </footer>
    </div>
  );
}

export default App;
