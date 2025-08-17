// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const NEXT_CANVAS_BLOCK_SIZE = 20;

// Game elements from the DOM
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
const nextCtx = nextCanvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const linesEl = document.getElementById('lines')!;
const levelEl = document.getElementById('level')!;
const startButton = document.getElementById('start-button')!;

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

const COLORS = [
    'transparent',
    '#00bcd4', // I (cyan)
    '#2196f3', // J (blue)
    '#ff9800', // L (orange)
    '#ffeb3b', // O (yellow)
    '#4caf50', // S (green)
    '#9c27b0', // T (purple)
    '#f44336', // Z (red)
];

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
let gameOver: boolean;
let dropCounter: number;
let dropInterval: number;
let lastTime: number;
let animationFrameId: number;

function init() {
    // Initialize canvas sizes
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    nextCanvas.width = 4 * NEXT_CANVAS_BLOCK_SIZE;
    nextCanvas.height = 4 * NEXT_CANVAS_BLOCK_SIZE;

    // Scale contexts for crisp rendering
    ctx.scale(BLOCK_SIZE, BLOCK_SIZE);
    nextCtx.scale(NEXT_CANVAS_BLOCK_SIZE, NEXT_CANVAS_BLOCK_SIZE);

    startButton.addEventListener('click', startGame);
    document.addEventListener('keydown', handleKeyPress);
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
    dropCounter = 0;
    dropInterval = 1000; // 1 second
    lastTime = 0;
    
    updateUI();
    
    resetNextPiece();
    resetPiece();
    
    animate(0);
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
    if (gameOver) {
        drawGameOver();
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        pieceDrop();
    }
    
    draw();
    animationFrameId = requestAnimationFrame(animate);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(ctx, grid, 0, 0);
    drawMatrix(ctx, currentPiece.shape, currentPiece.x, currentPiece.y);
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const { shape } = nextPiece;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    drawMatrix(nextCtx, shape, offsetX, offsetY);
}

function drawMatrix(context: CanvasRenderingContext2D, matrix: number[][], offsetX: number, offsetY: number) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(x + offsetX, y + offsetY, 1, 1);
            }
        });
    });
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, COLS, ROWS);

    ctx.fillStyle = 'white';
    ctx.font = '2px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', COLS / 2, ROWS / 2 - 1);
    ctx.font = '0.8px "Press Start 2P"';
    ctx.fillText('Press Start to Play Again', COLS/2, ROWS/2 + 1);

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
    
    // Basic wall kick
    let offsetX = 1;
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
    // Transpose and reverse rows to rotate
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
        lines += linesCleared;
        const linePoints = [0, 100, 300, 500, 800];
        score += linePoints[linesCleared] * (level + 1);
        
        level = Math.floor(lines / 10);
        dropInterval = Math.max(200, 1000 - level * 75);
        
        updateUI();
    }
}

function updateUI() {
    scoreEl.textContent = score.toString();
    linesEl.textContent = lines.toString();
    levelEl.textContent = level.toString();
}

function handleKeyPress(event: KeyboardEvent) {
    if (gameOver) return;

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
        case ' ':
            event.preventDefault();
            while (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
                currentPiece.y++;
            }
            solidifyPiece();
            break;
    }
    draw();
}

// Initialize and start the application
init();
