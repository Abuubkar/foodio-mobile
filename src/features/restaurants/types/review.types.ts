import { z } from 'zod';

import { restaurantReviewSchema } from './restaurant.types';

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MAX = 1000;

/**
 * `POST /orders/:orderId/review`. The order names the restaurant, the token
 * names the author — so the body carries neither. Mirrors the backend's
 * `newReviewSchema` bounds exactly.
 */
export const newReviewSchema = z.object({
  rating: z.number().int().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX),
  comment: z.string().max(REVIEW_COMMENT_MAX).optional(),
  /**
   * A Clip already posted for this order, which becomes the video on the
   * review. The server checks it is the caller's and from that order.
   */
  clipId: z.string().optional(),
});

/** A posted review: the embedded shape plus the ids that anchor it. */
export const reviewSchema = restaurantReviewSchema.extend({
  restaurantId: z.string(),
  orderId: z.string(),
});

export const reviewListSchema = z.array(reviewSchema);

/** The most a review carries. The server enforces it; this keeps the UI honest. */
export const REVIEW_PHOTO_MAX = 5;

/**
 * `POST /reviews/:reviewId/photos`.
 *
 * No public URL comes back, unlike the staff path: the photograph is not
 * served until it is confirmed, so there is nothing to show yet and nothing
 * for a caller to save.
 */
export const signedReviewPhotoSchema = z.object({
  mediaId: z.string(),
  /** Absolute. PUT the bytes here, with no Authorization header. */
  uploadUrl: z.string(),
  expiresAt: z.string(),
});

/**
 * What the sheet collects. `comment` stays a plain string while typing;
 * `toNewReview` drops it from the payload when it is only whitespace.
 */
export const reviewFormSchema = z.object({
  rating: z.number().int().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX),
});

export type NewReview = z.infer<typeof newReviewSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type SignedReviewPhoto = z.infer<typeof signedReviewPhotoSchema>;
export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

export function toNewReview(values: ReviewFormValues, clipId?: string): NewReview {
  const comment = values.comment.trim();
  return {
    rating: values.rating,
    ...(comment ? { comment } : {}),
    // Absent rather than undefined-valued: the server tells "no video" from
    // "a video I could not name".
    ...(clipId === undefined ? {} : { clipId }),
  };
}
