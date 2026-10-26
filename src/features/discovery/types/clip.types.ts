import { z } from 'zod';

/**
 * Who made a Clip. The Order a customer's Clip may name is **evidence**, not
 * permission — a Clip with no Order is still a Clip, it just is not a receipt.
 * See backend ADR-0023; before it, naming an Order was the only way to be a
 * customer.
 */
export const clipAuthorSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('restaurant') }),
  z.object({
    kind: z.literal('customer'),
    /** Points at a Person; the name below is read from them, never stored twice. */
    personId: z.string(),
    /**
     * Enough to draw a cell header without a second request. A community Clip
     * names no Restaurant, so the header has nobody else to be about.
     */
    displayName: z.string(),
    avatarUrl: z.string(),
    /** Null until they pick one; a cell falls back to the display name. */
    handle: z.string().nullable(),
    /** Present when a delivered Order backs this Clip. That is what "verified" means. */
    orderId: z.string().optional(),
  }),
]);

/**
 * How the media is addressed, so the player chooses its source rather than
 * assuming a file. One value today: ADR-0005 pins Clips to a progressive MP4,
 * and live — LL-HLS or WebRTC — is what will add the second.
 */
export const clipMediaKindSchema = z.enum(['mp4']);

export const clipSchema = z.object({
  id: z.string(),
  /**
   * The Restaurant this Clip is **about**, absent when it is about none.
   *
   * A Clip with no Restaurant is the community half of the feed: somebody
   * asking what to eat, rather than a statement about one kitchen.
   */
  restaurantId: z.string().optional(),
  /** Denormalised: the feed card needs it and json-server cannot join. */
  restaurantName: z.string().optional(),
  /** Present when the Clip is about one dish — lets a Menu Item show ours beside theirs. */
  menuItemId: z.string().optional(),
  /** Progressive MP4 — iOS cannot cache HLS. See docs/adr/0005. */
  mediaUrl: z.string(),
  /** Defaulted, so seeded clips from before the column existed still parse. */
  mediaKind: clipMediaKindSchema.default('mp4'),
  /** Shown while the media buffers. */
  thumbnailUrl: z.string(),
  caption: z.string(),
  durationSeconds: z.number().int().positive(),
  postedAt: z.string(),
  author: clipAuthorSchema,
});

export const clipListSchema = z.array(clipSchema);

export type ClipAuthor = z.infer<typeof clipAuthorSchema>;
export type ClipMediaKind = z.infer<typeof clipMediaKindSchema>;
export type Clip = z.infer<typeof clipSchema>;

export const isCustomerClip = (clip: Clip): boolean => clip.author.kind === 'customer';

/**
 * Which of the three shapes a Clip is, from the three fields that make it up.
 *
 * One function rather than three truthiness tests at every call site. The
 * server refuses the inconsistent combinations, so this cannot disagree with
 * what came over the wire.
 */
export type ClipSubject = 'community' | 'kitchen' | 'receipt';

export function clipSubject(clip: Clip): ClipSubject {
  if (clip.restaurantId === undefined) return 'community';
  if (clip.author.kind === 'customer' && clip.author.orderId !== undefined) return 'receipt';

  return 'kitchen';
}

/**
 * What a cell's header is about: the kitchen when there is one, the person
 * otherwise.
 *
 * Every label and title used to read `clip.restaurantName` directly, which is
 * now optional — so this is the one place that decides, rather than four
 * places each guessing.
 */
export function clipHeading(clip: Clip): string {
  if (clip.restaurantName !== undefined) return clip.restaurantName;

  return clip.author.kind === 'customer' ? clip.author.displayName : '';
}

/** `@sana` when they have picked one. Nothing to show otherwise. */
export function clipAuthorHandle(clip: Clip): string | undefined {
  if (clip.author.kind !== 'customer') return undefined;

  return clip.author.handle === null ? undefined : `@${clip.author.handle}`;
}
