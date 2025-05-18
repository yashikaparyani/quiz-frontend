document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    fetch("https://flask-backend-9bjs.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Store user info if needed
          localStorage.setItem("user_id", data.user_id);
          localStorage.setItem("user_name", data.name);

          // Redirect based on role
          if (data.is_admin) {
            window.location.href = "/admin.html";
          } else {
            window.location.href = "/welcome.html";
          }
        } else {
          alert("Invalid email or password");
        }
      });
  });
});
