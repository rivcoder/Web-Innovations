// ===============================
// 🔥 CHAOS BATTLE ARENA - FULL JS
// ===============================

// ====== CHARACTER DECK (20 CARDS) ======
const characters = [
  // 🟢 Weak (1 point)
  {name:'Pikachu', type:'weak', src:'https://img.pokemondb.net/artwork/large/pikachu.jpg', points:1},
  {name:'Bulbasaur', type:'weak', src:'https://img.pokemondb.net/artwork/large/bulbasaur.jpg', points:1},
  {name:'Squirtle', type:'weak', src:'https://img.pokemondb.net/artwork/large/squirtle.jpg', points:1},
  {name:'Eevee', type:'weak', src:'https://img.pokemondb.net/artwork/large/eevee.jpg', points:1},
  {name:'Jigglypuff', type:'weak', src:'https://img.pokemondb.net/artwork/large/jigglypuff.jpg', points:1},
  {name:'Psyduck', type:'weak', src:'https://img.pokemondb.net/artwork/large/psyduck.jpg', points:1},

  // 🔵 Strong (3 points)
  {name:'Charizard', type:'strong', src:'https://img.pokemondb.net/artwork/large/charizard.jpg', points:3},
  {name:'Blastoise', type:'strong', src:'https://img.pokemondb.net/artwork/large/blastoise.jpg', points:3},
  {name:'Venusaur', type:'strong', src:'https://img.pokemondb.net/artwork/large/venusaur.jpg', points:3},
  {name:'Dragonite', type:'strong', src:'https://img.pokemondb.net/artwork/large/dragonite.jpg', points:3},
  {name:'Gyarados', type:'strong', src:'https://img.pokemondb.net/artwork/large/gyarados.jpg', points:3},
  {name:'Lucario', type:'strong', src:'https://img.pokemondb.net/artwork/large/lucario.jpg', points:3},
  {name:'Snorlax', type:'strong', src:'https://img.pokemondb.net/artwork/large/snorlax.jpg', points:3},

  // 🔴 Villains (0 points – instant end)
  {name:'Mewtwo', type:'villain', src:'https://img.pokemondb.net/artwork/large/mewtwo.jpg', points:0},
  {name:'Gengar', type:'villain', src:'https://img.pokemondb.net/artwork/large/gengar.jpg', points:0},
  {name:'Arbok', type:'villain', src:'https://img.pokemondb.net/artwork/large/arbok.jpg', points:0},
  {name:'Ditto', type:'villain', src:'https://img.pokemondb.net/artwork/large/ditto.jpg', points:0},
  {name:'Team Rocket', type:'villain', src:'https://img.pokemondb.net/artwork/large/meowth.jpg', points:0}
];

// ====== STATE ======
let playerScore = 0;
let enemyScore = 0;
let gameActive = false;
let round = 0;
const maxRounds = 30;

// ====== ELEMENTS ======
const chaosButton = document.getElementById('chaosButton');
const restartButton = document.getElementById('restartButton');
const playerCardImg = document.getElementById('playerCard');
const enemyCardImg = document.getElementById('enemyCard');
const playerScoreDisplay = document.getElementById('playerScore');
const enemyScoreDisplay = document.getElementById('enemyScore');
const gameOverText = document.getElementById('gameOver');
const finalWinner = document.getElementById('finalWinner');
const instructionsOverlay = document.getElementById('instructionsOverlay');
const startButton = document.getElementById('startButton');

// ====== START GAME ======
startButton.addEventListener('click', () => {
  instructionsOverlay.style.display = 'none';
  gameActive = true;
  chaosButton.disabled = false;
});

// ===============================
// 🎲 RANDOM CARD WITH PROBABILITY
// ===============================
function getRandomCard(){
  const roll = Math.random();

  if(roll < 0.15){ // 15% Villain
    const villains = characters.filter(c => c.type === "villain");
    return villains[Math.floor(Math.random()*villains.length)];
  } else if(roll < 0.40){ // 25% Strong
    const strong = characters.filter(c => c.type === "strong");
    return strong[Math.floor(Math.random()*strong.length)];
  } else { // 60% Weak
    const weak = characters.filter(c => c.type === "weak");
    return weak[Math.floor(Math.random()*weak.length)];
  }
}

