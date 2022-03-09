import { sanitize } from '../src/sanitize';

describe('sanitize', () => {
  test.each([`'`, `"`, `\``, '(', ')', '[', ']'])('sanitizes out a character=%p', (char) => {
    const rawString = `Change ${char}some value${char} to be 42!`;
    const expected = 'Change some value to be 42!';

    expect(sanitize(rawString)).toEqual(expected);
  });

  test('ignores undefined', () => {
    expect(sanitize(undefined)).toEqual(undefined);
  });
});
