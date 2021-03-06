let endAudio, incorrectAudio, correctAudio;
loadAudios();
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

function loadConfig() {
  if (localStorage.getItem('darkMode') == 1) {
    document.documentElement.dataset.theme = 'dark';
  }
}
loadConfig();

function toggleDarkMode() {
  if (localStorage.getItem('darkMode') == 1) {
    localStorage.setItem('darkMode', 0);
    delete document.documentElement.dataset.theme;
  } else {
    localStorage.setItem('darkMode', 1);
    document.documentElement.dataset.theme = 'dark';
  }
}

function playAudio(audioBuffer, volume) {
  const audioSource = audioContext.createBufferSource();
  audioSource.buffer = audioBuffer;
  if (volume) {
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    audioSource.connect(gainNode);
    audioSource.start();
  } else {
    audioSource.connect(audioContext.destination);
    audioSource.start();
  }
}

function unlockAudio() {
  audioContext.resume();
}

function loadAudio(url) {
  return fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
      return new Promise((resolve, reject) => {
        audioContext.decodeAudioData(arrayBuffer, (audioBuffer) => {
          resolve(audioBuffer);
        }, (err) => {
          reject(err);
        });
      });
    });
}

function loadAudios() {
  promises = [
    loadAudio('mp3/end.mp3'),
    loadAudio('mp3/incorrect1.mp3'),
    loadAudio('mp3/correct3.mp3'),
  ];
  Promise.all(promises).then(audioBuffers => {
    endAudio = audioBuffers[0];
    incorrectAudio = audioBuffers[1];
    correctAudio = audioBuffers[2];
  });
}

function isEqual(arr1, arr2) {
  for (var i=0; i<arr1.length; i++) {
    if (arr1[i] != arr2[i]) {
      return false;
    }
  }
  return true;
}

// +-*/のテストデータ生成範囲を返却
function getNumRange(grade) {
  switch(grade) {
    case 1: return [ 8,2,      8, 2,    0,0,   0,0];
    case 2: return [28,6,     28, 6,    8,2,   0,0];
    case 3: return [38,11,    38,11,    8,2,   8,2];
    case 4: return [38,11,    38,11,   12,2,  16,4];
    case 5: return [99,50,    99,50,   16,4,  20,6];
    case 6: return [99,50,    99,50,   14,6,  20,8];
    default:return [388,111, 388,111,  12,8,  20,11];
  }
}

let answers = new Array(3);
function generateData() {
  const grade = document.getElementById('gradeOption').selectedIndex + 1;
  const course = document.getElementById('courseOption').selectedIndex - 1;
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
  switch(s) {
    case 0:
      a = Math.floor(Math.random() * range[0] + range[1]);
      b = Math.floor(Math.random() * range[0] + range[1]);
      c = a + b;
      x = '＋';
      break;
    case 1:
      b = Math.floor(Math.random() * range[2] + range[3]);
      c = Math.floor(Math.random() * range[2] + range[3]);
      a = b + c;
      x = '−';
      break;
    case 2:
      a = Math.floor(Math.random() * range[4] + range[5]);
      b = Math.floor(Math.random() * range[4] + range[5]);
      c = a * b;
      x = '×';
      break;
    case 3:
      b = Math.floor(Math.random() * range[6] + range[7]);
      c = Math.floor(Math.random() * range[6] + range[7]);
      a = b * c;
      x = '÷';
      break;
    default:
      console.log('error');
  }
  var num = document.getElementById('num');
  num.innerText = `${a}${x}${b}＝`;
  document.getElementById('reply').dataset.answer = c;
}

let gameTimer;
function startGameTimer() {
  clearInterval(gameTimer);
  var timeNode = document.getElementById('time');
  timeNode.innerText = '180秒 / 180秒';
  gameTimer = setInterval(function() {
    var arr = timeNode.innerText.split('秒 /');
    var t = parseInt(arr[0]);
    if (t > 0) {
      timeNode.innerText = (t-1) + '秒 /' + arr[1];
    } else {
      clearInterval(gameTimer);
      playAudio(endAudio);
      playPanel.classList.add('d-none');
      scorePanel.classList.remove('d-none');
    }
  }, 1000);
}

let countdownTimer;
function countdown() {
  clearTimeout(countdownTimer);
  gameStart.classList.remove('d-none');
  playPanel.classList.add('d-none');
  scorePanel.classList.add('d-none');
  var counter = document.getElementById('counter');
  counter.innerText = 3;
  countdownTimer = setInterval(function(){
    var colors = ['skyblue', 'greenyellow', 'violet', 'tomato'];
    if (parseInt(counter.innerText) > 1) {
      var t = parseInt(counter.innerText) - 1;
      counter.style.backgroundColor = colors[t];
      counter.innerText = t;
    } else {
      clearTimeout(countdownTimer);
      gameStart.classList.add('d-none');
      playPanel.classList.remove('d-none');
      document.getElementById('score').innerText = 0;
      generateData();
      startGameTimer();
    }
  }, 1000);
}

function initCalc() {
  var replyObj = document.getElementById('reply');
  var scoreObj = document.getElementById('score');
  document.getElementById('be').onclick = function() {
    var reply = replyObj.innerText;
    var answer = replyObj.dataset.answer;
    if (answer == reply) {
      playAudio(correctAudio);
      replyObj.innerText = '';
      scoreObj.innerText = parseInt(scoreObj.innerText) + 1;
      generateData();
    } else {
      playAudio(incorrectAudio);
    }
  }
  document.getElementById('bc').onclick = function() {
    replyObj.innerText = '';
  }
  for (var i=0; i<10; i++) {
    document.getElementById('b' + i).onclick = function() {
      var reply = replyObj.innerText;
      reply += this.getAttribute('id').slice(-1);
      if (reply.length > 3) {
        reply = reply.slice(1, 4);
      }
      replyObj.innerText = reply;
      var answer = replyObj.dataset.answer;
      if (answer == reply) {
        playAudio(correctAudio);
        replyObj.innerText = '';
        scoreObj.innerText = parseInt(scoreObj.innerText) + 1;
        generateData();
      }
    }
  }
}


initCalc();
generateData();
document.addEventListener('click', unlockAudio, { once:true, useCapture:true });

