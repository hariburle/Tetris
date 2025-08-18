// Game constants
const COLS = 10;
const ROWS = 20;

// Game elements from the DOM
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
const nextCtx = nextCanvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const linesEl = document.getElementById('lines')!;
const levelEl = document.getElementById('level')!;
const highScoreEl = document.getElementById('high-score')!;
const startButton = document.getElementById('start-button')!;
const quitButton = document.getElementById('quit-button')!;
const helpButton = document.getElementById('help-button')!;
const helpModal = document.getElementById('help-modal')!;
const closeHelpButton = document.querySelector('.close-button')!;


// Tetrominoes (shapes and colors)
const SHAPES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                         // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                         // L
    [[4, 4], [4, 4]],                                         // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                         // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                         // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]],                         // Z
];

const PALETTE = [
    { base: 'transparent', light: 'transparent', dark: 'transparent' },
    { base: '#00bcd4', light: '#6ff9ff', dark: '#008ba3' }, // I (cyan)
    { base: '#2196f3', light: '#6ec6ff', dark: '#0069c0' }, // J (blue)
    { base: '#ff9800', light: '#ffc947', dark: '#c66900' }, // L (orange)
    { base: '#ffeb3b', light: '#ffff72', dark: '#c8b900' }, // O (yellow)
    { base: '#4caf50', light: '#80e27e', dark: '#087f23' }, // S (green)
    { base: '#9c27b0', light: '#d05ce3', dark: '#6a0080' }, // T (purple)
    { base: '#f44336', light: '#ff7961', dark: '#ba000d' }, // Z (red)
];

const ACCENT_COLORS = ['#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0', '#2196f3'];


const GHOST_PALETTE = {
    base: '#555',
    light: '#888',
    dark: '#333'
};

const GRAY_PALETTE = {
    base: '#424242',
    light: '#6d6d6d',
    dark: '#1b1b1b'
};


// Define types for our game pieces
type Piece = {
    x: number;
    y: number;
    shape: number[][];
};

// Game state variables
let grid: number[][];
let currentPiece: Piece;
let nextPiece: { shape: number[][]; };
let score: number;
let lines: number;
let level: number;
let highScore: number;
let gameOver: boolean;
let isPaused: boolean;
let dropCounter: number;
let dropInterval: number;
let lastTime: number;
let animationFrameId: number;
let blockSize: number;
let nextBlockSize: number;

function init() {
    loadHighScore();

    // Event Listeners
    startButton.addEventListener('click', () => {
        if (gameOver) {
            startGame();
            return;
        }
        
        // If the game has started, this button is a pause/resume button
        if (animationFrameId && !gameOver) {
            togglePause();
        } else {
            startGame();
        }
    });
    quitButton.addEventListener('click', quitGame);
    document.addEventListener('keydown', handleKeyPress);
    helpButton.addEventListener('click', showHelp);
    closeHelpButton.addEventListener('click', hideHelp);
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    resetNextPiece(); // Show the first piece on load
}

function handleResize() {
    const vh = window.innerHeight;
    const vw = document.body.clientWidth; // Use clientWidth to avoid scrollbar issues

    // Determine max possible size of game area
    const gameArea = document.getElementById('game-container')!;
    const sidePanel = document.getElementById('side-panel')!;

    let availableWidth = gameArea.clientWidth;
    // On desktop, subtract side panel width
    if (window.innerWidth > 768) {
         availableWidth -= (sidePanel.clientWidth + 32); // 32 is for the gap
    }
    
    const blockFromHeight = Math.floor((vh * 0.9) / ROWS);
    // On mobile, the canvas can take almost full width
    const blockFromWidth = Math.floor((availableWidth * 0.95) / COLS); 

    // Use the smaller of the two to ensure the board fits in both dimensions
    blockSize = Math.min(blockFromHeight, blockFromWidth);

    // Set main canvas size
    canvas.width = COLS * blockSize;
    canvas.height = ROWS * blockSize;
    
    // Set side-panel height to match canvas on desktop for vertical alignment
    if (window.innerWidth > 768) {
        sidePanel.style.height = `${canvas.height}px`;
    } else {
        // On mobile, reset to auto height
        sidePanel.style.height = 'auto';
    }

    // IMPORTANT: Resizing canvas resets context, so we must rescale every time
    ctx.scale(blockSize, blockSize);

    // Set next piece canvas size to be proportional
    nextBlockSize = Math.floor(blockSize * 0.7);
    nextCanvas.width = 4 * nextBlockSize;
    nextCanvas.height = 4 * nextBlockSize;
    nextCtx.scale(nextBlockSize, nextBlockSize);
    
    // After resizing, we need to redraw the current state if the game is not actively running
    // The animation loop will handle redraws for an active game.
    if (nextPiece) {
        drawNextPiece();
    }
    
    if (gameOver) {
        draw();
        drawGameOver();
    } else if (isPaused) {
        draw();
        drawPaused();
    } else if (!animationFrameId && grid) {
        // Game has not started a new one yet.
        draw();
    }
}

function startGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    grid = createEmptyGrid();
    score = 0;
    lines = 0;
    level = 0;
    gameOver = false;
    isPaused = false;
    dropCounter = 0;
    dropInterval = 1000; // 1 second
    lastTime = 0;
    animationFrameId = 0;
    
    updateAccentColor(level); // Reset accent color
    hideHelp(); // Ensure help is hidden on new game
    updateUI();
    updateHighScoreUI();
    
    resetNextPiece();
    resetPiece();
    
    startButton.textContent = 'Pause';
    quitButton.classList.remove('hidden');
    animate(0);
}

function quitGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }
    
    // Reset game state to pre-game state
    grid = createEmptyGrid();
    score = 0;
    lines = 0;
    level = 0;
    gameOver = false;
    isPaused = false;
    dropInterval = 1000;
    updateAccentColor(0);
    
    // Reset UI
    updateUI();
    resetNextPiece();
    draw(); // Redraw empty board
    
    startButton.textContent = 'Start Game';
    quitButton.classList.add('hidden');
}


function createEmptyGrid(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function resetPiece() {
    currentPiece = { ...nextPiece, x: Math.floor(COLS / 2) - 1, y: 0 };
    resetNextPiece();
    
    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        gameOver = true;
    }
}

function resetNextPiece() {
    nextPiece = getRandomPiece();
    drawNextPiece();
}

function getRandomPiece() {
    const randIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[randIndex];
    return { shape };
}

function animate(time = 0) {
    animationFrameId = requestAnimationFrame(animate);
    
    if (isPaused) {
        drawPaused();
        return;
    }

    if (gameOver) {
        checkAndUpdateHighScore();
        drawGameOver();
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0; // Reset animationFrameId
        startButton.textContent = 'Start Game';
        quitButton.classList.add('hidden');
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        pieceDrop();
    }
    
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(ctx, grid, 0, 0);

    // Draw Ghost Piece
    let ghostY = currentPiece.y;
    while (isValidMove(currentPiece.shape, currentPiece.x, ghostY + 1)) {
        ghostY++;
    }
    drawGhostMatrix(ctx, currentPiece.shape, currentPiece.x, ghostY);
    
    drawMatrix(ctx, currentPiece.shape, currentPiece.x, currentPiece.y);
}


function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const { shape } = nextPiece;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    drawMatrix(nextCtx, shape, offsetX, offsetY);
}

function drawMatrix(context: CanvasRenderingContext2D, matrix: number[][], offsetX: number, offsetY: number, forceColor?: { base: string, light: string, dark: string }) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const color = forceColor ? forceColor : PALETTE[value];
                const blockX = x + offsetX;
                const blockY = y + offsetY;
                const borderWidth = 0.1;

                // Darker bottom/right side for shadow
                context.fillStyle = color.dark;
                context.fillRect(blockX, blockY, 1, 1);

                // Lighter top/left side for highlight
                context.fillStyle = color.light;
                context.fillRect(blockX, blockY, 1 - borderWidth, 1 - borderWidth);

                // Main color in the middle
                context.fillStyle = color.base;
                context.fillRect(blockX + borderWidth, blockY + borderWidth, 1 - (borderWidth * 2), 1 - (borderWidth * 2));
            }
        });
    });
}

function drawGhostMatrix(context: CanvasRenderingContext2D, matrix: number[][], offsetX: number, offsetY: number) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const blockX = x + offsetX;
                const blockY = y + offsetY;
                const borderWidth = 0.1;

                // Darker bottom/right side for shadow
                context.fillStyle = GHOST_PALETTE.dark;
                context.fillRect(blockX, blockY, 1, 1);

                // Lighter top/left side for highlight
                context.fillStyle = GHOST_PALETTE.light;
                context.fillRect(blockX, blockY, 1 - borderWidth, 1 - borderWidth);

                // Main color in the middle
                context.fillStyle = GHOST_PALETTE.base;
                context.fillRect(blockX + borderWidth, blockY + borderWidth, 1 - (borderWidth * 2), 1 - (borderWidth * 2));
            }
        });
    });
}


function drawGameOver() {
    // Draw the final grid state in grayscale.
    drawMatrix(ctx, grid, 0, 0, GRAY_PALETTE);

    // Draw a semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, COLS, ROWS);

    // Draw the text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // Adjusted font size to prevent truncation
    ctx.font = '1.1px "Press Start 2P"';
    ctx.fillText('GAME OVER', COLS / 2, ROWS / 2 - 1.5);

    ctx.font = '0.7px "Press Start 2P"';
    ctx.fillText('Press Start', COLS / 2, ROWS / 2 + 0.5);
    ctx.fillText('to Play Again', COLS / 2, ROWS / 2 + 1.5);
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, COLS, ROWS);

    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '1.5px "Press Start 2P"';
    ctx.fillText('PAUSED', COLS / 2, ROWS / 2);
}

function pieceDrop() {
    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        solidifyPiece();
    } else {
        currentPiece.y++;
    }
    dropCounter = 0;
}

