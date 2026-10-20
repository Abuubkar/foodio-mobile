export type ReviewPhotoUploader = {
  /** Claims a slot on the review and hands back somewhere to PUT the bytes. */
  sign: (reviewId: string) => Promise<{ mediaId: string; uploadUrl: string }>;
  put: (uploadUrl: string, uri: string) => Promise<void>;
  /** Publishes it. Until this lands the photograph is not served to anyone. */
  confirm: (mediaId: string) => Promise<void>;
};

export type ReviewPhotoOutcome = {
  uploaded: number;
  failed: number;
};

/**
 * Sends the photographs a customer picked, one after the other.
 *
 * Sequential rather than parallel. Five uploads at once on Lahore mobile data
 * is five slow uploads rather than one quick one, and the server counts a
 * signed URL against the review's limit the moment it issues one — so a burst
 * that half fails can spend slots on bytes that never arrive.
 *
 * **A failure here is not a failed review.** The review is already posted by
 * the time this runs; that is what makes the server's cap enforceable. So one
 * photograph failing must not look like losing the rating and the comment, and
 * the rest are still attempted — a flaky connection on photograph two should
 * not silently discard photograph three.
 *
 * Deps are injected so the ordering and the partial-failure behaviour can be
 * tested without a network, which is the only part of this worth testing.
 */
export async function uploadReviewPhotos(
  reviewId: string,
  uris: readonly string[],
  deps: ReviewPhotoUploader,
): Promise<ReviewPhotoOutcome> {
  let uploaded = 0;
  let failed = 0;

  for (const uri of uris) {
    try {
      const { mediaId, uploadUrl } = await deps.sign(reviewId);
      await deps.put(uploadUrl, uri);
      await deps.confirm(mediaId);
      uploaded += 1;
    } catch {
      // Swallowed on purpose, and counted. The caller shows one summary at the
      // end; five separate error messages for five photographs is noise, and
      // the review itself is already safe.
      failed += 1;
    }
  }

  return { uploaded, failed };
}
