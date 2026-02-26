let GAME_WIDTH = window.innerWidth;
const TOTAL_DISTANCE = 3000; // Game ends when player reaches this distance
const FRAME_RATE = 60;

window.addEventListener('resize', () => {
    GAME_WIDTH = window.innerWidth;
});

// Game State
let gameState = 'START'; // START, PLAYING, WON, LOST
let playerDistance = 100; // Player starts a bit into the level
let gorillaDistance = 0; // Gorilla starts behind
let playerSpeed = 70; // Distance units per second
let gorillaSpeed = 100; // Gorilla is faster! Player must answer to gain bursts of speed
let bgOffset = 0;
let lastTime = 0;
let promptTimer = 0;
let isPromptActive = false;
let currentVerb = null;
let currentPronoun = null;
let correctAnswer = "";

// Verb Pool
const verbs = ['hablar', 'estudiar', 'trabajar', 'mirar', 'viajar', 'escuchar',
    'comer', 'beber', 'aprender', 'correr', 'vender', 'leer'];
const pronouns = ['yo', 'tú', 'él/ella', 'nosotros', 'vosotros', 'ellos/ellas'];

// Conjugation Rules
const arEndings = {
    'yo': 'o', 'tú': 'as', 'él/ella': 'a',
    'nosotros': 'amos', 'vosotros': 'áis', 'ellos/ellas': 'an'
};
const erEndings = {
    'yo': 'o', 'tú': 'es', 'él/ella': 'e',
    'nosotros': 'emos', 'vosotros': 'éis', 'ellos/ellas': 'en'
};

// DOM Elements
const backgroundEl = document.getElementById('background');
const doorEl = document.getElementById('door');
const avatarEl = document.getElementById('avatar');
const gorillaEl = document.getElementById('gorilla');
const avatarMarker = document.getElementById('avatar-marker');
const gorillaMarker = document.getElementById('gorilla-marker');
const promptContainer = document.getElementById('prompt-container');
const verbPrompt = document.getElementById('verb-prompt');
const answerInput = document.getElementById('answer-input');
const messageOverlay = document.getElementById('message-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');

function init() {
    window.requestAnimationFrame(gameLoop);

    // Global keydown
    document.addEventListener('keydown', (e) => {
        if (gameState === 'START' || gameState === 'WON' || gameState === 'LOST') {
            if (e.key === 'Enter') {
                startGame();
            }
        }
    });

    // Input handler
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && isPromptActive) {
            checkAnswer(answerInput.value);
        }
    });
}

function startGame() {
    gameState = 'PLAYING';
    playerDistance = 500;
    gorillaDistance = 0;
    bgOffset = 0;
    promptTimer = 3; // Show prompt immediately
    isPromptActive = false;

    messageOverlay.classList.add('hidden');
    doorEl.style.display = 'none';
    promptContainer.classList.add('hidden');
    answerInput.value = '';

    lastTime = performance.now();
    window.requestAnimationFrame(gameLoop);
}

function gameOver(won) {
    gameState = won ? 'WON' : 'LOST';
    messageOverlay.classList.remove('hidden');
    promptContainer.classList.add('hidden');

    if (won) {
        overlayTitle.textContent = "¡ESCAPASTE!";
        overlayTitle.style.color = "var(--success-color)";
        overlayText.textContent = "Press Enter to Play Again";
    } else {
        overlayTitle.textContent = "¡ATRAPADO!";
        overlayTitle.style.color = "var(--error-color)";
        overlayText.textContent = "Press Enter to Try Again";
    }
}

function generatePrompt() {
    isPromptActive = true;
    promptContainer.classList.remove('hidden');
    answerInput.disabled = false;
    answerInput.value = '';
    answerInput.focus();

    const verb = verbs[Math.floor(Math.random() * verbs.length)];
    const pronoun = pronouns[Math.floor(Math.random() * pronouns.length)];

    currentVerb = verb;
    currentPronoun = pronoun;

    verbPrompt.textContent = `${verb} — ${pronoun} (presente)`;

    // Calculate correct answer
    const stem = verb.slice(0, -2);
    const endingType = verb.slice(-2);

    let ending = "";
    if (endingType === 'ar') {
        ending = arEndings[pronoun];
    } else {
        ending = erEndings[pronoun];
    }

    correctAnswer = stem + ending;
}

