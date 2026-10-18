import { z } from 'zod';

/**
 * One thing a customer picks, and what picking it does to the price.
 *
 * The delta is signed: "small" takes money off as readily as "extra cheese"
 * puts it on. Minor units, like every other amount.
 */
export const menuOptionChoiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceDeltaMinor: z.number().int(),
  /** Additive: absent means available — only `false` means sold out. */
  isAvailable: z.boolean().optional(),
});

/**
 * A question the dish asks. "Size" with one answer required, "Extras" with any
 * number. `minChoices` of 1 is what makes a group required.
 */
export const menuOptionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  minChoices: z.number().int().nonnegative(),
  maxChoices: z.number().int().positive(),
  choices: z.array(menuOptionChoiceSchema),
});

export const menuItemSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  menuCategoryId: z.string(),
  name: z.string(),
  description: z.string(),
  /** Minor units. The current asking price, not what anyone paid — docs/adr/0002. */
  priceMinor: z.number().int(),
  image: z.string(),
  rating: z.number().optional(),
  isPopular: z.boolean().optional(),
  /** Additive: absent means available — only `false` means sold out. */
  isAvailable: z.boolean().optional(),
  /** Absent for a dish that is simply one thing, which is most of them. */
  optionGroups: z.array(menuOptionGroupSchema).optional(),
});

export const menuCategorySchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  position: z.number().int(),
  menuItems: z.array(menuItemSchema),
});

/** `GET /restaurants/:id/menu` */
export const restaurantMenuSchema = z.array(menuCategorySchema);

export type MenuOptionChoice = z.infer<typeof menuOptionChoiceSchema>;
export type MenuOptionGroup = z.infer<typeof menuOptionGroupSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type MenuCategory = z.infer<typeof menuCategorySchema>;
export type RestaurantMenu = z.infer<typeof restaurantMenuSchema>;
