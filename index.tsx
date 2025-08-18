// Game constants
const COLS = 10;
const ROWS = 20;
const LINE_CLEAR_ANIMATION_DURATION = 300; // ms
const PIECE_LOCK_FLASH_DURATION = 100; // ms

// --- DOM ELEMENT GETTERS ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
const nextCtx = nextCanvas.getContext('2d')!;
const holdCanvas = document.getElementById('hold-canvas') as HTMLCanvasElement;
const holdCtx = holdCanvas.getContext('2d')!;
const scoreEl = document.getElementById('score')!;
const linesEl = document.getElementById('lines')!;
const levelEl = document.getElementById('level')!;
const highScoreEl = document.getElementById('high-score')!;
const pauseButton = document.getElementById('pause-button')!;
const quitButton = document.getElementById('quit-button')!;
const helpButton = document.getElementById('help-button')!;
const gameContainer = document.getElementById('game-container')!;
const modeDisplay = document.getElementById('mode-display')!;
const modeLabel = document.getElementById('mode-label')!;
const modeValue = document.getElementById('mode-value')!;

// Main Menu Elements
const mainMenu = document.getElementById('main-menu')!;
const menuMarathonButton = document.getElementById('menu-marathon-button')!;
const menuSprintButton = document.getElementById('menu-sprint-button')!;
const menuUltraButton = document.getElementById('menu-ultra-button')!;
const menuHighScoresButton = document.getElementById('menu-high-scores-button')!;
const menuSettingsButton = document.getElementById('menu-settings-button')!;

// Modal Elements
const helpModal = document.getElementById('help-modal')!;
const highScoresModal = document.getElementById('high-scores-modal')!;
const settingsModal = document.getElementById('settings-modal')!;
const highScoresTable = document.getElementById('high-scores-table')!;
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
const ghostToggle = document.getElementById('ghost-toggle') as HTMLInputElement;

// --- TETROMINOES & PALETTES ---
const SHAPES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                         // J
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                         // L
    [[4, 4], [4, 4]],                                         // O
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                         // S
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                         // T
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]],                         // Z
];
const T_PIECE_INDEX = 5;

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
const GHOST_PALETTE = { base: 'rgba(85, 85, 85, 0.5)', light: 'rgba(136, 136, 136, 0.5)', dark: 'rgba(51, 51, 51, 0.5)' };
const GRAY_PALETTE = { base: '#424242', light: '#6d6d6d', dark: '#1b1b1b' };

// --- TYPE DEFINITIONS ---
type Piece = { x: number; y: number; shape: number[][]; shapeIndex: number; };
type Settings = { volume: number; showGhost: boolean; };
type HighScore = { score: number; date: string; };
type GameMode = 'marathon' | 'sprint' | 'ultra';

// --- GAME STATE VARIABLES ---
let grid: number[][];
let currentPiece: Piece;
let nextPiece: { shape: number[][]; shapeIndex: number; };
let heldPiece: { shape: number[][]; shapeIndex: number; } | null;
let canHold: boolean;
let pieceBag: number[];
let score: number;
let lines: number;
let level: number;
let highScores: HighScore[];
let gameOver: boolean = true;
let isPaused: boolean;
let dropCounter: number;
let dropInterval: number;
let lastTime: number;
let animationFrameId: number;
let linesToClear: number[] = [];
let lineClearAnimationTimer: number;
let pieceLockFlashTimer: number;
let lastSolidifiedPiece: { shape: number[][], x: number, y: number } | null = null;
let lastMoveWasRotation: boolean;
let blockSize: number;
let sideBlockSize: number;
let settings: Settings;
let gameMode: GameMode;
let sprintLinesToGo: number;
let ultraTimer: number; // in milliseconds

