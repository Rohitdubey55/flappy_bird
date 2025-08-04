const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

let bird = { x: 40, y: 120, w: 18, h: 18, v: 0 };
let gravity = 0.6, lift = -10;
let pipes = [], gap=90, speed=2, width=24;
let score=0, high=0, running=false, name="Player";

function startGame(){
  name = document.getElementById("playerName").value || "Player";
  const lvl = document.getElementById("difficulty").value;
  if(lvl==="easy"){ gravity=0.5; speed=1.5; gap=110; }
  if(lvl==="medium"){ gravity=0.6; speed=2; gap=90; }
  if(lvl==="hard"){ gravity=0.75; speed=3; gap=70; }
  resetGame();
  running = true;
  loop();
}

function resetGame(){
  bird.y = 120; bird.v = 0;
  pipes = []; score = 0;
  running = false;
  updateScores();
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBird();
}

function updateScores(){
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("highScore").textContent = `High: ${high}`;
}

function loop(){
  if(!running) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // physics
  bird.v += gravity; bird.y += bird.v;
  if(bird.y<0 || bird.y>canvas.height) return endGame();

  // draw bird
  ctx.fillStyle="orange";
  ctx.fillRect(bird.x,bird.y,bird.w,bird.h);

  // pipes
  if(!pipes.length || pipes[pipes.length-1].x < canvas.width-140)
    pipes.push({ x: canvas.width, top: Math.random()*(canvas.height-gap-40)+20, passed:false });

  pipes.forEach((p,i)=> {
    p.x -= speed;
    ctx.fillStyle="green";
    ctx.fillRect(p.x,0,width,p.top);
    ctx.fillRect(p.x,p.top+gap,width,canvas.height);
    // score
    if(!p.passed && p.x + width < bird.x){
      p.passed=true; score++;
      if(score>high) high=score;
      updateScores();
    }
    // collision
    if(bird.x < p.x+width && bird.x+bird.w>p.x &&
      (bird.y < p.top || bird.y+bird.h > p.top+gap)) return endGame();
    // remove off-screen
    if(p.x+width < 0) pipes.splice(i,1);
  });

  requestAnimationFrame(loop);
}

function endGame(){
  running=false;
  updateScores();
  setTimeout(()=> alert(`${name}, Game Over!\nYour Score: ${score}`), 50);
}

// input
window.addEventListener("keydown", e=>{
  if(e.code==="Space" && running) bird.v = lift;
});
canvas.addEventListener("click", ()=>{ if(running) bird.v=lift; });
canvas.addEventListener("touchstart", e=>{ e.preventDefault(); if(running) bird.v=lift; });

// initial draw
drawBird();

function drawBird(){
  ctx.fillStyle="orange";
  ctx.fillRect(bird.x,bird.y,bird.w,bird.h);
}
