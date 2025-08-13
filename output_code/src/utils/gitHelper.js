const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Initialize a new git repository if it doesn't exist.
 */
function initGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (error) {
    execSync('git init');
  }
}

/**
 * Create a new branch with the given name.
 * @param {string} branchName - The name of the branch to create.
 */
function createBranch(branchName) {
  try {
    execSync(`git checkout -b ${branchName}`);
  } catch (error) {
    console.error('Failed to create branch:', error.message);
  }
}

/**
 * Commit changes with a given message.
 * @param {string} commitMessage - The commit message.
 */
function commitChanges(commitMessage) {
  try {
    execSync('git add .');
    execSync(`git commit -m "${commitMessage}"`);
  } catch (error) {
    console.error('Failed to commit changes:', error.message);
  }
}

/**
 * Get the current branch name.
 * @returns {string} The current branch name.
 */
function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch (error) {
    console.error('Failed to get current branch:', error.message);
    return null;
  }
}

/**
 * Checkout an existing branch.
 * @param {string} branchName - The name of the branch to checkout.
 */
function checkoutBranch(branchName) {
  try {
    execSync(`git checkout ${branchName}`);
  } catch (error) {
    console.error('Failed to checkout branch:', error.message);
  }
}

/**
 * Create a new branch for autodev and switch to it.
 * @returns {string} The name of the created branch.
 */
function createAutodevBranch() {
  const timestamp = Date.now();
  const branchName = `autodev/${timestamp}`;
  initGitRepo();
  createBranch(branchName);
  return branchName;
}

module.exports = {
  createAutodevBranch,
  commitChanges,
  getCurrentBranch,
  checkoutBranch
};