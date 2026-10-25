import { z } from 'zod';

/** One signed object: where to PUT it, and the path to name afterwards. */
export const signedUploadSchema = z.object({
  uploadUrl: z.string(),
  publicUrl: z.string(),
  path: z.string(),
  expiresAt: z.string(),
});

/** A clip is two objects, signed together so a phone cannot get half an answer. */
export const signedClipUploadSchema = z.object({
  video: signedUploadSchema,
  poster: signedUploadSchema,
});

export const CLIP_VIDEO_CONTENT_TYPE = 'video/mp4';
export const CLIP_POSTER_CONTENT_TYPE = 'image/jpeg';

/**
 * What a person composed, before anything has been uploaded.
 *
 * `restaurantId` absent is the community half of the feed. `orderId` present
 * makes it a receipt. A dish or an order each need a restaurant, which the
 * server refuses without — see backend ADR-0023.
 */
export type ClipDraft = {
  videoUri: string;
  posterUri: string;
  durationSeconds: number;
  caption: string;
  restaurantId?: string | undefined;
  menuItemId?: string | undefined;
  orderId?: string | undefined;
};

export type SignedUpload = z.infer<typeof signedUploadSchema>;
export type SignedClipUpload = z.infer<typeof signedClipUploadSchema>;
