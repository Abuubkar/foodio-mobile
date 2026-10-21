import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { uploadPhoto } from '@/features/photos/api/photo.api';
import { pickAndShrink, UPLOAD_CONTENT_TYPE } from '@/features/photos/lib/pickAndShrink';
import { confirmReviewPhoto, signReviewPhoto } from '@/features/restaurants/api/review.api';
import type { ReviewPhotoOutcome } from '@/features/restaurants/lib/uploadReviewPhotos';
import { uploadReviewPhotos } from '@/features/restaurants/lib/uploadReviewPhotos';
import { logError } from '@/lib/logger';
import { expoPermissionAdapter, PermissionType, requestPermission } from '@/services/permissions';

/**
 * Picking and sending the photographs on a review.
 *
 * Not a `useMutation`, because this is two phases with different owners: the
 * picker runs while the customer is still writing, and the upload runs after
 * the review has been accepted. A mutation would make the second look like a
 * retry of the first.
 */
export function useReviewPhotos() {
  const queryClient = useQueryClient();
  const [isPicking, setIsPicking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [outcome, setOutcome] = useState<ReviewPhotoOutcome | null>(null);

  /** A local file, already shrunk. `undefined` means they backed out. */
  const pick = async (): Promise<string | undefined> => {
    setIsPicking(true);
    try {
      const permission = await requestPermission(
        expoPermissionAdapter,
        PermissionType.PhotoLibrary,
      );
      if (permission.status !== 'granted') return undefined;

      const photo = await pickAndShrink();
      return photo?.uri;
    } catch (error) {
      // Backing out of a picker is not a failure, and neither is a library
      // that refused to open — neither is worth an error message over a form
      // the customer has already filled in.
      logError('review.photos.pick', error);
      return undefined;
    } finally {
      setIsPicking(false);
    }
  };

  const sendPhotos = async (
    reviewId: string,
    uris: readonly string[],
  ): Promise<ReviewPhotoOutcome> => {
    setIsSending(true);
    try {
      const result = await uploadReviewPhotos(reviewId, uris, {
        sign: async (id) => {
          const signed = await signReviewPhoto(id, UPLOAD_CONTENT_TYPE);
          return { mediaId: signed.mediaId, uploadUrl: signed.uploadUrl };
        },
        put: async (uploadUrl, uri) => {
          const file = await fetch(uri).then((response) => response.blob());
          await uploadPhoto(uploadUrl, file, UPLOAD_CONTENT_TYPE);
        },
        confirm: confirmReviewPhoto,
      });

      setOutcome(result);

      // Even a partial success changed what the reviews list serves.
      if (result.uploaded > 0) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.all });
      }

      return result;
    } finally {
      setIsSending(false);
    }
  };

  const resetPhotos = () => setOutcome(null);

  return { pick, isPicking, sendPhotos, isSending, outcome, resetPhotos };
}
