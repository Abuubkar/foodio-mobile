import { apiClient } from '@/api/client';
import type { Page } from '@/api/page';
import { parsePage } from '@/api/page';
import { parseResponse } from '@/api/parse';
import type { PhotoContentType } from '@/features/photos/types/photo.types';

import type { NewReview, Review, SignedReviewPhoto } from '../types/review.types';
import { reviewListSchema, reviewSchema, signedReviewPhotoSchema } from '../types/review.types';

export async function fetchRestaurantReviewsPage(
  restaurantId: string,
  cursor?: string,
): Promise<Page<Review>> {
  const endpoint = `/restaurants/${restaurantId}/reviews`;
  const { data, headers } = await apiClient.get<unknown>(endpoint, {
    params: cursor ? { cursor } : {},
  });
  return parsePage(reviewListSchema, data, headers['x-next-cursor'], `GET ${endpoint}`);
}

export async function submitOrderReview(orderId: string, review: NewReview): Promise<Review> {
  const endpoint = `/orders/${orderId}/review`;
  const { data } = await apiClient.post<unknown>(endpoint, review);
  return parseResponse(reviewSchema, data, `POST ${endpoint}`);
}

/**
 * A URL for one photograph on a review, and the row that will hold it.
 *
 * The review exists by the time this is called — the server counts this
 * review's photographs to enforce its limit of five, and before the review
 * there is nothing to count. See backend ADR-0021.
 */
export async function signReviewPhoto(
  reviewId: string,
  contentType: PhotoContentType,
): Promise<SignedReviewPhoto> {
  const endpoint = `/reviews/${reviewId}/photos`;
  const { data } = await apiClient.post<unknown>(endpoint, { contentType });
  return parseResponse(signedReviewPhotoSchema, data, `POST ${endpoint}`);
}

/** Says the bytes landed. Until this, the photograph is not served to anyone. */
export async function confirmReviewPhoto(mediaId: string): Promise<void> {
  await apiClient.post(`/review-photos/${mediaId}/confirm`);
}

/** Flags a photograph. The same answer whether or not this person already has. */
export async function reportReviewPhoto(mediaId: string, reason?: string): Promise<void> {
  await apiClient.post(`/review-photos/${mediaId}/report`, reason ? { reason } : {});
}

/** The author hides their own. The review itself stays published. */
export async function removeReviewPhoto(mediaId: string): Promise<void> {
  await apiClient.delete(`/review-photos/${mediaId}`);
}
