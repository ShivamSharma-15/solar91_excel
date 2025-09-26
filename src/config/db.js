const mysql = require("mysql2/promise");
const dbConfig = require("./dbConfig");

const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  supportBigNumbers: true,
  bigNumberStrings: true,
});

module.exports = pool;
