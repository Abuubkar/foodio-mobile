import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import type { RestaurantSummary } from '@/features/restaurants/types/restaurant.types';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

type KitchenHeaderProps = {
  name: string;
  /** Absent until the restaurant loads; the name alone is enough to render. */
  restaurant: RestaurantSummary | undefined;
  onOpenMenu: () => void;
};

/**
 * Whose kitchen this is, and the two facts that decide whether to keep
 * watching: how long it takes and what delivery costs.
 *
 * Everything here belongs to the restaurant. Nothing of the customer's lives
 * in this row — Saved sits in the account sheet precisely so that a second
 * bookmark never appears beside the one in the action rail.
 */
export function KitchenHeader({ name, restaurant, onOpenMenu }: KitchenHeaderProps) {
  const { t, i18n } = useTranslation();

  const delivery = restaurant
    ? restaurant.deliveryFeeMinor === 0
      ? t('restaurant.freeDelivery')
      : t('restaurant.deliveryFee', {
          fee: formatMoney(restaurant.deliveryFeeMinor, restaurant.currency, i18n.language),
        })
    : undefined;

  const eta = restaurant
    ? t('restaurant.deliveryEstimate', {
        min: restaurant.deliveryEstimate.minMinutes,
        max: restaurant.deliveryEstimate.maxMinutes,
      })
    : undefined;

  return (
    <View pointerEvents="box-none" className="flex-row items-center px-3.5">
      <Photo uri={restaurant?.image ?? ''} className="h-9 w-9 rounded-full" />

      <View className="ml-2.5 flex-1">
        <Text variant="bodyMedium" className="text-white" numberOfLines={1}>
          {name}
        </Text>
        {eta && delivery ? (
          <Text variant="caption" className="text-white/75" numberOfLines={1}>
            {`${eta} · ${delivery}`}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenMenu}
        accessibilityRole="button"
        accessibilityLabel={t('clips.openMenu', { restaurant: name })}
        hitSlop={8}
        className="ml-2 flex-row items-center rounded-full border border-white/20 bg-white/15 px-3 py-1.5 active:bg-white/25"
      >
        <Text variant="caption" className="font-semibold text-white">
          {t('clips.menu')}
        </Text>
        <Ionicons name="chevron-up" size={12} color={colors.white} style={{ marginLeft: 4 }} />
      </Pressable>
    </View>
  );
}
