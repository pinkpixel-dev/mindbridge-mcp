#!/usr/bin/env node

// This is a simple test script to verify that the CLI works correctly
import { spawn } from 'child_process';

console.log('Testing Mindbridge CLI...');

// Run the CLI
const cli = spawn('node', ['dist/cli.js']);

// Set a timeout to kill the process after 5 seconds
const timeout = setTimeout(() => {
  console.log('Test completed successfully!');
  cli.kill();
  process.exit(0);
}, 5000);

// Handle CLI output
cli.stderr.on('data', (data) => {
  console.log(`CLI output: ${data}`);
});

// Handle CLI errors
cli.on('error', (error) => {
  console.error(`CLI error: ${error}`);
  clearTimeout(timeout);
  process.exit(1);
});

// Handle CLI exit
cli.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`CLI exited with code ${code}`);
    clearTimeout(timeout);
    process.exit(code);
  }
});
