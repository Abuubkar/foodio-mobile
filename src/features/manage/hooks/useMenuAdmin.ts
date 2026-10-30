import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import type { RestaurantMenu } from '@/features/menu/types/menu.types';

import type { DishFields } from '../api/menuAdmin.api';
import {
  createCategory,
  createDish,
  deleteCategory,
  deleteDish,
  renameCategory,
  updateDish,
} from '../api/menuAdmin.api';

/**
 * Every mutation here invalidates rather than patching the cached menu.
 *
 * The menu is one tree read by the customer page, the kitchen's sold-out list
 * and this editor, and these operations move dishes between sections, add
 * sections and remove rows. Reproducing that tree surgery in five places is
 * where a stale menu comes from; a refetch of one query is cheap and always
 * right.
 */
function useMenuMutation<TArgs, TResult>(
  restaurantId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.restaurants.menu(restaurantId) }),
  });
}

export const useCreateCategory = (restaurantId: string) =>
  useMenuMutation(restaurantId, (name: string) => createCategory({ restaurantId, name }));

export const useRenameCategory = (restaurantId: string) =>
  useMenuMutation(restaurantId, (args: { categoryId: string; name: string }) =>
    renameCategory({ restaurantId, ...args }),
  );

export const useDeleteCategory = (restaurantId: string) =>
  useMenuMutation(restaurantId, (categoryId: string) => deleteCategory(restaurantId, categoryId));

export const useCreateDish = (restaurantId: string) =>
  useMenuMutation(restaurantId, (fields: DishFields) => createDish(restaurantId, fields));

export const useUpdateDish = (restaurantId: string) =>
  useMenuMutation(restaurantId, (args: { itemId: string; fields: Partial<DishFields> }) =>
    updateDish(restaurantId, args.itemId, args.fields),
  );

export const useDeleteDish = (restaurantId: string) =>
  useMenuMutation(restaurantId, (itemId: string) => deleteDish(restaurantId, itemId));

/** Every section, for the picker on the dish form. */
export const sectionsOf = (menu: RestaurantMenu | undefined) =>
  (menu ?? []).map((category) => ({ id: category.id, name: category.name }));
