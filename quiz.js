let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let hasAnswered = false;  // Track if user has answered current question
let questionsAttempted = 0;  // Track number of questions attempted

const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const nextButton = document.getElementById("next-btn");
const scoreElement = document.getElementById("score");
const quizContainer = document.querySelector(".quiz-container");

// Progress indicator elements
const totalQuestionsElement = document.getElementById("total-questions");
const questionsAttemptedElement = document.getElementById("questions-attempted");
const questionsLeftElement = document.getElementById("questions-left");

const BACKEND_URL = "https://flask-backend-9bjs.onrender.com";

function updateProgressIndicators() {
    totalQuestionsElement.textContent = questions.length;
    questionsAttemptedElement.textContent = questionsAttempted;
    questionsLeftElement.textContent = questions.length - questionsAttempted;
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    hasAnswered = false;
    questionsAttempted = 0;
    updateProgressIndicators();
    showQuestion();
}

function showQuestion() {
  const questionData = questions[currentQuestionIndex];
  questionElement.innerText = questionData.question;
  optionsElement.innerHTML = "";
  hasAnswered = false;

  questionData.options.forEach((option, index) => {
    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("btn-container");

    const button = document.createElement("button");
    button.innerText = option;
    button.classList.add("btn");
    button.addEventListener("click", () => {
      if (!hasAnswered) {
        selectAnswer(index);
        hasAnswered = true;
        // Submit the selected option
        fetch(`${BACKEND_URL}/submit-option`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_id: currentQuestionIndex,
            option_index: index
          })
        })
        .catch(err => {
          console.error('Error submitting option:', err);
        });
      }
    });

    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar-container");
    progressBar.id = `progress-${index}`;
    progressBar.innerHTML = `<div class="progress-bar-fill"></div>`;

    buttonWrapper.appendChild(button);
    buttonWrapper.appendChild(progressBar);
    optionsElement.appendChild(buttonWrapper);
  });

  nextButton.classList.add("hide");
  scoreElement.innerText = `Score: ${score}`;
  startTimer();
}

function selectAnswer(index) {
  const username = localStorage.getItem("username") || "Guest";
  if(nextButton.classList.contains("hide")=== false) return;
  
  hasAnswered = true;  // Mark that user has answered
  
  // Remove any previous selections
  const buttons = optionsElement.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.classList.remove("selected", "wrong", "correct");
  });
  
  // Add selected class to current selection
  buttons[index].classList.add("selected");
  
  // Store the selected answer
  const correctIndex = questions[currentQuestionIndex].answer;
  if (index === correctIndex) {
    // Add 1 mark only for correct answer
    score++;
    console.log("Correct answer! Score:", score);
  } else {
    console.log("Wrong answer. Score remains:", score);
  }
}

function disableOptions() {
  const buttons = optionsElement.querySelectorAll('button');
  buttons.forEach(button => {
    button.disabled = true;
  });
}

function startTimer() {
  clearInterval(timerInterval);
  timeleft = 10;
  document.getElementById("time-left").innerText = timeleft;
  timerInterval = setInterval(() => {
    timeleft--;
    document.getElementById("time-left").innerText = timeleft;
    if (timeleft === 0) {
      clearInterval(timerInterval);
      disableOptions();
      
      // Show correct answer
      const correctIndex = questions[currentQuestionIndex].answer;
      const buttons = optionsElement.querySelectorAll('button');
      buttons[correctIndex].classList.add("correct");
      buttons.forEach((btn, idx) => {
        if (idx !== correctIndex && btn.classList.contains("selected")) {
          btn.classList.remove("selected");
          btn.classList.add("wrong");
          btn.style.animation = "shake 0.5s";
        }
      });

      // Update questions attempted
      if (!hasAnswered) {
        questionsAttempted++;
        updateProgressIndicators();
      }

      // Only update live score after timer ends
      const username = localStorage.getItem("username") || "Guest";
      if (hasAnswered) {
        sendLiveScore(username, score);
      }

      // Fetch and display percentages regardless of whether user answered or not
      fetch(`${BACKEND_URL}/get-percentages/${currentQuestionIndex}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to get percentages');
          return res.json();
        })
        .then(data => {
          data.forEach((percent, idx) => {
            const fill = document.querySelector(`#progress-${idx} .progress-bar-fill`);
            if (fill) {
              fill.style.width = `${percent}%`;
              // Remove any existing percentage text
              const existingText = fill.querySelector('.percentage-text');
              if (existingText) {
                existingText.remove();
              }
              // Add new percentage text
              const percentageText = document.createElement('span');
              percentageText.className = 'percentage-text';
              percentageText.textContent = `${Math.round(percent)}%`;
              fill.appendChild(percentageText);
            }
          });
        })
        .catch(err => {
          console.error('Error updating option statistics:', err);
        });
    }
  }, 1000);
}

