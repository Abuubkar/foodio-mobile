import { useMutation } from '@tanstack/react-query';

import { expoPermissionAdapter, PermissionType, requestPermission } from '@/services/permissions';

import { signPhotoUpload, uploadPhoto } from '../api/photo.api';
import { pickAndShrink, UPLOAD_CONTENT_TYPE } from '../lib/pickAndShrink';

export type PhotoTarget = {
  restaurantId: string;
  /** Present for a dish photograph, absent for the restaurant's own. */
  menuItemId?: string;
};

/**
 * Pick, shrink, upload, and hand back the public URL to save.
 *
 * Saving is deliberately not part of this. A photograph is written into `image`
 * by whichever ordinary update endpoint owns that record, so this hook stays the
 * same whether the caller is editing a dish or a restaurant — and an upload that
 * is never saved leaves an orphaned object rather than a half-written row.
 *
 * `undefined` means the owner backed out of the picker, which is not a failure
 * and must not be shown as one.
 */
export function usePhotoUpload() {
  return useMutation({
    mutationFn: async (target: PhotoTarget): Promise<string | undefined> => {
      const permission = await requestPermission(
        expoPermissionAdapter,
        PermissionType.PhotoLibrary,
      );
      if (permission.status !== 'granted') {
        throw new Error('photo-library-denied');
      }

      const photo = await pickAndShrink();
      if (!photo) return undefined;

      // Signed only once the bytes exist: a URL fetched earlier could expire
      // while the owner is still choosing, and its lifetime is not ours to set.
      const signed = await signPhotoUpload({
        restaurantId: target.restaurantId,
        contentType: UPLOAD_CONTENT_TYPE,
        ...(target.menuItemId === undefined ? {} : { menuItemId: target.menuItemId }),
      });

      const file = await fetch(photo.uri).then((response) => response.blob());
      await uploadPhoto(signed.uploadUrl, file, UPLOAD_CONTENT_TYPE);

      return signed.publicUrl;
    },
  });
}
