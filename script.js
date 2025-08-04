const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const playerDisplay = document.getElementById("playerDisplay");

let birdY = 200;
let birdVelocity = 0;
let gravity = 0.6;
let isGameOver = false;
let pipes = [];
let score = 0;
let highScore = 0;
let playerName = "";
let gameStarted = false;
let difficultySpeed = 2;

function setDifficulty(level) {
  switch (level) {
    case "easy": difficultySpeed = 2; break;
    case "medium": difficultySpeed = 3; break;
    case "hard": difficultySpeed = 4; break;
  }
}

function drawBird() {
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(60, birdY, 15, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  ctx.fillStyle = "green";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, 50, pipe.top);
    ctx.fillRect(pipe.x, pipe.top + pipe.gap, 50, canvas.height - pipe.top - pipe.gap);
  });
}

function updatePipes() {
  pipes.forEach(pipe => {
    pipe.x -= difficultySpeed;

    if (!pipe.passed && pipe.x < 60) {
      score++;
      scoreEl.textContent = score;
      pipe.passed = true;
    }

    if (pipe.x + 50 < 0) pipes.shift();
  });

  if (pipes.length === 0 || pipes[pipes.length - 1].x < 200) {
    const top = Math.random() * 200 + 50;
    pipes.push({ x: canvas.width, top: top, gap: 120, passed: false });
  }
}

function checkCollision() {
  for (let pipe of pipes) {
    if (
      60 + 15 > pipe.x &&
      60 - 15 < pipe.x + 50 &&
      (birdY - 15 < pipe.top || birdY + 15 > pipe.top + pipe.gap)
    ) {
      gameOver();
    }
  }
  if (birdY + 15 >= canvas.height || birdY - 15 <= 0) {
    gameOver();
  }
}

function flap() {
  if (!gameStarted || isGameOver) return;
  birdVelocity = -8;
}

function gameOver() {
  isGameOver = true;
  gameStarted = false;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyBirdHighScore", highScore);
  }
  highScoreEl.textContent = highScore;
  alert(`${playerName}, Game Over! Your score: ${score}`);
}

function restartGame() {
  birdY = 200;
  birdVelocity = 0;
  isGameOver = false;
  gameStarted = true;
  pipes = [];
  score = 0;
  scoreEl.textContent = 0;
  gameLoop();
}

function startGame() {
  playerName = document.getElementById("playerName").value || "Player";
  const difficulty = document.getElementById("difficulty").value;
  setDifficulty(difficulty);
  highScore = localStorage.getItem("flappyBirdHighScore") || 0;
  highScoreEl.textContent = highScore;
  playerDisplay.textContent = playerName;
  restartGame();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isGameOver) {
    birdVelocity += gravity;
    birdY += birdVelocity;
    updatePipes();
    checkCollision();
  }

  drawBird();
  drawPipes();

  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", function (e) {
  if (e.code === "Space") flap();
});

canvas.addEventListener("click", flap); // Mobile tap
