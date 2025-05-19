let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let hasAnswered = false;
let answerCount = 0;
let totalUsers = 0;
let isShowingResults = false;

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

function startTimer() {
    clearInterval(timerInterval);
    timeleft = 10;
    hasAnswered = false;
    answerCount = 0;
    isShowingResults = false;
    document.getElementById("time-left").innerText = timeleft;
    
    // Reset all buttons to normal state
    const buttons = optionsElement.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('correct', 'wrong', 'selected');
        // Remove percentage display
        const originalText = button.innerText.split(" (")[0];
        button.innerText = originalText;
    });

    timerInterval = setInterval(() => {
        timeleft--;
        document.getElementById("time-left").innerText = timeleft;
        if (timeleft === 0) {
            clearInterval(timerInterval);
            showResults();
        }
    }, 1000);
}

function showResults() {
    if (isShowingResults) return;
    isShowingResults = true;

    const correctIndex = questions[currentQuestionIndex].answer;
    const buttons = optionsElement.querySelectorAll('button');
    
    // Show correct answer
    buttons[correctIndex].classList.add('correct');
    
    // Show wrong answer if user selected one
    if (hasAnswered) {
        buttons.forEach((button, index) => {
            if (index !== correctIndex && button.classList.contains('selected')) {
                button.classList.add('wrong');
            }
        });

        // Update score if answer was correct
        if (buttons[correctIndex].classList.contains('selected')) {
            score++;
            const username = localStorage.getItem("username") || "Guest";
            sendLiveScore(username, score);
        }
    }

    // Update percentages
    fetch(`https://flask-backend-9bjs.onrender.com/get-percentages/${currentQuestionIndex}`)
        .then(res => res.json())
        .then(data => {
            buttons.forEach((button, idx) => {
                const originalText = button.innerText.split(" (")[0];
                button.innerText = `${originalText} (${data[idx]}%)`;
                
                const fill = document.querySelector(`#progress-${idx} .progress-bar-fill`);
                if (fill) fill.style.width = `${data[idx]}%`;
            });
        });

    // Update leaderboard
    fetchLiveScores();
    
    // Show next button
    nextButton.classList.remove('hide');
}

function selectAnswer(index) {
    if (hasAnswered || isShowingResults) return;
    
    const username = localStorage.getItem("username") || "Guest";
    hasAnswered = true;
    
    const buttons = optionsElement.querySelectorAll('button');
    buttons.forEach(button => button.disabled = true);
    buttons[index].classList.add('selected');

    // Send answer to server
    fetch('https://flask-backend-9bjs.onrender.com/submit-option', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            question_id: currentQuestionIndex,
            option_index: index
        })
    })
    .then(() => {
        // Increment answer count
        answerCount++;
        
        // If all users have answered, wait for timer to finish
        if (answerCount >= totalUsers) {
            console.log("All users have answered, waiting for timer...");
        }
    });
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

    // Save score to global leaderboard
    const username = localStorage.getItem("username") || "Guest";
    fetch('https://flask-backend-9bjs.onrender.com/leaderboard', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: username,
            score: score
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log("Score saved to global leaderboard:", data);
        // Redirect to leaderboard page
        window.location.href = "leaderboard.html";
    })
    .catch(err => {
        console.error("Failed to save score:", err);
    });
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

// Add connection status logging
socket.on('connect', () => {
    console.log('Connected to server');
    // Join the quiz room when connected
    socket.emit('join', { username: username, room: 'quiz_room' });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('quiz_started', (data) => {
    console.log('Quiz started:', data);
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
});

socket.on('question_update', (data) => {
    console.log("Received new question:", data);
    if (data && data.questionData) {
        currentQuestionIndex = data.questionId;
        const questionData = data.questionData;
        
        // Update question text
        questionElement.innerText = questionData.question;
        optionsElement.innerHTML = "";
        
        // Create options
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

socket.on('user_count', (data) => {
    totalUsers = data.count;
    console.log(`Total users in room: ${totalUsers}`);
});

document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("name") || prompt("Enter your name") || "Guest";
    localStorage.setItem("username", username);
    
    // Initialize socket connection
    const socket = io("https://flask-backend-9bjs.onrender.com", {
        transports: ['websocket', 'polling'],
        withCredentials: true
    });

    // Add connection status logging
    socket.on('connect', () => {
        console.log('Connected to server');
        // Join the quiz room when connected
        socket.emit('join', { username: username, room: 'quiz_room' });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    socket.on('quiz_started', (data) => {
        console.log('Quiz started:', data);
        currentQuestionIndex = 0;
        score = 0;
        showQuestion();
    });

    socket.on('question_update', (data) => {
        console.log("Received new question:", data);
        if (data && data.questionData) {
            currentQuestionIndex = data.questionId;
            const questionData = data.questionData;
            
            // Update question text
            questionElement.innerText = questionData.question;
            optionsElement.innerHTML = "";
            
            // Create options
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

    // Initial quiz setup
    startQuiz();
});