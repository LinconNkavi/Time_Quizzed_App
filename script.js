// --- CONFIGURATION ---
const QUESTION_TIME_LIMIT = 50; // <--- CHANGE THIS NUMBER ANY TIME YOU WANT (e.g., 20, 30, etc.)

// --- APPLICATION STATE ---
let state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  timer: QUESTION_TIME_LIMIT,
  timerInterval: null,
  totalTimeElapsed: 0,
  globalTimerInterval: null,
  userAnswers: [], 
  missedQuestions: [],
  isPaused: false
};


// --- DOM ELEMENTS ---
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const startBtn = document.getElementById('start-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

const questionTracker = document.getElementById('question-tracker');
const timerDisplay = document.getElementById('timer-display');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const alertBanner = document.getElementById('alert-banner');

const leaderboardList = document.getElementById('leaderboard-list');
const finalScore = document.getElementById('final-score');
const finalPercentage = document.getElementById('final-percentage');
const totalTime = document.getElementById('total-time');
const reviewContainer = document.getElementById('review-container');
const saveScoreForm = document.getElementById('save-score-form');

// Custom Modal Elements
const customModal = document.getElementById('custom-modal');
const modalMessage = document.getElementById('modal-message');
const modalYesBtn = document.getElementById('modal-yes-btn');
const modalNoBtn = document.getElementById('modal-no-btn');

// --- HELPER: CUSTOM YES/NO MODAL ---
function showCustomModal(message, onYes) {
  modalMessage.textContent = message;
  customModal.classList.remove('hidden');

  // Remove old event listeners to prevent duplicate triggers
  const newYesBtn = modalYesBtn.cloneNode(true);
  const newNoBtn = modalNoBtn.cloneNode(true);
  modalYesBtn.parentNode.replaceChild(newYesBtn, modalYesBtn);
  modalNoBtn.parentNode.replaceChild(newNoBtn, modalNoBtn);

  // Re-assign references
  const activeYesBtn = document.getElementById('modal-yes-btn');
  const activeNoBtn = document.getElementById('modal-no-btn');

  activeYesBtn.addEventListener('click', () => {
    customModal.classList.add('hidden');
    onYes();
  });

  activeNoBtn.addEventListener('click', () => {
    customModal.classList.add('hidden');
  });
}

// --- HELPER FUNCTIONS ---
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initQuiz() {
  const preparedQuestions = shuffle(rawQuestions).map(q => ({
    ...q,
    options: shuffle(q.options)
  }));

  state = {
    questions: preparedQuestions,
    currentIndex: 0,
    score: 0,
    timer: 15,
    timerInterval: null,
    totalTimeElapsed: 0,
    globalTimerInterval: null,
    userAnswers: new Array(preparedQuestions.length).fill(null),
    missedQuestions: [],
    isPaused: false
  };

  pauseBtn.textContent = '⏸️ Pause';

  state.globalTimerInterval = setInterval(() => {
    if (!state.isPaused) {
      state.totalTimeElapsed++;
    }
  }, 1000);
}

// --- TIMER CONTROLS ---
function startQuestionTimer() {
  clearInterval(state.timerInterval);
  state.timer = QUESTION_TIME_LIMIT; // Uses your configuration constant
  timerDisplay.textContent = `⏳ ${state.timer}s`;

  state.timerInterval = setInterval(() => {
    if (!state.isPaused) {
      state.timer--;
      timerDisplay.textContent = `⏳ ${state.timer}s`;

      if (state.timer <= 0) {
        clearInterval(state.timerInterval);
        handleTimeout();
      }
    }
  }, 1000);
}

function stopQuestionTimer() {
  clearInterval(state.timerInterval);
}

// --- PAUSE / RESUME LOGIC ---
function togglePause() {
  const attempted = state.userAnswers[state.currentIndex] !== null;
  if (attempted) return; 

  state.isPaused = !state.isPaused;
  const buttons = optionsContainer.querySelectorAll('.option-btn');

  if (state.isPaused) {
    pauseBtn.textContent = '▶️ Resume';
    timerDisplay.textContent = `⏳ Paused`;
    buttons.forEach(btn => btn.disabled = true);
  } else {
    pauseBtn.textContent = '⏸️ Pause';
    timerDisplay.textContent = `⏳ ${state.timer}s`;
    buttons.forEach(btn => btn.disabled = false);
  }
}

// --- TIMEOUT LOGIC ---
function handleTimeout() {
  stopQuestionTimer();
  
  state.userAnswers[state.currentIndex] = {
    selected: "Timed Out (No Answer)",
    isCorrect: false
  };

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  } else {
    showResults();
  }
}

