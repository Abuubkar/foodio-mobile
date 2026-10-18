import { placeGuessFrom, prefillable } from './placeGuess';

describe('placeGuessFrom', () => {
  it('has nothing to say about a point it could not look up', () => {
    expect(placeGuessFrom(undefined)).toEqual({});
  });

  it('reads a street address off a full result', () => {
    expect(
      placeGuessFrom({
        streetNumber: '12',
        street: 'Gulberg Main Boulevard',
        city: 'Lahore',
        postalCode: '54660',
      }),
    ).toEqual({ line1: '12 Gulberg Main Boulevard', city: 'Lahore', postcode: '54660' });
  });

  /** The common Lahore result: a district and nothing else worth having. */
  it('keeps the district when there is no city', () => {
    expect(placeGuessFrom({ subregion: 'Gulberg III' })).toEqual({ city: 'Gulberg III' });
  });

  it('prefers the city over the district when both came back', () => {
    expect(placeGuessFrom({ city: 'Lahore', subregion: 'Gulberg III' })).toEqual({
      city: 'Lahore',
    });
  });

  it('falls back to the place name when there is no street', () => {
    expect(placeGuessFrom({ name: 'Packages Mall' })).toEqual({ line1: 'Packages Mall' });
  });

  /** A number with no street is not an address line, it is a number. */
  it('does not build a line out of a house number alone', () => {
    expect(placeGuessFrom({ streetNumber: '12' })).toEqual({});
  });

  it('treats blanks and nulls as absent', () => {
    expect(placeGuessFrom({ street: '   ', city: null, postalCode: '' })).toEqual({});
  });
});

describe('prefillable', () => {
  const guess = { line1: '12 Gulberg Main Boulevard', city: 'Lahore', postcode: '54660' };

  it('fills a form that is still empty', () => {
    expect(prefillable(guess, { line1: '', city: '', postcode: '' })).toEqual(guess);
  });

  /** A guess is a starting point, never a correction. */
  it('leaves anything already typed alone', () => {
    expect(prefillable(guess, { line1: 'Flat 3, my own words', city: '', postcode: '' })).toEqual({
      city: 'Lahore',
      postcode: '54660',
    });
  });

  it('treats a field of spaces as empty', () => {
    expect(prefillable({ city: 'Lahore' }, { city: '   ' })).toEqual({ city: 'Lahore' });
  });

  it('has nothing to fill from an empty guess', () => {
    expect(prefillable({}, { line1: '', city: '' })).toEqual({});
  });

  it('fills a field the form does not have a value for yet', () => {
    expect(prefillable({ postcode: '54660' }, {})).toEqual({ postcode: '54660' });
  });
});
