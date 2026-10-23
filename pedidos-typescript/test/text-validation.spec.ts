import { describe, expect, it } from 'vitest';
import { containsAsciiControlCharacter } from '../src/domain/text-validation.js';

describe('ASCII control character validation', () => {
  it('accepts printable text and non-ASCII characters', () => {
    expect(containsAsciiControlCharacter('Cliente João 😀')).toBe(false);
  });

  it.each(['\u0000', '\n', '\t', '\u001f', '\u007f'])(
    'rejects ASCII control character %s',
    (character) => {
      expect(containsAsciiControlCharacter(`before${character}after`)).toBe(true);
    },
  );
});
