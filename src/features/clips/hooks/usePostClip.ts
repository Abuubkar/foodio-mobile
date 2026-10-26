import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { uploadMedia } from '@/features/photos/api/photo.api';
import { logError } from '@/lib/logger';
import { expoPermissionAdapter, PermissionType, requestPermission } from '@/services/permissions';

import { postClip, signClipUpload } from '../api/clip-post.api';
import { postClipDraft } from '../lib/postClip';
import { posterFrame } from '../lib/posterFrame';
import { recordClip } from '../lib/recordClip';
import type { ClipDraft } from '../types/clip-draft.types';

/** What filming produced, before a caption has been written. */
export type ClipTake = {
  videoUri: string;
  posterUri: string;
  durationSeconds: number;
};

/**
 * Filming a clip, and sending it.
 *
 * Two phases with different owners, the same split `useReviewPhotos` makes:
 * filming happens while the person is still deciding, and sending happens once
 * they have written a caption and pressed post. Only the second is a mutation
 * — the first is not a retryable server call, and treating it as one makes
 * "film again" look like "try that upload again".
 */
export function usePostClip() {
  const queryClient = useQueryClient();
  const [isFilming, setIsFilming] = useState(false);

  /** `undefined` means they backed out or the camera was refused. Neither is an error. */
  const film = async (): Promise<ClipTake | undefined> => {
    setIsFilming(true);
    try {
      const permission = await requestPermission(expoPermissionAdapter, PermissionType.Camera);
      if (permission.status !== 'granted') return undefined;

      const recorded = await recordClip();
      if (!recorded) return undefined;

      // Before the caption, not after: a person should see the frame their
      // clip will be represented by while they can still film it again.
      const posterUri = await posterFrame(recorded.uri);

      return { videoUri: recorded.uri, posterUri, durationSeconds: recorded.durationSeconds };
    } catch (error) {
      logError('clips.film', error);
      return undefined;
    } finally {
      setIsFilming(false);
    }
  };

  const send = useMutation({
    mutationFn: (draft: ClipDraft) =>
      postClipDraft(draft, {
        sign: signClipUpload,
        put: async (uploadUrl, uri, contentType) => {
          // `uploadMedia` rather than a `fetch` here: the reason it exists is
          // a trap this would walk straight into — axios silently
          // JSON.stringifies React Native's Blob and uploads 141 bytes with a
          // 200, so the PUT succeeds and only the media is wrong.
          const file = await fetch(uri).then((response) => response.blob());
          await uploadMedia(uploadUrl, file, contentType);
        },
        post: postClip,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });

  return { film, isFilming, send };
}
