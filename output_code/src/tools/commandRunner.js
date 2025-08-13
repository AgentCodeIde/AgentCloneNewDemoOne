const { exec } = require('child_process');
const path = require('path');

/**
 * Runs a command in a specified directory and returns the output.
 * @param {string} command - The shell command to run.
 * @param {string} cwd - The current working directory for the command.
 * @returns {Promise<{ stdout: string, stderr: string }>} - A promise that resolves with the command's output or rejects with an error.
 */
async function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Runs a command in the sandbox directory and returns the output.
 * @param {string} command - The shell command to run.
 * @returns {Promise<{ stdout: string, stderr: string }>} - A promise that resolves with the command's output or rejects with an error.
 */
async function runInSandbox(command) {
  const sandboxPath = path.join(__dirname, '..', 'sandbox');
  return await runCommand(command, sandboxPath);
}

module.exports = {
  runCommand,
  runInSandbox
};