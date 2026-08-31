const arena = document.getElementById('arena');
const overlay = document.getElementById('overlay');

const ui = {
  level: document.getElementById('level'),
  score: document.getElementById('score'),
  time: document.getElementById('time'),
  popped: document.getElementById('popped'),
  accuracy: document.getElementById('accuracy'),
  streak: document.getElementById('streak')
};

const levels = [
  {name:'ROOKIE FLIGHT', seconds:42, target:18, spawn:1050, speed:[6.2,8.2], size:82, desc:'Learn the controls. Red left, blue right.'},
  {name:'NIGHTHAWK RUN', seconds:44, target:22, spawn:900, speed:[5.4,7.4], size:76, desc:'More balloons. Keep your accuracy high.'},
  {name:'SPEED ROUND', seconds:44, target:25, spawn:760, speed:[4.6,6.3], size:70, desc:'Faster balloons and less reaction time.'},
  {name:'PRECISION', seconds:46, target:24, spawn:820, speed:[4.8,6.5], size:54, desc:'Smaller targets test mouse precision.'},
  {name:'NIGHTHAWK ELITE', seconds:48, target:30, spawn:650, speed:[4.0,5.8], size:62, desc:'Everything combined. Earn Elite status!'}
];

let L = 0;
let score = 0;
let popped = 0;
let totalClicks = 0;
let correct = 0;
let streak = 0;
let bestStreak = 0;
let mistakes = 0;
let time = 0;
let spawnTimer;
let countTimer;
let running = false;
let sound = true;
let levelPops = 0;

function beep(freq=500, duration=.05) {
  if (!sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const a = new Ctx();
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(a.destination);
    g.gain.value = .035;
    o.start();
    o.stop(a.currentTime + duration);
  } catch (e) {}
}

document.getElementById('soundBtn').addEventListener('click', e => {
  sound = !sound;
  e.currentTarget.textContent = 'Sound: ' + (sound ? 'On' : 'Off');
});

function accuracy() {
  return totalClicks ? Math.round((correct / totalClicks) * 100) : 100;
}

function update() {
  ui.level.textContent = `${L + 1}/5`;
  ui.score.textContent = score;
  ui.time.textContent = `${time}s`;
  ui.popped.textContent = `${levelPops}/${levels[L].target}`;
  ui.accuracy.textContent = `${accuracy()}%`;
  ui.streak.textContent = streak;
}

function toast(text) {
  const x = document.getElementById('toast');
  x.textContent = text;
  x.classList.remove('show');
  void x.offsetWidth;
  x.classList.add('show');
}

function clearBalloons() {
  arena.querySelectorAll('.balloon').forEach(x => x.remove());
}

function showCard(title, body, buttonText, onClick) {
  overlay.innerHTML = `<div class="card"><h2>${title}</h2>${body}<button id="cardBtn">${buttonText}</button></div>`;
  overlay.classList.remove('hidden');
  document.getElementById('cardBtn').addEventListener('click', onClick, {once:true});
}

function beginQuest() {
  L = 0;
  score = 0;
  popped = 0;
  totalClicks = 0;
  correct = 0;
  streak = 0;
  bestStreak = 0;
  mistakes = 0;
  beginLevel();
}

function beginLevel() {
  clearInterval(spawnTimer);
  clearInterval(countTimer);
  clearBalloons();
  running = false;
  levelPops = 0;

  const x = levels[L];
  time = x.seconds;
  update();

  showCard(
    `LEVEL ${L + 1}: ${x.name}`,
    `<p>${x.desc}</p><p><b>Goal:</b> Pop ${x.target} balloons in ${x.seconds} seconds.</p>`,
    `START LEVEL ${L + 1}`,
    startCurrentLevel
  );
}

function startCurrentLevel() {
  overlay.classList.add('hidden');
  running = true;
  const x = levels[L];
  spawn();
  spawnTimer = setInterval(spawn, x.spawn);
  countTimer = setInterval(() => {
    time--;
    update();
    if (time <= 0) finishLevel(false);
  }, 1000);
}

