import { z } from 'zod';

import { paymentMethodSchema } from '@/features/checkout/types/order.types';

export const openingHoursSchema = z.object({
  /** 0 is Sunday, matching Date#getDay(). */
  dayOfWeek: z.number().int().min(0).max(6),
  /** 24-hour `HH:mm`. */
  opensAt: z.string(),
  closesAt: z.string(),
});

export const reviewPhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
});

export const restaurantReviewSchema = z.object({
  id: z.string(),
  author: z.string(),
  avatar: z.string(),
  rating: z.number(),
  comment: z.string(),
  /** ISO 8601 date. */
  postedAt: z.string(),
  /**
   * Photographs the customer attached, in the order they chose. Defaulted: a
   * review without any is the normal case, and an API that has not shipped
   * this yet must still parse.
   *
   * Each carries its id as well as its URL, because reporting needs the id and
   * the two are not derivable from each other.
   */
  photos: z.array(reviewPhotoSchema).default([]),
});

export const deliveryEstimateSchema = z.object({
  minMinutes: z.number().int(),
  maxMinutes: z.number().int(),
});

/** The detail response extends this, so the two cannot drift. */
export const restaurantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  cuisines: z.array(z.string()),
  rating: z.number(),
  reviewCount: z.number().int(),
  /** ISO 4217. */
  currency: z.string(),
  deliveryFeeMinor: z.number().int(),
  deliveryEstimate: deliveryEstimateSchema,
  latitude: z.number(),
  longitude: z.number(),
  deliveryRadiusMeters: z.number().int(),
  image: z.string(),
  /**
   * Why this restaurant is or is not listed. Only its own staff ever see a
   * value other than `active` — see t2 and the going-live screen.
   */
  status: z.enum(['onboarding', 'active', 'suspended']),
  /**
   * What this restaurant accepts, served rather than assumed — the app renders
   * what it is handed. Defaulted so an older payload, or a restaurant read
   * before the API served this, still parses: cash is what every restaurant
   * took before the field existed.
   */
  paymentMethods: z.array(paymentMethodSchema).default(['cash_on_delivery']),
  /** Present only when the request carried `lat`/`lng`. */
  isDeliverable: z.boolean().optional(),
  distanceMeters: z.number().optional(),
});

export const restaurantSchema = restaurantSummarySchema.extend({
  description: z.string(),
  address: z.string(),
  gallery: z.array(z.string()),
  /**
   * IANA zone. Opening hours are stated in the restaurant's local time, so
   * judging Open/Closed on the device clock is wrong for anyone whose phone is
   * elsewhere. Required, not optional with a fallback: a silent default would
   * reintroduce the same bug quietly.
   */
  timezone: z.string(),
  openingHours: z.array(openingHoursSchema),
  reviews: z.array(restaurantReviewSchema),
});

export const restaurantSummaryListSchema = z.array(restaurantSummarySchema);

export type DeliveryEstimate = z.infer<typeof deliveryEstimateSchema>;
export type RestaurantReview = z.infer<typeof restaurantReviewSchema>;
export type RestaurantSummary = z.infer<typeof restaurantSummarySchema>;
export type Restaurant = z.infer<typeof restaurantSchema>;

export type ReviewPhoto = z.infer<typeof reviewPhotoSchema>;
