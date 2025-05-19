document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    

    const response = fetch(
      "https://flask-backend-9bjs.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const result =  response.json();
    const message = document.getElementById("message");

    
    if (result.success === true) {
      message.style.color = "green";
      message.textContent = "Login successful! Redirecting...";

      // Store user info if needed
      localStorage.setItem("user", JSON.stringify(result));
      localStorage.setItem("username", result.username);
      localStorage.setItem('role', result.role)

      if(result.role === 'admin'){
        window.location.href = 'admin_panel.html';
      } else {
        window.location.href = 'welcome.html';
      }
    }else{
      message.style.color = "red";
      message.textContent = result.message;
    }
  });
