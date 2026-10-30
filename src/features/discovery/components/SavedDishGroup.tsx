import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import { useRestaurantMenu } from '@/features/menu/hooks/useRestaurantMenu';
import { useRestaurant } from '@/features/restaurants/hooks/useRestaurant';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useCartStore } from '@/stores/cart.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import type { SavedDish } from '../lib/kitchens';
import { dishInMenu, primaryAction, requiredGroupName } from '../lib/kitchens';
import type { Clip } from '../types/clip.types';
import { clipSubject } from '../types/clip.types';

import { SavedClipTile } from './SavedClipTile';

type SavedDishGroupProps = {
  dish: SavedDish;
};

/**
 * One dish and every saved clip of it, with the dish's own price and action.
 *
 * The sibling of `SavedKitchenGroup`, one level down: the kitchen header is a
 * way back into a place, this one is a way straight into the cart. Which makes
 * the dish view a shortlist you can order from without it being a second
 * screen — the header carries Add, so a save is one tap from the basket.
 *
 * The clips underneath are the pair this grouping exists for: the kitchen's
 * own footage beside the customer's receipt of the same plate.
 */
export function SavedDishGroup({ dish }: SavedDishGroupProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();

  const { data: restaurant } = useRestaurant(dish.restaurantId);
  const { data: menu } = useRestaurantMenu(dish.restaurantId);
  const addItem = useCartStore((state) => state.addItem);

  /* Only the id travels on a clip, so the name, the price and whether it
     still needs an answer all come from the kitchen's menu. */
  const menuItem = menu ? dishInMenu(menu, dish.menuItemId) : undefined;
  const currency = restaurant?.currency ?? 'USD';
  const soldOut = menuItem?.isAvailable === false;
  /* The clip's caption until the menu lands, so the row is never nameless. */
  const heading = menuItem?.name ?? dish.clips[0]?.caption ?? '';
  const action = primaryAction(menuItem);
  const requiredGroup = requiredGroupName(menuItem);

  const openDish = () => {
    if (menuItem) {
      guard(() => router.push(`/menu-item/${menuItem.id}`));
      return;
    }
    guard(() => router.push(`/restaurant/${dish.restaurantId}`));
  };

  const add = () => {
    if (!restaurant || !menuItem) return;
    addItem(
      {
        id: restaurant.id,
        name: restaurant.name,
        currency: restaurant.currency,
        deliveryFeeMinor: restaurant.deliveryFeeMinor,
        deliveryEstimate: restaurant.deliveryEstimate,
      },
      {
        id: menuItem.id,
        name: menuItem.name,
        priceMinor: menuItem.priceMinor,
        image: menuItem.image,
      },
    );
  };

  /** Price, then the kitchen, then what still has to be answered. */
  const dishLine = menuItem
    ? [
        formatMoney(menuItem.priceMinor, currency, i18n.language),
        dish.restaurantName,
        requiredGroup ? t('clips.pickA', { group: requiredGroup.toLowerCase() }) : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : dish.restaurantName;

  // Two real columns, as in the kitchen group. Every tile is short here: a
  // taller one would make two clips of the same dish look unequal, and
  // comparing them is the whole reason they are side by side.
  const columns = [
    dish.clips.filter((_, index) => index % 2 === 0),
    dish.clips.filter((_, index) => index % 2 === 1),
  ];

  return (
    <View className="mb-4">
      <Pressable
        onPress={openDish}
        accessibilityRole="button"
        accessibilityLabel={t('saved.openDish', { dish: heading })}
        className="mb-2.5 flex-row items-center px-3 py-1 active:opacity-70"
      >
        <Photo
          uri={menuItem?.image ?? dish.clips[0]?.thumbnailUrl ?? ''}
          className="h-10 w-10 rounded-lg"
        />

        <View className="ml-2.5 flex-1">
          <Text variant="label" className="text-white" numberOfLines={1}>
            {heading}
          </Text>
          <Text variant="caption" className="text-gray-400" numberOfLines={1}>
            {dishLine}
          </Text>
        </View>

        {/* Nothing until the menu answers: a pill that said "See the menu"
            while loading and then became Add would be a flicker, not a hint. */}
        {menu ? <DishAction action={soldOut ? 'soldOut' : action} onPress={add} /> : null}
      </Pressable>

      <View className="flex-row px-3">
        {columns.map((column, columnIndex) => (
          <View key={columnIndex} className={columnIndex === 0 ? 'flex-1' : 'ml-2.5 flex-1'}>
            {column.map((clip) => {
              const provenance = provenanceKey(clip);
              return (
                <SavedClipTile
                  key={clip.id}
                  clip={clip}
                  title={filmedBy(clip)}
                  subtitle={provenance ? t(provenance) : undefined}
                  tall={false}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

type DishActionProps = {
  action: 'add' | 'choose' | 'menu' | 'soldOut';
  onPress: () => void;
};

/**
 * The dish's own button, on the header row.
 *
 * `add` is the only one that is primary-orange, because it is the only one
 * that finishes the job here. `choose` and `menu` both lead somewhere, and the
 * header is already a link to it, so they read as the quieter chips the rest
 * of the shelf uses.
 */
function DishAction({ action, onPress }: DishActionProps) {
  const { t } = useTranslation();

  if (action === 'soldOut') {
    return (
      <Text variant="caption" className="text-gray-500">
        {t('clips.soldOut')}
      </Text>
    );
  }

  if (action === 'add') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('clips.action.add')}
        hitSlop={8}
        className="flex-row items-center rounded-full bg-primary-500 px-3 py-1.5 active:bg-primary-600"
      >
        <Ionicons name="add" size={14} color={colors.gray[900]} />
        <Text variant="caption" className="ml-0.5 font-semibold text-gray-900">
          {t('clips.action.add')}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5">
      <Text variant="caption" className="font-semibold text-gray-200">
        {t(`clips.action.${action}`)}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={12}
        color={colors.gray[400]}
        style={{ marginLeft: 3 }}
      />
    </View>
  );
}

/**
 * Who filmed it. The dish name is in the header, and repeating it on both
 * tiles would say nothing about the one difference between them.
 */
function filmedBy(clip: Clip): string {
  if (clip.author.kind === 'customer') return clip.author.displayName;

  return clip.restaurantName ?? '';
}

/**
 * What kind of clip it is, which is the claim each one is making.
 *
 * A customer clip with no order behind it gets no line: calling it a receipt
 * would be the one thing this screen must not say.
 */
function provenanceKey(clip: Clip): string | undefined {
  if (clip.author.kind === 'restaurant') return 'clips.marketingBadge';

  return clipSubject(clip) === 'receipt' ? 'clips.receiptBadge' : undefined;
}
