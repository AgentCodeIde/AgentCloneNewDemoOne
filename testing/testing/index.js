const leftPad = require('left-pad');

/**
 * Trả về chuỗi đã được pad sang độ dài 5 ký tự.
 */
module.exports = function(str) {
  return leftPad(str, 5);
};