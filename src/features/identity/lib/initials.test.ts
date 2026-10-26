import { initialsOf } from './initials';

describe('initialsOf', () => {
  it('takes one initial from each of the first two words', () => {
    expect(initialsOf('Sana Khan')).toBe('SK');
  });

  it('takes one from a single name', () => {
    expect(initialsOf('Sana')).toBe('S');
  });

  it('ignores anything past the second word', () => {
    expect(initialsOf('Muhammad Ali Jinnah')).toBe('MA');
  });

  it('is not confused by extra spaces', () => {
    expect(initialsOf('  Sana   Khan  ')).toBe('SK');
  });

  it('keeps a full character rather than half of one', () => {
    // Splitting a string by index can cut a surrogate pair in two and render
    // a replacement glyph.
    expect(initialsOf('😀 Khan')).toBe('😀K');
  });

  it('shows a neutral mark rather than a hole', () => {
    expect(initialsOf('   ')).toBe('·');
  });
});
