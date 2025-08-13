/**
 * Module to parse error logs and extract relevant context.
 */

/**
 * Extracts error context from a given log string.
 * @param {string} log - The log string containing the error information.
 * @returns {Object} An object with extracted stack trace and file name.
 */
function extractErrorContext(log) {
  const stackTraceRegex = /at\s+(.+):(\d+):(\d+)/;
  const match = log.match(stackTraceRegex);

  if (!match) {
    return {
      stackTrace: null,
      fileName: null
    };
  }

  const [, fileName, lineNumber, columnNumber] = match;

  return {
    stackTrace: `${fileName}:${lineNumber}:${columnNumber}`,
    fileName: fileName.trim()
  };
}

module.exports = {
  extractErrorContext
};