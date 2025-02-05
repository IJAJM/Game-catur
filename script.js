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
                postMoveActions();
                setTimeout(botMove, 500);
            }
            clearSelection();
        }
    }

    function getValidMoves(row, col, piece) {
        const moves = [];
        const directions = {
            '♙': [[-1, 0], [-2, 0], [-1, -1], [-1, 1]],
            '♟': [[1, 0], [2, 0], [1, -1], [1, 1]],
            '♘': [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]],
            '♗': [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],
                  [-1,-1],[-2,-2],[-3,-3],[-4,-4],[-5,-5],[-6,-6],[-7,-7],
                  [1,-1],[2,-2],[3,-3],[4,-4],[5,-5],[6,-6],[7,-7],
                  [-1,1],[-2,2],[-3,3],[-4,4],[-5,5],[-6,6],[-7,7]],
            '♖': [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
                  [0,-1],[0,-2],[0,-3],[0,-4],[0,-5],[0,-6],[0,-7],
                  [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],
                  [-1,0],[-2,0],[-3,0],[-4,0],[-5,0],[-6,0],[-7,0]],
            '♕': [...directions['♗'], ...directions['♖']],
            '♔': [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]]
        };

        for (let [dr, dc] of directions[piece]) {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = board[newRow][newCol];
                
                if (targetPiece === "") {
                    if (piece === '♙' && dr === -2 && row !== 6) continue;
                    if (piece === '♟' && dr === 2 && row !== 1) continue;
                    moves.push({row: newRow, col: newCol});
                } else if (isEnemyPiece(piece, targetPiece)) {
                    if (piece === '♙' && Math.abs(dc) === 1) moves.push({row: newRow, col: newCol});
                    else if (piece !== '♙' && piece !== '♟') moves.push({row: newRow, col: newCol});
                }
            }
        }
        return moves;
    }

    function makeMove(fromRow, fromCol, toRow, toCol) {
        const piece = board[fromRow][fromCol];
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = "";
        
        // Animasi
        const targetSquare = document.querySelector(`[data-row="${toRow}"][data-col="${toCol}"]`);
        targetSquare.classList.add('animated-move');
        setTimeout(() => targetSquare.classList.remove('animated-move'), 300);
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
        let bestMove = null;
        let bestScore = -Infinity;
        const moves = getAllValidMoves('bot');

        for (let move of moves) {
            makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
            const score = minimax(2, false, -Infinity, Infinity);
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
        board.forEach((row, r) => {
            row.forEach((piece, c) => {
                score += pieceValues[piece] || 0;
            });
        });
        return score;
    }

    function undoMove() {
        if (moveHistory.length > 0) {
            const lastMove = moveHistory.pop();
            board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
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

    function isPlayerPiece(piece) { return Object.keys(pieceValues).includes(piece) && pieceValues[piece] > 0; }
    function isBotPiece(piece) { return Object.keys(pieceValues).includes(piece) && pieceValues[piece] < 0; }
    function isEnemyPiece(piece, target) { return isPlayerPiece(piece) ? isBotPiece(target) : isPlayerPiece(target); }

    drawBoard();
    updateTurn();
    undoBtn.addEventListener("click", undoMove);
});