// --- SOUND FRAMEWORK (DEFINITIVE FIX) ---
const soundManager = {
    sounds: {} as { [key: string]: HTMLAudioElement },
    volume: 0.5,
    loadSounds: function() {
        const soundFiles = ['move', 'rotate', 'softDrop', 'hardDrop', 'lock', 'hold', 'clearLine', 'clearTetris', 'levelUp', 'pause', 'gameOver'];
        
        // This is the key fix for the crash and for GitHub pages deployment
        const baseUrl = (typeof import.meta.env !== 'undefined' && import.meta.env.BASE_URL) 
                      ? import.meta.env.BASE_URL 
                      : '/';

        soundFiles.forEach(name => {
            const audio = new Audio();
            
            const wavSource = document.createElement('source');
            wavSource.src = `${baseUrl}sounds/${name}.wav`;
            wavSource.type = 'audio/wav';

            const mp3Source = document.createElement('source');
            mp3Source.src = `${baseUrl}sounds/${name}.mp3`;
            mp3Source.type = 'audio/mpeg';

            audio.appendChild(wavSource);
            audio.appendChild(mp3Source);

            this.sounds[name] = audio;
        });
    },
    play: function(soundName: string) {
        if (this.sounds[soundName]) {
            const soundToPlay = this.sounds[soundName].cloneNode(true) as HTMLAudioElement;
            soundToPlay.volume = this.volume;
            soundToPlay.play().catch(e => console.error(`Error playing sound ${soundName}:`, e.message));
        }
    }
};


// --- INITIALIZATION ---
function init() {
    soundManager.loadSounds();
    loadSettings();
    loadHighScores();
    setupEventListeners();
    handleResize();
    showMainMenu();
}

function setupEventListeners() {
    // Menu Buttons
    menuMarathonButton.addEventListener('click', () => startGame('marathon'));
    menuSprintButton.addEventListener('click', () => startGame('sprint'));
    menuUltraButton.addEventListener('click', () => startGame('ultra'));
    menuHighScoresButton.addEventListener('click', showHighScores);
    menuSettingsButton.addEventListener('click', showSettings);

    // In-Game Buttons
    pauseButton.addEventListener('click', togglePause);
    quitButton.addEventListener('click', quitGame);
    helpButton.addEventListener('click', showHelp);

    // Modals
    document.querySelectorAll('.close-button').forEach(btn => {
        btn.addEventListener('click', closeModalAndResume);
    });

    // Settings
    volumeSlider.addEventListener('input', (e) => {
        settings.volume = parseFloat((e.target as HTMLInputElement).value);
        soundManager.volume = settings.volume;
        saveSettings();
    });
    ghostToggle.addEventListener('change', (e) => {
        settings.showGhost = (e.target as HTMLInputElement).checked;
        saveSettings();
        if (!gameOver) draw(); // Redraw to show/hide ghost immediately
    });

    // Global listeners
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', handleResize);
}

// --- UI & SCREEN MANAGEMENT ---
function showMainMenu() {
    mainMenu.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    modeDisplay.classList.add('hidden');
}

function showGame() {
    mainMenu.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    handleResize();
}

function showHelp() {
    if (animationFrameId && !isPaused && !gameOver) {
        togglePause();
    }
    helpModal.classList.remove('hidden');
}

function showHighScores() {
    const tableBody = highScoresTable.querySelector('tbody');
    if (tableBody) tableBody.remove();
    const newBody = document.createElement('tbody');
    if (highScores.length === 0) {
        newBody.innerHTML = `<tr><td colspan="2">No scores yet!</td></tr>`;
    } else {
        highScores.forEach((entry, index) => {
            const row = `<tr><td>${index + 1}.</td><td>${entry.score}</td></tr>`;
            newBody.innerHTML += row;
        });
    }
    highScoresTable.appendChild(newBody);
    highScoresModal.classList.remove('hidden');
}

function showSettings() {
    if (animationFrameId && !isPaused && !gameOver) {
        togglePause();
    }
    settingsModal.classList.remove('hidden');
}

function closeModalAndResume() {
    const aModalWasOpen = !!document.querySelector('.modal:not(.hidden)');
    if (!aModalWasOpen) return;

    const wasPausedForModal = isPaused;
    
    document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));

    if (wasPausedForModal && animationFrameId && !gameOver) {
        isPaused = false; // Manually unpause
        pauseButton.textContent = 'Pause';
        lastTime = performance.now();
        animate(lastTime);
    }
}


