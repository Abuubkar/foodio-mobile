import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import { AddToCartControl, type CartRestaurant } from '@/features/cart';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { colors } from '@/theme';

import { needsChoosing } from '../lib/chooseOptions';
import type { MenuItem } from '../types/menu.types';

import { MenuPrice } from './MenuPrice';

type MenuItemCardProps = {
  item: MenuItem;
  restaurant: CartRestaurant;
  closedNotice?: string;
};

/**
 * The dish gets the photograph the chosen design gives it — a large square on
 * the left, as decided in #196. A dish with no photograph keeps the frame, so
 * rows stay aligned.
 *
 * Add sits on the row's bottom right, opposite the price, rather than on the
 * photograph: on the corner it covered the food and crowded the text, and a
 * line already in the cart turns it into a stepper that needs the width.
 */
export function MenuItemCard({ item, restaurant, closedNotice }: MenuItemCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();
  const soldOut = item.isAvailable === false;

  return (
    <Pressable
      onPress={() => guard(() => router.push(`/menu-item/${item.id}`))}
      accessibilityRole="button"
      accessibilityLabel={item.name}
      className="flex-row items-stretch py-3 active:opacity-70"
    >
      <View className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100">
        {item.image ? (
          <Photo uri={item.image} className="h-full w-full" />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name="fast-food-outline" size={28} color={colors.gray[300]} />
          </View>
        )}
      </View>

      <View className="ml-3 flex-1 justify-between py-0.5">
        <View>
          <View className="flex-row items-center">
            <Text variant="bodyMedium" className="flex-1 text-gray-900" numberOfLines={1}>
              {item.name}
            </Text>
            {soldOut ? (
              <View className="ml-2 rounded-full bg-gray-200 px-2 py-0.5">
                <Text variant="caption" className="font-semibold text-gray-600">
                  {t('menu.soldOut')}
                </Text>
              </View>
            ) : item.isPopular ? (
              <View className="ml-2 rounded-full bg-warning-100 px-2 py-0.5">
                <Text variant="caption" className="font-semibold text-warning-700">
                  {t('menu.popularBadge')}
                </Text>
              </View>
            ) : null}
          </View>
          {item.rating !== undefined ? (
            <View className="mt-0.5 flex-row items-center">
              <Ionicons name="star" size={11} color={colors.warning[500]} />
              <Text variant="caption" className="ml-0.5 font-semibold text-warning-700">
                {item.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}
          <Text variant="caption" className="mt-1 text-gray-500" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <MenuPrice priceMinor={item.priceMinor} currency={restaurant.currency} />

          {/*
            A dish with a question that must be answered cannot be added from
            here: the row has no way to ask it, and adding silently would pick
            for the customer. It opens the dish page instead, and says so.
          */}
          {needsChoosing(item.optionGroups) ? (
            <Pressable
              onPress={() => guard(() => router.push(`/menu-item/${item.id}`))}
              disabled={soldOut}
              accessibilityRole="button"
              accessibilityLabel={t('menu.options.chooseFor', { dish: item.name })}
              className={
                soldOut
                  ? 'rounded-full bg-gray-100 px-3 py-1.5 opacity-50'
                  : 'flex-row items-center rounded-full bg-primary-50 px-3 py-1.5 active:opacity-70'
              }
            >
              <Text variant="caption" className="font-semibold text-primary-700">
                {t('menu.options.chooseShort')}
              </Text>
              <Ionicons name="chevron-forward" size={13} color={colors.primary[600]} />
            </Pressable>
          ) : (
            <AddToCartControl
              restaurant={restaurant}
              item={{
                id: item.id,
                name: item.name,
                image: item.image,
                priceMinor: item.priceMinor,
              }}
              disabled={soldOut}
              {...(closedNotice === undefined ? {} : { closedNotice })}
            />
          )}
        </View>
      </View>
    </Pressable>
  );
}
