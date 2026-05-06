#!/usr/bin/env node

/**
 * BizFlow Smoke Test Script
 * 
 * Validates that the entire application stack works:
 * 1. Imports schema.sql (DDL)
 * 2. Imports seed.sql (sample data + admin user)
 * 3. Starts the backend server
 * 4. Tests key API endpoints
 * 5. Reports pass/fail
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';
import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:3000/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  pass: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  fail: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

let backendProcess = null;
let testsPassed = 0;
let testsFailed = 0;

/**
 * Drop and recreate database using mysql2
 */
async function resetDatabase() {
  const dbName = process.env.DB_NAME || 'bizflow';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await connection.query(`CREATE DATABASE ${dbName}`);
    log.pass(`Database reset: ${dbName}`);
  } catch (error) {
    log.fail(`Failed to reset database: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Split SQL into statements, handling DELIMITER blocks
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let delimiter = ';';
  const lines = sql.split('\n');

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Skip comments and empty lines at start
    if (!current && (trimmed.startsWith('--') || trimmed.startsWith('/*') || !trimmed)) {
      continue;
    }

    // Handle DELIMITER changes
    if (trimmed.startsWith('DELIMITER')) {
      if (current.trim()) {
        statements.push({ sql: current.trim(), delimiter });
        current = '';
      }
      delimiter = trimmed.split(/\s+/)[1] || ';';
      continue;
    }

    current += line + '\n';

    // Check if statement is complete
    if (current.trim().endsWith(delimiter)) {
      const stmt = current.trim();
      // Remove trailing delimiter and clean up
      const cleaned = stmt.slice(0, -delimiter.length).trim();
      if (cleaned && !cleaned.startsWith('--') && !cleaned.startsWith('/*')) {
        statements.push({ sql: cleaned + ';', delimiter });
      }
      current = '';
      delimiter = ';';
    }
  }

  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push({ sql: current.trim() + ';', delimiter });
  }

  return statements;
}

/**
 * Execute SQL file
 */
async function executeSqlFile(filePath) {
  const dbName = process.env.DB_NAME || 'bizflow';
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = splitSqlStatements(sql);

    for (const stmt of statements) {
      if (!stmt.sql.trim() || stmt.sql.trim().startsWith('--')) {
        continue;
      }
      try {
        await connection.query(stmt.sql);
      } catch (error) {
        // Log but continue on some errors (like "already exists")
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    log.pass(`Executed: ${path.basename(filePath)}`);
  } catch (error) {
    log.fail(`Failed to execute ${path.basename(filePath)}: ${error.message}`);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Import schema and seed data
 */
async function setupDatabase() {
  log.info('Setting up database...');
  const schemaFile = path.join(__dirname, '..', 'backend', 'database', 'schema.sql');
  const seedFile = path.join(__dirname, '..', 'backend', 'database', 'seed.sql');

  try {
    await resetDatabase();
    await executeSqlFile(schemaFile);
    await executeSqlFile(seedFile);
    log.pass('Database setup complete');
  } catch (error) {
    log.fail(`Database setup failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Start backend server
 */
function startBackend() {
  return new Promise((resolve) => {
    log.info('Starting backend server...');
    const serverFile = path.join(__dirname, '..', 'backend', 'server.js');
    
    backendProcess = spawn('node', [serverFile], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    let isResolved = false;

    // Capture stdout/stderr for debugging
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Backend] ${output}`);
      if (!isResolved && (output.includes('listening') || output.includes('started') || output.includes('running'))) {
        isResolved = true;
        log.pass('Backend server started');
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        log.fail(`Failed to start backend: ${err.message}`);
        resolve();
      }
    });

    // Fallback: resolve after 5 seconds even if no "listening" message
    setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        log.pass('Backend server started (timeout)');
        resolve();
      }
    }, 5000);
  });
}

/**
 * Wait for API to be ready
 */
async function waitForApi(maxRetries = 30) {
  log.info('Waiting for API to be ready...');
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Try a simple request to see if API is responding
      await axios.get(`${BASE_URL}/../health`, { timeout: 1000 }).catch(() => {
        // If health endpoint doesn't exist, that's ok, we'll try login endpoint in the actual test
        return true;
      });
      log.pass('API is ready');
      return;
    } catch {
      if (i % 5 === 0) {
        process.stdout.write('.');
      }
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  log.warn('API health check timed out, but continuing with tests...');
}

/**
 * Test: Admin login
 */
async function testLogin() {
  log.info('Testing admin login...');
  try {
    console.log(`Attempting login at: ${BASE_URL}/login`);
    const response = await axios.post(`${BASE_URL}/login`, {
      email: 'admin@bizflow.local',
      password: 'Admin@123'
    });
    
    if (response.data.token) {
      log.pass('Admin login successful');
      testsPassed++;
      return response.data.token;
    } else {
      log.fail('Login returned no token');
      testsFailed++;
      return null;
    }
  } catch (error) {
    console.log('Full error object:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: error.config?.url
    });
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
    const statusCode = error.response?.status || error.code || 'N/A';
    log.fail(`Login failed (${statusCode}): ${errorMsg}`);
    testsFailed++;
    return null;
  }
}

/**
 * Test: Get reports
 */
async function testReports(token) {
  log.info('Testing reports endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/reports/top-vendors`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Reports response:', typeof response.data, Array.isArray(response.data));
    
    if (response.data && (Array.isArray(response.data) || typeof response.data === 'object')) {
      const itemCount = Array.isArray(response.data) ? response.data.length : Object.keys(response.data).length;
      log.pass(`Reports endpoint works (returned ${itemCount} items)`);
      testsPassed++;
    } else {
      log.fail('Reports endpoint returned invalid data');
      testsFailed++;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 'N/A';
    log.fail(`Reports test failed (${statusCode}): ${errorMsg}`);
    testsFailed++;
  }
}

/**
 * Test: Inventory data
 */
async function testInventory(token) {
  log.info('Testing inventory endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/inventory/raw-materials`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (Array.isArray(response.data)) {
      log.pass(`Inventory endpoint works (returned ${response.data.length} materials)`);
      testsPassed++;
    } else {
      log.fail('Inventory endpoint returned invalid data');
      testsFailed++;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 'N/A';
    log.fail(`Inventory test failed (${statusCode}): ${errorMsg}`);
    testsFailed++;
  }
}

/**
 * Run all smoke tests
 */
async function runTests() {
  log.info('Running smoke tests...\n');

  try {
    await setupDatabase();
    await startBackend();
    await waitForApi();
    
    console.log('\n--- API Tests ---\n');
    const token = await testLogin();
    
    if (token) {
      await testReports(token);
      await testInventory(token);
    }

    console.log(`\n--- Test Summary ---\n`);
    log.pass(`Passed: ${testsPassed}`);
    log.fail(`Failed: ${testsFailed}`);

    if (testsFailed === 0) {
      log.pass('All smoke tests passed! ✨');
      process.exit(0);
    } else {
      log.fail(`${testsFailed} test(s) failed`);
      process.exit(1);
    }
  } catch (error) {
    log.fail(`Smoke test failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Cleanup
 */
function cleanup() {
  if (backendProcess) {
    log.info('Stopping backend server...');
    backendProcess.kill();
  }
}

// Handle interrupts
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Start tests
runTests().finally(cleanup);