function handleResize() {
    const vh = window.innerHeight;
    const gameAreaRect = gameContainer.getBoundingClientRect();
    let availableWidth = gameAreaRect.width;
    if (window.innerWidth > 768) {
         availableWidth -= (220 + 32);
    }
    const blockFromHeight = Math.floor((vh * 0.9) / ROWS);
    const blockFromWidth = Math.floor((availableWidth * 0.95) / COLS);
    blockSize = Math.max(1, Math.min(blockFromHeight, blockFromWidth));
    canvas.width = COLS * blockSize;
    canvas.height = ROWS * blockSize;
    const sidePanel = document.getElementById('side-panel')!;
    if (window.innerWidth > 768) {
        sidePanel.style.height = `${canvas.height}px`;
    } else {
        sidePanel.style.height = 'auto';
    }
    ctx.scale(blockSize, blockSize);
    sideBlockSize = Math.floor(blockSize * 0.7);
    nextCanvas.width = 4 * sideBlockSize;
    nextCanvas.height = 4 * sideBlockSize;
    nextCtx.scale(sideBlockSize, sideBlockSize);
    holdCanvas.width = 4 * sideBlockSize;
    holdCanvas.height = 4 * sideBlockSize;
    holdCtx.scale(sideBlockSize, sideBlockSize);
    if (nextPiece) drawNextPiece();
    if (heldPiece) drawHeldPiece();
    if (grid) { // Only draw if grid exists
        draw();
        if (gameOver) drawGameOver();
    }
}

// --- GAME FLOW ---
function startGame(mode: GameMode) {
    gameMode = mode;
    showGame();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    grid = createEmptyGrid();
    score = 0; lines = 0; level = 0;
    gameOver = false; isPaused = false;
    dropCounter = 0; dropInterval = 1000;
    lastTime = 0; animationFrameId = 0;
    linesToClear = []; lineClearAnimationTimer = 0; pieceLockFlashTimer = 0;
    heldPiece = null; canHold = true;
    pieceBag = [];

    // Mode-specific setup
    modeDisplay.classList.remove('hidden');
    switch(gameMode) {
        case 'sprint':
            sprintLinesToGo = 40;
            modeLabel.textContent = "LINES";
            levelEl.parentElement!.classList.add('hidden');
            break;
        case 'ultra':
            ultraTimer = 3 * 60 * 1000; // 3 minutes
            modeLabel.textContent = "TIME";
            levelEl.parentElement!.classList.add('hidden');
            linesEl.parentElement!.classList.add('hidden');
            break;
        case 'marathon':
        default:
            modeDisplay.classList.add('hidden');
            levelEl.parentElement!.classList.remove('hidden');
            linesEl.parentElement!.classList.remove('hidden');
            break;
    }

    fillBag();
    updateAccentColor(level);
    closeModalAndResume();
    updateUI();
    updateHighScoreUI();
    resetNextPiece();
    resetPiece();
    drawHeldPiece();
    pauseButton.textContent = 'Pause';
    quitButton.classList.remove('hidden');
    animate(0);
}

function quitGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }
    gameOver = true;
    showMainMenu();
}

function animate(time = 0) {
    if (gameOver) return; // Stop the loop if the game has ended elsewhere
    
    animationFrameId = requestAnimationFrame(animate);
    
    if (isPaused) {
        drawPaused();
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;

    // Handle game mode timers
    if (gameMode === 'ultra') {
        ultraTimer -= deltaTime;
        if (ultraTimer <= 0) {
            ultraTimer = 0;
            endGame();
        }
    } else if (gameMode === 'sprint' && sprintLinesToGo <= 0) {
        endGame(); // You win!
    }

    // Handle animations first, they pause the game logic
    if (pieceLockFlashTimer > 0) pieceLockFlashTimer -= deltaTime;
    
    if (linesToClear.length > 0) {
        lineClearAnimationTimer -= deltaTime;
        if (lineClearAnimationTimer <= 0) {
            let linesCleared = linesToClear.length;
            linesToClear.sort((a,b) => a - b).forEach(y => {
                grid.splice(y, 1);
                grid.unshift(Array(COLS).fill(0));
            });
            linesToClear = [];
            updateScoreAndLevel(linesCleared);
            resetPiece();
        }
    } else {
        // Normal game logic only runs if not clearing lines
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            pieceDrop();
        }
    }
    
    updateUI();
    draw();
}

function endGame() {
    gameOver = true;
    soundManager.play('gameOver');
    checkAndUpdateHighScore();
    draw(); // Draw final state
    drawGameOver();
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    quitButton.classList.add('hidden');
}


