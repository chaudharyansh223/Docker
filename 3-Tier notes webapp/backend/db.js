const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'notes_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
};

let pool;

async function initDB(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      console.log(`[DB] Attempting connection to MySQL at ${dbConfig.host}:${dbConfig.port} (Attempt ${i}/${retries})...`);

      // First ensure database exists
      const tempConnection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
      });

      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await tempConnection.end();

      // Now create pool with target database
      pool = mysql.createPool(dbConfig);

      // Verify connection
      const connection = await pool.getConnection();
      console.log('✅ [DB] Successfully connected to MySQL database:', dbConfig.database);

      // Ensure notes table exists
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS notes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content MEDIUMTEXT NOT NULL,
          color VARCHAR(20) DEFAULT '#ffffff',
          is_pinned BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `;
      await connection.query(createTableSQL);
      console.log('✅ [DB] Notes table verified/created successfully.');
      connection.release();

      return pool;
    } catch (err) {
      console.error(`⚠️ [DB] Connection failed: ${err.message}`);
      if (i === retries) {
        throw new Error(`Failed to connect to MySQL after ${retries} attempts.`);
      }
      console.log(`⏳ [DB] Waiting ${delayMs / 1000}s before next retry...`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDB() first.');
  }
  return pool;
}

module.exports = {
  initDB,
  getPool,
};
