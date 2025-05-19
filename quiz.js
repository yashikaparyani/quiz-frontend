let currentQuestionIndex = 0;
let score = 0;
let timerInterval;

const questionElement = document.getElementById("question");
const optionsElement = document.getElementById("options");
const nextButton = document.getElementById("next-btn");
const scoreElement = document.getElementById("score");
const quizContainer = document.querySelector(".quiz-container");

const BACKEND_URL = "https://flask-backend-9bjs.onrender.com";

function startQuiz() {
  currentQuestionIndex = 0;
  score = 0;
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
    
    // Remove any previous selections
    const buttons = optionsElement.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.remove("selected");
    });
    
    // Add selected class to current selection
    buttons[index].classList.add("selected");
    
    // Store the selected answer
    const correctIndex = questions[currentQuestionIndex].answer;
    if (index === correctIndex) {
        score++;
        sendLiveScore(username, score);
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
            
            // Remove selected class and add correct/wrong classes
            buttons.forEach((btn, idx) => {
                btn.classList.remove("selected");
                if (idx === correctIndex) {
                    btn.classList.add("correct");
                } else if (btn.classList.contains("selected")) {
                    btn.classList.add("wrong");
                }
            });
            
            // Fetch and display percentages only after timer ends
            fetch(`https://flask-backend-9bjs.onrender.com/get-percentages/${currentQuestionIndex}`)
                .then(res => res.json())
                .then(data => {
                    data.forEach((percent, idx) => {
                        const fill = document.querySelector(`#progress-${idx} .progress-bar-fill`);
                        if (fill) {
                            fill.style.width = `${percent}%`;
                            const percentageText = document.createElement('span');
                            percentageText.className = 'percentage-text';
                            percentageText.textContent = `${percent}%`;
                            fill.appendChild(percentageText);
                        }
                    });
                });
        }
    }, 1000);
}

function endQuiz() {
  questionElement.innerText = "Quiz Completed!";
  optionsElement.innerHTML = "";
  scoreElement.classList.remove("hide");
  scoreElement.innerText = `Final Score: ${score} / ${questions.length}`;

  // Auto submit the score and redirect to leaderboard
  saveToBackend();

  const timerElement = document.getElementById("timer");
  if (timerElement) {
      timerElement.style.display = "none";
  }
}

function saveToBackend() {
  const username = localStorage.getItem("username") || "Guest";
  console.log("Submitting score to backend:", username, score);

  fetch(`${BACKEND_URL}/leaderboard`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          name: username,
          score: score,
          total_questions: questions.length
      })
  })
  .then(res => res.json())
  .then(data => {
      console.log("Score saved:", data);
      // After saving score, redirect to leaderboard
      window.location.href = "leaderboard.html";
  })
  .catch(err => {
      console.error("Failed to save score:", err);
      // Even if save fails, still show leaderboard
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
    currentQuestionIndex = data.questionId;
    const questionData = data.questionData;
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
  } else {
    console.error("Invalid question data received:", data);
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