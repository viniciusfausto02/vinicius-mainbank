#!/usr/bin/env node

/**
 * ViniBank - Setup Script
 * Automated development environment setup
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { randomBytes } from 'crypto';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function exec(command: string, description: string) {
  try {
    log(`\n🔄 ${description}...`, colors.cyan);
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} - Concluído`, colors.green);
    return true;
  } catch {
    log(`❌ ${description} - Erro`, colors.red);
    return false;
  }
}

function generateSecureKey(bytes: number): string {
  return randomBytes(bytes).toString('base64');
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');

  if (!existsSync(envPath)) {
    log('\n⚠️  Arquivo .env não encontrado!', colors.yellow);
    log('📝 Criando .env com valores seguros...', colors.cyan);

    const encryptionKey = generateSecureKey(32);
    const encryptionSalt = generateSecureKey(16);
    const nextAuthSecret = generateSecureKey(32);

    const envContent = `# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vinibank"

# NextAuth
NEXTAUTH_SECRET="${nextAuthSecret}"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opcional)
GOOGLE_ID=""
GOOGLE_SECRET=""

# Encryption
ENCRYPTION_KEY="${encryptionKey}"
ENCRYPTION_SALT="${encryptionSalt}"

# Environment
NODE_ENV="development"
LOG_LEVEL="info"
`;

    writeFileSync(envPath, envContent);
    log('✅ Arquivo .env criado com sucesso!', colors.green);
    log('\n🔐 Chaves de criptografia geradas:', colors.yellow);
    log(`   NEXTAUTH_SECRET: ${nextAuthSecret.substring(0, 20)}...`, colors.reset);
    log(`   ENCRYPTION_KEY: ${encryptionKey.substring(0, 20)}...`, colors.reset);
    log(`   ENCRYPTION_SALT: ${encryptionSalt.substring(0, 20)}...`, colors.reset);
  } else {
    log('✅ Arquivo .env já existe', colors.green);
  }
}

function checkDatabase() {
  log('\n🔍 Verificando conexão com o banco de dados...', colors.cyan);
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="(.+)"/);
  
  if (!dbUrlMatch) {
    log('❌ DATABASE_URL não encontrada no .env', colors.red);
    return false;
  }

  const dbUrl = dbUrlMatch[1];
  
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    log('\n⚠️  Banco de dados local detectado!', colors.yellow);
    log('📋 Certifique-se de que o PostgreSQL está rodando:', colors.yellow);
    log('   - Docker: docker-compose up -d', colors.reset);
    log('   - Windows: Serviço PostgreSQL deve estar ativo', colors.reset);
    log('   - Mac/Linux: sudo service postgresql start', colors.reset);
    
    // Tentar criar o banco se não existir
    try {
      log('\n🔄 Tentando criar banco de dados...', colors.cyan);
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      return true;
    } catch {
      log('\n❌ Não foi possível conectar ao banco de dados', colors.red);
      log('💡 Soluções:', colors.yellow);
      log('   1. Instalar PostgreSQL: https://www.postgresql.org/download/', colors.reset);
      log('   2. Usar Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres', colors.reset);
      log('   3. Usar serviço cloud: Vercel Postgres, Supabase, Railway', colors.reset);
      return false;
    }
  }

  return true;
}
async function main() {
  log('\n' + '='.repeat(60), colors.bright);
  log('🏦 ViniBank - Setup Automático', colors.bright + colors.cyan);
  log('='.repeat(60) + '\n', colors.bright);

  // 1. Verificar Node.js e npm
  log('📦 Verificando dependências do sistema...', colors.bright);
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    const npmVersion = execSync('npm --version').toString().trim();
    log(`✅ Node.js: ${nodeVersion}`, colors.green);
    log(`✅ npm: ${npmVersion}`, colors.green);
  } catch {
    log('❌ Node.js ou npm não encontrado!', colors.red);
    process.exit(1);
  }

  // 2. Instalar dependências
  if (!existsSync(path.join(process.cwd(), 'node_modules'))) {
    exec('npm install', 'Instalando dependências do projeto');
  } else {
    log('✅ Dependências já instaladas', colors.green);
  }

  // 3. Verificar/criar .env
  checkEnvFile();

  // 4. Gerar Prisma Client
  exec('npx prisma generate', 'Gerando Prisma Client');

  // 5. Verificar banco de dados
  const dbReady = checkDatabase();

  if (dbReady) {
    // 6. Executar migrations
    exec('npx prisma db push', 'Aplicando schema do banco de dados');

    // 7. Seed do banco
    log('\n🌱 Deseja popular o banco com dados de exemplo? (s/n)', colors.yellow);
    log('   Isso criará usuários, contas e transações de teste', colors.reset);
    
    // Auto seed em modo desenvolvimento
    const shouldSeed = process.env.AUTO_SEED !== 'false';
    
    if (shouldSeed) {
      exec('npm run db:seed', 'Populando banco de dados com dados de exemplo');
    }
  }

  // 8. Resumo final
  log('\n' + '='.repeat(60), colors.bright);
  log('🎉 Setup Concluído!', colors.bright + colors.green);
  log('='.repeat(60), colors.bright);

  log('\n📋 Próximos passos:', colors.bright);
  log('   1. npm run dev          - Iniciar servidor de desenvolvimento', colors.cyan);
  log('   2. npm run make:admin   - Criar usuário administrador', colors.cyan);
  
  if (dbReady) {
    log('\n👤 Usuários de teste criados:', colors.bright);
    log('   Email: demo@vinibank.com', colors.reset);
    log('   Senha: Demo123!', colors.reset);
  }

  log('\n🌐 Acesse: http://localhost:3000', colors.bright + colors.blue);
  log('📚 Documentação: README.md', colors.reset);
  
  log('\n' + '='.repeat(60) + '\n', colors.bright);
}

main().catch((error) => {
  log('\n❌ Erro durante o setup:', colors.red);
  console.error(error);
  process.exit(1);
});
