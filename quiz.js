let questions = [
  {
      question: "What will console.log(2 + '2') output in JavaScript?",
      options: ["4", "22", "NaN", "Error"],
      answer: 1
  },
  {
      question: "Which keyword is used to declare a constant variable in JavaScript?",
      options: ["let", "var", "const", "static"],
      answer: 2
  },
  {
      question: "What does the typeof operator return for null?",
      options: ["null", "object", "undefined", "number"],
      answer: 1
  },
  {
      question: "How can you access the last element of an array in JavaScript?",
      options: ["array{last]", "array[-1]", "array[array.length-1]", "array.pop()"],
      answer: 2
  },
  {
      question: "What is the purpose of setTimeout function in JavaScript?",
      options: ["To execute a function immediately", "To execute a function after a delay", "To stop a loop", "To store a variable's value"],
      answer: 1
  },
  {
    question: "What is the result of typeof NaN in JavaScript?",
    options: ["'number'", "'NaN'", "'undefined'", "'object'"],
    answer: 0
  },
  {
    question: "Which method converts JSON data to a JavaScript object?",
    options: ["JSON.stringify()", "JSON.parse()", "JSON.objectify()", "JSON.convert()"],
    answer: 1
  },
  {
    question: "Which symbol is used for comments in JavaScript?",
    options: ["//", "/* */", "#", "<!-- -->"],
    answer: 0
  },
  {
    question: "How do you create a function in JavaScript?",
    options: ["function myFunction()", "create function myFunction()", "function = myFunction()", "function:myFunction()"],
    answer: 0
  },
  {
    question: "What will the following code return: Boolean(10 > 9)?",
    options: ["false", "true", "NaN", "undefined"],
    answer: 1
  }
];

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
    const name = localStorage.getItem("name") || "Guest";
    if(nextButton.classList.contains("hide")=== false) return;
  clearInterval(timerInterval);
  const correctIndex = questions[currentQuestionIndex].answer;
  if (index === correctIndex) {
      score++;
      optionsElement.children[index].classList.add("correct");
    sendLiveScore(name, score)
  } else {
      optionsElement.children[index].classList.add("wrong");
      optionsElement.children[correctIndex].classList.add("correct");
  }
  disableOptions();
  nextButton.classList.remove("hide");
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

  // Add leaderboard button (still optional)
  const leaderboardBtn = document.createElement("button");
  leaderboardBtn.innerText = "View Leaderboard";
  leaderboardBtn.classList.add("btn");
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
  const name = localStorage.getItem("name") || "Guest";
  console.log("Submitting score to backend:", name, score);

  fetch(`${BACKEND_URL}/leaderboard`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json"
      },
      body: JSON.stringify({
          name: name,
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
          nextButton.click();
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

document.addEventListener("DOMContentLoaded", () => {
  const name = localStorage.getItem("name") || prompt("Enter your name") || "Guest";
  localStorage.setItem("name", name);
  startQuiz();
});