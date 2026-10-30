import { z } from 'zod';

import { apiClient } from '@/api/client';
import { parseResponse } from '@/api/parse';
import type { MenuCategory, MenuItem } from '@/features/menu/types/menu.types';
import { menuCategorySchema, menuItemSchema } from '@/features/menu/types/menu.types';

/** The create/rename response carries no dishes yet, so the list is optional here. */
const categoryResponseSchema = menuCategorySchema.extend({
  menuItems: z.array(menuItemSchema).default([]),
});

export type CreateCategory = { restaurantId: string; name: string };

export async function createCategory({
  restaurantId,
  name,
}: CreateCategory): Promise<MenuCategory> {
  const endpoint = `/restaurants/${restaurantId}/menu-categories`;
  const { data } = await apiClient.post<unknown>(endpoint, { name });
  return parseResponse(categoryResponseSchema, data, `POST ${endpoint}`);
}

export type RenameCategory = { restaurantId: string; categoryId: string; name: string };

export async function renameCategory({
  restaurantId,
  categoryId,
  name,
}: RenameCategory): Promise<MenuCategory> {
  const endpoint = `/restaurants/${restaurantId}/menu-categories/${categoryId}`;
  const { data } = await apiClient.patch<unknown>(endpoint, { name });
  return parseResponse(categoryResponseSchema, data, `PATCH ${endpoint}`);
}

/**
 * 409 when any dish in the section has ever been ordered: the delete cascades
 * to the section's items and `order_lines` pins every one that has been sold.
 * In practice that makes an established section permanent, which the screen
 * says before offering this rather than after.
 */
export async function deleteCategory(restaurantId: string, categoryId: string): Promise<void> {
  await apiClient.delete(`/restaurants/${restaurantId}/menu-categories/${categoryId}`);
}

export type DishFields = {
  menuCategoryId: string;
  name: string;
  description: string;
  priceMinor: number;
};

export async function createDish(restaurantId: string, fields: DishFields): Promise<MenuItem> {
  const endpoint = `/restaurants/${restaurantId}/menu-items`;
  const { data } = await apiClient.post<unknown>(endpoint, fields);
  return parseResponse(menuItemSchema, data, `POST ${endpoint}`);
}

export async function updateDish(
  restaurantId: string,
  itemId: string,
  fields: Partial<DishFields>,
): Promise<MenuItem> {
  const endpoint = `/restaurants/${restaurantId}/menu-items/${itemId}`;
  const { data } = await apiClient.patch<unknown>(endpoint, fields);
  return parseResponse(menuItemSchema, data, `PATCH ${endpoint}`);
}

/**
 * 409 for anything ever ordered — order lines reference the item and that
 * history is not negotiable. The screen presents sold-out as the ordinary way
 * to take a dish off the menu, so this is the exception it looks like.
 */
export async function deleteDish(restaurantId: string, itemId: string): Promise<void> {
  await apiClient.delete(`/restaurants/${restaurantId}/menu-items/${itemId}`);
}
