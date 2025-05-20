let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let hasAnswered = false;  // Track if user has answered current question

const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const nextButton = document.getElementById("next-btn");
const scoreElement = document.getElementById("score");
const quizContainer = document.querySelector(".quiz-container");

const BACKEND_URL = "https://flask-backend-9bjs.onrender.com";

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
  hasAnswered = false;
  showQuestion();
}

function showQuestion() {
  const questionData = questions[currentQuestionIndex];
  questionElement.innerText = questionData.question;
  optionsElement.innerHTML = "";

  questionData.options.forEach((option, index) => {
    const buttonWrapper = document.createElement("div");
    buttonWrapper.classList.add("btn-container");

    const button = document.createElement("button");
    button.innerText = option;
    button.classList.add("btn");
    button.addEventListener("click", () => {
        selectAnswer(index);
        fetch('https://flask-backend-9bjs.onrender.com/submit-option', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: currentQuestionIndex,
                option_index: index
            })
        })
        .then(() => {
            fetch(`https://flask-backend-9bjs.onrender.com/get-percentages/${currentQuestionIndex}`)
                .then(res => res.json())
                .then(data => {
                    const buttons = optionsElement.querySelectorAll('button');
                    data.forEach((percent, idx) => {
                        const originalText = buttons[idx].innerText.split(" (")[0];
                        buttons[idx].innerText =` ${originalText} (${percent}%)`;

                        const fill = document.querySelector(`#progress-${idx} .progress-bar-fill`);
                        if (fill) fill.style.width = `${percent}%`;
                    });
                });
        });
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
      
      // First show correct answer in green
      buttons[correctIndex].classList.add("correct");
      
      // Then show wrong answer in red if user selected wrong
      buttons.forEach((btn, idx) => {
        if (idx !== correctIndex && btn.classList.contains("selected")) {
          btn.classList.remove("selected");
          btn.classList.add("wrong");
          btn.style.animation = "shake 0.5s";
        }
      });

      // Only update live score after timer ends
      const username = localStorage.getItem("username") || "Guest";
      if (hasAnswered) {
        sendLiveScore(username, score);
      }
      
      // Get the selected option index
      const selectedIndex = Array.from(buttons).findIndex(btn => btn.classList.contains("selected"));
      
      // Send the selected option to backend
      fetch(`${BACKEND_URL}/update-option-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          questionId: currentQuestionIndex,
          selectedOption: selectedIndex
        })
      })
      .then(() => {
        // After sending the selection, fetch the updated percentages
        return fetch(`${BACKEND_URL}/get-option-stats/${currentQuestionIndex}`);
      })
      .then(res => res.json())
      .then(data => {
        console.log('Option statistics:', data);
        
        // Calculate total responses
        const totalResponses = data.reduce((sum, count) => sum + count, 0);
        
        // Update progress bars with percentages
        data.forEach((count, idx) => {
          const fill = document.querySelector(`#progress-${idx} .progress-bar-fill`);
          if (fill) {
            // Calculate percentage
            const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
            
            // Force a reflow to ensure animation works
            fill.style.width = '0%';
            void fill.offsetWidth;
            
            // Set the new width with animation
            setTimeout(() => {
              fill.style.width = `${percentage}%`;
            }, 50);
            
            // Remove any existing percentage text
            const existingText = fill.querySelector('.percentage-text');
            if (existingText) {
              existingText.remove();
            }
            
            // Add new percentage text
            const percentageText = document.createElement('span');
            percentageText.className = 'percentage-text';
            percentageText.textContent = `${Math.round(percentage)}%`;
            fill.appendChild(percentageText);
            
            console.log(`Option ${idx}: ${Math.round(percentage)}% (${count} users)`);
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
  .then(res => res.json())
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
  fetch('https://flask-backend-9bjs.onrender.com/live-scores')
    .then(res => res.json())
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
  fetch('https://flask-backend-9bjs.onrender.com/update-live-score', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: name, score: score })
  })
  .then(res => res.json())
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