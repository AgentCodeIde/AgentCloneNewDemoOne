const fs = require('fs');
const path = require('path');

/**
 * Reads the content of a file.
 * @param {string} filePath - The path to the file.
 * @returns {Promise<string>} A promise that resolves with the file content or rejects with an error.
 */
async function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, '..', filePath), 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Writes content to a file.
 * @param {string} filePath - The path to the file.
 * @param {string} content - The content to write to the file.
 * @returns {Promise<void>} A promise that resolves when the file is written or rejects with an error.
 */
async function writeFile(filePath, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(__dirname, '..', filePath), content, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

module.exports = {
  readFile,
  writeFile
};