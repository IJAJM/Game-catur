document.addEventListener("DOMContentLoaded", () => {
    const chessboard = document.getElementById("chessboard");
    const turnIndicator = document.getElementById("turn-indicator");
    const undoBtn = document.getElementById("undo-btn");

    let selectedPiece = null;
    let playerTurn = true;
    let moveHistory = [];
    let validMoves = [];

    const pieceValues = {
        '♙': 10, '♟': -10,
        '♘': 30, '♞': -30,
        '♗': 30, '♝': -30,
        '♖': 50, '♜': -50,
        '♕': 90, '♛': -90,
        '♔': 1000, '♚': -1000
    };

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
                
                if (selectedPiece?.row === row && selectedPiece?.col === col) {
                    square.classList.add("selected");
                }
                
                square.addEventListener("click", () => handleMove(row, col));
                chessboard.appendChild(square);
            }
        }
    }

    function handleMove(row, col) {
        const piece = board[row][col];

        if (playerTurn && !selectedPiece) {
            if (piece && isPlayerPiece(piece)) {
                selectedPiece = { row, col };
                validMoves = getValidMoves(row, col, piece);
                highlightMoves(validMoves);
            }
        } else if (selectedPiece) {
            if (isValidMove(row, col)) {
                moveHistory.push({
                    from: selectedPiece,
                    to: { row, col },
                    captured: board[row][col]
                });

                makeMove(selectedPiece.row, selectedPiece.col, row, col);
                clearSelection();
                drawBoard();
                postMoveActions();
                setTimeout(botMove, 500);
            } else {
                clearSelection();
            }
        }
    }

    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = "";

        const targetSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        if (targetSquare) {
            targetSquare.classList.add('animated-move');
            setTimeout(() => {
                targetSquare.classList.remove('animated-move');
                drawBoard();
            }, 300);
        } else {
            drawBoard();
        }
    }

    function postMoveActions() {
        playerTurn = !playerTurn;
        updateTurn();
        drawBoard();
    }

    function updateTurn() {
        turnIndicator.textContent = playerTurn ? "Giliran: Pemain" : "Giliran: Bot";
    }

    function botMove() {
        let moves = getAllValidMoves('bot');

        if (moves.length === 0) {
            alert("Bot tidak bisa bergerak, pemain menang!");
            return;
        }

        let bestMove = null;
        let bestScore = -Infinity;

        for (let move of moves) {
            makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
            let score = minimax(2, false, -Infinity, Infinity);
            undoMove();

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        if (bestMove) {
            makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
            moveHistory.push(bestMove);
            postMoveActions();
        }
    }

    function getAllValidMoves(side) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if ((side === 'bot' && isBotPiece(piece)) || (side === 'player' && isPlayerPiece(piece))) {
                    getValidMoves(row, col, piece).forEach(move => {
                        moves.push({
                            from: {row, col},
                            to: move,
                            piece: piece
                        });
                    });
                }
            }
        }
        return moves;
    }

    function minimax(depth, isMaximizing, alpha, beta) {
        if (depth === 0) return evaluateBoard();
        
        const moves = getAllValidMoves(isMaximizing ? 'bot' : 'player');
        let bestScore = isMaximizing ? -Infinity : Infinity;

        for (let move of moves) {
            makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
            const score = minimax(depth - 1, !isMaximizing, alpha, beta);
            undoMove();

            if (isMaximizing) {
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, score);
            } else {
                bestScore = Math.min(bestScore, score);
                beta = Math.min(beta, score);
            }
            
            if (beta <= alpha) break;
        }
        return bestScore;
    }

    function evaluateBoard() {
        let score = 0;
        board.forEach(row => row.forEach(piece => {
            score += pieceValues[piece] || 0;
        }));
        return score;
    }

    function undoMove() {
        if (moveHistory.length > 0) {
            const lastMove = moveHistory.pop();
            board[lastMove.from.row][lastMove.from.col] = board[lastMove.to.row][lastMove.to.col];
            board[lastMove.to.row][lastMove.to.col] = lastMove.captured || "";
            drawBoard();
        }
    }

    function clearSelection() {
        selectedPiece = null;
        validMoves = [];
        clearHighlights();
    }

    function highlightMoves(moves) {
        moves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            square?.classList.add('highlight');
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    }

    function isValidMove(row, col) {
        return validMoves.some(m => m.row === row && m.col === col);
    }

    function isPlayerPiece(piece) { return pieceValues[piece] > 0; }
    function isBotPiece(piece) { return pieceValues[piece] < 0; }

    drawBoard();
    updateTurn();
    undoBtn.addEventListener("click", undoMove);
});
