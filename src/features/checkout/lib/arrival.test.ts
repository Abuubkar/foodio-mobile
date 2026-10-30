import { riderState } from './arrival';

const window = { from: '2026-10-30T19:10:00.000Z', to: '2026-10-30T19:25:00.000Z' };
const during = new Date('2026-10-30T19:15:00.000Z');
const after = new Date('2026-10-30T19:40:00.000Z');

describe('riderState', () => {
  it('brackets the arrival while the window is still open', () => {
    expect(riderState('out_for_delivery', window, during)).toBe('on-the-way');
  });

  it('admits it is late once the window has closed', () => {
    expect(riderState('out_for_delivery', window, after)).toBe('overdue');
  });

  it('speaks in the past tense once the food has arrived', () => {
    // Delivered beats overdue: the window is irrelevant once it is in your hands.
    expect(riderState('delivered', window, after)).toBe('delivered');
  });

  it('says nothing at all about an order that ended badly', () => {
    for (const status of ['rejected', 'cancelled', 'delivery_failed'] as const) {
      expect(riderState(status, window, during)).toBe('hidden');
    }
  });

  it('names the rider without a timing claim when there is no window', () => {
    expect(riderState('out_for_delivery', undefined, during)).toBe('unknown');
  });

  it('treats an unparseable window as no window rather than as late', () => {
    const broken = { from: 'not a date', to: 'also not a date' };
    expect(riderState('out_for_delivery', broken, during)).toBe('unknown');
  });
});