// ===============================
// 🚨 VILLAIN ALERT
// ===============================
function showVillain(card){
  const alert = document.createElement('div');
  alert.className = 'villain-alert';
  alert.innerText = `⚠️ ${card.name.toUpperCase()} ENTERED THE ARENA!`;
  document.body.appendChild(alert);

  document.body.classList.add('shake');
  setTimeout(()=>{
    alert.remove();
    document.body.classList.remove('shake');
  }, 2000);
}

// ===============================
// 🎉 PREMIUM RIBBON CONFETTI
// ===============================
const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let confettiParticles = [];
let confettiAnimationId;
let confettiTimeout;
let confettiRunning = false;

function createConfetti(){
  confettiParticles = [];
  for(let i=0;i<140;i++){
    confettiParticles.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height - canvas.height,
      size: Math.random()*8 + 6,
      speedY: Math.random()*3 + 2,
      tilt: Math.random()*10 - 10,
      tiltAngle: 0,
      tiltSpeed: Math.random()*0.08 + 0.04,
      color: `hsl(${Math.random()*360}, 90%, 60%)`
    });
  }
}

function drawConfetti(){
  if(!confettiRunning) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  confettiParticles.forEach(p=>{
    p.tiltAngle += p.tiltSpeed;
    p.y += p.speedY;
    p.tilt = Math.sin(p.tiltAngle) * 15;

    ctx.beginPath();
    ctx.lineWidth = p.size/2;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt, p.y);
    ctx.lineTo(p.x + p.tilt + p.size/2, p.y + p.size);
    ctx.stroke();

    if(p.y > canvas.height){
      p.y = -20;
      p.x = Math.random()*canvas.width;
    }
  });

  confettiAnimationId = requestAnimationFrame(drawConfetti);
}

function startConfetti(){
  clearTimeout(confettiTimeout);
  createConfetti();
  confettiRunning = true;
  drawConfetti();
  confettiTimeout = setTimeout(()=>{
    stopConfetti();
  },3000);
}

function stopConfetti(){
  confettiRunning = false;
  cancelAnimationFrame(confettiAnimationId);
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

// ===============================
// 🏆 END GAME
// ===============================
function endGame(){
  gameActive = false;
  chaosButton.disabled = true;
  gameOverText.style.display = 'block';

  if(playerScore > enemyScore){
    finalWinner.textContent = "🏆 PLAYER WINS!";
  } else if(enemyScore > playerScore){
    finalWinner.textContent = "💀 ENEMY WINS!";
  } else {
    finalWinner.textContent = "🤝 DRAW!";
  }
}

// ===============================
// ⚔️ PLAY TURN
// ===============================
function resetCardEffects(){
  playerCardImg.classList.remove("strong-glow","villain-glow");
  enemyCardImg.classList.remove("strong-glow","villain-glow");
}

function playTurn(){
  if(!gameActive) return;
  if(round >= maxRounds){ endGame(); return; }

  round++;
  resetCardEffects();

  const playerCard = getRandomCard();
  const enemyCard = getRandomCard();

  playerCardImg.src = playerCard.src;
  enemyCardImg.src = enemyCard.src;

  playerScore += playerCard.points;
  enemyScore += enemyCard.points;

  playerScoreDisplay.textContent = `PLAYER: ${playerScore}`;
  enemyScoreDisplay.textContent = `ENEMY: ${enemyScore}`;

  // STRONG CARDS
  let strongTriggered = false;
  if(playerCard.type==="strong"){
    playerCardImg.classList.add("strong-glow");
    strongTriggered = true;
  }
  if(enemyCard.type==="strong"){
    enemyCardImg.classList.add("strong-glow");
    strongTriggered = true;
  }
  if(strongTriggered) startConfetti();

  // VILLAIN CHECK
  if(playerCard.type==="villain"){
    playerCardImg.classList.add("villain-glow");
    showVillain(playerCard);
    setTimeout(endGame,2000);
    return;
  }
  if(enemyCard.type==="villain"){
    enemyCardImg.classList.add("villain-glow");
    showVillain(enemyCard);
    setTimeout(endGame,2000);
    return;
  }
}

// ===============================
// EVENTS
// ===============================
chaosButton.addEventListener('click', playTurn);

restartButton.addEventListener('click', ()=>{
  playerScore = 0;
  enemyScore = 0;
  round = 0;
  gameActive = true;

  playerScoreDisplay.textContent = "PLAYER: 0";
  enemyScoreDisplay.textContent = "ENEMY: 0";
  playerCardImg.src = "";
  enemyCardImg.src = "";
  finalWinner.textContent = "";
  gameOverText.style.display = 'none';
  chaosButton.disabled = false;
  resetCardEffects();
});
