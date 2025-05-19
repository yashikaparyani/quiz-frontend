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
nextButton.addEventListener("click", () => {
    nextButton.classList.add('swipe-right');
    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
        nextButton.classList.remove('swipe-right');
    },500);
 
});

function endQuiz() {
  questionElement.innerText = "Quiz Completed!";
  optionsElement.innerHTML = "";
  nextButton.classList.add("hide");
  scoreElement.classList.remove("hide");
  scoreElement.innerText = `Final Score: ${score} / ${questions.length}`;

  // Auto submit the score
  saveToBackend();

  // Add leaderboard button
  const leaderboardBtn = document.createElement("button");
  leaderboardBtn.innerText = "View Leaderboard";
  leaderboardBtn.classList.add("btn", "leaderboard-btn");
  leaderboardBtn.style.marginTop = "20px";
  leaderboardBtn.addEventListener("click", () => {
      window.location.href = "leaderboard.html";
  });
  quizContainer.appendChild(leaderboardBtn);

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
          score: score
      })
  })
  .then(res => res.json())
  .then(data => {
      console.log("Score saved:", data);
  })
  .catch(err => {
      console.error("Failed to save score:", err);
  });
}

let timeleft = 10;
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
            
            // Fetch and display percentages
            fetch(`https://flask-backend-9bjs.onrender.com/get-percentages/${currentQuestionIndex}`)
                .then(res => res.json())
                .then(data => {
                    data.forEach((percent, idx) => {
                        const fill = document.querySelector(`#progress-${idx} .progress-bar-fill`);
                        if (fill) {
                            fill.style.width = `${percent}%`;
                            // Add percentage text
                            const percentageText = document.createElement('span');
                            percentageText.className = 'percentage-text';
                            percentageText.textContent = `${percent}%`;
                            fill.appendChild(percentageText);
                        }
                    });
                });
            
            // Show next button after a short delay
            setTimeout(() => {
                nextButton.classList.remove("hide");
            }, 2000);
        }
    }, 1000);
}

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
                buttons[idx].innerText = `${originalText} (${percent}%)`;

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