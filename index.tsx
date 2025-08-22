

// Game constants
const COLS = 10;
const ROWS = 20;
const LINE_CLEAR_ANIMATION_DURATION = 300; // ms
const PIECE_LOCK_FLASH_DURATION = 100; // ms
const GARBAGE_BLOCK_VALUE = 8;


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
const mobileScoreEl = document.getElementById('mobile-score')!;
const mobileLevelEl = document.getElementById('mobile-level')!;
const pauseButton = document.getElementById('pause-button') as HTMLButtonElement;
const quitButton = document.getElementById('quit-button') as HTMLButtonElement;
const helpButton = document.getElementById('help-button') as HTMLButtonElement;
const gameContainer = document.getElementById('game-container')!;
const modeDisplay = document.getElementById('mode-display')!;
const modeLabel = document.getElementById('mode-label')!;
const modeValue = document.getElementById('mode-value')!;
const mobileModeDisplay = document.getElementById('mobile-mode-display')!;
const mobileModeLabel = document.getElementById('mobile-mode-label')!;
const mobileModeValue = document.getElementById('mobile-mode-value')!;
const gameModeDisplayDesktopContainer = document.getElementById('game-mode-display-desktop-container')!;
const gameModeDisplayDesktopEl = document.getElementById('game-mode-display-desktop')!;
const gameModeDisplayMobileContainer = document.getElementById('game-mode-display-mobile-container')!;
const gameModeDisplayMobileEl = document.getElementById('game-mode-display-mobile')!;
const mcPause = document.getElementById('mc-pause') as HTMLButtonElement;
const mcHelp = document.getElementById('mc-help') as HTMLButtonElement;
const mcQuit = document.getElementById('mc-quit') as HTMLButtonElement;

// Main Menu Elements
const mainMenu = document.getElementById('main-menu')!;
const menuButtons = document.querySelectorAll<HTMLButtonElement>('#menu-button-group button');
const menuMarathonButton = document.getElementById('menu-marathon-button')!;
const menuSprintButton = document.getElementById('menu-sprint-button')!;
const menuUltraButton = document.getElementById('menu-ultra-button')!;
const menuPuzzleButton = document.getElementById('menu-puzzle-button')!;
const menuSurvivalButton = document.getElementById('menu-survival-button')!;
const menuAvalancheButton = document.getElementById('menu-avalanche-button')!;
const menuHighScoresButton = document.getElementById('menu-high-scores-button')!;
const menuSettingsButton = document.getElementById('menu-settings-button')!;
const menuHelpButton = document.getElementById('menu-help-button')!;

// Modal Elements
const helpModal = document.getElementById('help-modal')!;
const highScoresModal = document.getElementById('high-scores-modal')!;
const settingsModal = document.getElementById('settings-modal')!;
const highScoresTable = document.getElementById('high-scores-table')!;
const highScoresTabs = document.getElementById('high-scores-tabs')!;
const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
const ghostStyleSelect = document.getElementById('ghost-style-select') as HTMLSelectElement;

// --- TETROMINOES & PALETTES ---
const SHAPES = [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I (0)
    [[2, 0, 0], [2, 2, 2], [0, 0, 0]],                         // J (1)
    [[0, 0, 3], [3, 3, 3], [0, 0, 0]],                         // L (2)
    [[4, 4], [4, 4]],                                         // O (3)
    [[0, 5, 5], [5, 5, 0], [0, 0, 0]],                         // S (4)
    [[0, 6, 0], [6, 6, 6], [0, 0, 0]],                         // T (5)
    [[7, 7, 0], [0, 7, 7], [0, 0, 0]],                         // Z (6)
];
const T_PIECE_INDEX = 5;
const O_PIECE_INDEX = 3;

const PALETTE = [
    { base: 'transparent', light: 'transparent', dark: 'transparent' },
    { base: '#00bcd4', light: '#6ff9ff', dark: '#008ba3' }, // 1: I (cyan)
    { base: '#2196f3', light: '#6ec6ff', dark: '#0069c0' }, // 2: J (blue)
    { base: '#ff9800', light: '#ffc947', dark: '#c66900' }, // 3: L (orange)
    { base: '#ffeb3b', light: '#ffff72', dark: '#c8b900' }, // 4: O (yellow)
    { base: '#4caf50', light: '#80e27e', dark: '#087f23' }, // 5: S (green)
    { base: '#9c27b0', light: '#d05ce3', dark: '#6a0080' }, // 6: T (purple)
    { base: '#f44336', light: '#ff7961', dark: '#ba000d' }, // 7: Z (red)
    { base: '#757575', light: '#a4a4a4', dark: '#494949' }, // 8: Garbage
];

