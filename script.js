// DOM refs
const startScreen = document.getElementById('start-screen');
const gameScreen  = document.getElementById('game-screen');
const startBtn    = document.getElementById('startBtn');
const resetBtn    = document.getElementById('resetBtn');
const scoreEl     = document.getElementById('score');
const highEl      = document.getElementById('highScore');
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');

// Game config placeholders
let gravity, lift, pipeSpeed, gap;
let player;

// Persistent high score
let high = parseInt(localStorage.getItem('flappyHigh')) || 0;
highEl.textContent = `High: ${high}`;

// Shared game state
let bird, pipes, score, running;
let lastTime = 0;

// Initialize a new round
function initGame() {
  bird  = { x: 40, y: 120, w: 18, h: 18, v: 0 };
  pipes = [];
  score = 0;
  running = true;
  scoreEl.textContent = `Score: ${score}`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBird();
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Start button handler
startBtn.addEventListener('click', () => {
  player = document.getElementById('playerName').value.trim() || 'Player';
  const lvl = document.getElementById('difficulty').value;

  // per-second values
  if (lvl === 'easy') {
    gravity   = 300;   // px/s²
    lift      = -200;  // px/s impulse
    pipeSpeed = 100;   // px/s
    gap       = 120;   // px
  }
  if (lvl === 'medium') {
    gravity   = 400;
    lift      = -250;
    pipeSpeed = 150;
    gap       = 90;
  }
  if (lvl === 'hard') {
    gravity   = 500;
    lift      = -300;
    pipeSpeed = 200;
    gap       = 70;
  }

  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  initGame();
});

// Reset button handler
resetBtn.addEventListener('click', e => {
  e.preventDefault();
  initGame();
});

// Draw the bird
function drawBird() {
  ctx.fillStyle = 'orange';
  ctx.fillRect(bird.x, bird.y, bird.w, bird.h);
}

// Main loop with time delta
function gameLoop(now) {
  if (!running) return;
  const dt = (now - lastTime) / 1000;  // delta in seconds
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Bird physics: v += a * dt; y += v * dt
  bird.v += gravity * dt;
  bird.y += bird.v * dt;

  // Out of bounds?
  if (bird.y < 0 || bird.y + bird.h > canvas.height) {
    return endGame();
  }

  drawBird();
  updatePipes(dt);
  requestAnimationFrame(gameLoop);
}

function updatePipes(dt) {
  // spawn
  if (!pipes.length || pipes[pipes.length - 1].x < canvas.width - 140) {
    const top = Math.random() * (canvas.height - gap - 40) + 20;
    pipes.push({ x: canvas.width, top, passed: false });
  }

  pipes.forEach((p, i) => {
    p.x -= pipeSpeed * dt;

    // draw
    ctx.fillStyle = 'green';
    ctx.fillRect(p.x, 0, 24, p.top);
    ctx.fillRect(p.x, p.top + gap, 24, canvas.height);

    // collision
    if (
      bird.x < p.x + 24 &&
      bird.x + bird.w > p.x &&
      (bird.y < p.top || bird.y + bird.h > p.top + gap)
    ) {
      return endGame();
    }

    // score
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

    // cleanup
    if (p.x + 24 < 0) pipes.splice(i, 1);
  });
}

// End game
function endGame() {
  running = false;
  setTimeout(() => {
    alert(`${player}, Game Over!\nYour Score: ${score}`);
  }, 50);
}

// Flap logic: instantaneous v = lift
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
