import { apiClient } from '@/api/client';
import { parseResponse } from '@/api/parse';

import type { PhotoContentType, SignedUpload } from '../types/photo.types';
import { signedUploadSchema } from '../types/photo.types';

export type SignPhotoUpload = {
  restaurantId: string;
  contentType: PhotoContentType;
  /** Present for a dish photograph, absent for the restaurant's own. */
  menuItemId?: string;
};

export async function signPhotoUpload({
  restaurantId,
  contentType,
  menuItemId,
}: SignPhotoUpload): Promise<SignedUpload> {
  const endpoint = `/restaurants/${restaurantId}/photo-uploads`;
  const { data } = await apiClient.post<unknown>(endpoint, { contentType, menuItemId });
  return parseResponse(signedUploadSchema, data, `POST ${endpoint}`);
}

/**
 * Straight to storage, with `fetch` rather than axios or the shared client.
 *
 * Not the shared client, because the signed URL carries its own scoped token
 * and sending Foodio's bearer token to a storage host would leak it. Not axios
 * either: React Native's `Blob` is a polyfill over a native handle, axios does
 * not recognise it as a body it can send, and quietly `JSON.stringify`s it — so
 * the "photograph" that arrives is 141 bytes reading
 * `{"_data":{"blobId":…}}`. React Native's own `fetch` passes a Blob straight
 * to XHR, which knows what to do with it.
 *
 * That failure is silent end to end: the PUT returns 200, the record saves, and
 * only the picture is wrong. It was caught by uploading a real photograph and
 * looking at the file on disk.
 */
export async function uploadPhoto(
  uploadUrl: string,
  file: Blob,
  contentType: PhotoContentType,
): Promise<void> {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  // `fetch` resolves for 4xx and 5xx alike, so this has to be asked explicitly.
  if (!response.ok) {
    throw new Error(`Upload failed with ${response.status}`);
  }
}