const ACCENT_COLORS = ['#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0', '#2196f3'];
const GHOST_PALETTE = { base: 'rgba(85, 85, 85, 0.5)', light: 'rgba(136, 136, 136, 0.5)', dark: 'rgba(51, 51, 51, 0.5)' };
const GRAY_PALETTE = { base: '#424242', light: '#6d6d6d', dark: '#1b1b1b' };

// --- TYPE DEFINITIONS ---
type Piece = { x: number; y: number; shape: number[][]; shapeIndex: number; };
type GhostStyle = 'off' | 'solid' | 'outline';
type Settings = { volume: number; ghostStyle: GhostStyle; };
type HighScore = { score: number; date: string; };
type GameMode = 'marathon' | 'sprint' | 'ultra' | 'puzzle' | 'survival' | 'avalanche';
const GAME_MODE_NAMES: { [key in GameMode]: string } = {
    marathon: 'Classic',
    sprint: 'Sprint (40L)',
    ultra: 'Ultra (3 Min)',
    puzzle: 'Puzzle',
    survival: 'Survival',
    avalanche: 'Avalanche'
};


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
let highScores: { [key: string]: HighScore[] };
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
let selectedMenuIndex: number = 0;
let selectedPauseButtonIndex: number = 0;
// Mode-specific state
let sprintLinesToGo: number;
let sprintTimer: number;
let ultraTimer: number; // in milliseconds
let turnsLeft: number;
let garbageTimer: number;
let garbageInterval: number;
let garbageAmount: number;
let isCascading: boolean;
let comboCount: number;

