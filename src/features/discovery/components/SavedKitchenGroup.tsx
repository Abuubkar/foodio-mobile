import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import { useRestaurantMenu } from '@/features/menu/hooks/useRestaurantMenu';
import { useRestaurant } from '@/features/restaurants/hooks/useRestaurant';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import type { Kitchen } from '../lib/kitchens';
import { taggedDish } from '../lib/kitchens';

import { SavedClipTile } from './SavedClipTile';

type SavedKitchenGroupProps = {
  kitchen: Kitchen;
};

/**
 * One kitchen's saved clips, under the same header the feed uses.
 *
 * Grouping is what makes a save a way back into a kitchen rather than a loose
 * clip: the thing you want after saving three dishes from one place is to
 * order from that place, and the header carries the delivery facts and the
 * route to the menu.
 */
export function SavedKitchenGroup({ kitchen }: SavedKitchenGroupProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();

  const { data: restaurant } = useRestaurant(kitchen.restaurantId);
  const { data: menu } = useRestaurantMenu(kitchen.restaurantId);

  const eta = restaurant
    ? t('restaurant.deliveryEstimate', {
        min: restaurant.deliveryEstimate.minMinutes,
        max: restaurant.deliveryEstimate.maxMinutes,
      })
    : undefined;

  // Two real columns, not a masonry library: with a handful of tiles the
  // library costs more than the rhythm it buys.
  const columns = [
    kitchen.clips.filter((_, index) => index % 2 === 0),
    kitchen.clips.filter((_, index) => index % 2 === 1),
  ];

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => guard(() => router.push(`/restaurant/${kitchen.restaurantId}`))}
        accessibilityRole="button"
        accessibilityLabel={t('clips.openMenu', { restaurant: kitchen.name })}
        className="mb-2.5 flex-row items-center px-3 py-1 active:opacity-70"
      >
        <Photo uri={restaurant?.image ?? ''} className="h-8 w-8 rounded-full" />

        <View className="ml-2.5 flex-1">
          <Text variant="label" className="text-white" numberOfLines={1}>
            {kitchen.name}
          </Text>
          {eta ? (
            <Text variant="caption" className="text-gray-400" numberOfLines={1}>
              {eta}
            </Text>
          ) : null}
        </View>

        <View className="flex-row items-center rounded-full border border-gray-700 bg-gray-800 px-3 py-1.5">
          <Text variant="caption" className="font-semibold text-gray-200">
            {t('clips.menu')}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={12}
            color={colors.gray[400]}
            style={{ marginLeft: 3 }}
          />
        </View>
      </Pressable>

      <View className="flex-row px-3">
        {columns.map((column, columnIndex) => (
          <View key={columnIndex} className={columnIndex === 0 ? 'flex-1' : 'ml-2.5 flex-1'}>
            {column.map((clip, index) => {
              const dish = menu ? taggedDish(menu, clip) : undefined;
              return (
                <SavedClipTile
                  key={clip.id}
                  clip={clip}
                  title={dish?.name ?? clip.caption}
                  subtitle={
                    dish
                      ? formatMoney(dish.priceMinor, restaurant?.currency ?? 'USD', i18n.language)
                      : undefined
                  }
                  tall={(index + columnIndex) % 3 === 0}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
