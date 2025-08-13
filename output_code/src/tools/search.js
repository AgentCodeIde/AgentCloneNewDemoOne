const fs = require('fs');
const path = require('path');

/**
 * Searches for a string or regex pattern in the codebase.
 * @param {string} searchPattern - The string or regex pattern to search for.
 * @param {string} rootDir - The root directory of the codebase to search within.
 * @returns {Array} - An array of objects containing file paths and matching lines.
 */
function searchCode(searchPattern, rootDir) {
  const results = [];
  const pattern = new RegExp(searchPattern, 'g');

  function traverseDirectory(dir) {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        traverseDirectory(filePath);
      } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) { // Adjust extensions as needed
        const content = fs.readFileSync(filePath, 'utf-8');
        let match;
        while ((match = pattern.exec(content)) !== null) {
          results.push({
            file: filePath,
            line: match.lineNumber,
            match: match[0]
          });
        }
      }
    });
  }

  traverseDirectory(rootDir);
  return results;
}

module.exports = {
  searchCode
};