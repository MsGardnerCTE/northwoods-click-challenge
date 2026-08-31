const gameArea = document.getElementById('gameArea');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const endTitle = document.getElementById('endTitle');
const endMessage = document.getElementById('endMessage');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');

const TARGET = 20;
const GAME_SECONDS = 20;

let score = 0;
let mistakes = 0;
let running = false;
let startTime = 0;
let timerFrame = null;
let spawnInterval = null;

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Prevent the browser menu from appearing inside the game area.
gameArea.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

function startGame() {
  clearGame();

  score = 0;
  mistakes = 0;
  running = true;
  startTime = performance.now();

  updateStats(GAME_SECONDS);
  startOverlay.classList.remove('visible');
  endOverlay.classList.remove('visible');

  // Start with a few balloons immediately so the game feels fast.
  spawnBalloon();
  setTimeout(() => running && spawnBalloon(), 180);
  setTimeout(() => running && spawnBalloon(), 360);

  spawnInterval = setInterval(spawnBalloon, 520);
  timerFrame = requestAnimationFrame(updateTimer);
}

function updateTimer(now) {
  if (!running) return;

  const elapsed = (now - startTime) / 1000;
  const remaining = Math.max(0, GAME_SECONDS - elapsed);
  timerEl.textContent = remaining.toFixed(1);

  if (remaining <= 0) {
    endGame(false);
    return;
  }

  timerFrame = requestAnimationFrame(updateTimer);
}

function spawnBalloon() {
  if (!running) return;

  const balloon = document.createElement('div');
  const isRed = Math.random() < 0.5;
  const color = isRed ? 'red' : 'blue';

  balloon.className = `balloon ${color}`;
  balloon.dataset.color = color;
  balloon.setAttribute('role', 'button');
  balloon.setAttribute('aria-label', `${color} balloon`);

  const areaWidth = gameArea.clientWidth;
  const balloonWidth = 74;
  const left = Math.max(4, Math.random() * (areaWidth - balloonWidth - 8));
  const speed = randomBetween(3.2, 5.2);

  balloon.style.left = `${left}px`;
  balloon.style.bottom = '-120px';
  balloon.style.animationDuration = `${speed}s`;

  balloon.addEventListener('mousedown', handleBalloonMouseDown);
  balloon.addEventListener('animationend', () => balloon.remove());

  gameArea.appendChild(balloon);
}

function handleBalloonMouseDown(event) {
  if (!running) return;

  event.preventDefault();
  event.stopPropagation();

  const balloon = event.currentTarget;
  if (balloon.dataset.popped === 'true') return;

  const color = balloon.dataset.color;
  const correct = (color === 'red' && event.button === 0) ||
                  (color === 'blue' && event.button === 2);

  if (correct) {
    balloon.dataset.popped = 'true';
    score += 1;
    scoreEl.textContent = `${score} / ${TARGET}`;
    showFeedback(event.clientX, event.clientY, '+1', true);

    balloon.classList.add('pop');
    setTimeout(() => balloon.remove(), 160);

    if (score >= TARGET) {
      endGame(true);
    }
  } else if (event.button === 0 || event.button === 2) {
    mistakes += 1;
    mistakesEl.textContent = mistakes;
    showFeedback(event.clientX, event.clientY, 'Wrong click!', false);
    balloon.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(0)' }
      ],
      { duration: 180 }
    );
  }
}

function showFeedback(clientX, clientY, text, correct) {
  const rect = gameArea.getBoundingClientRect();
  const feedback = document.createElement('div');
  feedback.className = `feedback ${correct ? 'correct' : 'wrong'}`;
  feedback.textContent = text;
  feedback.style.left = `${clientX - rect.left}px`;
  feedback.style.top = `${clientY - rect.top}px`;
  gameArea.appendChild(feedback);
  setTimeout(() => feedback.remove(), 750);
}

function endGame(won) {
  if (!running) return;

  running = false;
  clearInterval(spawnInterval);
  cancelAnimationFrame(timerFrame);

  const elapsed = Math.min(GAME_SECONDS, (performance.now() - startTime) / 1000);
  const remaining = Math.max(0, GAME_SECONDS - elapsed);

  document.querySelectorAll('.balloon').forEach((balloon) => balloon.remove());

  if (won) {
    endTitle.textContent = 'You Did It!';
    endMessage.innerHTML = `You popped all <strong>${TARGET}</strong> balloons with <strong>${remaining.toFixed(1)} seconds</strong> left.<br>Mistakes: <strong>${mistakes}</strong>`;
  } else {
    endTitle.textContent = 'Time!';
    endMessage.innerHTML = `You popped <strong>${score} of ${TARGET}</strong> balloons.<br>Mistakes: <strong>${mistakes}</strong><br>Try again and beat your score!`;
  }

  endOverlay.classList.add('visible');
}

function clearGame() {
  running = false;
  clearInterval(spawnInterval);
  cancelAnimationFrame(timerFrame);

  document.querySelectorAll('.balloon, .feedback').forEach((element) => element.remove());
}

function updateStats(time) {
  scoreEl.textContent = `0 / ${TARGET}`;
  mistakesEl.textContent = '0';
  timerEl.textContent = Number(time).toFixed(1);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