// --- SOUND FRAMEWORK (DEFINITIVE FIX) ---
const soundManager = {
    sounds: {} as { [key: string]: HTMLAudioElement },
    volume: 0.5,
    loadSounds: function() {
        console.log("Attempting to load sound files...");
        // Only attempt to load sound files that are known to exist.
        const soundFiles = ['clearLine', 'clearTetris', 'gameOver', 'hardDrop', 'levelUp', 'lock', 'combo', 'move', 'rotate', 'softDrop', 'hold', 'pause'];
        
        // This is the key fix for the crash and for GitHub pages deployment
        const baseUrl = (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.BASE_URL) 
                      ? (import.meta as any).env.BASE_URL 
                      : '/';

        soundFiles.forEach(name => {
            console.log(`- Loading sound: ${name}`);
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
        console.log("Sound loading finished.");
    },
    play: function(soundName: string) {
        // If the sound wasn't loaded (because the file doesn't exist), this check prevents errors.
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
    menuPuzzleButton.addEventListener('click', () => startGame('puzzle'));
    menuSurvivalButton.addEventListener('click', () => startGame('survival'));
    menuAvalancheButton.addEventListener('click', () => startGame('avalanche'));
    menuHighScoresButton.addEventListener('click', showHighScores);
    menuSettingsButton.addEventListener('click', showSettings);
    menuHelpButton.addEventListener('click', showHelp);

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
    ghostStyleSelect.addEventListener('change', (e) => {
        settings.ghostStyle = (e.target as HTMLSelectElement).value as GhostStyle;
        saveSettings();
        if (!gameOver) draw(); // Redraw to show/hide ghost immediately
    });

    // Global listeners
    document.addEventListener('keydown', handleKeyPress);
    window.addEventListener('resize', handleResize);
    setupMobileControls();
}

// --- UI & SCREEN MANAGEMENT ---
function showMainMenu() {
    canvas.removeEventListener('click', showMainMenu);
    document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
    mainMenu.classList.remove('hidden');
    gameContainer.classList.add('hidden');
    modeDisplay.classList.add('hidden');
    gameModeDisplayDesktopContainer.classList.add('hidden');
    gameModeDisplayMobileContainer.classList.add('hidden');
    selectedMenuIndex = 0;
    updateMenuSelection();
}

function updateMenuSelection() {
    menuButtons.forEach((button, index) => {
        if (index === selectedMenuIndex) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
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
    const gameModesWithScores: GameMode[] = Object.keys(highScores) as GameMode[];
    const allGameModes: { id: GameMode, name: string }[] = [
        { id: 'marathon', name: 'Classic' },
        { id: 'sprint', name: 'Sprint' },
        { id: 'ultra', name: 'Ultra' },
        { id: 'puzzle', name: 'Puzzle' },
        { id: 'survival', name: 'Survival' },
        { id: 'avalanche', name: 'Avalanche' },
    ];

    highScoresTabs.innerHTML = '';
    let activeTabFound = false;

    allGameModes.forEach(modeInfo => {
        if (gameModesWithScores.includes(modeInfo.id)) {
            const tabButton = document.createElement('button');
            tabButton.className = 'hs-tab-btn';
            tabButton.textContent = modeInfo.name;
            tabButton.dataset.mode = modeInfo.id;
            tabButton.addEventListener('click', () => renderHighScoreTable(modeInfo.id));
            highScoresTabs.appendChild(tabButton);
            if (!activeTabFound) {
                tabButton.classList.add('active');
                renderHighScoreTable(modeInfo.id);
                activeTabFound = true;
            }
        }
    });

    if (!activeTabFound) {
        highScoresTable.innerHTML = `<tbody><tr><td colspan="2">No scores yet!</td></tr></tbody>`;
    }

    highScoresModal.classList.remove('hidden');
}

function renderHighScoreTable(mode: GameMode) {
    document.querySelectorAll('.hs-tab-btn').forEach(btn => {
        btn.classList.toggle('active', (btn as HTMLElement).dataset.mode === mode);
    });

    const scores = highScores[mode] || [];
    const tableBody = highScoresTable.querySelector('tbody');
    if (tableBody) tableBody.remove();
    const newBody = document.createElement('tbody');
    
    if (scores.length === 0) {
        newBody.innerHTML = `<tr><td colspan="2">No scores for this mode!</td></tr>`;
    } else {
        scores.forEach((entry, index) => {
            const scoreDisplay = mode === 'sprint' ? formatTime(entry.score) : entry.score.toString();
            const row = `<tr><td>${index + 1}.</td><td>${scoreDisplay}</td></tr>`;
            newBody.innerHTML += row;
        });
    }
    highScoresTable.appendChild(newBody);
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
        togglePause(); // Use togglePause to correctly update button text
    }
}


function handleResize() {
    const vh = window.innerHeight;
    const gameAreaRect = gameContainer.getBoundingClientRect();
    let availableWidth = gameAreaRect.width;

    if (window.innerWidth <= 768) { 
        // Mobile layout logic: calculate available height precisely
        const sidePanel = document.getElementById('side-panel')!;
        const mobileHeader = document.getElementById('mobile-header')!;
        const containerStyle = window.getComputedStyle(gameContainer);
        const paddingTop = parseFloat(containerStyle.paddingTop);
        const paddingBottom = parseFloat(containerStyle.paddingBottom);
        const containerGap = parseFloat(containerStyle.gap);

        // Calculate the total vertical space used by non-canvas elements
        const otherElementsHeight = (window.innerHeight > window.innerWidth) // is portrait?
            ? (mobileHeader.offsetHeight + sidePanel.offsetHeight + paddingTop + paddingBottom + containerGap)
            : (paddingTop + paddingBottom + containerGap);
        
        // The available height for the canvas is the viewport height minus everything else
        const availableCanvasHeight = vh - otherElementsHeight;
        
        const blockFromHeight = Math.floor(availableCanvasHeight / ROWS);
        const blockFromWidth = Math.floor((gameAreaRect.width * 0.95) / COLS);

        blockSize = Math.max(1, Math.min(blockFromHeight, blockFromWidth));

    } else {
        // Desktop layout logic
         availableWidth -= (220 + 32); // side panel width + gap
        const blockFromHeight = Math.floor((vh * 0.9) / ROWS);
        const blockFromWidth = Math.floor((availableWidth * 0.95) / COLS);
        blockSize = Math.max(1, Math.min(blockFromHeight, blockFromWidth));
    }

    canvas.width = COLS * blockSize;
    canvas.height = ROWS * blockSize;
    
    const sidePanel = document.getElementById('side-panel')!;
    if (window.innerWidth > 768 || window.innerHeight < window.innerWidth) { // desktop or landscape
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
    isCascading = false;
    comboCount = 0;
    selectedPauseButtonIndex = 0; // Reset pause menu selection

    // Display Game Mode
    const gameModeName = GAME_MODE_NAMES[gameMode];
    gameModeDisplayDesktopEl.textContent = gameModeName;
    gameModeDisplayMobileEl.textContent = gameModeName;
    gameModeDisplayDesktopContainer.classList.remove('hidden');
    gameModeDisplayMobileContainer.classList.remove('hidden');

    // Reset UI visibility
    scoreEl.parentElement!.classList.remove('hidden');
    mobileScoreEl.parentElement!.classList.remove('hidden');
    levelEl.parentElement!.classList.remove('hidden');
    mobileLevelEl.parentElement!.classList.remove('hidden');
    linesEl.parentElement!.classList.remove('hidden');


    // Mode-specific setup
    modeDisplay.classList.add('hidden'); // Hide the dynamic value display by default
    mobileModeDisplay.classList.add('hidden');
    (linesEl.previousElementSibling as HTMLElement).textContent = "LINES";


    switch(gameMode) {
        case 'sprint':
            sprintLinesToGo = 40;
            sprintTimer = 0;
            modeLabel.textContent = "TIME";
            mobileModeLabel.textContent = "TIME";
            modeDisplay.classList.remove('hidden');
            mobileModeDisplay.classList.remove('hidden');
            (linesEl.previousElementSibling as HTMLElement).textContent = "LINES LEFT";
            levelEl.parentElement!.classList.add('hidden');
            mobileLevelEl.parentElement!.classList.add('hidden');
            scoreEl.parentElement!.classList.add('hidden');
            mobileScoreEl.parentElement!.classList.add('hidden');
            break;
        case 'ultra':
            ultraTimer = 3 * 60 * 1000; // 3 minutes
            modeLabel.textContent = "TIME";
            mobileModeLabel.textContent = "TIME";
            modeDisplay.classList.remove('hidden');
            mobileModeDisplay.classList.remove('hidden');
            levelEl.parentElement!.classList.add('hidden');
            mobileLevelEl.parentElement!.classList.add('hidden');
            linesEl.parentElement!.classList.add('hidden');
            break;
        case 'puzzle':
            turnsLeft = 50;
            modeLabel.textContent = "TURNS";
            mobileModeLabel.textContent = "TURNS";
            modeDisplay.classList.remove('hidden');
            mobileModeDisplay.classList.remove('hidden');
            break;
        case 'survival':
            garbageInterval = 10000;
            garbageTimer = garbageInterval;
            garbageAmount = 1;
            break;
        case 'avalanche':
        case 'marathon':
        default:
            // No special setup needed for these modes
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
    mcPause.textContent = '❚❚';
    quitButton.classList.remove('hidden');
    mcQuit.classList.remove('hidden');
    animate(0);
}

function quitGame() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }
    gameOver = true;
    quitButton.classList.add('hidden');
    mcQuit.classList.add('hidden');
    showMainMenu();
}

function animate(time = 0) {
    if (gameOver) return; // Stop the loop if the game has ended elsewhere
    
    animationFrameId = requestAnimationFrame(animate);
    
    if (isPaused) {
        drawPaused();
        return;
    }
    
    const deltaTime = (lastTime === 0) ? 0 : time - lastTime;
    lastTime = time;

    // Handle game mode timers
    if (gameMode === 'sprint') {
        sprintTimer += deltaTime;
        if (sprintLinesToGo <= 0) {
            endGame();
        }
    } else if (gameMode === 'ultra') {
        ultraTimer -= deltaTime;
        if (ultraTimer <= 0) {
            ultraTimer = 0;
            endGame();
        }
    } else if (gameMode === 'survival' && !isCascading) {
        garbageTimer -= deltaTime;
        if (garbageTimer <= 0) {
            addGarbageLines(garbageAmount);
            garbageInterval = Math.max(3000, garbageInterval * 0.97);
            if (lines > 30 && lines % 10 === 0) garbageAmount = Math.min(4, garbageAmount + 1);
            garbageTimer = garbageInterval;
        }
    }

    // Handle animations first, they pause the game logic
    if (pieceLockFlashTimer > 0) pieceLockFlashTimer -= deltaTime;
    
    if (linesToClear.length > 0) {
        lineClearAnimationTimer -= deltaTime;
        if (lineClearAnimationTimer <= 0) {
            if (gameMode === 'avalanche') {
                completeAvalancheClear();
            } else {
                let linesCleared = linesToClear.length;
                linesToClear.sort((a,b) => a - b).forEach(y => {
                    grid.splice(y, 1);
                    grid.unshift(Array(COLS).fill(0));
                });
                linesToClear = [];
                updateScoreAndLevel(linesCleared);
                if (!gameOver) resetPiece();
            }
        }
    } else if (!isCascading) {
        // Normal game logic only runs if not clearing lines or cascading
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            pieceDrop();
        }
    }

    if (gameOver) return;
    
    updateUI();
    draw();
}

function endGame() {
    if(gameOver) return; // Prevent endGame from running multiple times
    gameOver = true;
    soundManager.play('gameOver');
    checkAndUpdateHighScore();
    draw();
    drawGameOver();
    cancelAnimationFrame(animationFrameId);
    animationFrameId = 0;
    quitButton.classList.add('hidden');
    mcQuit.classList.add('hidden');
    canvas.addEventListener('click', showMainMenu);
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

function useTurn() {
    if (gameMode !== 'puzzle' || gameOver) return;
    if (turnsLeft > 0) {
        turnsLeft--;
        updateUI(); // Update immediately so user sees the count change
        if (turnsLeft <= 0) {
            // Use a short timeout to allow the final move to render before the game over screen appears
            setTimeout(() => endGame(), 100);
        }
    }
}

function holdPiece() {
    if (!canHold || gameOver) return;
    if (gameMode === 'puzzle' && turnsLeft <= 0) return;

    soundManager.play('hold');
    if (gameMode === 'puzzle') useTurn();
    if(gameOver) return;
    
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
        updateUI();
    }
}

function pieceDrop() {
    if (gameOver) return;
    if (!isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
        solidifyPiece();
    } else {
        currentPiece.y++;
        lastMoveWasRotation = false;
    }
    dropCounter = 0;
}

function pieceMove(dir: number) {
    if (gameOver) return;
    if (isValidMove(currentPiece.shape, currentPiece.x + dir, currentPiece.y)) {
        currentPiece.x += dir;
        lastMoveWasRotation = false;
        soundManager.play('move');
    }
}

function pieceRotate() {
    if (gameOver) return;
    if (gameMode === 'puzzle' && currentPiece.shapeIndex === O_PIECE_INDEX) {
        return; // Don't rotate or spend a turn on the O piece in puzzle mode
    }
    
    const rotated = rotateMatrix(currentPiece.shape);
    const kicks = [[0,0], [1,0], [-1,0], [2,0], [-2,0], [0,1], [0,-1]]; // Simple wall kicks
    for(const [offsetX, offsetY] of kicks) {
        if (isValidMove(rotated, currentPiece.x + offsetX, currentPiece.y + offsetY)) {
            currentPiece.x += offsetX;
            currentPiece.y += offsetY;
            currentPiece.shape = rotated;
            lastMoveWasRotation = true;

            if (gameMode === 'puzzle') useTurn();

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
    
    if (gameMode === 'puzzle') useTurn();

    clearLines(isTSpin);
    
    if (linesToClear.length === 0 && !gameOver) {
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

    if (!gameOver && currentPiece && !isCascading) {
        if (settings.ghostStyle !== 'off') {
            let ghostY = currentPiece.y;
            while (isValidMove(currentPiece.shape, currentPiece.x, ghostY + 1)) ghostY++;
            drawGhostMatrix(ctx, currentPiece.shape, currentPiece.x, ghostY, settings.ghostStyle);
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
    const { shape, shapeIndex } = nextPiece;
    const offsetX = (4 - shape[0].length) / 2;
    let offsetY = (4 - shape.length) / 2;

    // Adjust for vertical alignment to truly center the piece's shape, not its bounding box.
    // The O piece is naturally centered. All others need a small push down.
    if (shapeIndex !== O_PIECE_INDEX) {
        offsetY += 0.5;
    }

    drawMatrix(nextCtx, shape, offsetX, offsetY);
}

function drawHeldPiece() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (!heldPiece) return;
    const { shape, shapeIndex } = heldPiece;
    const offsetX = (4 - shape[0].length) / 2;
    let offsetY = (4 - shape.length) / 2;

    // Adjust for vertical alignment to truly center the piece's shape, not its bounding box.
    // The O piece is naturally centered. All others need a small push down.
    if (shapeIndex !== O_PIECE_INDEX) {
        offsetY += 0.5;
    }

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

function drawGhostMatrix(context: CanvasRenderingContext2D, matrix: number[][], offsetX: number, offsetY: number, style: GhostStyle) {
    if (style === 'solid') {
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
    } else if (style === 'outline') {
        context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        context.lineWidth = 0.1;
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value > 0) {
                    const blockX = x + offsetX;
                    const blockY = y + offsetY;
                    const halfLineWidth = context.lineWidth / 2;
                    context.strokeRect(blockX + halfLineWidth, blockY + halfLineWidth, 1 - context.lineWidth, 1 - context.lineWidth);
                }
            });
        });
    }
}


function drawGameOver() {
    drawMatrix(ctx, grid, 0, 0, GRAY_PALETTE);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, COLS, ROWS);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    let message = "GAME OVER";
    
    if (gameMode === 'sprint' && sprintLinesToGo <= 0) {
        message = "YOU WIN!";
    } else if (gameMode === 'puzzle' && turnsLeft <= 0) {
        message = "OUT OF TURNS";
    }
    
    ctx.font = (message === "OUT OF TURNS") ? '0.9px "Press Start 2P"' : '1.1px "Press Start 2P"';
    ctx.fillText(message, COLS / 2, ROWS / 2 - 1.5);
    
    ctx.font = '0.55px "Press Start 2P"';
    ctx.fillText('Click or press key', COLS / 2, ROWS / 2 + 1.2);
    ctx.fillText('to continue', COLS / 2, ROWS / 2 + 2.2);
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
    if (gameMode === 'avalanche') return false;
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
        if(gameMode === 'avalanche') isCascading = true;
        lineClearAnimationTimer = LINE_CLEAR_ANIMATION_DURATION;
        const T_SPIN_POINTS = [400, 800, 1200, 1600]; // T-Spin Mini, Single, Double, Triple
        const NORMAL_POINTS = [0, 100, 300, 500, 800]; // Single, Double, Triple, Tetris
        let scoreToAdd = (isTSpin ? T_SPIN_POINTS[clearedCount] : NORMAL_POINTS[clearedCount]) * (level + 1);
        if (gameMode === 'avalanche' && comboCount > 0) {
            scoreToAdd *= (1 + comboCount * 0.5); // Combo bonus
            soundManager.play('combo');
        }
        score += Math.round(scoreToAdd);
        soundManager.play(clearedCount >= 4 ? 'clearTetris' : 'clearLine');
    }
}

function updateScoreAndLevel(linesCleared: number) {
     const previousLevel = level;
     lines += linesCleared;
     if (gameMode === 'sprint') {
        sprintLinesToGo -= linesCleared;
     }
     if (gameMode === 'marathon' || gameMode === 'survival' || gameMode === 'avalanche' || gameMode === 'puzzle') {
         level = Math.floor(lines / 10);
         if (level > previousLevel) {
             updateAccentColor(level);
             soundManager.play('levelUp');
         }
         if(gameMode !== 'avalanche') dropInterval = Math.max(200, 1000 - level * 75);
     }
     updateUI();
}

function updateAccentColor(newLevel: number) {
    const color = ACCENT_COLORS[newLevel % ACCENT_COLORS.length];
    document.documentElement.style.setProperty('--accent-color', color);
}

function formatTime(ms: number): string {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor(ms % 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}


function updateUI() {
    scoreEl.textContent = score.toString();
    mobileScoreEl.textContent = score.toString();
    linesEl.textContent = lines.toString();
    levelEl.textContent = level.toString();
    mobileLevelEl.textContent = level.toString();
    // Mode specific UI
    if (gameMode === 'sprint') {
        const val = formatTime(sprintTimer);
        modeValue.textContent = val;
        mobileModeValue.textContent = val;
        linesEl.textContent = Math.max(0, sprintLinesToGo).toString();
    } else if (gameMode === 'ultra') {
        const minutes = Math.floor(ultraTimer / 60000);
        const seconds = Math.floor((ultraTimer % 60000) / 1000);
        const val = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        modeValue.textContent = val;
        mobileModeValue.textContent = val;
    } else if (gameMode === 'puzzle') {
        const val = Math.max(0, turnsLeft).toString();
        modeValue.textContent = val;
        mobileModeValue.textContent = val;
    }
}

// --- MODE-SPECIFIC LOGIC ---

function addGarbageLines(count: number) {
    // Check for top out before adding lines
    for (let y = 0; y < count; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] !== 0) {
                endGame();
                return;
            }
        }
    }

    grid.splice(0, count);
    const holePosition = Math.floor(Math.random() * COLS);
    for (let i = 0; i < count; i++) {
        const garbageRow = Array(COLS).fill(GARBAGE_BLOCK_VALUE).map((val, i) => i === holePosition ? 0 : val);
        grid.push(garbageRow);
    }
}

