import { apiClient } from '@/api/client';
import { parseResponse } from '@/api/parse';
import type { Clip } from '@/features/discovery/types/clip.types';
import { clipSchema } from '@/features/discovery/types/clip.types';

import type { SignedClipUpload } from '../types/clip-draft.types';
import { signedClipUploadSchema } from '../types/clip-draft.types';

/** Both objects at once: a clip with a video and no poster cannot draw a cell. */
export async function signClipUpload(): Promise<SignedClipUpload> {
  const { data } = await apiClient.post<unknown>('/clip-uploads');
  return parseResponse(signedClipUploadSchema, data, 'POST /clip-uploads');
}

export type NewClipBody = {
  mediaPath: string;
  posterPath: string;
  durationSeconds: number;
  caption?: string | undefined;
  restaurantId?: string | undefined;
  menuItemId?: string | undefined;
  orderId?: string | undefined;
  postToFeed?: boolean | undefined;
};

/**
 * Creates the clip, naming the **paths** it uploaded rather than URLs.
 *
 * The server resolves them and refuses anything outside the prefix it signed
 * for this person — so a feed card cannot be pointed at somebody else's video
 * or at a tracker. See backend ADR-0021 and ADR-0023.
 */
export async function postClip(body: NewClipBody): Promise<Clip> {
  const { data } = await apiClient.post<unknown>('/clips', body);
  return parseResponse(clipSchema, data, 'POST /clips');
}

export async function reportClip(clipId: string, reason?: string): Promise<void> {
  await apiClient.post(`/clips/${clipId}/report`, { reason });
}
