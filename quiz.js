let currentQuestionIndex = 0;
let score = 0;
let timerInterval;
let timeleft = 10;

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
  const questionData = window.questions[currentQuestionIndex];
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
        fetch(`${BACKEND_URL}/submit-option`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question_id: currentQuestionIndex,
                option_index: index
            })
        })
        .then(() => {
            fetch(`${BACKEND_URL}/get-percentages/${currentQuestionIndex}`)
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
    clearInterval(timerInterval);
    const correctIndex = window.questions[currentQuestionIndex].answer;
    if (index === correctIndex) {
        score++;
        optionsElement.children[index].classList.add("correct");
        sendLiveScore(username, score);
    } else {
        optionsElement.children[index].classList.add("wrong");
        optionsElement.children[correctIndex].classList.add("correct");
    }
    disableOptions();
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
            nextButton.click();
        }
    }, 1000);
}

function sendLiveScore(name, score) {
    fetch(`${BACKEND_URL}/update-live-score`, {
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

// Initialize socket connection
const socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true
});

socket.on('connect', () => {
    console.log('Client connected to server');
});

socket.on('quiz_started', (data) => {
    console.log('Quiz started event received:', data);
    startQuiz();
});

socket.on('question_update', (data) => {
    console.log("Received question update:", data);
    if (data && data.questionData) {
        currentQuestionIndex = data.questionId;
        showQuestion();
    }
});

// Add username prompt when page loads
const username = localStorage.getItem("username") || prompt("Enter your name") || "Guest";
localStorage.setItem("username", username);

// Fetch live scores periodically
function fetchLiveScores() {
    fetch(`${BACKEND_URL}/live-scores`)
        .then(res => res.json())
        .then(data => {
            const leaderboard = document.getElementById('live-leaderboard');
            if (!leaderboard) return;
            leaderboard.innerHTML = '';
            data.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `${entry.name}: ${entry.score}`;
                leaderboard.appendChild(li);
            });
        })
        .catch(err => console.error('Live leaderboard error:', err));
}

setInterval(fetchLiveScores, 2000);