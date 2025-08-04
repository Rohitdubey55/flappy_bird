// DOM references
const startScreen = document.getElementById('start-screen');
const gameScreen  = document.getElementById('game-screen');
const startBtn    = document.getElementById('startBtn');
const resetBtn    = document.getElementById('resetBtn');
const scoreEl     = document.getElementById('score');
const highEl      = document.getElementById('highScore');
const canvas      = document.getElementById('gameCanvas');
const ctx         = canvas.getContext('2d');

// Game state
let bird = { x: 40, y: 120, w: 18, h: 18, v: 0 };
let gravity = 0.6, lift = -10;
let pipes = [], gap = 90, speed = 2, pw = 24;
let score = 0, high = 0, running = false, player = 'Player';

// Load high score
high = parseInt(localStorage.getItem('flappyBirdHigh')) || 0;
highEl.textContent = `High: ${high}`;

// Start
startBtn.addEventListener('click', () => {
  player = document.getElementById('playerName').value.trim() || 'Player';
  const lvl = document.getElementById('difficulty').value;
  if (lvl === 'easy')   { gravity=0.5; speed=1.5; gap=110; }
  if (lvl === 'medium') { gravity=0.6; speed=2; gap=90; }
  if (lvl === 'hard')   { gravity=0.75; speed=3; gap=70; }

  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGame();
  running = true;
  loop();
});

// Reset
resetBtn.addEventListener('click', resetGame);

function resetGame(){
  bird.y = 120; bird.v = 0;
  pipes = []; score = 0; running = false;
  scoreEl.textContent = `Score: ${score}`;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBird();
}

// Main loop
function loop(){
  if (!running) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Physics
  bird.v += gravity;
  bird.y += bird.v;
  if (bird.y < 0 || bird.y > canvas.height) return endGame();

  drawBird();

  // Pipes
  if (!pipes.length || pipes[pipes.length-1].x < canvas.width - 140) {
    const top = Math.random()*(canvas.height-gap-40)+20;
    pipes.push({ x: canvas.width, top, passed:false });
  }

  pipes.forEach((p,i) => {
    p.x -= speed;
    // Draw
    ctx.fillStyle = 'green';
    ctx.fillRect(p.x,0,pw,p.top);
    ctx.fillRect(p.x,p.top+gap,pw,canvas.height);
    // Collision
    if (bird.x < p.x+pw && bird.x+bird.w>p.x &&
        (bird.y<p.top || bird.y+bird.h>p.top+gap)) {
      return endGame();
    }
    // Score
    if (!p.passed && p.x+pw < bird.x) {
      p.passed = true;
      score++;
      if (score>high) {
        high=score;
        localStorage.setItem('flappyBirdHigh', high);
        highEl.textContent = `High: ${high}`;
      }
      scoreEl.textContent = `Score: ${score}`;
    }
    // Remove off-screen
    if (p.x+pw < 0) pipes.splice(i,1);
  });

  requestAnimationFrame(loop);
}

function drawBird(){
  ctx.fillStyle = 'orange';
  ctx.fillRect(bird.x, bird.y, bird.w, bird.h);
}

function endGame(){
  running = false;
  setTimeout(()=> alert(`${player}, Game Over!\nYour Score: ${score}`), 50);
}

// Universal “flap” handler
function onFlap(e){
  // no preventDefault needed on pointerdown
  if (running) bird.v = lift;
}

// Listen for ANY pointer down (mouse, touch, stylus)
window.addEventListener('pointerdown', onFlap);

// Also allow Space key
window.addEventListener('keydown', e => {
  if (e.code === 'Space') onFlap(e);
});
