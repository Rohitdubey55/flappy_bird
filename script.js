// --- Tab Switching ---
const tabs   = document.querySelectorAll('.tab');
const panels = {
  settings:    document.getElementById('settings'),
  shop:        document.getElementById('shop'),
  leaderboard: document.getElementById('leaderboard')
};
tabs.forEach(btn =>
  btn.addEventListener('click', () => switchPanel(btn.dataset.tab))
);
function switchPanel(key){
  tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === key));
  Object.entries(panels).forEach(
    ([k,el]) => el.classList.toggle('hidden', k !== key)
  );
  // hide game overlay
  document.getElementById('game-screen').classList.add('hidden');
}

// --- Leaderboard Persistence ---
const lbList = document.getElementById('leaderboardList');
function loadLeaderboard(){
  const data = JSON.parse(localStorage.getItem('fbLeaderboard')||'[]');
  lbList.innerHTML = data
    .slice(0,5)
    .map(e=>`<li>${e.name}: Score ${e.score}, Coins ${e.coins}</li>`)
    .join('');
}
function saveScore(name,score,coins){
  let arr = JSON.parse(localStorage.getItem('fbLeaderboard')||'[]');
  arr.push({name,score,coins,date:Date.now()});
  arr.sort((a,b)=>b.score-a.score||b.coins-a.coins);
  localStorage.setItem('fbLeaderboard', JSON.stringify(arr.slice(0,10)));
  loadLeaderboard();
}
loadLeaderboard();

// --- Settings UI ---
const modeSelect   = document.getElementById('modeSelect');
const customDiv    = document.getElementById('customSettings');

modeSelect.onchange = () => {
  if(modeSelect.value === 'custom'){
    customDiv.classList.remove('hidden');
    customDiv.classList.add('custom-visible');
  } else {
    customDiv.classList.add('hidden');
    customDiv.classList.remove('custom-visible');
  }
};

// Bird appearance controls
const birdShapeSel = document.getElementById('birdShape');
const birdSizeInp  = document.getElementById('birdSize');
const birdColorInp = document.getElementById('birdColor');

// --- Daily Challenge ---
let seed = null;
const challenges = [
  'Collect 5 coins',
  'Score at least 10 points',
  'Survive 30 seconds',
  'Pick up a shield power-up'
];
const dailyBtn  = document.getElementById('dailyBtn');
const dailyDesc = document.getElementById('dailyDesc');

dailyBtn.onclick = () => {
  const d = new Date();
  seed = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
  const idx = seed % challenges.length;
  dailyDesc.textContent = `Today’s challenge: ${challenges[idx]}`;
  dailyDesc.classList.remove('hidden');
  dailyDesc.classList.add('custom-visible');
  // auto-open custom panel
  modeSelect.value = 'custom';
  modeSelect.dispatchEvent(new Event('change'));
};

// --- Coin Bank & Shop ---
const bankEl      = document.getElementById('bankCoins');
const invShieldEl = document.getElementById('invShield');
const invSlowEl   = document.getElementById('invSlow');
const shopBtns    = document.querySelectorAll('#shop button[data-power]');
const costs       = { shield:10, slow:8 };

let bankCoins = parseInt(localStorage.getItem('fbBank')||'0',10);
let inventory = JSON.parse(localStorage.getItem('fbInventory')||'{}');
inventory.shield = inventory.shield||0;
inventory.slow   = inventory.slow||0;

function updateBankUI(){
  bankEl.textContent      = bankCoins;
  invShieldEl.textContent = inventory.shield;
  invSlowEl.textContent   = inventory.slow;
}
shopBtns.forEach(btn => {
  btn.onclick = () => {
    const pw = btn.dataset.power, cost = costs[pw];
    if(bankCoins < cost){
      return alert('Not enough coins!');
    }
    bankCoins -= cost;
    inventory[pw]++;
    localStorage.setItem('fbBank', bankCoins);
    localStorage.setItem('fbInventory', JSON.stringify(inventory));
    updateBankUI();
  };
});
updateBankUI();

// --- Game Variables & DOM refs ---
const startBtn  = document.getElementById('startBtn');
const nameInput = document.getElementById('playerName');
const gameScr   = document.getElementById('game-screen');

const scoreEl   = document.getElementById('score');
const coinsEl   = document.getElementById('coins');
const powerEl   = document.getElementById('power');

const canvas    = document.getElementById('gameCanvas');
const ctx       = canvas.getContext('2d');

const resetBtn  = document.getElementById('resetBtn');
const homeBtn   = document.getElementById('homeBtn');

const useShield = document.getElementById('useShieldBtn');
const useSlow   = document.getElementById('useSlowBtn');
const pwrCtrl   = document.getElementById('powerUpControls');

let config, bird, pipes, score, coins;
let birdSize, birdShape, birdColor;
let baseSpeed, activePower, powerTimer;
let running, lastTime;

// seeded RNG
function rng(){
  seed = (seed*9301 + 49297) % 233280;
  return seed/233280;
}

// --- Start Game Handler ---
startBtn.onclick = () => {
  // read physics mode
  const m = modeSelect.value;
  if(m==='easy')   config={gravity:300,lift:-200,speed:100,gap:120};
  else if(m==='medium') config={gravity:400,lift:-250,speed:150,gap:90};
  else if(m==='hard')   config={gravity:500,lift:-300,speed:200,gap:70};
  else { // custom
    config = {
      gravity: +document.getElementById('inGravity').value,
      lift:    +document.getElementById('inLift').value,
      speed:   +document.getElementById('inSpeed').value,
      gap:     +document.getElementById('inGap').value
    };
  }

  // set bird appearance
  birdShape = birdShapeSel.value;
  birdSize  = +birdSizeInp.value;
  birdColor = birdColorInp.value;

  if(seed===null) seed = Math.random()*1e6;

  // init state
  bird   = { x:40, y:200, v:0 };
  pipes  = []; score=0; coins=0;
  baseSpeed  = config.speed;
  activePower= null; powerTimer=0;

  // HUD reset
  scoreEl.textContent = 'Score: 0';
  coinsEl.textContent = 'Coins: 0';
  powerEl.textContent = 'Power-Up: –';

  // show game
  Object.values(panels).forEach(el=>el.classList.add('hidden'));
  gameScr.classList.remove('hidden');
  pwrCtrl.classList.remove('hidden');

  lastTime = performance.now();
  running  = true;
  requestAnimationFrame(gameLoop);
};

