import type { ArrivalWindow, OrderStatus } from '../types/order.types';
import { isTerminal } from '../types/order.types';

/**
 * `hidden` is not the same as `unknown`. Unknown means we have a rider and
 * nothing to say about timing; hidden means saying anything at all would be a
 * claim the order contradicts.
 */
export type RiderState = 'on-the-way' | 'overdue' | 'delivered' | 'unknown' | 'hidden';

/**
 * What the rider card may honestly claim.
 *
 * Read on every render rather than on a timer: the order screen already polls
 * every five seconds while the order is live, so the flip to `overdue` arrives
 * with the next poll and costs nothing.
 */
export function riderState(
  status: OrderStatus,
  arrival: ArrivalWindow | undefined,
  now: Date,
): RiderState {
  if (status === 'delivered') return 'delivered';

  // A rejected, cancelled or failed order already explains itself on the
  // timeline. A card beside that saying someone is on the way would be the app
  // contradicting itself on the same screen.
  if (isTerminal(status)) return 'hidden';

  if (arrival === undefined) return 'unknown';

  const to = Date.parse(arrival.to);
  if (Number.isNaN(to)) return 'unknown';

  return now.getTime() > to ? 'overdue' : 'on-the-way';
}