function spawn() {
  if (!running) return;
  const x = levels[L];
  const b = document.createElement('div');
  const r = Math.random();
  const type = r < .43 ? 'red' : r < .86 ? 'blue' : r < .93 ? 'gold' : 'black';

  b.className = `balloon ${type}`;
  b.dataset.type = type;

  const sz = x.size * (.86 + Math.random() * .28);
  b.style.width = `${sz}px`;
  b.style.height = `${sz * 1.22}px`;
  b.style.left = `${Math.random() * Math.max(10, arena.clientWidth - sz - 10) + 5}px`;
  b.style.bottom = `${-sz * 1.3}px`;
  arena.appendChild(b);

  let y = -sz * 1.3;
  const speed = x.speed[0] + Math.random() * (x.speed[1] - x.speed[0]);

  const anim = setInterval(() => {
    if (!running || !b.isConnected) {
      clearInterval(anim);
      return;
    }
    y += 2.3;
    b.style.bottom = `${y}px`;
    if (y > arena.clientHeight + 20) {
      clearInterval(anim);
      b.remove();
    }
  }, speed);

  b.addEventListener('contextmenu', e => e.preventDefault());
  b.addEventListener('mousedown', e => {
    e.preventDefault();
    if (!running) return;
    handle(b, e.button);
  });
}

function handle(b, button) {
  const t = b.dataset.type;
  totalClicks++;

  const ok =
    (t === 'red' && button === 0) ||
    (t === 'blue' && button === 2) ||
    (t === 'gold' && (button === 0 || button === 2));

  if (t === 'black') {
    mistakes++;
    streak = 0;
    score = Math.max(0, score - 100);
    toast('💣 DECOY! -100');
    beep(140, .12);
    b.remove();
    update();
    return;
  }

  if (ok) {
    correct++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    const pts = t === 'gold' ? 300 : 100 + Math.min(streak, 10) * 10;
    score += pts;
    levelPops++;
    popped++;

    b.classList.add('pop');
    setTimeout(() => b.remove(), 160);
    beep(t === 'gold' ? 900 : 620);

    if (t === 'gold') toast('⭐ BONUS +300!');
    else if ([5, 10, 15].includes(streak)) toast(`🔥 ${streak} CLICK STREAK!`);

    update();

    if (levelPops >= levels[L].target) {
      finishLevel(true);
    }
  } else {
    mistakes++;
    streak = 0;
    score = Math.max(0, score - 50);
    toast('WRONG CLICK -50');
    beep(180, .09);
    update();
  }
}

function finishLevel(success) {
  if (!running) return;

  running = false;
  clearInterval(spawnTimer);
  clearInterval(countTimer);
  clearBalloons();

  if (!success) {
    showCard(
      `LEVEL ${L + 1} NOT CLEARED`,
      `<p>You popped <b>${levelPops}/${levels[L].target}</b>.</p><p>Retry this level to continue your quest.</p>`,
      'RETRY LEVEL',
      beginLevel
    );
    return;
  }

  score += time * 20;
  update();

  if (L < levels.length - 1) {
    const completed = L + 1;
    const next = L + 2;
    showCard(
      `LEVEL ${completed} COMPLETE!`,
      `<p>You cleared <b>${levels[L].name}</b>.</p><p>Score: <b>${score}</b> &nbsp; Accuracy: <b>${accuracy()}%</b></p><p><b>Next:</b> Level ${next} of 5</p>`,
      `NEXT LEVEL → LEVEL ${next}`,
      () => {
        L++;
        beginLevel();
      }
    );
  } else {
    finishQuest();
  }
}

function finishQuest() {
  const acc = accuracy();
  const rank = acc >= 95 && mistakes <= 5
    ? '🏆 NIGHTHAWK ELITE'
    : acc >= 90
      ? '🥇 NIGHTHAWK ACE'
      : acc >= 82
        ? '🥈 NIGHTHAWK PRO'
        : acc >= 72
          ? '🥉 NIGHTHAWK FLYER'
          : '🏅 NIGHTHAWK ROOKIE';

  showCard(
    'ALL 5 LEVELS COMPLETE!',
    `<p style="font-size:25px"><b>${rank}</b></p><p>Final Score: <b>${score}</b><br>Accuracy: <b>${acc}%</b><br>Total Balloons: <b>${popped}</b><br>Best Streak: <b>${bestStreak}</b><br>Mistakes: <b>${mistakes}</b></p>`,
    'PLAY AGAIN',
    beginQuest
  );
}

document.getElementById('startBtn').addEventListener('click', beginQuest);
arena.addEventListener('contextmenu', e => e.preventDefault());
update();
