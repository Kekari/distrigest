import mysql from 'mysql2/promise';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
if (existsSync('.env')) loadEnvFile('.env');

// Las credenciales se leen únicamente en el servidor, nunca desde el navegador.
export function createPool(database = true) {
  return mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ...(database ? { database: databaseName() } : {}),
    connectionLimit: 5,
    dateStrings: true,
    decimalNumbers: true,
    charset: 'utf8mb4'
  });
}
export function databaseName() {
  const name = process.env.DB_NAME || 'distrigest';
  if (!/^[a-zA-Z0-9_]{1,64}$/.test(name))
    throw new Error('DB_NAME debe usar letras, números o guion bajo.');
  return name;
}
