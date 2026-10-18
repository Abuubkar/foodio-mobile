import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { ErrorState, LoadingState, ScreenHeader } from '@/components/shared';
import { Button, Photo, Text, TextField } from '@/components/ui';
// Deep imports: these barrels reach back into this feature.
import { DishClips } from '@/features/discovery/components/DishClips';
import { useOpeningNotice } from '@/features/restaurants/hooks/useOpeningNotice';
import { useRestaurant } from '@/features/restaurants/hooks/useRestaurant';
import type { Restaurant } from '@/features/restaurants/types/restaurant.types';
import { selectIsFromOtherRestaurant, useCartStore } from '@/stores/cart.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import { OptionGroupPicker } from '../components/OptionGroupPicker';
import { useMenuItem } from '../hooks/useMenuItem';
import type { Selection } from '../lib/chooseOptions';
import {
  chosenOptionsFrom,
  firstUnanswered,
  toggleChoice,
  unitPriceWith,
} from '../lib/chooseOptions';
import type { MenuItem } from '../types/menu.types';

const INSTRUCTION_MAX = 140;

export function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: item, isPending, error, refetch } = useMenuItem(id);
  const { data: restaurant } = useRestaurant(item?.restaurantId);

  if (isPending)
    return (
      <Shell>
        <LoadingState className="flex-1 items-center justify-center" />
      </Shell>
    );

  if (error) {
    return (
      <Shell>
        <ErrorState
          error={error}
          onRetry={refetch}
          className="flex-1 items-center justify-center px-8"
        />
      </Shell>
    );
  }

  if (!item || !restaurant)
    return (
      <Shell>
        <LoadingState className="flex-1 items-center justify-center" />
      </Shell>
    );

  return <Loaded item={item} restaurant={restaurant} />;
}

type LoadedProps = {
  item: MenuItem;
  restaurant: Restaurant;
};

function Loaded({ item, restaurant }: LoadedProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { currency } = restaurant;
  const { opensText } = useOpeningNotice(restaurant);

  const [quantity, setQuantity] = useState(1);
  const [instruction, setInstruction] = useState('');

  const groups = item.optionGroups ?? [];
  const [selection, setSelection] = useState<Selection>({});

  const chosen = chosenOptionsFrom(groups, selection);
  const unitPriceMinor = unitPriceWith(item.priceMinor, chosen);
  const missing = firstUnanswered(groups, selection);

  const soldOut = item.isAvailable === false;

  const addItem = useCartStore((state) => state.addItem);
  const heldByOtherRestaurant = useCartStore(selectIsFromOtherRestaurant(restaurant.id));
  const currentRestaurantName = useCartStore((state) => state.restaurant?.name);

  const addable = {
    id: item.id,
    name: item.name,
    image: item.image,
    priceMinor: item.priceMinor,
  };

  const commit = () => {
    addItem(restaurant, addable, { instruction, quantity, chosen });
    router.back();
  };

  const handleAdd = () => {
    if (soldOut) return;

    // Closed: say so here, before a Cart is built on it — checkout is the backstop (#156).
    if (opensText) {
      Alert.alert(
        t('cart.closedTitle', { restaurant: restaurant.name }),
        t('cart.closedMessage', { opens: opensText }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('cart.closedConfirm'), onPress: addOrReplace },
        ],
      );
      return;
    }
    addOrReplace();
  };

  const addOrReplace = () => {
    if (!heldByOtherRestaurant) {
      commit();
      return;
    }

    // Same one-restaurant-per-cart warning the menu row gives.
    Alert.alert(
      t('cart.replaceTitle'),
      t('cart.replaceMessage', { restaurant: currentRestaurantName ?? '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('cart.replaceConfirm'), style: 'destructive', onPress: commit },
      ],
    );
  };

  return (
    <Shell title={item.name}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Photo uri={item.image} className="h-56 w-full" />

        <View className="px-4 pt-4">
          <View className="flex-row items-start">
            <Text variant="subheading" className="flex-1 text-gray-900">
              {item.name}
            </Text>
            <Text variant="subheading" className="ml-3 text-gray-900">
              {formatMoney(item.priceMinor, currency, i18n.language)}
            </Text>
          </View>

          {item.rating !== undefined ? (
            <View className="mt-1 flex-row items-center">
              <Ionicons name="star" size={13} color={colors.warning[500]} />
              <Text variant="caption" className="ml-1 font-semibold text-warning-700">
                {item.rating.toFixed(1)}
              </Text>
            </View>
          ) : null}

          <Text variant="body" className="mt-3 text-gray-500">
            {item.description}
          </Text>

          {groups.map((group) => (
            <OptionGroupPicker
              key={group.id}
              group={group}
              selection={selection}
              currency={currency}
              onToggle={(choiceId) =>
                setSelection((current) => toggleChoice(current, group, choiceId))
              }
            />
          ))}

          <View className="mt-6 flex-row items-center justify-between">
            <Text variant="label" className="text-gray-700">
              {t('menu.quantity')}
            </Text>
            <Stepper quantity={quantity} onChange={setQuantity} name={item.name} />
          </View>

          <TextField
            label={t('menu.instructionLabel')}
            placeholder={t('menu.instructionPlaceholder')}
            value={instruction}
            onChangeText={setInstruction}
            maxLength={INSTRUCTION_MAX}
            multiline
            className="mt-6"
          />

          <DishClips menuItemId={item.id} />
        </View>
      </ScrollView>

      <View className="border-t border-gray-100 px-4 pb-5 pt-3">
        {/* Names the question rather than just greying the button: "Choose a
            size" is actionable, a dead button is not. */}
        <Button onPress={handleAdd} disabled={soldOut || missing !== null}>
          {soldOut
            ? t('menu.soldOut')
            : missing
              ? t('menu.options.choose', { group: missing.name.toLowerCase() })
              : t('menu.addWithTotal', {
                  count: quantity,
                  total: formatMoney(unitPriceMinor * quantity, currency, i18n.language),
                })}
        </Button>
      </View>
    </Shell>
  );
}

type StepperProps = {
  quantity: number;
  onChange: (next: number) => void;
  name: string;
};

function Stepper({ quantity, onChange, name }: StepperProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center rounded-full bg-gray-100 px-1 py-1">
      <Pressable
        onPress={() => onChange(Math.max(1, quantity - 1))}
        disabled={quantity === 1}
        accessibilityRole="button"
        accessibilityLabel={t('cart.decrease', { name })}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full active:bg-gray-200"
      >
        <Ionicons
          name="remove"
          size={17}
          color={quantity === 1 ? colors.gray[300] : colors.gray[700]}
        />
      </Pressable>
      <Text variant="label" className="w-8 text-center text-gray-900">
        {quantity}
      </Text>
      <Pressable
        onPress={() => onChange(quantity + 1)}
        accessibilityRole="button"
        accessibilityLabel={t('cart.increase', { name })}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-full active:bg-gray-200"
      >
        <Ionicons name="add" size={17} color={colors.gray[700]} />
      </Pressable>
    </View>
  );
}

function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={title ?? t('menu.dish')} />
      {children}
    </View>
  );
}
