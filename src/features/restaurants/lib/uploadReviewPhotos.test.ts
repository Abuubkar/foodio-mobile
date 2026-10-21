import type { ReviewPhotoUploader } from './uploadReviewPhotos';
import { uploadReviewPhotos } from './uploadReviewPhotos';

/** Records the order calls arrive in, so sequencing can be asserted. */
function recorder(overrides: Partial<ReviewPhotoUploader> = {}) {
  const calls: string[] = [];
  let next = 0;

  const deps: ReviewPhotoUploader = {
    sign: async (reviewId) => {
      next += 1;
      calls.push(`sign:${reviewId}:${next}`);
      return Promise.resolve({ mediaId: `m${next}`, uploadUrl: `https://up/${next}` });
    },
    put: async (uploadUrl, uri) => {
      calls.push(`put:${uploadUrl}:${uri}`);
      return Promise.resolve();
    },
    confirm: async (mediaId) => {
      calls.push(`confirm:${mediaId}`);
      return Promise.resolve();
    },
    ...overrides,
  };

  return { calls, deps };
}

describe('uploadReviewPhotos', () => {
  it('signs, puts and confirms each photograph in that order', async () => {
    const { calls, deps } = recorder();

    const outcome = await uploadReviewPhotos('r1', ['file://a.jpg'], deps);

    expect(outcome).toEqual({ uploaded: 1, failed: 0 });
    expect(calls).toEqual(['sign:r1:1', 'put:https://up/1:file://a.jpg', 'confirm:m1']);
  });

  it('finishes one before starting the next, rather than racing them', async () => {
    const { calls, deps } = recorder();

    await uploadReviewPhotos('r1', ['file://a.jpg', 'file://b.jpg'], deps);

    // The second sign must come after the first confirm: a burst can spend
    // slots the server has already counted on bytes that never arrive.
    expect(calls.indexOf('sign:r1:2')).toBeGreaterThan(calls.indexOf('confirm:m1'));
  });

  it('keeps going when one fails, and counts it', async () => {
    const { calls, deps } = recorder({
      put: async (uploadUrl, uri) => {
        calls.push(`put:${uploadUrl}:${uri}`);
        if (uri.includes('b.jpg')) throw new Error('network');
        return Promise.resolve();
      },
    });

    const outcome = await uploadReviewPhotos(
      'r1',
      ['file://a.jpg', 'file://b.jpg', 'file://c.jpg'],
      deps,
    );

    // A flaky connection on the second must not silently discard the third.
    expect(outcome).toEqual({ uploaded: 2, failed: 1 });
    expect(calls).toContain('confirm:m3');
  });

  it('never throws, because the review is already posted by the time it runs', async () => {
    const { deps } = recorder({
      sign: () => Promise.reject(new Error('offline')),
    });

    const outcome = await uploadReviewPhotos('r1', ['file://a.jpg', 'file://b.jpg'], deps);

    expect(outcome).toEqual({ uploaded: 0, failed: 2 });
  });

  it('does nothing, successfully, when no photographs were picked', async () => {
    const { calls, deps } = recorder();

    const outcome = await uploadReviewPhotos('r1', [], deps);

    expect(outcome).toEqual({ uploaded: 0, failed: 0 });
    expect(calls).toEqual([]);
  });
});