function normalizeText(text) {
    text = text.toLowerCase().trim();
    // Remove accents specifically to allow 'hablais' instead of 'habláis'
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function checkAnswer(input) {
    const normalizedInput = normalizeText(input);
    const normalizedCorrect = normalizeText(correctAnswer);

    answerInput.disabled = true; // Briefly disable

    if (normalizedInput === normalizedCorrect) {
        // Success
        answerInput.classList.remove('shake');
        void answerInput.offsetWidth; // Trigger reflow
        answerInput.classList.add('success');

        // Boost player!
        playerDistance += 150;

        setTimeout(() => {
            promptContainer.classList.add('hidden');
            answerInput.classList.remove('success');
            isPromptActive = false;
            promptTimer = 0; // Reset timer for next prompt (3 seconds)
        }, 500);

    } else {
        // Failure
        answerInput.classList.remove('success');
        void answerInput.offsetWidth;
        answerInput.classList.add('shake');

        // Penalty! Gorilla gets closer, or just lose time?
        gorillaDistance += 50;

        setTimeout(() => {
            answerInput.disabled = false;
            answerInput.value = '';
            answerInput.focus();
        }, 500); // Wait for shake to finish
    }
}

function updatePositions() {
    // Relative positioning
    // Player is usually around the center of the screen, unless close to end

    const VISUAL_RANGE = 1000; // How much distance is shown on screen

    // If player is close to target, move player to right of screen, draw door
    let visualPlayerX = GAME_WIDTH / 2; // Center

    if (playerDistance > TOTAL_DISTANCE - (GAME_WIDTH / 2)) {
        visualPlayerX = (GAME_WIDTH / 2) + (playerDistance - (TOTAL_DISTANCE - (GAME_WIDTH / 2)));
    }

    // Calculate gorilla visual X relative to player
    const distanceDiff = playerDistance - gorillaDistance;
    let visualGorillaX = visualPlayerX - distanceDiff;

    // Set styles
    avatarEl.style.left = `${visualPlayerX}px`;
    gorillaEl.style.left = `${visualGorillaX}px`;

    // Door
    if (TOTAL_DISTANCE - playerDistance < GAME_WIDTH) {
        doorEl.style.display = 'block';
        const rawDoorX = visualPlayerX + (TOTAL_DISTANCE - playerDistance);
        doorEl.style.left = `${rawDoorX}px`;
    } else {
        doorEl.style.display = 'none';
    }

    // Progress Bar (0 to 100%)
    let pPercent = (playerDistance / TOTAL_DISTANCE) * 100;
    let gPercent = (gorillaDistance / TOTAL_DISTANCE) * 100;

    // Clamp
    pPercent = Math.min(Math.max(pPercent, 0), 100);
    gPercent = Math.min(Math.max(gPercent, 0), 100);

    avatarMarker.style.left = `${pPercent}%`;
    gorillaMarker.style.left = `${gPercent}%`;
}

function gameLoop(timestamp) {
    if (gameState !== 'PLAYING') {
        lastTime = timestamp;
        window.requestAnimationFrame(gameLoop);
        return;
    }

    const dt = (timestamp - lastTime) / 1000; // Delta time in seconds
    lastTime = timestamp;

    // Move entities
    playerDistance += playerSpeed * dt;
    gorillaDistance += gorillaSpeed * dt;

    // Scroll background infinitely using background-position
    bgOffset -= playerSpeed * 2 * dt;
    backgroundEl.style.backgroundPositionX = `${bgOffset}px`;

    // Prompt Timer
    if (!isPromptActive) {
        promptTimer += dt;
        if (promptTimer >= 3.0) {
            generatePrompt();
        }
    }

    updatePositions();

    // Win / Loss Conditions
    if (gorillaDistance >= playerDistance) {
        gameOver(false);
    } else if (playerDistance >= TOTAL_DISTANCE) {
        gameOver(true);
    }

    window.requestAnimationFrame(gameLoop);
}

// Start
init();