// --- UI RENDER FUNCTIONS ---
function renderQuestion() {
  state.isPaused = false;
  pauseBtn.textContent = '⏸️ Pause';

  const currentQ = state.questions[state.currentIndex];
  const attempted = state.userAnswers[state.currentIndex] !== null;

  questionTracker.textContent = `Question ${state.currentIndex + 1} / ${state.questions.length}`;
  questionText.textContent = currentQ.question;
  optionsContainer.innerHTML = '';

  if (state.currentIndex === 0) {
    prevBtn.classList.add('hidden');
  } else {
    prevBtn.classList.remove('hidden');
  }

  if (state.currentIndex === state.questions.length - 1) {
    nextBtn.textContent = 'Submit';
    nextBtn.classList.add('btn-submit');
  } else {
    nextBtn.textContent = 'Next';
    nextBtn.classList.remove('btn-submit');
  }

  if (attempted) {
    alertBanner.classList.remove('hidden');
    stopQuestionTimer();
    timerDisplay.textContent = `⏳ Locked`;
    pauseBtn.classList.add('hidden');
  } else {
    alertBanner.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
    startQuestionTimer();
  }

  currentQ.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;

    if (attempted) {
      btn.disabled = true;
      const userAns = state.userAnswers[state.currentIndex];
      if (opt === currentQ.answer) {
        btn.classList.add('correct');
      }
      if (userAns && opt === userAns.selected && !userAns.isCorrect) {
        btn.classList.add('incorrect');
      }
    } else {
      btn.addEventListener('click', () => handleOptionSelect(opt, btn));
    }

    optionsContainer.appendChild(btn);
  });
}

function handleOptionSelect(selectedOption, clickedBtn) {
  stopQuestionTimer();
  const currentQ = state.questions[state.currentIndex];
  const isCorrect = selectedOption === currentQ.answer;

  const buttons = optionsContainer.querySelectorAll('.option-btn');
  buttons.forEach(btn => btn.disabled = true);

  if (isCorrect) {
    clickedBtn.classList.add('correct');
    state.score++;
  } else {
    clickedBtn.classList.add('incorrect');
    buttons.forEach(btn => {
      if (btn.textContent === currentQ.answer) {
        btn.classList.add('correct');
      }
    });
  }

  state.userAnswers[state.currentIndex] = {
    selected: selectedOption,
    isCorrect: isCorrect
  };
}

function showResults() {
  stopQuestionTimer();
  clearInterval(state.globalTimerInterval);

  quizScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  // Automatically build review list with question numbers (index + 1)
  state.missedQuestions = [];
  state.questions.forEach((q, index) => {
    const ans = state.userAnswers[index];
    if (!ans || !ans.isCorrect) {
      state.missedQuestions.push({
        questionNumber: index + 1, // Stores the actual question number
        question: q.question,
        userAnswer: ans ? ans.selected : "Skipped (No Answer)",
        correctAnswer: q.answer
      });
    }
  });

  const percentage = Math.round((state.score / state.questions.length) * 100);
  finalScore.textContent = `${state.score} / ${state.questions.length}`;
  finalPercentage.textContent = `${percentage}%`;
  totalTime.textContent = state.totalTimeElapsed;

  reviewContainer.innerHTML = '';
  if (state.missedQuestions.length === 0) {
    reviewContainer.innerHTML = `
      <div style="text-align: center; padding: 10px;">
        <img src="congrats.jpg" alt="Perfect Score" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 8px; border: 2px solid #0fd461;" />
        <p style="color:#0fd461; font-weight: bold;">Congratulations! No missed questions to review.</p>
      </div>
    `;
  } else {
    state.missedQuestions.forEach(item => {
      const div = document.createElement('div');
      div.className = 'review-card';
      div.innerHTML = `
        <p><strong>Question ${item.questionNumber}: ${item.question}</strong></p>
        <p style="color: #ef4444;">❌ Your Answer: ${item.userAnswer}</p>
        <p style="color: #0fd461;">✅ Correct Answer: ${item.correctAnswer}</p>
      `;
      reviewContainer.appendChild(div);
    });
  }
}