// --- CORE GAME LOGIC ---
function createEmptyGrid(): number[][] {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function fillBag() {
    const pieces = [0, 1, 2, 3, 4, 5, 6];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    pieceBag.push(...pieces);
}

function getNextPieceFromBag() {
    if (pieceBag.length === 0) fillBag();
    const shapeIndex = pieceBag.shift()!;
    return { shape: SHAPES[shapeIndex], shapeIndex };
}

function resetPiece() {
    currentPiece = { ...nextPiece, x: Math.floor(COLS / 2) - 1, y: 0 };
    resetNextPiece();
    lastMoveWasRotation = false;
    canHold = true;
    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y)) {
        endGame();
    }
}

function resetNextPiece() {
    nextPiece = getNextPieceFromBag();
    drawNextPiece();
}

function holdPiece() {
    if (!canHold) return;
    soundManager.play('hold');
    
    const tempX = currentPiece.x, tempY = currentPiece.y;
    const pieceToHold = { shape: currentPiece.shape, shapeIndex: currentPiece.shapeIndex };
    let newCurrentPiece;

    if (heldPiece) {
        newCurrentPiece = { ...heldPiece, x: tempX, y: tempY };
    } else {
        newCurrentPiece = { ...getNextPieceFromBag(), x: Math.floor(COLS / 2) - 1, y: 0 };
    }

    if (isValidMove(newCurrentPiece.shape, newCurrentPiece.x, newCurrentPiece.y)) {
        currentPiece = newCurrentPiece;
        heldPiece = pieceToHold;
        canHold = false;
        drawHeldPiece();
    }
}

function pieceDrop() {
    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        solidifyPiece();
    } else {
        currentPiece.y++;
        lastMoveWasRotation = false;
    }
    dropCounter = 0;
}

function pieceMove(dir: number) {
    if (isValidMove(currentPiece.shape, currentPiece.x + dir, currentPiece.y)) {
        currentPiece.x += dir;
        lastMoveWasRotation = false;
        soundManager.play('move');
    }
}

function pieceRotate() {
    const rotated = rotateMatrix(currentPiece.shape);
    const kicks = [[0,0], [1,0], [-1,0], [2,0], [-2,0], [0,1], [0,-1]]; // Simple wall kicks
    for(const [offsetX, offsetY] of kicks) {
        if (isValidMove(rotated, currentPiece.x + offsetX, currentPiece.y + offsetY)) {
            currentPiece.x += offsetX;
            currentPiece.y += offsetY;
            currentPiece.shape = rotated;
            lastMoveWasRotation = true;
            soundManager.play('rotate');
            return;
        }
    }
}

function rotateMatrix(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex])).map(row => row.reverse());
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
    const isTSpin = checkTSpin();
    lastSolidifiedPiece = { shape: currentPiece.shape, x: currentPiece.x, y: currentPiece.y };
    pieceLockFlashTimer = PIECE_LOCK_FLASH_DURATION;

    currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0 && currentPiece.y + y >= 0) {
                grid[currentPiece.y + y][currentPiece.x + x] = value;
            }
        });
    });
    
    clearLines(isTSpin);
    
    if (linesToClear.length === 0) {
        if (isTSpin) {
            score += 400 * (level + 1);
            updateUI();
        }
        resetPiece();
    }
    soundManager.play('lock');
}

// --- DRAWING FUNCTIONS ---
function draw() {
    if (!ctx || !grid) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(ctx, grid, 0, 0);

    // Piece Lock Flash Animation
    if (pieceLockFlashTimer > 0 && lastSolidifiedPiece) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (pieceLockFlashTimer / PIECE_LOCK_FLASH_DURATION)})`;
        lastSolidifiedPiece.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    ctx.fillRect(lastSolidifiedPiece!.x + x, lastSolidifiedPiece!.y + y, 1, 1);
                }
            });
        });
    }

    if (!gameOver && currentPiece) {
        if (settings.showGhost) {
            let ghostY = currentPiece.y;
            while (isValidMove(currentPiece.shape, currentPiece.x, ghostY + 1)) ghostY++;
            drawGhostMatrix(ctx, currentPiece.shape, currentPiece.x, ghostY);
        }
        drawMatrix(ctx, currentPiece.shape, currentPiece.x, currentPiece.y);
    }
    
    // Line Clear Flash Animation
    if (linesToClear.length > 0) {
        const flashOpacity = Math.abs(Math.sin((lineClearAnimationTimer / LINE_CLEAR_ANIMATION_DURATION) * Math.PI * 2));
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity * 0.9})`;
        linesToClear.forEach(y => {
            ctx.fillRect(0, y, COLS, 1);
        });
    }
}