function completeAvalancheClear() {
    comboCount++;
    const linesClearedCount = linesToClear.length;
    // Remove lines by setting them to 0
    linesToClear.forEach(y => {
        for(let x=0; x<COLS; x++) grid[y][x] = 0;
    });
    linesToClear = [];
    settleBlocks();
    updateScoreAndLevel(linesClearedCount);
    
    // Check for new lines after settling
    grid.forEach((row, y) => {
        if (row.every(value => value > 0)) {
            linesToClear.push(y);
        }
    });

    if (linesToClear.length > 0) {
        // Another combo!
        clearLines(false); // isTSpin is false for combos
    } else {
        // Combo ends
        isCascading = false;
        comboCount = 0;
        resetPiece();
    }
    draw();
}

function settleBlocks() {
    for (let x = 0; x < COLS; x++) {
        let emptyRow = ROWS - 1;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (grid[y][x] !== 0) {
                if (y !== emptyRow) {
                    grid[emptyRow][x] = grid[y][x];
                    grid[y][x] = 0;
                }
                emptyRow--;
            }
        }
    }
}


// --- DATA PERSISTENCE ---
function loadSettings() {
    const savedString = localStorage.getItem('tetrisSettings');
    const saved = savedString ? JSON.parse(savedString) : null;
    
    const defaultSettings: Settings = { volume: 0.5, ghostStyle: 'solid' };

    if (saved) {
        if (typeof (saved as any).showGhost !== 'undefined') {
            saved.ghostStyle = (saved as any).showGhost ? 'solid' : 'off';
            delete (saved as any).showGhost;
        }
        settings = { ...defaultSettings, ...saved };
    } else {
        settings = defaultSettings;
    }

    soundManager.volume = settings.volume;
    volumeSlider.value = settings.volume.toString();
    ghostStyleSelect.value = settings.ghostStyle;
}


