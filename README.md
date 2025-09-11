# Tetris Game

A classic Tetris game built with TypeScript and Vite, packed with modern features and multiple game modes. It's fully responsive and playable on both desktop and mobile devices.

## Features

*   **Multiple Game Modes:**
    *   **Classic:** The original Tetris experience. Clear lines to level up and increase speed.
    *   **Sprint (40L):** Clear 40 lines as fast as you can.
    *   **Ultra (3 Min):** Score as many points as possible in a 3-minute time limit.
    *   **Puzzle:** A strategic mode where you have a limited number of turns to maximize your score.
    *   **Survival:** An intense mode where garbage lines rise from the bottom. Survive as long as you can!
    *   **Avalanche:** Cleared lines cause blocks above to fall, setting up potential chain-reaction combos.
*   **Modern Gameplay Mechanics:**
    *   **Hold Queue:** Swap the current piece with a held piece to save it for later.
    *   **7-Bag Randomizer:** Ensures a fair and balanced distribution of tetrominoes.
    *   **T-Spin Detection:** Rewards advanced players with bonus points for difficult T-piece maneuvers.
*   **Visual Polish & UI/UX:**
    *   **Ghost Piece:** See a preview of where your piece will land (can be set to solid, outline, or off).
    *   **Animations:** Smooth animations for line clears and piece locking.
    *   **Persistent High Scores:** Saves the top 5 scores for each game mode locally in your browser.
    *   **Responsive Design:** Adapts seamlessly from large desktop monitors to mobile phone screens.
*   **Customization & Controls:**
    *   **Settings Menu:** Adjust game volume and ghost piece style.
    *   **Full Keyboard Support:** For desktop players.
    *   **Intuitive Touch Controls:** A complete set of on-screen controls for mobile play.

## Getting Started

Follow these instructions to get the project running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) installed on your computer. This will also install `npm` (Node Package Manager), which is used to manage the project's dependencies.

### Installation & Setup

1.  **Open your terminal** in the root directory of the project (where the `package.json` file is located).

2.  **Install the dependencies.** This command reads the `package.json` file and downloads all the necessary tools (like Vite) that the project needs to run. You only need to do this once.

    ```bash
    npm install
    ```

### Running the Game

1.  **Start the development server.** This will launch the game in your default web browser.

    ```bash
    npm run dev
    ```

2.  **Preview on a mobile device.** To test the game on your phone, run this command instead. It will give you a "Network" URL that you can open in your phone's browser (make sure your computer and phone are on the same Wi-Fi network).

    ```bash
    npm run preview:mobile
    ```

## How to Add Sound Effects

The game's sound engine is fully implemented. To enable sounds, you need to add your own `.wav` or `.mp3` files to the correct folder.

**Due to the build process (Vite), all public assets like sounds MUST be placed in a `public` folder.**

1.  **Create a `public` folder:** In the root directory of your project (the same level as `index.html`), create a new folder named `public`.
2.  **Create a `sounds` folder:** Inside the new `public` folder, create a folder named `sounds`.
3.  **Add your audio files:** Place your sound files inside this new `public/sounds/` folder. The game code will automatically look for files with these **exact names**:
    *   `move.wav` (for moving left/right)
    *   `rotate.wav` (for rotating a piece)
    *   `softDrop.wav` (for pressing down arrow)
    *   `hardDrop.wav` (for pressing spacebar)
    *   `lock.wav` (when a piece solidifies)
    *   `hold.wav` (for using the hold queue)
    *   `clearLine.wav` (for clearing 1-3 lines)
    *   `clearTetris.wav` (for clearing 4 lines)
    *   `levelUp.wav` (when the level increases)
    *   `combo.wav` (for Avalanche mode combos)
    *   `pause.wav` (when the game is paused)
    *   `gameOver.wav` (when the game ends)

The game will now find and play your sounds automatically. No further code changes are needed.
