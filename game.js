const gameArea = document.getElementById('gameArea');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const startOverlay = document.getElementById('startOverlay');
const endOverlay = document.getElementById('endOverlay');
const endTitle = document.getElementById('endTitle');
const endMessage = document.getElementById('endMessage');
const ratingEl = document.getElementById('rating');
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');

const TARGET = 20;
const GAME_SECONDS = 20;

let score = 0;
let mistakes = 0;
let totalClicks = 0;
let running = false;
let startTime = 0;
let timerFrame = null;
let spawnInterval = null;

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

gameArea.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

function startGame() {
  clearGame();

  score = 0;
  mistakes = 0;
  totalClicks = 0;
  running = true;
  startTime = performance.now();

  updateStats(GAME_SECONDS);
  startOverlay.classList.remove('visible');
  endOverlay.classList.remove('visible');

  spawnBalloon();
  setTimeout(() => running && spawnBalloon(), 180);
  setTimeout(() => running && spawnBalloon(), 360);

  spawnInterval = setInterval(spawnBalloon, 500);
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
  const color = Math.random() < 0.5 ? 'red' : 'blue';

  balloon.className = `balloon ${color}`;
  balloon.dataset.color = color;
  balloon.setAttribute('role', 'button');
  balloon.setAttribute('aria-label', `${color} balloon`);

  const areaWidth = gameArea.clientWidth;
  const balloonWidth = window.innerWidth <= 760 ? 66 : 74;
  const left = Math.max(5, Math.random() * (areaWidth - balloonWidth - 10));
  const speed = randomBetween(3.0, 4.9);

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

  if (event.button !== 0 && event.button !== 2) return;

  totalClicks += 1;

  const color = balloon.dataset.color;
  const correct =
    (color === 'red' && event.button === 0) ||
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
  } else {
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
  const accuracy = totalClicks === 0 ? 0 : Math.round((score / totalClicks) * 100);

  document.querySelectorAll('.balloon').forEach((balloon) => balloon.remove());

  if (won) {
    endTitle.textContent = 'Challenge Complete!';
    endMessage.innerHTML = `You popped <strong>${score} of ${TARGET}</strong> balloons in <strong>${elapsed.toFixed(1)} seconds</strong>.<br>Accuracy: <strong>${accuracy}%</strong> • Mistakes: <strong>${mistakes}</strong>`;
  } else {
    endTitle.textContent = 'Time!';
    endMessage.innerHTML = `You popped <strong>${score} of ${TARGET}</strong> balloons.<br>Accuracy: <strong>${accuracy}%</strong> • Mistakes: <strong>${mistakes}</strong><br>Try again and beat your score!`;
  }

  ratingEl.textContent = getRating(won, accuracy, mistakes, remaining);
  endOverlay.classList.add('visible');
}

function getRating(won, accuracy, mistakes, remaining) {
  if (won && accuracy === 100 && mistakes === 0 && remaining >= 5) return '🏆 CLICK MASTER';
  if (won && accuracy >= 95) return '⭐ SHARP SHOOTER';
  if (won) return '🎯 CLICK CHAMP';
  if (accuracy >= 85) return '💪 ALMOST THERE';
  return '🚀 KEEP PRACTICING';
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
  ratingEl.textContent = '';
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