function saveSettings() {
    localStorage.setItem('tetrisSettings', JSON.stringify(settings));
}

function loadHighScores() {
    const saved = localStorage.getItem('tetrisHighScores');
    highScores = saved ? JSON.parse(saved) : {};
    updateHighScoreUI();
}

function saveHighScores() {
    localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
}

function checkAndUpdateHighScore() {
    // Don't save score if player quits Sprint mode early
    if (gameMode === 'sprint' && sprintLinesToGo > 0) return;

    const finalScore = (gameMode === 'sprint') ? sprintTimer : score;
    const newEntry: HighScore = { score: finalScore, date: new Date().toISOString() };
    
    const modeScores = highScores[gameMode] || [];
    modeScores.push(newEntry);

    if (gameMode === 'sprint') {
        // Lower time is better
        modeScores.sort((a, b) => a.score - b.score);
    } else {
        // Higher score is better
        modeScores.sort((a, b) => b.score - a.score);
    }
    
    highScores[gameMode] = modeScores.slice(0, 5);
    
    saveHighScores();
    updateHighScoreUI();
}

function updateHighScoreUI() {
    if (!gameMode) return; // Don't update if no game mode is selected yet
    const currentModeScores = highScores[gameMode];
    let hiScoreText = '0';
    if (currentModeScores && currentModeScores.length > 0) {
        hiScoreText = (gameMode === 'sprint') ? formatTime(currentModeScores[0].score) : currentModeScores[0].score.toString();
    }
    highScoreEl.textContent = hiScoreText;
}