function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextPiece) return;
    const { shape } = nextPiece;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    drawMatrix(nextCtx, shape, offsetX, offsetY);
}

function drawHeldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (!heldPiece) return;
    const { shape } = heldPiece;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;
    drawMatrix(holdCtx, shape, offsetX, offsetY);
}

function drawMatrix(context: CanvasRenderingContext2D, matrix: number[][], offsetX: number, offsetY: number, forceColor?: { base: string, light: string, dark: string }) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                // If a line is being cleared, don't draw the pieces on that line
                if (linesToClear.includes(Math.floor(y + offsetY))) return;
                
                const color = forceColor || PALETTE[value];
                const blockX = x + offsetX, blockY = y + offsetY, borderWidth = 0.1;
                context.fillStyle = color.dark;
                context.fillRect(blockX, blockY, 1, 1);
                context.fillStyle = color.light;
                context.fillRect(blockX, blockY, 1 - borderWidth, 1 - borderWidth);
                context.fillStyle = color.base;
                context.fillRect(blockX + borderWidth, blockY + borderWidth, 1 - (borderWidth * 2), 1 - (borderWidth * 2));
            }
        });
    });
}

function drawGhostMatrix(context: CanvasRenderingContext2D, matrix: number[][], offsetX: number, offsetY: number) {
    const color = GHOST_PALETTE;
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value > 0) {
                const blockX = x + offsetX, blockY = y + offsetY, borderWidth = 0.1;
                context.fillStyle = color.dark;
                context.fillRect(blockX, blockY, 1, 1);
                context.fillStyle = color.light;
                context.fillRect(blockX, blockY, 1 - borderWidth, 1 - borderWidth);
                context.fillStyle = color.base;
                context.fillRect(blockX + borderWidth, blockY + borderWidth, 1 - (borderWidth * 2), 1 - (borderWidth * 2));
            }
        });
    });
}

function drawGameOver() {
    drawMatrix(ctx, grid, 0, 0, GRAY_PALETTE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, COLS, ROWS);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    let message = "GAME OVER";
    if (gameMode === 'sprint' && sprintLinesToGo <= 0) message = "YOU WIN!";
    
    ctx.font = '1.1px "Press Start 2P"';
    ctx.fillText(message, COLS / 2, ROWS / 2 - 1.5);
    
    ctx.font = '0.7px "Press Start 2P"';
    ctx.fillText('Press any key', COLS / 2, ROWS / 2 + 1);
    ctx.fillText('to continue', COLS / 2, ROWS / 2 + 2);
}

function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, COLS, ROWS);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.font = '1.5px "Press Start 2P"';
    ctx.fillText('PAUSED', COLS / 2, ROWS / 2);
}


// --- SCORING & LEVELING ---
function checkTSpin(): boolean {
    if (currentPiece.shapeIndex !== T_PIECE_INDEX || !lastMoveWasRotation) return false;
    const cx = currentPiece.x + 1, cy = currentPiece.y + 1;
    const corners = [[cy - 1, cx - 1], [cy - 1, cx + 1], [cy + 1, cx - 1], [cy + 1, cx + 1]];
    let occupiedCorners = 0;
    corners.forEach(([y, x]) => {
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || grid[y][x] !== 0) {
            occupiedCorners++;
        }
    });
    return occupiedCorners >= 3;
}

function clearLines(isTSpin: boolean) {
    let clearedCount = 0;
    grid.forEach((row, y) => {
        if (row.every(value => value > 0)) {
            clearedCount++;
            linesToClear.push(y);
        }
    });

    if (clearedCount > 0) {
        lineClearAnimationTimer = LINE_CLEAR_ANIMATION_DURATION;
        const T_SPIN_POINTS = [400, 800, 1200, 1600]; // T-Spin Mini, Single, Double, Triple
        const NORMAL_POINTS = [0, 100, 300, 500, 800]; // Single, Double, Triple, Tetris
        score += (isTSpin ? T_SPIN_POINTS[clearedCount] : NORMAL_POINTS[clearedCount]) * (level + 1);
        soundManager.play(clearedCount >= 4 ? 'clearTetris' : 'clearLine');
    }
}

