document.addEventListener("DOMContentLoaded", () => {
    const chessboard = document.getElementById("chessboard");
    const turnIndicator = document.getElementById("turn-indicator");
    const playerTimerEl = document.getElementById("player-timer");
    const botTimerEl = document.getElementById("bot-timer");
    const undoBtn = document.getElementById("undo-btn");

    let selectedPiece = null;
    let playerTime = 30, botTime = 30;
    let playerTurn = true;
    let timer;
    let moveHistory = [];

    const board = [
        ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
        ["♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟"],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", ""],
        ["♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙"],
        ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"]
    ];

    function drawBoard() {
        chessboard.innerHTML = "";
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement("div");
                square.classList.add("square", (row + col) % 2 === 0 ? "white" : "black");
                square.textContent = board[row][col];
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener("click", () => handleMove(row, col));
                chessboard.appendChild(square);
            }
        }
    }

    function handleMove(row, col) {
        if (!playerTurn) return;

        if (!selectedPiece && board[row][col] !== "") {
            selectedPiece = { row, col };
            highlightMoves(row, col);
        } else if (selectedPiece) {
            moveHistory.push({
                from: selectedPiece,
                to: { row, col },
                piece: board[row][col]
            });

            makeMove(selectedPiece.row, selectedPiece.col, row, col);
            selectedPiece = null;
            clearHighlights();
            playerTurn = false;
            updateTurn();
            setTimeout(botMove, 500);
        }
    }

    function makeMove(fromRow, fromCol, toRow, toCol) {
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = "";
        drawBoard();
    }

    function highlightMoves(row, col) {
        clearHighlights();
        let squares = document.querySelectorAll(".square");
        squares.forEach(square => {
            let r = parseInt(square.dataset.row);
            let c = parseInt(square.dataset.col);
            if ((r === row + 1 && c === col) || (r === row - 1 && c === col)) {
                square.classList.add("highlight");
            }
        });
    }

    function clearHighlights() {
        document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));
    }

    function botMove() {
        let bestMove = null;
        let bestScore = -Infinity;

        let moves = generateValidMoves("bot");
        for (let move of moves) {
            makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
            let score = minimax(3, false);
            undoMove();
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        if (bestMove) {
            makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        }

        playerTurn = true;
        updateTurn();
        drawBoard();
    }

    function generateValidMoves(side) {
        let moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((side === "player" && board[row][col] === "♙") ||
                    (side === "bot" && board[row][col] === "♟")) {
                    if (board[row + (side === "bot" ? 1 : -1)][col] === "") {
                        moves.push({ from: { row, col }, to: { row: row + (side === "bot" ? 1 : -1), col } });
                    }
                }
            }
        }
        return moves;
    }

    function minimax(depth, isMaximizing) {
        if (depth === 0) return evaluateBoard();

        let bestScore = isMaximizing ? -Infinity : Infinity;
        let moves = generateValidMoves(isMaximizing ? "bot" : "player");

        for (let move of moves) {
            makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
            let score = minimax(depth - 1, !isMaximizing);
            undoMove();
            bestScore = isMaximizing
                ? Math.max(bestScore, score)
                : Math.min(bestScore, score);
        }

        return bestScore;
    }

    function evaluateBoard() {
        let score = 0;
        board.forEach(row => row.forEach(cell => {
            if (cell === "♙") score += 10;
            if (cell === "♟") score -= 10;
            if (cell === "♔") score += 1000;
            if (cell === "♚") score -= 1000;
        }));
        return score;
    }

    function updateTurn() {
        turnIndicator.textContent = playerTurn ? "Giliran: Pemain" : "Giliran: Bot";
        startTimer(playerTurn ? "player" : "bot");
    }

    function startTimer(player) {
        clearInterval(timer);
        timer = setInterval(() => {
            if (player === "player") {
                playerTime--;
                playerTimerEl.textContent = `Pemain: ${playerTime}s`;
                if (playerTime === 0) {
                    alert("Waktu habis! Bot menang!");
                    resetGame();
                }
            } else {
                botTime--;
                botTimerEl.textContent = `Bot: ${botTime}s`;
                if (botTime === 0) {
                    alert("Bot kehabisan waktu! Pemain menang!");
                    resetGame();
                }
            }
        }, 1000);
    }

    function undoMove() {
        if (moveHistory.length > 0) {
            let lastMove = moveHistory.pop();
            board[lastMove.from.row][lastMove.from.col] = board[lastMove.to.row][lastMove.to.col];
            board[lastMove.to.row][lastMove.to.col] = lastMove.piece;
            drawBoard();
        }
    }

    function resetGame() {
        clearInterval(timer);
        playerTime = botTime = 30;
        playerTurn = true;
        drawBoard();
        updateTurn();
    }

    drawBoard();
    updateTurn();
    undoBtn.addEventListener("click", undoMove);
});
