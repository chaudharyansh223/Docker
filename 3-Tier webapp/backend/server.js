const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "database",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function initializeDatabase() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.trim().length < 3 ||
      password.length < 8 ||
      password.length > 72
    ) {
      return res.status(400).json({
        message: "Username must have 3+ characters and password 8–72 characters."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.execute(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username.trim(), passwordHash]
    );

    res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username already exists." });
    }

    console.error("Registration failed:", error.message);
    res.status(500).json({ message: "Registration failed." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({ message: "Enter username and password." });
    }

    const [users] = await pool.execute(
      "SELECT id, username, password_hash FROM users WHERE username = ?",
      [username.trim()]
    );

    if (
      users.length === 0 ||
      !(await bcrypt.compare(password, users[0].password_hash))
    ) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // Authentication works, but this starter does not create a session.
    res.json({
      message: "Login successful.",
      user: { id: users[0].id, username: users[0].username }
    });
  } catch (error) {
    console.error("Login failed:", error.message);
    res.status(500).json({ message: "Login failed." });
  }
});

const PORT = Number(process.env.PORT || 3000);

initializeDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  });
