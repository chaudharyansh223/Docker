const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "tasks.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readTasks() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tasks", (req, res) => {
  res.json(readTasks());
});

app.post("/api/tasks", (req, res) => {
  const title = String(req.body.title || "").trim();

  if (!title) {
    return res.status(400).json({ error: "Task title is required" });
  }

  const tasks = readTasks();

  const task = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.unshift(task);
  saveTasks(tasks);

  res.status(201).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const task = tasks.find((item) => item.id === req.params.id);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  task.completed = !task.completed;
  saveTasks(tasks);

  res.json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const tasks = readTasks();
  const updatedTasks = tasks.filter(
    (item) => item.id !== req.params.id
  );

  if (tasks.length === updatedTasks.length) {
    return res.status(404).json({ error: "Task not found" });
  }

  saveTasks(updatedTasks);
  res.json({ message: "Task deleted" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DevOps Task Manager running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
