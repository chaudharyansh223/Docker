const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "taskuser",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "taskmanager",
  waitForConnections: true,
  connectionLimit: 10
});

async function initializeDatabase() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const [tasks] = await pool.execute(
      "SELECT * FROM tasks ORDER BY id DESC"
    );
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Tasks load nahi ho sake." });
  }
});

// Add a task
app.post("/api/tasks", async (req, res) => {
  const title = req.body.title?.trim();

  if (!title) {
    return res.status(400).json({ error: "Task title required hai." });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO tasks (title) VALUES (?)",
      [title]
    );

    const [rows] = await pool.execute(
      "SELECT * FROM tasks WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Task save nahi ho saka." });
  }
});

// Mark task complete/incomplete
app.patch("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const completed = req.body.completed;

  if (!Number.isInteger(id) || id < 1 ||
      typeof completed !== "boolean") {
    return res.status(400).json({ error: "Invalid task ID or status." });
  }

  try {
    const [result] = await pool.execute(
      "UPDATE tasks SET completed = ? WHERE id = ?",
      [completed, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task nahi mila." });
    }

    const [rows] = await pool.execute(
      "SELECT * FROM tasks WHERE id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Task update nahi ho saka." });
  }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid task ID." });
  }

  try {
    const [result] = await pool.execute(
      "DELETE FROM tasks WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Task nahi mila." });
    }

    res.json({ message: "Task delete ho gaya." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Task delete nahi ho saka." });
  }
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Task Manager running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

start();
