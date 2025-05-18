document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    localStorage.setItem("username", username);

    const response = await fetch(
      "https://flask-backend-9bjs.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const result = await response.json();
    const message = document.getElementById("message");

    
    if (result.success === true) {
      message.style.color = "green";
      message.textContent = "Login successful! Redirecting...";

      // Store user info if needed
      localStorage.setItem("user", JSON.stringify(result));

      // Redirect to quiz
      setTimeout(() => {
        window.location.href = "quiz.html";
      }, 1500);
    } else {
      message.style.color = "red";
      message.textContent = result.message;
    }
  });
});
