const leftPad = require('left-pad');

/**
 * Pad a string to the specified length using left-pad.
 * @param {string} str - The input string.
 * @param {number} length - Desired total length after padding.
 * @returns {string}
 */
module.exports = (str, length) => leftPad(str, length);