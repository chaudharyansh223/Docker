-- Create database if it does not already exist
CREATE DATABASE IF NOT EXISTS notes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE notes_db;

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    color VARCHAR(20) DEFAULT '#ffffff',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert welcome sample notes if table is empty
INSERT INTO notes (title, content, color, is_pinned)
SELECT * FROM (
    SELECT 'Welcome to Notes! 📝' AS title,
           'This is your mobile-style Notes web application.\n\nKey features:\n• Create, edit, and save notes easily\n• Pin your important notes to the top\n• Color-code your thoughts\n• Instant live search\n\nAll notes are securely stored in your MySQL database!' AS content,
           '#fef08a' AS color,
           1 AS is_pinned
) AS tmp
WHERE NOT EXISTS (
    SELECT 1 FROM notes LIMIT 1
);

INSERT INTO notes (title, content, color, is_pinned)
SELECT * FROM (
    SELECT 'Project Architecture 🚀' AS title,
           'Architecture overview:\n1. Frontend: Served by Nginx web server\n2. Reverse Proxy: Nginx proxies /api calls to the backend\n3. Backend: Express.js REST API\n4. Database: MySQL persisting all notes data',
           '#bae6fd' AS color,
           0 AS is_pinned
) AS tmp
WHERE (SELECT COUNT(*) FROM notes) = 1;
