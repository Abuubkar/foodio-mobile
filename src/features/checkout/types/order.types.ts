import { z } from 'zod';

import { deliveryAddressSchema } from './address.types';

/**
 * No "finding a courier" stage — the restaurant delivers its own orders, so
 * there is nobody to search for. See docs/adr/0003.
 *
 * `delivery_failed` is the cash-on-delivery failure mode a card market never
 * has — nobody answered the door — see the backend's ADR-0009.
 */
export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'rejected',
  'cancelled',
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

/**
 * A choice as it was made, frozen. Names and the delta are copies, exactly as
 * the line copies the dish's name and price: an Order is a receipt, and a
 * receipt does not change when the menu does. See the backend's ADR-0020.
 */
export const chosenOptionSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  choiceId: z.string(),
  choiceName: z.string(),
  priceDeltaMinor: z.number().int(),
});

/** The amount charged at the time, never the menu item's current price. */
export const orderLineSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  image: z.string(),
  unitPriceMinor: z.number().int(),
  quantity: z.number().int().positive(),
  /** Optional: orders placed before instructions existed carry none. */
  instruction: z.string().optional(),
  /**
   * What the customer chose. Absent for a dish that asks nothing, which is
   * every line placed before options existed.
   */
  options: z.array(chosenOptionSchema).optional(),
});

/**
 * One member today, and a list rather than a fixed word on purpose.
 *
 * A `z.literal` accepts that exact string and rejects everything else, and
 * `parseResponse` throws for the whole response — so the first order carrying a
 * second method would empty the entire order list rather than hide one row. A
 * one-member list accepts exactly the same values today and costs nothing.
 *
 * Card is the only member that will ever join it.
 */
export const PAYMENT_METHODS = ['cash_on_delivery'] as const;

export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const ORDER_PAYMENT_STATES = [
  'pending',
  'authorized',
  'captured',
  'voided',
  'refunded',
  'failed',
] as const;

export const orderPaymentStateSchema = z.enum(ORDER_PAYMENT_STATES);

/**
 * The money against an order, as its own record rather than a field on the
 * order — see the backend's ADR-0016. Cash never reaches `authorized`, because
 * there is nothing to hold.
 */
export const orderPaymentSchema = z.object({
  method: paymentMethodSchema,
  state: orderPaymentStateSchema,
  amountMinor: z.number().int(),
});

/**
 * Who picked the order up. A name and a face, and deliberately nothing else —
 * the server never sends the rider's phone. See backend ADR-0024.
 */
export const orderRiderSchema = z.object({
  displayName: z.string(),
  /** Empty means no photograph; `PersonAvatar` draws initials. */
  avatarUrl: z.string().default(''),
});

/**
 * When the food should turn up, as a range rather than a moment. The server
 * measures it once at pickup and never revises it, so it does not jitter
 * across the five-second poll.
 */
export const arrivalWindowSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const orderSchema = z.object({
  /** json-server assigns a number; every caller wants a string. */
  id: z.coerce.string(),
  restaurantId: z.string(),
  restaurantName: z.string(),
  currency: z.string(),
  status: orderStatusSchema,
  placedAt: z.string(),
  lines: z.array(orderLineSchema),
  subtotalMinor: z.number().int(),
  deliveryFeeMinor: z.number().int(),
  totalMinor: z.number().int(),
  address: deliveryAddressSchema,
  paymentMethod: paymentMethodSchema,
  /**
   * Optional, and its absence means "we do not know" rather than "unpaid":
   * orders placed before order payments existed carry none, and the app must
   * not invent a state for them.
   */
  payment: orderPaymentSchema.optional(),
  /** Only on staff-scoped reads, so a rider can call about a wrong gate number. */
  customerPhone: z.string().optional(),
  /** Both present from pickup onward — the server reads them off that event. */
  rider: orderRiderSchema.optional(),
  arrival: arrivalWindowSchema.optional(),
});

export const orderListSchema = z.array(orderSchema);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type OrderPaymentState = z.infer<typeof orderPaymentStateSchema>;
export type OrderPayment = z.infer<typeof orderPaymentSchema>;
export type OrderRider = z.infer<typeof orderRiderSchema>;
export type ArrivalWindow = z.infer<typeof arrivalWindowSchema>;
export type ChosenOption = z.infer<typeof chosenOptionSchema>;
export type OrderLine = z.infer<typeof orderLineSchema>;
export type Order = z.infer<typeof orderSchema>;

/**
 * An order as it is submitted — the server owns id, status and placedAt, and
 * the payment, which it opens inside the order's own transaction. A client that
 * could state its own payment state could claim to have paid.
 */
export type NewOrder = Omit<Order, 'id' | 'status' | 'placedAt' | 'payment'>;

const TERMINAL: readonly OrderStatus[] = ['delivered', 'delivery_failed', 'rejected', 'cancelled'];

export const isTerminal = (status: OrderStatus): boolean => TERMINAL.includes(status);

/** Only before the kitchen starts. */
export const isCancellable = (status: OrderStatus): boolean =>
  status === 'placed' || status === 'accepted';
