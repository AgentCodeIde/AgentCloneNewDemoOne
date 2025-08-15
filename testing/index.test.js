const pad = require('./index');

test('pads string to desired length', () => {
  expect(pad('foo', 5)).toBe('  foo'); // left-pad pads with spaces by default
});