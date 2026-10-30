import type { Clip } from './clip.types';
import { clipAuthorHandle, clipHeading, clipSchema, clipSubject, isOwnClip } from './clip.types';

const base = {
  id: 'clip-1',
  mediaUrl: 'https://example.test/a.mp4',
  thumbnailUrl: 'https://example.test/a.jpg',
  caption: 'A clip',
  durationSeconds: 9,
  postedAt: '2026-01-01T00:00:00.000Z',
};

const customer = (overrides: Record<string, unknown> = {}) => ({
  kind: 'customer' as const,
  personId: 'p1',
  displayName: 'Sana',
  avatarUrl: '',
  handle: 'sana',
  ...overrides,
});

const parse = (raw: unknown): Clip => clipSchema.parse(raw);

describe('clipSchema', () => {
  it('defaults the media kind, so a clip seeded before the column parses', () => {
    expect(parse({ ...base, author: { kind: 'restaurant' } }).mediaKind).toBe('mp4');
  });

  it('accepts a clip with no restaurant at all', () => {
    expect(() => parse({ ...base, author: customer() })).not.toThrow();
  });

  it('refuses a customer author with no name to draw a header with', () => {
    // The whole reason profiles gate the community cell.
    expect(() => parse({ ...base, author: { kind: 'customer', personId: 'p1' } })).toThrow();
  });
});

describe('clipSubject', () => {
  it('is community when no restaurant is named', () => {
    expect(clipSubject(parse({ ...base, author: customer() }))).toBe('community');
  });

  it('is a receipt when a customer names the order behind it', () => {
    const clip = parse({
      ...base,
      restaurantId: 'rest-1',
      restaurantName: 'Kebabish',
      author: customer({ orderId: 'o1' }),
    });

    expect(clipSubject(clip)).toBe('receipt');
  });

  it("is a kitchen for a restaurant's own footage", () => {
    const clip = parse({
      ...base,
      restaurantId: 'rest-1',
      restaurantName: 'Kebabish',
      author: { kind: 'restaurant' },
    });

    expect(clipSubject(clip)).toBe('kitchen');
  });

  it('is a kitchen when a customer posts about one with no receipt', () => {
    const clip = parse({
      ...base,
      restaurantId: 'rest-1',
      restaurantName: 'Kebabish',
      author: customer(),
    });

    expect(clipSubject(clip)).toBe('kitchen');
  });
});

describe('clipHeading', () => {
  it('is the kitchen when there is one', () => {
    const clip = parse({
      ...base,
      restaurantId: 'rest-1',
      restaurantName: 'Kebabish',
      author: customer({ orderId: 'o1' }),
    });

    expect(clipHeading(clip)).toBe('Kebabish');
  });

  it('is the person when there is not', () => {
    expect(clipHeading(parse({ ...base, author: customer() }))).toBe('Sana');
  });

  it('is empty rather than wrong for a restaurant clip with no name', () => {
    // Cannot happen from the server; a cell should render regardless.
    expect(clipHeading(parse({ ...base, author: { kind: 'restaurant' } }))).toBe('');
  });
});

describe('clipAuthorHandle', () => {
  it('reads as a handle', () => {
    expect(clipAuthorHandle(parse({ ...base, author: customer() }))).toBe('@sana');
  });

  it('is nothing for somebody who has not picked one', () => {
    expect(
      clipAuthorHandle(parse({ ...base, author: customer({ handle: null }) })),
    ).toBeUndefined();
  });

  it('is nothing for a restaurant', () => {
    expect(clipAuthorHandle(parse({ ...base, author: { kind: 'restaurant' } }))).toBeUndefined();
  });
});

describe('isOwnClip', () => {
  it('is yours when you are the person the author points at', () => {
    expect(isOwnClip(parse({ ...base, author: customer() }), 'p1')).toBe(true);
  });

  it('is not yours when another customer filmed it', () => {
    // The bug this replaced: every customer clip wore the badge.
    expect(isOwnClip(parse({ ...base, author: customer({ personId: 'p2' }) }), 'p1')).toBe(false);
  });

  it('is never yours when the kitchen filmed it', () => {
    expect(isOwnClip(parse({ ...base, author: { kind: 'restaurant' } }), 'p1')).toBe(false);
  });

  it('is nobody’s while signed out', () => {
    expect(isOwnClip(parse({ ...base, author: customer() }), null)).toBe(false);
  });
});
