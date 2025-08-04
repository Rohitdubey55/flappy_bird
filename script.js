// DOM refs
const startScreen = document.getElementById('start-screen');
const gameScreen  = document.getElementById('game-screen');
const startBtn    = document.getElementById('startBtn');
const resetBtn    = document.getElementById('resetBtn');
const scoreEl     = document.getElementById('score');
const highEl      = document.getElementById('highScore');
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');

// Game state
let bird    = { x: 40, y: 120, w: 18, h: 18, v: 0 };
let gravity = 0.5, lift = -6;     // gentler movement
let pipes   = [], gap = 90, speed = 2, pw = 24;
let score   = 0, high = 0, running = false, player = 'Player';

// Load high score
high = parseInt(localStorage.getItem('flappyBirdHigh')) || 0;
highEl.textContent = `High: ${high}`;

// Start game
startBtn.addEventListener('click', () => {
  player = document.getElementById('playerName').value.trim() || 'Player';
  const lvl = document.getElementById('difficulty').value;
  if (lvl === 'easy')   { gravity = 0.4; speed = 1.5; gap = 110; }
  if (lvl === 'medium') { gravity = 0.5; speed = 2;   gap = 90;  }
  if (lvl === 'hard')   { gravity = 0.6; speed = 3;   gap = 70;  }

  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  startNewGame();
});

// Reset button now restarts immediately
resetBtn.addEventListener('click', startNewGame);

// Initialize or restart
function startNewGame(){
  bird.y = 120; bird.v = 0;
  pipes = []; score = 0;
  running = true;
  updateScores();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBird();
  requestAnimationFrame(loop);
}

// Main loop
function loop(){
  if (!running) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Apply physics
  bird.v += gravity;
  bird.y += bird.v;
  if (bird.y < 0 || bird.y > canvas.height) return endGame();

  drawBird();
  handlePipes();
  requestAnimationFrame(loop);
}

// Draw bird
function drawBird(){
  ctx.fillStyle = 'orange';
  ctx.fillRect(bird.x, bird.y, bird.w, bird.h);
}

// Pipes logic
function handlePipes(){
  // spawn
  if (!pipes.length || pipes[pipes.length-1].x < canvas.width - 140) {
    const top = Math.random() * (canvas.height - gap - 40) + 20;
    pipes.push({ x: canvas.width, top, passed: false });
  }

  pipes.forEach((p, i) => {
    p.x -= speed;
    // draw
    ctx.fillStyle = 'green';
    ctx.fillRect(p.x, 0, pw, p.top);
    ctx.fillRect(p.x, p.top + gap, pw, canvas.height);
    // collision
    if (
      bird.x < p.x + pw &&
      bird.x + bird.w > p.x &&
      (bird.y < p.top || bird.y + bird.h > p.top + gap)
    ) {
      return endGame();
    }
    // scoring
    if (!p.passed && p.x + pw < bird.x) {
      p.passed = true;
      score++;
      if (score > high) {
        high = score;
        localStorage.setItem('flappyBirdHigh', high);
      }
      updateScores();
    }
    // cleanup
    if (p.x + pw < 0) pipes.splice(i, 1);
  });
}

// End game
function endGame(){
  running = false;
  setTimeout(() => alert(`${player}, Game Over!\nYour Score: ${score}`), 50);
}

// Update score displays
function updateScores(){
  scoreEl.textContent = `Score: ${score}`;
  highEl.textContent  = `High: ${high}`;
}

// Flap handler
function flap(){
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
