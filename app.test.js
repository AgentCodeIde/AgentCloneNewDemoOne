const getString = require('./app');

test('returns hello', () => {
  expect(getString()).toBe('hello');
});