function loadLeaderboard() {
  const rawScores = JSON.parse(localStorage.getItem('quiz_leaderboard')) || [];
  
  const validScores = rawScores.filter(item => 
    item && typeof item.name === 'string' && typeof item.percentage === 'number' && !isNaN(item.percentage)
  );

  validScores.sort((a, b) => b.percentage - a.percentage);
  const top5 = validScores.slice(0, 5);
  
  leaderboardList.innerHTML = '';
  if (top5.length === 0) {
    leaderboardList.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center;">No high scores recorded yet.</td>
      </tr>
    `;
  } else {
    top5.forEach(entry => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${entry.name}</td>
        <td>${entry.percentage}% (${entry.score}/${entry.total})</td>
        <td>${entry.time}s</td>
      `;
      leaderboardList.appendChild(tr);
    });
  }
}

function saveHighScore(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('username');
  const name = usernameInput.value.trim();

  if (!name) return;

  // Name validation using standard alert with an OK button
  if (/\d/.test(name)) {
    alert("Names cannot contain numbers!");
    usernameInput.value = ''; // Clear the input box
    usernameInput.focus();   // Put the cursor back in the box
    return;
  }

  const percentage = Math.round((state.score / state.questions.length) * 100);
  const newEntry = {
    name: name,
    score: state.score,
    total: state.questions.length,
    percentage: percentage,
    time: state.totalTimeElapsed
  };

  const rawScores = JSON.parse(localStorage.getItem('quiz_leaderboard')) || [];
  const cleanScores = rawScores.filter(item => item && typeof item.percentage === 'number' && !isNaN(item.percentage));
  
  cleanScores.push(newEntry);
  localStorage.setItem('quiz_leaderboard', JSON.stringify(cleanScores));

  usernameInput.value = '';
  saveScoreForm.classList.add('hidden');
  loadLeaderboard();
  resetToHome();

}

function resetToHome() {
  stopQuestionTimer();
  clearInterval(state.globalTimerInterval);

  resultScreen.classList.add('hidden');
  quizScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  saveScoreForm.classList.remove('hidden');

  loadLeaderboard();
}

// --- THEME TOGGLE LOGIC ---
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  themeToggleBtn.textContent = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
}

// --- EVENT LISTENERS ---

startBtn.addEventListener('click', () => {
  initQuiz();
  startScreen.classList.add('hidden');
  quizScreen.classList.remove('hidden');
  renderQuestion();
});

prevBtn.addEventListener('click', () => {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
  }
});

// Next Button with Custom Yes/No Modal for Unanswered Questions
nextBtn.addEventListener('click', () => {
  const attempted = state.userAnswers[state.currentIndex] !== null;

  if (!attempted) {
    showCustomModal("Are you sure you want to proceed without an answer?", () => {
      // User clicked Yes
      state.userAnswers[state.currentIndex] = {
        selected: "Skipped (No Answer)",
        isCorrect: false
      };

      if (state.currentIndex < state.questions.length - 1) {
        state.currentIndex++;
        renderQuestion();
      } else {
        showResults();
      }
    });
    return; // Pause navigation until modal decision is made
  }

  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
  } else {
    showResults();
  }
});

pauseBtn.addEventListener('click', togglePause);
themeToggleBtn.addEventListener('click', toggleTheme);

restartBtn.addEventListener('click', resetToHome);
saveScoreForm.addEventListener('submit', saveHighScore);

// Initial load
loadLeaderboard();
