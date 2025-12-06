#!/usr/bin/env node

/**
 * Database Connection Tester
 * 
 * Testa a conexão com PostgreSQL usando as credenciais do .env
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTitle(title) {
  console.log('\n' + colors.bold + colors.blue + '═'.repeat(50) + colors.reset);
  log(title, 'blue');
  console.log(colors.bold + colors.blue + '═'.repeat(50) + colors.reset + '\n');
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  logTitle('🔐 PostgreSQL Connection Setup');

  const user = await ask('PostgreSQL user (default: postgres): ') || 'postgres';
  const password = await ask('PostgreSQL password: ');
  const database = await ask('Database name (default: vinibank): ') || 'vinibank';
  const host = 'localhost';
  const port = '5432';

  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  const safeString = connectionString.replace(password, '****');

  logTitle('✅ Configuration');
  log(`User:     ${user}`, 'green');
  log(`Database: ${database}`, 'green');
  log(`Host:     ${host}`, 'green');
  log(`Port:     ${port}`, 'green');

  console.log('\n' + colors.bold + 'Connection String:' + colors.reset);
  log(safeString, 'yellow');

  console.log('\n' + colors.bold + 'Update your .env file:' + colors.reset);
  log(`DATABASE_URL="${connectionString}"`, 'blue');

  console.log('\n' + colors.bold + 'Then run:' + colors.reset);
  log('npx prisma db push', 'yellow');
  log('npm run db:seed', 'yellow');
  log('npm run dev', 'yellow');

  rl.close();
}

main();

