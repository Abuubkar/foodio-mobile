import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Text } from '@/components/ui';
import { needsChoosing } from '@/features/menu/lib/chooseOptions';
import type { MenuItem, RestaurantMenu } from '@/features/menu/types/menu.types';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import { filmedCount } from '../lib/kitchens';
import type { Clip } from '../types/clip.types';

type KitchenMenuDrawerProps = {
  visible: boolean;
  onClose: () => void;
  menu: RestaurantMenu | undefined;
  clips: readonly Clip[];
  currency: string;
  /** Height of the cell, so the sheet knows how far it has to travel. */
  height: number;
  onAdd: (item: MenuItem) => void;
  onOpen: (item: MenuItem) => void;
  reduceMotion: boolean;
};

/** How much of the cell the raised sheet covers. The clip keeps the rest. */
const SHEET_RATIO = 0.64;
const SLIDE_MS = 240;

/**
 * The kitchen's whole menu, pulled up from the lip.
 *
 * It slides over the clip rather than resizing it. Shrinking the video would
 * re-lay-out a live surface every time the drawer moved, which is the exact
 * road to the black frames the clips feed already fought once on the A15 — and
 * the clip is still visible above the sheet either way.
 *
 * Dishes that were filmed carry a badge. That is the one fact this surface
 * knows which the restaurant page does not, and it is usually a small number:
 * one dish in six to ten.
 */
export function KitchenMenuDrawer({
  visible,
  onClose,
  menu,
  clips,
  currency,
  height,
  onAdd,
  onOpen,
  reduceMotion,
}: KitchenMenuDrawerProps) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const sheetHeight = Math.round(height * SHEET_RATIO);
  const offset = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    // Reduce motion: appear, do not travel.
    if (reduceMotion) {
      offset.setValue(visible ? 0 : sheetHeight);
      return;
    }
    Animated.timing(offset, {
      toValue: visible ? 0 : sheetHeight,
      duration: SLIDE_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, sheetHeight, offset, reduceMotion]);

  const filmed = new Set(clips.map((clip) => clip.menuItemId).filter(Boolean));
  const dishCount = (menu ?? []).reduce((sum, category) => sum + category.menuItems.length, 0);

  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      className="absolute inset-0"
      accessibilityViewIsModal={visible}
    >
      {visible ? (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('clips.closeMenu')}
          className="absolute inset-0 bg-black/55"
        />
      ) : null}

      <Animated.View
        style={{ height: sheetHeight, transform: [{ translateY: offset }] }}
        className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-gray-700 bg-gray-900"
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('clips.closeMenu')}
          className="items-center py-2.5"
        >
          <View className="h-1 w-9 rounded-sm bg-white/30" />
        </Pressable>

        <View className="flex-row items-baseline justify-between px-4 pb-2.5">
          <Text variant="bodyMedium" className="text-white">
            {t('clips.menu')}
          </Text>
          {menu ? (
            <Text variant="caption" className="text-gray-400">
              {t('clips.filmedRatio', { filmed: filmedCount(menu, clips), total: dishCount })}
            </Text>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {(menu ?? []).map((category) => (
            <View key={category.id}>
              <Text
                variant="caption"
                className="px-4 pb-1.5 pt-3 uppercase tracking-wider text-gray-400"
              >
                {category.name}
              </Text>

              {category.menuItems.map((item) => {
                const choose = needsChoosing(item.optionGroups);
                const soldOut = item.isAvailable === false;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onOpen(item)}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    className="flex-row items-center px-4 py-2 active:bg-white/5"
                    style={
                      filmed.has(item.id)
                        ? { borderLeftWidth: 2, borderLeftColor: colors.primary[500] }
                        : undefined
                    }
                  >
                    <Photo uri={item.image} className="h-12 w-12 rounded-lg" />

                    <View className="ml-2.5 flex-1">
                      <Text variant="bodyMedium" className="text-white" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text variant="caption" className="text-gray-400" numberOfLines={1}>
                        {formatMoney(item.priceMinor, currency, i18n.language)}
                        {filmed.has(item.id) ? ` · ${t('clips.hasAClip')}` : ''}
                      </Text>
                    </View>

                    {soldOut ? (
                      <Text variant="caption" className="text-gray-500">
                        {t('clips.soldOut')}
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() => (choose ? onOpen(item) : onAdd(item))}
                        accessibilityRole="button"
                        accessibilityLabel={
                          choose
                            ? t('clips.action.choose')
                            : t('clips.addNamed', { dish: item.name })
                        }
                        hitSlop={8}
                        className="h-7 w-7 items-center justify-center rounded-full bg-primary-500 active:bg-primary-600"
                      >
                        <Ionicons
                          name={choose ? 'chevron-forward' : 'add'}
                          size={16}
                          color={colors.gray[900]}
                        />
                      </Pressable>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}