function updateScoreAndLevel(linesCleared: number) {
     const previousLevel = level;
     lines += linesCleared;
     if (gameMode === 'sprint') sprintLinesToGo -= linesCleared;
     if (gameMode === 'marathon') {
         level = Math.floor(lines / 10);
         if (level > previousLevel) {
             updateAccentColor(level);
             soundManager.play('levelUp');
         }
         dropInterval = Math.max(200, 1000 - level * 75);
     }
     updateUI();
}

function updateAccentColor(newLevel: number) {
    const color = ACCENT_COLORS[newLevel % ACCENT_COLORS.length];
    document.documentElement.style.setProperty('--accent-color', color);
}

function updateUI() {
    scoreEl.textContent = score.toString();
    linesEl.textContent = lines.toString();
    levelEl.textContent = level.toString();
    // Mode specific UI
    if (gameMode === 'sprint') {
        modeValue.textContent = Math.max(0, sprintLinesToGo).toString();
    } else if (gameMode === 'ultra') {
        const minutes = Math.floor(ultraTimer / 60000);
        const seconds = Math.floor((ultraTimer % 60000) / 1000);
        modeValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// --- DATA PERSISTENCE ---
function loadSettings() {
    const saved = localStorage.getItem('tetrisSettings');
    settings = saved ? JSON.parse(saved) : { volume: 0.5, showGhost: true };
    // Ensure new settings have defaults
    if (settings.showGhost === undefined) settings.showGhost = true;

    soundManager.volume = settings.volume;
    volumeSlider.value = settings.volume.toString();
    ghostToggle.checked = settings.showGhost;
}

function saveSettings() {
    localStorage.setItem('tetrisSettings', JSON.stringify(settings));
}

function loadHighScores() {
    const saved = localStorage.getItem('tetrisHighScores');
    highScores = saved ? JSON.parse(saved) : [];
    updateHighScoreUI();
}

function saveHighScores() {
    localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
}

function checkAndUpdateHighScore() {
    if (gameMode === 'sprint' && sprintLinesToGo > 0) return; // Don't save incomplete sprints
    const newEntry: HighScore = { score, date: new Date().toISOString() };
    highScores.push(newEntry);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    saveHighScores();
    updateHighScoreUI();
}

function updateHighScoreUI() {
    highScoreEl.textContent = highScores.length > 0 ? highScores[0].score.toString() : '0';
}

// --- CONTROLS ---
function togglePause() {
    if (gameOver || linesToClear.length > 0) return;
    if (document.querySelector('.modal:not(.hidden)')) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        soundManager.play('pause');
        cancelAnimationFrame(animationFrameId);
        drawPaused();
    } else {
        lastTime = performance.now();
        animate(lastTime);
    }
    
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
}

function handleKeyPress(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    
    // This listener handles returning to menu after game over
    if (gameOver && animationFrameId === 0) {
        showMainMenu();
        return;
    }

    const isModalOpen = !!document.querySelector('.modal:not(.hidden)');
    if (isModalOpen) {
        if (key === 'escape') {
            event.preventDefault();
            closeModalAndResume();
        }
        return;
    }

    if (key === 'h') { event.preventDefault(); showHelp(); return; }
    
    if (!gameOver && (key === 'p' || key === 'escape')) {
        event.preventDefault();
        togglePause();
        return;
    }

    if (gameOver || isPaused || linesToClear.length > 0 || !animationFrameId) return;

    switch (key) {
        case 'arrowleft': event.preventDefault(); pieceMove(-1); break;
        case 'arrowright': event.preventDefault(); pieceMove(1); break;
        case 'arrowdown': event.preventDefault(); pieceDrop(); soundManager.play('softDrop'); break;
        case 'arrowup': event.preventDefault(); pieceRotate(); break;
        case ' ': 
            event.preventDefault();
            while (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
                currentPiece.y++;
            }
            solidifyPiece();
            soundManager.play('hardDrop');
            break;
        case 'c': event.preventDefault(); holdPiece(); break;
        case 'q': event.preventDefault(); quitGame(); break;
    }
    draw();
}

init();