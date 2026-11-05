// --- APPLICATION STATE ---
let state = {
  questions: [],
  currentIndex: 0,
  score: 0,
  timer: 15,
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
  
  // Mark current unattempted question as null (skipped)
  state.userAnswers[state.currentIndex] = null;

  // Jump straight to next question or results without showing answers
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
    nextBtn.textContent = 'Submit ✅';
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

// --- RESULTS & LEADERBOARD (Dynamically collects incorrect & skipped questions) ---

function showResults() {
  stopQuestionTimer();
  clearInterval(state.globalTimerInterval);

  quizScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  // Automatically build review list for both incorrect AND skipped (null) answers
  state.missedQuestions = [];
  state.questions.forEach((q, index) => {
    const ans = state.userAnswers[index];
    if (!ans || !ans.isCorrect) {
      state.missedQuestions.push({
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
    reviewContainer.innerHTML = '<p style="color:#0fd461; text-align:center;">🎉 Perfect score! No missed questions to review.</p>';
  } else {
    state.missedQuestions.forEach(item => {
      const div = document.createElement('div');
      div.className = 'review-card';
      div.innerHTML = `
        <p><strong>Q: ${item.question}</strong></p>
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
    leaderboardList.innerHTML = '<li>No high scores recorded yet.</li>';
  } else {
    top5.forEach(entry => {
      const li = document.createElement('li');
      li.textContent = `${entry.name} - ${entry.percentage}% (${entry.score}/${entry.total}) in ${entry.time}s`;
      leaderboardList.appendChild(li);
    });
  }
}

function saveHighScore(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('username');
  const name = usernameInput.value.trim();

  if (!name) return;

  // NEW: Check if the name contains any numbers (digits)
  if (/\d/.test(name)) {
    alert("Please enter a valid name using letters only (numbers are not allowed).");
    usernameInput.value = ''; // Clear the invalid input
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

nextBtn.addEventListener('click', () => {
  const attempted = state.userAnswers[state.currentIndex] !== null;

  if (!attempted) {
    const confirmProceed = confirm("Are you sure you want to proceed without an answer?");
    if (!confirmProceed) {
      return; 
    }
    state.userAnswers[state.currentIndex] = null;
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

