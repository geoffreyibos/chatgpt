class SportsCrushGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 8;
        this.cellSize = 80;
        this.grid = [];
        this.score = 0;
        this.moves = 30;
        this.selectedPiece = null;
        this.animating = false;
        
        // Sports equipment types (using emojis for simplicity)
        this.pieceTypes = ['⚽', '🏀', '🎾', '🏈', '⚾', '🏐'];
        
        this.initializeGame();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initializeGame() {
        this.grid = [];
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = this.getRandomPieceType();
            }
        }
        
        // Ensure no initial matches
        this.removeInitialMatches();
        this.updateDisplay();
    }
    
    getRandomPieceType() {
        return this.pieceTypes[Math.floor(Math.random() * this.pieceTypes.length)];
    }
    
    removeInitialMatches() {
        let hasMatches = true;
        while (hasMatches) {
            hasMatches = false;
            for (let row = 0; row < this.gridSize; row++) {
                for (let col = 0; col < this.gridSize; col++) {
                    if (this.checkMatchAt(row, col)) {
                        this.grid[row][col] = this.getRandomPieceType();
                        hasMatches = true;
                    }
                }
            }
        }
    }
    
    checkMatchAt(row, col) {
        const piece = this.grid[row][col];
        
        // Check horizontal match
        let horizontalCount = 1;
        // Check left
        for (let c = col - 1; c >= 0 && this.grid[row][c] === piece; c--) {
            horizontalCount++;
        }
        // Check right
        for (let c = col + 1; c < this.gridSize && this.grid[row][c] === piece; c++) {
            horizontalCount++;
        }
        
        // Check vertical match
        let verticalCount = 1;
        // Check up
        for (let r = row - 1; r >= 0 && this.grid[r][col] === piece; r--) {
            verticalCount++;
        }
        // Check down
        for (let r = row + 1; r < this.gridSize && this.grid[r][col] === piece; r++) {
            verticalCount++;
        }
        
        return horizontalCount >= 3 || verticalCount >= 3;
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        document.getElementById('new-game-btn').addEventListener('click', () => this.newGame());
    }
    
    handleClick(e) {
        if (this.animating || this.moves <= 0) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        if (row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize) {
            if (this.selectedPiece === null) {
                this.selectedPiece = { row, col };
            } else {
                if (this.areAdjacent(this.selectedPiece, { row, col })) {
                    this.attemptSwap(this.selectedPiece, { row, col });
                }
                this.selectedPiece = null;
            }
        }
    }
    
    areAdjacent(pos1, pos2) {
        const rowDiff = Math.abs(pos1.row - pos2.row);
        const colDiff = Math.abs(pos1.col - pos2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    attemptSwap(pos1, pos2) {
        // Try the swap
        this.swapPieces(pos1, pos2);
        
        // Check if this creates any matches
        if (this.checkMatchAt(pos1.row, pos1.col) || this.checkMatchAt(pos2.row, pos2.col)) {
            this.moves--;
            this.processMatches();
        } else {
            // Swap back if no matches
            this.swapPieces(pos1, pos2);
        }
    }
    
    swapPieces(pos1, pos2) {
        const temp = this.grid[pos1.row][pos1.col];
        this.grid[pos1.row][pos1.col] = this.grid[pos2.row][pos2.col];
        this.grid[pos2.row][pos2.col] = temp;
    }
    
    processMatches() {
        this.animating = true;
        let matchesFound = this.findAndRemoveMatches();
        
        if (matchesFound.length > 0) {
            this.score += this.calculateScore(matchesFound);
            
            setTimeout(() => {
                this.dropPieces();
                this.fillEmptySpaces();
                
                // Check for more matches (cascade effect)
                setTimeout(() => {
                    if (this.hasMatches()) {
                        this.processMatches();
                    } else {
                        this.animating = false;
                        this.checkGameOver();
                    }
                }, 300);
            }, 300);
        } else {
            this.animating = false;
        }
    }
    
    findAndRemoveMatches() {
        const matches = [];
        const toRemove = new Set();
        
        // Find horizontal matches
        for (let row = 0; row < this.gridSize; row++) {
            let count = 1;
            let currentPiece = this.grid[row][0];
            
            for (let col = 1; col < this.gridSize; col++) {
                if (this.grid[row][col] === currentPiece) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let c = col - count; c < col; c++) {
                            toRemove.add(`${row},${c}`);
                        }
                        matches.push({ type: 'horizontal', count, piece: currentPiece });
                    }
                    count = 1;
                    currentPiece = this.grid[row][col];
                }
            }
            
            // Check the last sequence
            if (count >= 3) {
                for (let c = this.gridSize - count; c < this.gridSize; c++) {
                    toRemove.add(`${row},${c}`);
                }
                matches.push({ type: 'horizontal', count, piece: currentPiece });
            }
        }
        
        // Find vertical matches
        for (let col = 0; col < this.gridSize; col++) {
            let count = 1;
            let currentPiece = this.grid[0][col];
            
            for (let row = 1; row < this.gridSize; row++) {
                if (this.grid[row][col] === currentPiece) {
                    count++;
                } else {
                    if (count >= 3) {
                        for (let r = row - count; r < row; r++) {
                            toRemove.add(`${r},${col}`);
                        }
                        matches.push({ type: 'vertical', count, piece: currentPiece });
                    }
                    count = 1;
                    currentPiece = this.grid[row][col];
                }
            }
            
            // Check the last sequence
            if (count >= 3) {
                for (let r = this.gridSize - count; r < this.gridSize; r++) {
                    toRemove.add(`${r},${col}`);
                }
                matches.push({ type: 'vertical', count, piece: currentPiece });
            }
        }
        
        // Remove matched pieces
        toRemove.forEach(pos => {
            const [row, col] = pos.split(',').map(Number);
            this.grid[row][col] = null;
        });
        
        return matches;
    }
    
    calculateScore(matches) {
        let points = 0;
        matches.forEach(match => {
            points += match.count * 10 + (match.count - 3) * 5; // Bonus for longer matches
        });
        return points;
    }
    
    dropPieces() {
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            
            // Collect non-null pieces from bottom to top
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.grid[row][col] !== null) {
                    column.push(this.grid[row][col]);
                }
            }
            
            // Clear the column
            for (let row = 0; row < this.gridSize; row++) {
                this.grid[row][col] = null;
            }
            
            // Place pieces at the bottom
            for (let i = 0; i < column.length; i++) {
                this.grid[this.gridSize - 1 - i][col] = column[i];
            }
        }
    }
    
    fillEmptySpaces() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === null) {
                    this.grid[row][col] = this.getRandomPieceType();
                }
            }
        }
    }
    
    hasMatches() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.checkMatchAt(row, col)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkGameOver() {
        if (this.moves <= 0) {
            alert(`Jeu terminé ! Score final: ${this.score}`);
            return;
        }
        
        // Check if any moves are possible
        if (!this.hasValidMoves()) {
            alert(`Plus de mouvements possibles ! Score final: ${this.score}`);
        }
    }
    
    hasValidMoves() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Try swapping with right neighbor
                if (col < this.gridSize - 1) {
                    this.swapPieces({row, col}, {row, col: col + 1});
                    if (this.checkMatchAt(row, col) || this.checkMatchAt(row, col + 1)) {
                        this.swapPieces({row, col}, {row, col: col + 1}); // swap back
                        return true;
                    }
                    this.swapPieces({row, col}, {row, col: col + 1}); // swap back
                }
                
                // Try swapping with bottom neighbor
                if (row < this.gridSize - 1) {
                    this.swapPieces({row, col}, {row: row + 1, col});
                    if (this.checkMatchAt(row, col) || this.checkMatchAt(row + 1, col)) {
                        this.swapPieces({row, col}, {row: row + 1, col}); // swap back
                        return true;
                    }
                    this.swapPieces({row, col}, {row: row + 1, col}); // swap back
                }
            }
        }
        return false;
    }
    
    newGame() {
        this.score = 0;
        this.moves = 30;
        this.selectedPiece = null;
        this.animating = false;
        this.initializeGame();
    }
    
    updateDisplay() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('moves-value').textContent = this.moves;
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = col * this.cellSize;
                const y = row * this.cellSize;
                
                // Draw cell background
                this.ctx.fillStyle = (row + col) % 2 === 0 ? '#f8f9fa' : '#e9ecef';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                
                // Draw border
                this.ctx.strokeStyle = '#dee2e6';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
                
                // Highlight selected piece
                if (this.selectedPiece && 
                    this.selectedPiece.row === row && 
                    this.selectedPiece.col === col) {
                    this.ctx.fillStyle = 'rgba(255, 193, 7, 0.5)';
                    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                }
                
                // Draw sports equipment
                if (this.grid[row][col]) {
                    this.ctx.font = '48px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(
                        this.grid[row][col],
                        x + this.cellSize / 2,
                        y + this.cellSize / 2
                    );
                }
            }
        }
    }
    
    gameLoop() {
        this.draw();
        this.updateDisplay();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SportsCrushGame();
});