// --- Reset & Home ---
function doReset(e){ e.preventDefault(); startBtn.click(); }
resetBtn.addEventListener('click', doReset);
homeBtn.addEventListener('click', e=>{
  e.preventDefault();
  running = false;
  switchPanel('settings');
});

// --- Use Power-Up Buttons ---
useShield.onclick = () => {
  if(inventory.shield<1) return alert('No shields!');
  inventory.shield--;
  localStorage.setItem('fbInventory', JSON.stringify(inventory));
  updateBankUI();
  activePower='shield'; powerTimer=5;
  powerEl.textContent='Power-Up: shield';
};
useSlow.onclick = () => {
  if(inventory.slow<1) return alert('No slows!');
  inventory.slow--;
  localStorage.setItem('fbInventory', JSON.stringify(inventory));
  updateBankUI();
  activePower='slow'; powerTimer=5;
  config.speed = baseSpeed*0.5;
  powerEl.textContent='Power-Up: slow';
};

// --- Game Loop ---
function gameLoop(now){
  if(!running) return;
  const dt = (now - lastTime)/1000;
  lastTime = now;

  // physics
  bird.v += config.gravity*dt;
  bird.y += bird.v*dt;
  if(bird.y < 0 || bird.y + birdSize > canvas.height) return endGame();

  // spawn pipes
  if(!pipes.length || pipes[pipes.length-1].x < canvas.width - 150){
    const top = rng()*(canvas.height-config.gap-80)+40;
    pipes.push({
      x: canvas.width,
      top,
      passed:false,
      coin: rng()<0.3,
      power: rng()<0.1? (rng()<0.5?'slow':'shield') : null
    });
  }

  // clear & draw bird
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = birdColor;
  if(birdShape==='square'){
    ctx.fillRect(bird.x, bird.y, birdSize, birdSize);
  } else if(birdShape==='circle'){
    ctx.beginPath();
    ctx.arc(
      bird.x + birdSize/2,
      bird.y + birdSize/2,
      birdSize/2, 0, 2*Math.PI
    );
    ctx.fill();
  } else if(birdShape==='triangle'){
    ctx.beginPath();
    ctx.moveTo(bird.x + birdSize/2, bird.y);
    ctx.lineTo(bird.x, bird.y + birdSize);
    ctx.lineTo(bird.x + birdSize, bird.y + birdSize);
    ctx.closePath();
    ctx.fill();
  }

  // pipes & collisions
  pipes.forEach((p,i) => {
    p.x -= config.speed*dt;
    // draw pipes
    ctx.fillStyle='green';
    ctx.fillRect(p.x, 0, 24, p.top);
    ctx.fillRect(p.x, p.top + config.gap, 24, canvas.height);

    // coin
    if(p.coin){
      ctx.fillStyle='gold';
      ctx.beginPath();
      ctx.arc(p.x+12, p.top+config.gap/2, 6, 0, 2*Math.PI);
      ctx.fill();
    }
    // power
    if(p.power){
      ctx.fillStyle = p.power==='slow'? 'cyan':'red';
      ctx.fillRect(p.x+4, p.top+config.gap/2-4, 16, 16);
    }

    // collision & pickups
    if(bird.x < p.x+24 && bird.x+birdSize > p.x){
      const inGap = bird.y > p.top && bird.y+birdSize < p.top+config.gap;
      if(!inGap){
        if(activePower==='shield'){
          activePower = null;
          powerEl.textContent = 'Power-Up: –';
        } else {
          return endGame();
        }
      }
      if(p.coin){
        coins++; coinsEl.textContent=`Coins: ${coins}`;
        p.coin=false;
      }
      if(p.power){
        activePower = p.power; powerTimer=5;
        powerEl.textContent = `Power-Up: ${activePower}`;
        if(activePower==='slow') config.speed = baseSpeed*0.5;
        p.power = null;
      }
    }

    // scoring
    if(!p.passed && p.x+24 < bird.x){
      p.passed = true;
      score++; scoreEl.textContent=`Score: ${score}`;
    }
    if(p.x+24 < 0) pipes.splice(i,1);
  });

  // power expiration
  if(activePower && (powerTimer -= dt) <= 0){
    if(activePower==='slow') config.speed = baseSpeed;
    activePower = null;
    powerEl.textContent = 'Power-Up: –';
  }

  requestAnimationFrame(gameLoop);
}

// --- End Game ---
function endGame(){
  running = false;
  saveScore(nameInput.value||'Player', score, coins);
  bankCoins += coins;
  localStorage.setItem('fbBank', bankCoins);
  updateBankUI();
  setTimeout(()=>{
    alert(`Game Over!\n${nameInput.value||'Player'}: Score ${score}, Coins ${coins}`);
  }, 50);
}

// --- Flap ---
function flap(e){
  e.preventDefault();
  if(running) bird.v = config.lift;
}
window.addEventListener('keydown', e => { if(e.code==='Space') flap(e); });
canvas.addEventListener('pointerdown', flap);
canvas.addEventListener('touchstart', flap, { passive: false });