function endQuiz() {
  questionElement.innerText = "Quiz Completed!";
  optionsElement.innerHTML = "";
  scoreElement.classList.remove("hide");
  // Show final score out of total questions
  scoreElement.innerText = `Final Score: ${score} / ${questions.length}`;
  console.log("Quiz ended. Final score:", score, "out of", questions.length);

  // Add leaderboard button
  const leaderboardBtn = document.createElement("button");
  leaderboardBtn.innerText = "View Leaderboard";
  leaderboardBtn.classList.add("btn", "leaderboard-btn");
  leaderboardBtn.style.marginTop = "20px";
  leaderboardBtn.addEventListener("click", () => {
    saveToBackend();
  });
  quizContainer.appendChild(leaderboardBtn);

  const timerElement = document.getElementById("timer");
  if (timerElement) {
    timerElement.style.display = "none";
  }
}

function saveToBackend() {
  const username = localStorage.getItem("username") || "Guest";
  // Ensure score doesn't exceed total questions
  const finalScore = Math.min(score, questions.length);
  console.log("Submitting score to backend:", username, finalScore);

  fetch(`${BACKEND_URL}/leaderboard`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: username,
      score: finalScore,
      total_questions: questions.length
    })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to save score');
    return res.json();
  })
  .then(data => {
    console.log("Score saved:", data);
    window.location.href = "leaderboard.html";
  })
  .catch(err => {
    console.error("Failed to save score:", err);
    // Show error message but still allow going to leaderboard
    alert("Failed to save score, but you can still view the leaderboard");
    window.location.href = "leaderboard.html";
  });
}

let timeleft = 10;

function fetchLiveScores() {
  fetch(`${BACKEND_URL}/live-scores`)
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch live scores');
      return res.json();
    })
    .then(data => {
      const leaderboard = document.getElementById('live-leaderboard');
      if (!leaderboard) return;
      leaderboard.innerHTML = '';
      data.forEach(entry => {
        const li = document.createElement('li');
        li.textContent =`${entry.name}: ${entry.score}`;
        leaderboard.appendChild(li);
      });
    })
    .catch(err => console.error('Live leaderboard error:', err));
}

setInterval(fetchLiveScores, 2000);

function sendLiveScore(name, score) {
  fetch(`${BACKEND_URL}/update-live-score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: name, score: score })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to update live score');
    return res.json();
  })
  .then(data => {
    console.log('Live score sent:', data.message);
  })
  .catch(err => console.error('Error updating live score:', err));
}

const socket = io("https://flask-backend-9bjs.onrender.com", {
  transports: ['websocket', 'polling'],
  withCredentials: true
});  

socket.on('question_update', (data) => {
  console.log("Got new question", data);
  if (data && data.questionData) {
    // Only update if it's a new question
    if (data.questionId !== currentQuestionIndex) {
      currentQuestionIndex = data.questionId;
      questionsAttempted++;
      updateProgressIndicators();
      
      // Check if this is the last question
      if (currentQuestionIndex >= questions.length - 1) {
        // Wait for timer to end before showing leaderboard button
        const checkTimer = setInterval(() => {
          if (timeleft === 0) {
            clearInterval(checkTimer);
            endQuiz();  // Show leaderboard button
          }
        }, 1000);
      }

      const questionData = data.questionData;
      questionElement.innerText = questionData.question;
      optionsElement.innerHTML = "";
      hasAnswered = false;  // Reset answer state

      questionData.options.forEach((option, index) => {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.classList.add("btn-container");

        const button = document.createElement("button");
        button.innerText = option;
        button.classList.add("btn");
        button.addEventListener("click", () => {
          if (!hasAnswered) {
            selectAnswer(index);
          }
        });

        const progressBar = document.createElement("div");
        progressBar.classList.add("progress-bar-container");
        progressBar.id = `progress-${index}`;
        progressBar.innerHTML = `<div class="progress-bar-fill"></div>`;

        buttonWrapper.appendChild(button);
        buttonWrapper.appendChild(progressBar);
        optionsElement.appendChild(buttonWrapper);
      });

      nextButton.classList.add("hide");
      scoreElement.innerText = `Score: ${score}`;
      startTimer();
    }
  }
});

const username = localStorage.getItem("username") || "Guest";
socket.emit('join', { username: username, room: 'quiz_room' });

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("name") || prompt("Enter your name") || "Guest";
  localStorage.setItem("username", username);
  startQuiz();
});

// Remove the next button click handler since admin controls question changes
nextButton.style.display = 'none';