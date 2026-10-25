import type { ClipDraft } from '../types/clip-draft.types';
import { CLIP_POSTER_CONTENT_TYPE, CLIP_VIDEO_CONTENT_TYPE } from '../types/clip-draft.types';

export type ClipPoster = {
  /** Signs both objects and hands back where to PUT them. */
  sign: () => Promise<{
    video: { uploadUrl: string; path: string };
    poster: { uploadUrl: string; path: string };
  }>;
  put: (uploadUrl: string, uri: string, contentType: string) => Promise<void>;
  /** Creates the row. Nothing exists until this lands. */
  post: (body: {
    mediaPath: string;
    posterPath: string;
    durationSeconds: number;
    caption?: string | undefined;
    restaurantId?: string | undefined;
    menuItemId?: string | undefined;
    orderId?: string | undefined;
    postToFeed?: boolean | undefined;
  }) => Promise<{ id: string }>;
};

/**
 * Sends a clip: sign, upload the video, upload the poster, then create it.
 *
 * **The row is created last, and that is the whole shape of this function.** A
 * failure anywhere before it leaves two orphaned objects in a bucket and no
 * clip — which is the right way round. The alternative, creating the row first,
 * means a feed card pointing at bytes that never arrived, and a person seeing
 * their own post as a black rectangle.
 *
 * Unlike a review's photographs this does not swallow failures. There the
 * review was already posted and losing one photograph must not look like
 * losing the rating; here the clip *is* the thing, so a failure is a failure
 * and the caller says so once.
 *
 * Deps are injected because the ordering is the only part worth testing, and
 * testing it should not need a network.
 */
export async function postClipDraft(draft: ClipDraft, deps: ClipPoster): Promise<{ id: string }> {
  const signed = await deps.sign();

  await deps.put(signed.video.uploadUrl, draft.videoUri, CLIP_VIDEO_CONTENT_TYPE);
  await deps.put(signed.poster.uploadUrl, draft.posterUri, CLIP_POSTER_CONTENT_TYPE);

  return deps.post({
    mediaPath: signed.video.path,
    posterPath: signed.poster.path,
    durationSeconds: draft.durationSeconds,
    // Trimmed to nothing is nothing, not an empty caption the server stores.
    ...(draft.caption.trim() === '' ? {} : { caption: draft.caption.trim() }),
    ...(draft.restaurantId === undefined ? {} : { restaurantId: draft.restaurantId }),
    ...(draft.menuItemId === undefined ? {} : { menuItemId: draft.menuItemId }),
    ...(draft.orderId === undefined ? {} : { orderId: draft.orderId }),
    ...(draft.postToFeed === undefined ? {} : { postToFeed: draft.postToFeed }),
  });
}
