const countPanel = document.getElementById("countPanel");
const infoPanel = document.getElementById("infoPanel");
const playPanel = document.getElementById("playPanel");
const scorePanel = document.getElementById("scorePanel");
const gameTime = 180;
let gameTimer;
let hinted = false;
let correctCount = 0;
let audioContext;
const audioBufferCache = {};
loadConfig();

function loadConfig() {
  if (localStorage.getItem("darkMode") == 1) {
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function toggleDarkMode() {
  if (localStorage.getItem("darkMode") == 1) {
    localStorage.setItem("darkMode", 0);
    document.documentElement.setAttribute("data-bs-theme", "light");
  } else {
    localStorage.setItem("darkMode", 1);
    document.documentElement.setAttribute("data-bs-theme", "dark");
  }
}

function createAudioContext() {
  if (globalThis.AudioContext) {
    return new globalThis.AudioContext();
  } else {
    console.error("Web Audio API is not supported in this browser");
    return null;
  }
}

function unlockAudio() {
  if (audioContext) {
    audioContext.resume();
  } else {
    audioContext = createAudioContext();
    loadAudio("end", "mp3/end.mp3");
    loadAudio("correct", "mp3/correct3.mp3");
    loadAudio("incorrect", "mp3/incorrect1.mp3");
  }
  document.removeEventListener("pointerdown", unlockAudio);
  document.removeEventListener("keydown", unlockAudio);
}

async function loadAudio(name, url) {
  if (!audioContext) return;
  if (audioBufferCache[name]) return audioBufferCache[name];
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[name] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Loading audio ${name} error:`, error);
    throw error;
  }
}

function playAudio(name, volume) {
  if (!audioContext) return;
  const audioBuffer = audioBufferCache[name];
  if (!audioBuffer) {
    console.error(`Audio ${name} is not found in cache`);
    return;
  }
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  const gainNode = audioContext.createGain();
  if (volume) gainNode.gain.value = volume;
  gainNode.connect(audioContext.destination);
  sourceNode.connect(gainNode);
  sourceNode.start();
}

// +-*/のテストデータ生成範囲を返却
function getNumRange(grade) {
  switch (grade) {
    case 1:
      return [8, 2, 8, 2, 0, 0, 0, 0];
    case 2:
      return [28, 6, 28, 6, 8, 2, 0, 0];
    case 3:
      return [38, 11, 38, 11, 8, 2, 8, 2];
    case 4:
      return [38, 11, 38, 11, 12, 2, 16, 4];
    case 5:
      return [99, 50, 99, 50, 16, 4, 20, 6];
    case 6:
      return [99, 50, 99, 50, 14, 6, 20, 8];
    case 7:
      return [388, 111, 388, 111, 12, 8, 20, 11];
    default:
      return [8888, 1111, 8888, 1111, 88, 11, 88, 11];
  }
}

function generateData() {
  hinted = false;
  const grade = document.getElementById("gradeOption").selectedIndex + 1;
  const course = document.getElementById("courseOption").selectedIndex - 1;
  const range = getNumRange(grade);
  let a, b, c, x, s;
  if (course < 0) {
    if (grade == 1) {
      s = Math.floor(Math.random() * 2);
    } else if (grade == 2) {
      s = Math.floor(Math.random() * 3);
    } else {
      s = Math.floor(Math.random() * 4);
    }
  } else {
    s = course;
  }
  switch (s) {
    case 0:
      a = Math.floor(Math.random() * range[0] + range[1]);
      b = Math.floor(Math.random() * range[0] + range[1]);
      c = a + b;
      x = "＋";
      break;
    case 1:
      b = Math.floor(Math.random() * range[2] + range[3]);
      c = Math.floor(Math.random() * range[2] + range[3]);
      a = b + c;
      x = "−";
      break;
    case 2:
      a = Math.floor(Math.random() * range[4] + range[5]);
      b = Math.floor(Math.random() * range[4] + range[5]);
      c = a * b;
      x = "×";
      break;
    case 3:
      b = Math.floor(Math.random() * range[6] + range[7]);
      c = Math.floor(Math.random() * range[6] + range[7]);
      a = b * c;
      x = "÷";
      break;
    default:
      console.log("error");
  }
  const num = document.getElementById("num");
  num.textContent = `${a}${x}${b}＝`;
  document.getElementById("reply").dataset.answer = c;
}

function countdown() {
  correctCount = 0;
  countPanel.classList.remove("d-none");
  playPanel.classList.add("d-none");
  infoPanel.classList.add("d-none");
  scorePanel.classList.add("d-none");
  const counter = document.getElementById("counter");
  counter.textContent = 3;
  const timer = setInterval(() => {
    const colors = ["skyblue", "greenyellow", "violet", "tomato"];
    if (parseInt(counter.textContent) > 1) {
      const t = parseInt(counter.textContent) - 1;
      counter.style.backgroundColor = colors[t];
      counter.textContent = t;
    } else {
      clearInterval(timer);
      countPanel.classList.add("d-none");
      playPanel.classList.remove("d-none");
      infoPanel.classList.remove("d-none");
      generateData();
      startGameTimer();
    }
  }, 1000);
}

function startGame() {
  clearInterval(gameTimer);
  initTime();
  countdown();
}

function startGameTimer() {
  const timeNode = document.getElementById("time");
  initTime();
  gameTimer = setInterval(() => {
    const t = parseInt(timeNode.textContent);
    if (t > 0) {
      timeNode.textContent = t - 1;
    } else {
      clearInterval(gameTimer);
      playAudio("end");
      playPanel.classList.add("d-none");
      scorePanel.classList.remove("d-none");
      scoring();
    }
  }, 1000);
}

function initTime() {
  document.getElementById("time").textContent = gameTime;
}

function scoring() {
  document.getElementById("score").textContent = correctCount;
}

function initCalc() {
  const replyObj = document.getElementById("reply");
  document.getElementById("be").onclick = () => {
    if (!hinted) {
      hinted = true;
      replyObj.textContent = replyObj.dataset.answer;
    }
    playAudio("incorrect", 0.3);
    setTimeout(() => {
      replyObj.textContent = "";
      generateData();
    }, 3000);
  };
  document.getElementById("bc").onclick = () => {
    replyObj.textContent = "";
  };
  for (let i = 0; i < 10; i++) {
    document.getElementById("b" + i).onclick = (event) => {
      let reply = replyObj.textContent;
      reply += event.target.getAttribute("id").slice(-1);
      if (reply.length > 6) {
        reply = reply.slice(1, 7);
      }
      replyObj.textContent = reply;
      const answer = replyObj.dataset.answer;
      if (answer == reply) {
        playAudio("correct", 0.3);
        replyObj.textContent = "";
        if (!hinted) correctCount += 1;
        generateData();
      }
    };
  }
}

initCalc();
generateData();

document.getElementById("toggleDarkMode").onclick = toggleDarkMode;
document.getElementById("startButton").onclick = startGame;
document.getElementById("restartButton").onclick = startGame;
document.addEventListener("pointerdown", unlockAudio, { once: true });
document.addEventListener("keydown", unlockAudio, { once: true });
