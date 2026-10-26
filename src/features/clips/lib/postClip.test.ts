import type { ClipDraft } from '../types/clip-draft.types';

import type { ClipPoster } from './postClip';
import { postClipDraft } from './postClip';

const draft = (overrides: Partial<ClipDraft> = {}): ClipDraft => ({
  videoUri: 'file:///take.mp4',
  posterUri: 'file:///take.jpg',
  durationSeconds: 9,
  caption: 'Straight off the grill',
  ...overrides,
});

/** Records what happened, in order, so the sequence itself can be asserted. */
const poster = (overrides: Partial<ClipPoster> = {}) => {
  const steps: string[] = [];
  const deps: ClipPoster = {
    sign: async () => {
      steps.push('sign');
      return {
        video: { uploadUrl: 'https://store.test/v', path: 'clips/p1/take.mp4' },
        poster: { uploadUrl: 'https://store.test/p', path: 'clips/p1/take.jpg' },
      };
    },
    put: async (uploadUrl) => {
      steps.push(`put ${uploadUrl}`);
    },
    post: async () => {
      steps.push('post');
      return { id: 'clip-1' };
    },
    ...overrides,
  };

  return { deps, steps };
};

describe('postClipDraft', () => {
  it('signs, uploads both objects, then creates the clip', async () => {
    const { deps, steps } = poster();

    await postClipDraft(draft(), deps);

    expect(steps).toEqual(['sign', 'put https://store.test/v', 'put https://store.test/p', 'post']);
  });

  it('names the paths it was given, never a URL', async () => {
    const bodies: unknown[] = [];
    const { deps } = poster({
      post: async (body) => {
        bodies.push(body);
        return { id: 'clip-1' };
      },
    });

    await postClipDraft(draft(), deps);

    expect(bodies[0]).toMatchObject({
      mediaPath: 'clips/p1/take.mp4',
      posterPath: 'clips/p1/take.jpg',
    });
  });

  it('creates nothing when the video upload fails', async () => {
    const { deps, steps } = poster({
      put: async () => {
        throw new Error('offline');
      },
    });

    await expect(postClipDraft(draft(), deps)).rejects.toThrow('offline');

    // The row is created last on purpose. A clip that exists while its bytes
    // do not is a feed card showing a black rectangle to the person who posted it.
    expect(steps).not.toContain('post');
  });

  it('sends no caption at all when it is blank', async () => {
    const bodies: Record<string, unknown>[] = [];
    const { deps } = poster({
      post: async (body) => {
        bodies.push(body as Record<string, unknown>);
        return { id: 'clip-1' };
      },
    });

    await postClipDraft(draft({ caption: '   ' }), deps);

    expect(bodies[0]).not.toHaveProperty('caption');
  });

  it('trims a caption rather than storing the spaces', async () => {
    const bodies: Record<string, unknown>[] = [];
    const { deps } = poster({
      post: async (body) => {
        bodies.push(body as Record<string, unknown>);
        return { id: 'clip-1' };
      },
    });

    await postClipDraft(draft({ caption: '  hot  ' }), deps);

    expect(bodies[0]?.caption).toBe('hot');
  });

  const cases: [string, Partial<ClipDraft>, string[]][] = [
    ['nothing in particular', {}, []],
    ['one kitchen', { restaurantId: 'rest-1' }, ['restaurantId']],
    ['one dish', { restaurantId: 'rest-1', menuItemId: 'item-1' }, ['restaurantId', 'menuItemId']],
    ['a receipt', { restaurantId: 'rest-1', orderId: 'order-1' }, ['restaurantId', 'orderId']],
  ];

  it.each(cases)('carries the context for a clip about %s', async (_name, context, expected) => {
    const bodies: Record<string, unknown>[] = [];
    const { deps } = poster({
      post: async (body) => {
        bodies.push(body as Record<string, unknown>);
        return { id: 'clip-1' };
      },
    });

    await postClipDraft(draft(context), deps);

    const sent = bodies[0] ?? {};
    for (const key of ['restaurantId', 'menuItemId', 'orderId']) {
      // Absent, not null: the server tells optional from "explicitly nothing".
      expect(Object.keys(sent).includes(key)).toBe(expected.includes(key));
    }
  });
});