// --- CONTROLS ---
function togglePause() {
    if (gameOver || linesToClear.length > 0) return;
    if (document.querySelector('.modal:not(.hidden)')) return;
    
    isPaused = !isPaused;
    
    if (isPaused) {
        soundManager.play('pause');
        cancelAnimationFrame(animationFrameId);
        selectedPauseButtonIndex = 0; // Reset focus to the first button
        updatePauseMenuSelection();
        drawPaused();
    } else {
        lastTime = performance.now();
        animate(lastTime);
    }
    
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
    mcPause.textContent = isPaused ? '▶' : '❚❚';
}

function updatePauseMenuSelection() {
    const buttons = [pauseButton, quitButton, helpButton];
    buttons.forEach((button, index) => {
        if (index === selectedPauseButtonIndex) {
            button.focus();
        }
    });
}


function setupMobileControls() {
    const mcLeft = document.getElementById('mc-left');
    const mcRight = document.getElementById('mc-right');
    const mcDown = document.getElementById('mc-down');
    const mcRotate = document.getElementById('mc-rotate');
    const mcHardDrop = document.getElementById('mc-hard-drop');
    const mcHold = document.getElementById('mc-hold');

    if (!mcLeft || !mcRight || !mcDown || !mcRotate || !mcHardDrop || !mcHold || !mcPause || !mcHelp || !mcQuit) {
        return;
    }

    const vibrate = (duration: number = 25) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
        }
    }

    const handleControlPress = (action: Function, sound?: string) => {
        const handler = (event: TouchEvent | MouseEvent) => {
            event.preventDefault();
            vibrate();
            if (isPaused || gameOver || linesToClear.length > 0 || isCascading || !!document.querySelector('.modal:not(.hidden)')) {
                if (action !== togglePause && action !== showHelp) {
                    return;
                }
            }
            action();
            if (sound) soundManager.play(sound);
            if (!isPaused) draw();
        };
        return handler;
    };

    const hardDropAction = () => {
        while (isValidMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
            currentPiece.y++;
        }
        solidifyPiece();
    };

    const addControlListeners = (element: HTMLElement, handler: (event: TouchEvent | MouseEvent) => void) => {
        element.addEventListener('touchstart', handler, { passive: false });
        element.addEventListener('mousedown', handler, { passive: false });
    };

    addControlListeners(mcLeft, handleControlPress(() => pieceMove(-1)));
    addControlListeners(mcRight, handleControlPress(() => pieceMove(1)));
    addControlListeners(mcDown, handleControlPress(pieceDrop, 'softDrop'));
    addControlListeners(mcRotate, handleControlPress(pieceRotate));
    addControlListeners(mcHold, handleControlPress(holdPiece));
    addControlListeners(mcHardDrop, handleControlPress(hardDropAction, 'hardDrop'));
    addControlListeners(mcPause, handleControlPress(togglePause));
    addControlListeners(mcHelp, handleControlPress(showHelp));
    addControlListeners(mcQuit, handleControlPress(quitGame));
}


