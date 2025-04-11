import mysql from 'mysql2';
import dotenv from 'dotenv';
dotenv.config();

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
};

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

export { pool, promisePool };
export default pool;
