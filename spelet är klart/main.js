const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");
const score1 = document.getElementById("score1");
const score2 = document.getElementById("score2");
const startBtn = document.getElementById("startBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const playerRadius = 40;
const ballRadius = 30;

let keys = {};
let isGameOver = false;
let winner = "";

let score = { player1: 0, player2: 0 };

const apaSprite = new Image();
apaSprite.src = "img/apa.png";

const kuraSprite = new Image();
kuraSprite.src = "img/kura.png";

const spriteFrameWidth = 72;
const spriteFrameHeight = 97;
const spriteFrames = 4;
let currentFrame = 0;
let frameCounter = 0;
const frameSpeed = 10;

let lastJumpTimePlayer1 = 0;
let lastJumpTimePlayer2 = 0;
const doubleJumpThreshold = 250;

let player1 = {
  x: 100,
  y: HEIGHT - playerRadius - 10,
  vy: 0,
  isOnGround: true,
  gravity: 0.5,
  jumpCount: 0,
  rotation: 0,
  isSpinning: false,
  jumpForce: -12,
};

let player2 = {
  x: WIDTH - 100,
  y: HEIGHT - playerRadius - 10,
  vy: 0,
  isOnGround: true,
  gravity: 0.5,
  jumpCount: 0,
  rotation: 0,
  isSpinning: false,
  jumpForce: -12,
};

let ball = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  vx: 10,
  vy: -10,
  gravity: 0.2,
};

let animationId = null;

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if (e.key.toLowerCase() === "w" && player1.jumpCount < 2) {
    player1.vy = player1.jumpForce;
    if (player1.jumpCount === 1) {
      player1.isSpinning = true;
    }
    player1.jumpCount++;
  }

  if (e.key === "ArrowUp" && player2.jumpCount < 2) {
    player2.vy = player2.jumpForce;
    if (player2.jumpCount === 1) {
      player2.isSpinning = true;
    }
    player2.jumpCount++;
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.onload = () => {
  startBtn.style.display = "inline-block";
  restartBtn.style.display = "none";
};

function updateScoreboard() {
  score1.textContent = score.player1;
  score2.textContent = score.player2;
}

function showStartButton() {
  startBtn.style.display = "inline-block";
  restartBtn.style.display = "none";
}

function showRestartButton() {
  restartBtn.style.display = "inline-block";
  startBtn.style.display = "none";
}

function startGame() {
  startBtn.style.display = "none";
  restartBtn.style.display = "none";
  isGameOver = false;
  winner = "";
  if (animationId) cancelAnimationFrame(animationId);
  score.player1 = 0;
  score.player2 = 0;
  updateScoreboard();
  resetBall();
  gameLoop();
}

function resetBall(scoringPlayer = null) {
  if (scoringPlayer === "player1") {
    score.player1++;
    ball.vx = -4;
  } else if (scoringPlayer === "player2") {
    score.player2++;
    ball.vx = 4;
  } else {
    ball.vx = Math.random() > 0.5 ? 4 : -4;
  }

  if (score.player1 >= 10) {
    isGameOver = true;
    winner = "Spelare 1 vinner!";
    showRestartButton();
    return;
  }
  if (score.player2 >= 10) {
    isGameOver = true;
    winner = "Spelare 2 vinner!";
    showRestartButton();
    return;
  }

  player1.x = 100;
  player1.y = HEIGHT - playerRadius - 10;
  player1.vy = 0;
  player1.isOnGround = true;
  player1.jumpCount = 0;
  player1.rotation = 0;
  player1.isSpinning = false;

  player2.x = WIDTH - 100;
  player2.y = HEIGHT - playerRadius - 10;
  player2.vy = 0;
  player2.isOnGround = true;
  player2.jumpCount = 0;
  player2.rotation = 0;
  player2.isSpinning = false;

  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.vy = -6;

  updateScoreboard();
}

function update() {
  if (isGameOver) return;

  if (keys["a"]) player1.x -= 5;
  if (keys["d"]) player1.x += 5;
  if (keys["arrowleft"]) player2.x -= 5;
  if (keys["arrowright"]) player2.x += 5;

  [player1, player2].forEach((player) => {
    player.vy += player.gravity;
    player.y += player.vy;

    if (player.isSpinning) {
      player.rotation += 0.3;
    }

    if (player.y >= HEIGHT - playerRadius - 10) {
      player.y = HEIGHT - playerRadius - 10;
      player.vy = 0;
      player.isOnGround = true;
      player.jumpCount = 0;
      player.rotation = 0;
      player.isSpinning = false;
    } else {
      player.isOnGround = false;
    }
  });

  player1.x = Math.max(
    playerRadius,
    Math.min(WIDTH / 2 - playerRadius, player1.x)
  );
  player2.x = Math.max(
    WIDTH / 2 + playerRadius,
    Math.min(WIDTH - playerRadius, player2.x)
  );

  ball.vy += ball.gravity;
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.x - ballRadius < WIDTH / 2 && ball.x + ballRadius > WIDTH / 2) {
    if (ball.y > HEIGHT / 1.6) {
      ball.vx *= -1;
    }
  }

  if (ball.x - ballRadius < 0) {
    ball.x = ballRadius;
    ball.vx *= -1;
  }
  if (ball.x + ballRadius > WIDTH) {
    ball.x = WIDTH - ballRadius;
    ball.vx *= -1;
  }

  if (ball.y + ballRadius > HEIGHT) {
    if (ball.x < WIDTH / 2) resetBall("player2");
    else resetBall("player1");
  }

  [player1, player2].forEach((player) => {
    let dx = ball.x - player.x;
    let dy = ball.y - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    let collisionRadius = playerRadius * 2;

    if (distance < collisionRadius + ballRadius) {
      let angle = Math.atan2(dy, dx);

      let power = 12;

      ball.vx = Math.cos(angle) * power;
      ball.vy = Math.sin(angle) * power - 2;

      ball.vx += (Math.random() - 0.5) * 2;
    }
  });

  frameCounter++;
  if (frameCounter >= frameSpeed) {
    currentFrame = (currentFrame + 1) % spriteFrames;
    frameCounter = 0;
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, HEIGHT);
  ctx.lineTo(WIDTH / 2, HEIGHT / 1.6);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 10;
  ctx.stroke();

  ctx.save();
  ctx.translate(player1.x, player1.y);
  ctx.rotate(player1.rotation);
  ctx.drawImage(
    kuraSprite,
    -playerRadius * 2,
    -playerRadius * 2,
    playerRadius * 4,
    playerRadius * 4
  );
  ctx.restore();

  ctx.save();
  ctx.translate(player2.x, player2.y);
  ctx.rotate(player2.rotation);
  ctx.drawImage(
    apaSprite,
    -playerRadius * 2,
    -playerRadius * 2,
    playerRadius * 4,
    playerRadius * 4
  );
  ctx.restore();

  const ballImage = new Image();
  ballImage.src = "img/volleyball.png";
  ctx.drawImage(
    ballImage,
    ball.x - ballRadius * 2,
    ball.y - ballRadius * 2,
    ballRadius * 4,
    ballRadius * 4
  );

  if (isGameOver) {
    ctx.fillStyle = "green";
    ctx.font = "40px Arial";
    ctx.fillText(winner, WIDTH / 2 - 120, HEIGHT / 2 - 20);
  }
}

function gameLoop() {
  update();
  draw();
  if (!isGameOver) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

showStartButton();

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
