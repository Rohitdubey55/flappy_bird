// DOM refs
const startScreen = document.getElementById('start-screen');
const gameScreen  = document.getElementById('game-screen');
const startBtn    = document.getElementById('startBtn');
const resetBtn    = document.getElementById('resetBtn');
const scoreEl     = document.getElementById('score');
const highEl      = document.getElementById('highScore');
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');

// Game config (to be filled in on Start)
let gravity, lift, speed, gap;
let player;

// Persistent high score
let high = parseInt(localStorage.getItem('flappyHigh')) || 0;
highEl.textContent = `High: ${high}`;

// Common game state
let bird, pipes, score, running;

// Initialize a new round
function initGame() {
  bird = { x: 40, y: 120, w: 18, h: 18, v: 0 };
  pipes = [];
  score = 0;
  running = true;
  scoreEl.textContent = `Score: ${score}`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  requestAnimationFrame(gameLoop);
}

// Start button handler
startBtn.addEventListener('click', () => {
  player = document.getElementById('playerName').value.trim() || 'Player';
  const lvl = document.getElementById('difficulty').value;

  // Set parameters per difficulty
  if (lvl === 'easy')   { gravity = 0.3; lift = -4; speed = 1.5; gap = 110; }
  if (lvl === 'medium') { gravity = 0.4; lift = -5; speed = 2;   gap = 90;  }
  if (lvl === 'hard')   { gravity = 0.5; lift = -6; speed = 2.5; gap = 70;  }

  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  initGame();
});

// Reset button handler
resetBtn.addEventListener('click', () => {
  // Simply re-initialize using same settings
  initGame();
});

// Draw the bird
function drawBird() {
  ctx.fillStyle = 'orange';
  ctx.fillRect(bird.x, bird.y, bird.w, bird.h);
}

// Main loop
function gameLoop() {
  if (!running) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bird physics
  bird.v += gravity;
  bird.y += bird.v;

  // Check bounds
  if (bird.y < 0 || bird.y + bird.h > canvas.height) {
    return endGame();
  }

  drawBird();
  updatePipes();
  requestAnimationFrame(gameLoop);
}

// Pipe handling + scoring + collision
function updatePipes() {
  // Spawn new pipe as needed
  if (!pipes.length || pipes[pipes.length - 1].x < canvas.width - 140) {
    const top = Math.random() * (canvas.height - gap - 40) + 20;
    pipes.push({ x: canvas.width, top, passed: false });
  }

  pipes.forEach((p, i) => {
    p.x -= speed;

    // Draw pipes
    ctx.fillStyle = 'green';
    ctx.fillRect(p.x, 0, 24, p.top);
    ctx.fillRect(p.x, p.top + gap, 24, canvas.height);

    // Collision?
    if (
      bird.x < p.x + 24 &&
      bird.x + bird.w > p.x &&
      (bird.y < p.top || bird.y + bird.h > p.top + gap)
    ) {
      return endGame();
    }

    // Scoring
    if (!p.passed && p.x + 24 < bird.x) {
      p.passed = true;
      score++;
      if (score > high) {
        high = score;
        localStorage.setItem('flappyHigh', high);
        highEl.textContent = `High: ${high}`;
      }
      scoreEl.textContent = `Score: ${score}`;
    }

    // Remove off-screen
    if (p.x + 24 < 0) pipes.splice(i, 1);
  });
}

// End the game
function endGame() {
  running = false;
  setTimeout(() => {
    alert(`${player}, Game Over!\nYour Score: ${score}`);
  }, 50);
}

// Flap logic
function flap() {
  if (running) bird.v = lift;
}

// Input listeners
window.addEventListener('keydown', e => {
  if (e.code === 'Space') flap();
});
canvas.addEventListener('pointerdown', flap);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  flap();
}, { passive: false });
