const form = document.getElementById("loginForm");
const message = document.getElementById("message");
const button = document.getElementById("loginButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "";
  button.disabled = true;
  button.textContent = "Signing in...";

  const username = form.username.value.trim();
  const password = form.password.value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Login failed.");
    }

    window.location.assign("/dashboard");
  } catch (error) {
    message.textContent =
      error.message === "Failed to fetch"
        ? "Server se connection nahi ho paaya. Dobara try karein."
        : error.message;
  } finally {
    button.disabled = false;
    button.textContent = "Sign In";
  }
});
