document.addEventListener("DOMContentLoaded", () => {
    const chessboard = document.getElementById("chessboard");
    const turnIndicator = document.getElementById("turn-indicator");
    const undoBtn = document.getElementById("undo-btn");

    let selectedPiece = null;
    let playerTurn = true;
    let moveHistory = [];
    let validMoves = [];

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
                    from: { ...selectedPiece },
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
        board[toRow][toCol] = board[fromRow][fromCol];
        board[fromRow][fromCol] = "";
        drawBoard();
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

        let bestMove = moves[Math.floor(Math.random() * moves.length)];
        makeMove(bestMove.from.row, bestMove.from.col, bestMove.to.row, bestMove.to.col);
        moveHistory.push(bestMove);
        postMoveActions();
    }

    function getAllValidMoves(side) {
        const moves = [];
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if ((side === 'bot' && isBotPiece(piece)) || (side === 'player' && isPlayerPiece(piece))) {
                    getValidMoves(row, col, piece).forEach(move => {
                        moves.push({
                            from: { row, col },
                            to: move
                        });
                    });
                }
            }
        }
        return moves;
    }

    function getValidMoves(row, col, piece) {
        let moves = [];
        let directions = [];

        if (piece === "♙") {
            if (board[row - 1][col] === "") moves.push({ row: row - 1, col });
            if (row === 6 && board[row - 2][col] === "") moves.push({ row: row - 2, col });
            if (board[row - 1]?.[col - 1] && isBotPiece(board[row - 1][col - 1])) moves.push({ row: row - 1, col: col - 1 });
            if (board[row - 1]?.[col + 1] && isBotPiece(board[row - 1][col + 1])) moves.push({ row: row - 1, col: col + 1 });
        } else if (piece === "♟") {
            if (board[row + 1][col] === "") moves.push({ row: row + 1, col });
            if (row === 1 && board[row + 2][col] === "") moves.push({ row: row + 2, col });
            if (board[row + 1]?.[col - 1] && isPlayerPiece(board[row + 1][col - 1])) moves.push({ row: row + 1, col: col - 1 });
            if (board[row + 1]?.[col + 1] && isPlayerPiece(board[row + 1][col + 1])) moves.push({ row: row + 1, col: col + 1 });
        }

        return moves;
    }

    function undoMove() {
        if (moveHistory.length > 0) {
            const lastMove = moveHistory.pop();
            board[lastMove.from.row][lastMove.from.col] = board[lastMove.to.row][lastMove.to.col];
            board[lastMove.to.row][lastMove.to.col] = lastMove.captured || "";
            drawBoard();
        }
    }

    function highlightMoves(moves) {
        clearHighlights();
        moves.forEach(move => {
            let square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (square) square.classList.add('highlight');
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
    }

    function isValidMove(row, col) {
        return validMoves.some(m => m.row === row && m.col === col);
    }

    function clearSelection() {
        selectedPiece = null;
        validMoves = [];
        clearHighlights();
    }

    function isPlayerPiece(piece) { return ["♙", "♘", "♗", "♖", "♕", "♔"].includes(piece); }
    function isBotPiece(piece) { return ["♟", "♞", "♝", "♜", "♛", "♚"].includes(piece); }

    drawBoard();
    updateTurn();
    undoBtn.addEventListener("click", undoMove);
});
