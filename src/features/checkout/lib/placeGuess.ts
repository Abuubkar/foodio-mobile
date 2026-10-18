/** What a reverse lookup could tell us about a point. Any of it may be absent. */
export type PlaceGuess = {
  line1?: string;
  city?: string;
  postcode?: string;
};

/** The parts of an `expo-location` result this app has any use for. */
export type ReverseGeocoded = {
  streetNumber?: string | null;
  street?: string | null;
  name?: string | null;
  city?: string | null;
  subregion?: string | null;
  postalCode?: string | null;
};

const text = (value: string | null | undefined): string | undefined => {
  const trimmed = (value ?? '').trim();
  return trimmed === '' ? undefined : trimmed;
};

/**
 * A reverse-lookup result, reduced to the three fields the address form has.
 *
 * Everything is optional because in Lahore it genuinely is: a lookup often
 * knows the city and nothing else, and `name` is sometimes a building and
 * sometimes a repeat of the street. Absent beats a confident wrong guess —
 * an empty field asks to be filled, a wrong one has to be noticed first.
 */
export function placeGuessFrom(place: ReverseGeocoded | undefined): PlaceGuess {
  if (!place) return {};

  const street = text(place.street) ?? text(place.name);
  const number = text(place.streetNumber);
  const line1 = street ? [number, street].filter(Boolean).join(' ') : undefined;

  // `subregion` is the district, which is what a lookup in Lahore tends to
  // return in place of a city.
  const city = text(place.city) ?? text(place.subregion);
  const postcode = text(place.postalCode);

  return {
    ...(line1 ? { line1 } : {}),
    ...(city ? { city } : {}),
    ...(postcode ? { postcode } : {}),
  };
}

/**
 * What of a guess may actually be written into the form.
 *
 * Only into an empty field: a guess is a starting point, never a correction.
 * Somebody who has typed their own street has said something more reliable
 * than the device did.
 */
export function prefillable<T extends Record<string, unknown>>(
  guess: PlaceGuess,
  current: T,
): PlaceGuess {
  const keep = Object.entries(guess).filter(([field, value]) => {
    const existing = current[field];
    return Boolean(value) && (typeof existing !== 'string' || existing.trim() === '');
  });

  return Object.fromEntries(keep);
}