function handleKeyPress(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    const isMainMenuVisible = !mainMenu.classList.contains('hidden');

    if (isMainMenuVisible) {
        event.preventDefault();
        switch (key) {
            case 'arrowdown':
                selectedMenuIndex = (selectedMenuIndex + 1) % menuButtons.length;
                updateMenuSelection();
                break;
            case 'arrowup':
                selectedMenuIndex = (selectedMenuIndex - 1 + menuButtons.length) % menuButtons.length;
                updateMenuSelection();
                break;
            case 'enter':
                menuButtons[selectedMenuIndex].click();
                break;
        }
        return;
    }
    
    if (gameOver) {
        if (animationFrameId === 0) {
            showMainMenu();
        }
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
    
    if (isPaused) {
        event.preventDefault();
        const pauseButtons = [pauseButton, quitButton, helpButton];
        switch (key) {
            case 'arrowdown':
                selectedPauseButtonIndex = (selectedPauseButtonIndex + 1) % pauseButtons.length;
                updatePauseMenuSelection();
                break;
            case 'arrowup':
                selectedPauseButtonIndex = (selectedPauseButtonIndex - 1 + pauseButtons.length) % pauseButtons.length;
                updatePauseMenuSelection();
                break;
            case 'enter':
                pauseButtons[selectedPauseButtonIndex].click();
                break;
            case 'p':
            case 'escape':
                togglePause();
                break;
        }
        return;
    }


    if (key === 'h') { event.preventDefault(); showHelp(); return; }
    if (key === 'p' || key === 'escape') {
        event.preventDefault();
        togglePause();
        return;
    }
    
    if (linesToClear.length > 0 || isCascading) {
        return;
    }

    switch (key) {
        case 'arrowleft': event.preventDefault(); pieceMove(-1); break;
        case 'arrowright': event.preventDefault(); pieceMove(1); break;
        case 'arrowdown': event.preventDefault(); pieceDrop(); soundManager.play('softDrop'); break;
        case 'arrowup': event.preventDefault(); pieceRotate(); break;
        case 'enter':
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