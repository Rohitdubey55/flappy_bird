const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const gravity = 0.5;
const jump = -8;
const bird = {
  x: 80,
  y: 200,
  width: 30,
  height: 30,
  velocity: 0
};

const pipes = [];
const pipeWidth = 60;
const pipeGap = 140;
let score = 0;
let highScore = localStorage.getItem("flappyHighScore") || 0;
let gameOver = false;

const birdImg = new Image();
birdImg.src = "https://i.imgur.com/o3zZLKr.png";

document.getElementById("highScore").textContent = highScore;

function resetGame() {
  bird.y = 200;
  bird.velocity = 0;
  pipes.length = 0;
  score = 0;
  gameOver = false;
  document.getElementById("restartBtn").style.display = "none";
  gameLoop();
}

function drawBird() {
  ctx.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
}

function createPipe() {
  const topHeight = Math.floor(Math.random() * 200) + 50;
  pipes.push({
    x: canvas.width,
    top: topHeight,
    bottom: topHeight + pipeGap,
    passed: false
  });
}

function drawPipes() {
  ctx.fillStyle = "#228B22";
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
  });
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function checkCollision(pipe) {
  if (
    bird.x < pipe.x + pipeWidth &&
    bird.x + bird.width > pipe.x &&
    (bird.y < pipe.top || bird.y + bird.height > pipe.bottom)
  ) {
    return true;
  }
  return false;
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  bird.velocity += gravity;
  bird.y += bird.velocity;

  if (bird.y + bird.height > canvas.height || bird.y < 0) {
    endGame();
    return;
  }

  pipes.forEach(pipe => {
    pipe.x -= 2;
    if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
      score++;
      pipe.passed = true;
    }
    if (checkCollision(pipe)) {
      endGame();
      return;
    }
  });

  if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 200) {
    createPipe();
  }

  drawPipes();
  drawBird();
  drawScore();

  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  }
}

function endGame() {
  gameOver = true;

  ctx.fillStyle = "red";
  ctx.font = "30px Arial";
  ctx.fillText("Game Over!", canvas.width / 2 - 80, canvas.height / 2);
  ctx.font = "20px Arial";
  ctx.fillText("Click Restart to Play Again", canvas.width / 2 - 110, canvas.height / 2 + 30);

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("flappyHighScore", highScore);
    document.getElementById("highScore").textContent = highScore;
  }

  document.getElementById("restartBtn").style.display = "inline-block";
}

function restartGame() {
  resetGame();
}

// Controls
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !gameOver) {
    bird.velocity = jump;
  }
});

canvas.addEventListener("click", () => {
  if (!gameOver) bird.velocity = jump;
});

birdImg.onload = () => {
  resetGame();
};
