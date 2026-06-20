import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const sqlFile = path.join(process.cwd(), 'sql', 'wai_system_structure_seed.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
});

await connection.query(sql);
await connection.end();

console.log('Database setup completed.');
