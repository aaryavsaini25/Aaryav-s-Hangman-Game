// ── index.js — Hangman game logic (no external API) ──────────────────────────
// Requires words.js to be loaded first (it exposes pickWord() globally)

function typesound(){
  const type = new Audio('lightningbulb-spacebar-click-keyboard-199448.mp3');
  type.play();
}
function playsound(){
  new Audio('freesound_community-goodresult-82807.mp3').play();
}
function playerror(){
  new Audio('u_8iuwl7zrk0-error-170796.mp3').play();
}

const currentlevel = localStorage.getItem('difficulty') || 'easy';

// Body parts revealed in order (max 7 wrong guesses)
const BODY_PARTS = [
  ["h-head"],
  ["h-body"],
  ["h-larm"],
  ["h-rarm"],
  ["h-lleg"],
  ["h-rleg"],
  ["h-leye","h-leye2","h-reye","h-reye2","h-mouth"],
];

const ROWS = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM"
];

let currentWord = "";
let currentHint = "";
let currentTopic = "";
let guessed = new Set();
let wrong = 0;
let gameOver = false;
const MAX_WRONG = 7;

// ── Keyboard ──────────────────────────────────────────────────────────────────

function buildKeyboard() {
  const kb = document.getElementById("keyboard");
  kb.innerHTML = "";
  ROWS.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.className = "key-row";
    [...row].forEach(letter => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.id = "key-" + letter;
      btn.textContent = letter;
      btn.onclick = () => {
        typesound();
        guess(letter);
      };
      rowDiv.appendChild(btn);
    });
    kb.appendChild(rowDiv);
  });
}

// ── Render helpers ────────────────────────────────────────────────────────────

function renderWord() {
  const display = document.getElementById("word-display");
  display.innerHTML = "";
  [...currentWord].forEach(ch => {
    if (ch === " ") {
      // render a spacer for multi-word entries
      const spacer = document.createElement("div");
      spacer.className = "letter-spacer";
      display.appendChild(spacer);
    } else {
      const box = document.createElement("div");
      box.className = "letter-box" + (guessed.has(ch) ? " revealed" : "");
      box.textContent = guessed.has(ch) ? ch : "";
      display.appendChild(box);
    }
  });
}

function renderWrong() {
  const el = document.getElementById("wrong-letters");
  el.innerHTML = "";
  [...guessed].filter(l => !currentWord.includes(l)).forEach(l => {
    const span = document.createElement("span");
    span.className = "wrong-letter";
    span.textContent = l;
    el.appendChild(span);
  });
}

function showBodyPart(index) {
  if (index >= BODY_PARTS.length) return;
  BODY_PARTS[index].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = "1";
  });
}

function hideAllBodyParts() {
  BODY_PARTS.flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = "0";
  });
}

function updatePips() {
  for (let i = 0; i < MAX_WRONG; i++) {
    const pip = document.getElementById("pip" + i);
    if (pip) pip.classList.toggle("lost", i < wrong);
  }
}

function checkWin() {
  return [...currentWord].filter(c => c !== " ").every(ch => guessed.has(ch));
}

// ── Guess logic ───────────────────────────────────────────────────────────────

function guess(letter) {
  if (gameOver || guessed.has(letter)) return;
  guessed.add(letter);

  const keyEl = document.getElementById("key-" + letter);

  if (currentWord.includes(letter)) {
    if (keyEl) keyEl.classList.add("right");

    if (checkWin()) {
      gameOver = true;
      const msgEl = document.getElementById("message");
      msgEl.textContent = "🎉 You saved them!";
      msgEl.className = "message win";
      disableAllKeys();
      requestAnimationFrame(() => playsound());
    }
  } else {
    if (keyEl) keyEl.classList.add("wrong");
    showBodyPart(wrong);
    wrong++;
    updatePips();

    // Shake the gallows
    const gw = document.querySelector(".gallows-wrap");
    if (gw) {
      gw.classList.remove("shake");
      void gw.offsetWidth;
      gw.classList.add("shake");
    }

    if (wrong >= MAX_WRONG) {
      gameOver = true;
      // reveal whole word
      [...currentWord].filter(c => c !== " ").forEach(ch => guessed.add(ch));
      const msgEl = document.getElementById("message");
      msgEl.textContent = `💀 The word was: ${currentWord}`;
      msgEl.className = "message lose";
      disableAllKeys();
      requestAnimationFrame(() => playerror());
    }
  }

  renderWord();
  renderWrong();
  if (keyEl) keyEl.disabled = true;
}

function disableAllKeys() {
  document.querySelectorAll(".key").forEach(k => k.disabled = true);
}

// ── New Game ──────────────────────────────────────────────────────────────────

function newGame() {
  typesound();

  // Reset state
  guessed = new Set();
  wrong = 0;
  gameOver = false;
  hideAllBodyParts();
  updatePips();

  // Pick a word from the local word bank
  const pick = pickWord(currentlevel);   // pickWord() comes from words.js
  currentWord  = pick.word;
  currentHint  = pick.hint;
  currentTopic = pick.topic;

  buildKeyboard();
  renderWord();
  renderWrong();

  // Capitalise the topic label nicely
  const topicLabel = currentTopic.charAt(0).toUpperCase() + currentTopic.slice(1);
  document.getElementById("hint-box").innerHTML =
    `<span class="topic-badge">${topicLabel}</span> ${currentHint}`;

  const msgEl = document.getElementById("message");
  msgEl.textContent = "";
  msgEl.className = "message";
}

// ── Physical keyboard support ─────────────────────────────────────────────────

document.addEventListener("keydown", e => {
  const letter = e.key.toUpperCase();
  if (/^[A-Z]$/.test(letter)) guess(letter);
});

// Start!
newGame();