/**
 * The device's own timezone on purpose — the opposite of `formatDate` below.
 *
 * An arrival window is a moment in the reader's day, so it has to read as their
 * clock reads. `formatDate` pins UTC because an ISO *date* is midnight UTC and
 * would shift a day west of it; an ISO *instant* has no such problem and
 * forcing UTC on one would show a Lahore customer a time five hours out.
 */
export function formatTime(iso: string, locale?: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return iso;

  return new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(at);
}

/** UTC on purpose: an ISO date is midnight UTC and would shift a day west of it. */
export function formatDate(isoDate: string, locale?: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
