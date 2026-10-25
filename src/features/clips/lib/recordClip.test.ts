import { durationOf, MAX_CLIP_SECONDS } from './recordClip';

/**
 * The picker reports milliseconds, and `null` when it could not read one. The
 * server refuses a non-positive duration, so neither may reach it.
 */
describe('durationOf', () => {
  it('converts milliseconds to whole seconds', () => {
    expect(durationOf(9000)).toBe(9);
  });

  it('rounds up, so a clip is never reported shorter than it is', () => {
    expect(durationOf(9400)).toBe(10);
  });

  it('never reports zero, which the server refuses', () => {
    expect(durationOf(200)).toBe(1);
  });

  it.each([null, undefined])('falls back to a second when the picker says %p', (value) => {
    expect(durationOf(value)).toBe(1);
  });

  it('clamps to the cap the camera was given', () => {
    expect(durationOf(90_000)).toBe(MAX_CLIP_SECONDS);
  });
});
