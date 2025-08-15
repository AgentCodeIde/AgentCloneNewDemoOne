const pad = require('./index');

test('should pad string to length 5', () => {
  expect(pad('hi')).toBe('   hi');
});