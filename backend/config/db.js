const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "wildaura",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Optional: quick check that the pool can actually reach the DB on startup
db.getConnection((err, connection) => {
  if (err) {
    console.log("❌ DB Connection failed:", err.code);
  } else {
    console.log("✅ DB Connected!");
    connection.release();
  }
});

module.exports = db;