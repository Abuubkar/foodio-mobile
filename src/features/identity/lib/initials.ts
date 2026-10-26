/**
 * Up to two initials for somebody with no photograph.
 *
 * Initials rather than a stock face, which is the rule the restaurant
 * photographs already follow: where there is no picture, show no picture. A
 * generic avatar is a small lie about a real person, and it makes every
 * profile without one look like the same profile.
 *
 * Falls back to a single neutral mark rather than an empty circle, so a cell
 * never has a hole in it.
 */
export function initialsOf(displayName: string): string {
  const words = displayName
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // "Sana K." gives SK; "Sana" gives S; a name of emoji or punctuation gives
  // whatever its first characters are, which is better than deciding it is
  // not a name.
  const letters = words.slice(0, 2).map((word) => [...word][0] ?? '');
  const joined = letters.join('').toUpperCase();

  return joined === '' ? '·' : joined;
}