function pieceMove(dir: number) {
    if (isValidMove(currentPiece.shape, currentPiece.x + dir, currentPiece.y)) {
        currentPiece.x += dir;
    }
}

function pieceRotate() {
    const originalShape = currentPiece.shape;
    const rotated = rotateMatrix(originalShape);
    
    let offsetX = 1;
    // Basic wall kick logic
    if (isValidMove(rotated, currentPiece.x, currentPiece.y)) {
        currentPiece.shape = rotated;
    } else if (isValidMove(rotated, currentPiece.x + offsetX, currentPiece.y)) {
        currentPiece.x += offsetX;
        currentPiece.shape = rotated;
    } else if (isValidMove(rotated, currentPiece.x - offsetX, currentPiece.y)) {
        currentPiece.x -= offsetX;
        currentPiece.shape = rotated;
    }
}

function rotateMatrix(matrix: number[][]): number[][] {
    const result = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    return result.map(row => row.reverse());
}

function isValidMove(matrix: number[][], newX: number, newY: number): boolean {
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] !== 0) {
                const gridX = newX + x;
                const gridY = newY + y;

                if (gridX < 0 || gridX >= COLS || gridY >= ROWS || (gridY >= 0 && grid[gridY][gridX] !== 0)) {
                    return false;
                }
            }
        }
    }
    return true;
}

function solidifyPiece() {
    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                 if (currentPiece.y + y >= 0) {
                    grid[currentPiece.y + y][currentPiece.x + x] = value;
                }
            }
        });
    });
    
    clearLines();
    resetPiece();
}

function clearLines() {
    let linesCleared = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = grid.splice(y, 1)[0].fill(0);
        grid.unshift(row);
        y++;
        
        linesCleared++;
    }

    if (linesCleared > 0) {
        const previousLevel = level;
        lines += linesCleared;
        const linePoints = [0, 100, 300, 500, 800];
        score += linePoints[linesCleared] * (level + 1);
        
        level = Math.floor(lines / 10);
        
        if (level > previousLevel) {
            updateAccentColor(level);
        }
        
        dropInterval = Math.max(200, 1000 - level * 75);
        
        updateUI();
    }
}

function updateAccentColor(newLevel: number) {
    const color = ACCENT_COLORS[newLevel % ACCENT_COLORS.length];
    document.documentElement.style.setProperty('--accent-color', color);
}

function updateUI() {
    scoreEl.textContent = score.toString();
    linesEl.textContent = lines.toString();
    levelEl.textContent = level.toString();
}

function loadHighScore() {
    const savedHighScore = localStorage.getItem('tetrisHighScore');
    highScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;
    updateHighScoreUI();
}

function saveHighScore() {
    localStorage.setItem('tetrisHighScore', highScore.toString());
}

function checkAndUpdateHighScore() {
    if (score > highScore) {
        highScore = score;
        saveHighScore();
        updateHighScoreUI();
    }
}

function updateHighScoreUI() {
    highScoreEl.textContent = highScore.toString();
}

function togglePause() {
    if (gameOver) return;

    // Don't allow unpausing via keyboard if help modal is open
    if (isPaused && !helpModal.classList.contains('hidden')) {
        return;
    }
    isPaused = !isPaused;
    startButton.textContent = isPaused ? 'Resume' : 'Pause';
}

function showHelp() {
    if (animationFrameId && !isPaused && !gameOver) {
        isPaused = true;
        startButton.textContent = 'Resume';
    }
    helpModal.classList.remove('hidden');
}

function hideHelp() {
    // Only unpause if the game is active and wasn't paused before help was opened
    if (animationFrameId && !gameOver) {
       if (startButton.textContent === 'Resume') { // Indicates game was active
            isPaused = false;
            startButton.textContent = 'Pause';
        }
    }
    helpModal.classList.add('hidden');
}


function handleKeyPress(event: KeyboardEvent) {
    // These keys can be pressed at any time.
    if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        showHelp();
        return;
    }
    
    // Allow pausing/unpausing anytime, unless game is over
    if (!gameOver && (event.key === 'p' || event.key === 'P' || event.key === 'Escape')) {
        event.preventDefault();
        
        // If help modal is open, Escape should close it
        if (!helpModal.classList.contains('hidden') && event.key === 'Escape') {
            hideHelp();
        } else {
            togglePause();
        }
        return;
    }

    if (gameOver || isPaused) return;

    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            pieceMove(-1);
            break;
        case 'ArrowRight':
            event.preventDefault();
            pieceMove(1);
            break;
        case 'ArrowDown':
            event.preventDefault();
            pieceDrop();
            break;
        case 'ArrowUp':
            event.preventDefault();
            pieceRotate();
            break;
        case ' ': // Spacebar for hard drop
            event.preventDefault();
            while (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
                currentPiece.y++;
            }
            solidifyPiece();
            break;
        case 'q':
        case 'Q':
            event.preventDefault();
            quitGame();
            break;
    }
    draw();
}

// Initialize and start the application
init();