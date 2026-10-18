import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Photo, Text } from '@/components/ui';
import { useCartStore } from '@/stores/cart.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import type { CartLine } from '../types/cart.types';

type CartLineRowProps = {
  line: CartLine;
  currency: string;
  /** The note editor lives on the screen, not in the row — see CartScreen. */
  onEditNote: () => void;
};

export function CartLineRow({ line, currency, onEditNote }: CartLineRowProps) {
  const { t, i18n } = useTranslation();

  const incrementLine = useCartStore((state) => state.incrementLine);
  const decrementLine = useCartStore((state) => state.decrementLine);

  const lineTotalMinor = line.unitPriceMinor * line.quantity;

  return (
    <View className="flex-row items-center border-b border-gray-100 py-3">
      <Photo uri={line.image} className="mr-3 h-16 w-16 flex-shrink-0 rounded-xl" />

      <View className="flex-1">
        <Text variant="bodyMedium" className="text-gray-900" numberOfLines={2}>
          {line.name}
        </Text>
        <Text variant="caption" className="mt-0.5 text-gray-400">
          {formatMoney(line.unitPriceMinor, currency, i18n.language)}
        </Text>

        {/* What was chosen, not what was asked for in words — the note below
            is the free text, and the two must not read as one thing. */}
        {line.options.length > 0 ? (
          <Text variant="caption" className="mt-0.5 text-gray-500" numberOfLines={2}>
            {line.options.map((option) => option.choiceName).join(' · ')}
          </Text>
        ) : null}

        <Pressable
          onPress={onEditNote}
          accessibilityRole="button"
          accessibilityLabel={
            line.instruction
              ? t('cart.editNoteLabel', { note: line.instruction })
              : t('cart.addNoteLabel', { name: line.name })
          }
          hitSlop={4}
          className="mt-1 flex-row items-center active:opacity-60"
        >
          <Ionicons
            name={line.instruction ? 'chatbox-ellipses' : 'chatbox-ellipses-outline'}
            size={12}
            color={line.instruction ? colors.gray[700] : colors.gray[400]}
          />
          <Text
            variant="caption"
            className={line.instruction ? 'ml-1 flex-1 text-gray-700' : 'ml-1 flex-1 text-gray-400'}
            numberOfLines={2}
          >
            {line.instruction || t('cart.addNote')}
          </Text>
        </Pressable>
      </View>

      <View className="ml-3 items-end">
        <Text variant="bodyMedium" className="text-gray-900">
          {formatMoney(lineTotalMinor, currency, i18n.language)}
        </Text>
        <View className="mt-2 flex-row items-center rounded-full bg-gray-100">
          <Pressable
            onPress={() => decrementLine(line.id)}
            accessibilityRole="button"
            accessibilityLabel={t('cart.decrease', { name: line.name })}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full active:bg-gray-200"
          >
            <Ionicons
              name={line.quantity === 1 ? 'trash-outline' : 'remove'}
              size={16}
              color={colors.gray[700]}
            />
          </Pressable>
          <Text variant="caption" className="w-6 text-center font-semibold text-gray-900">
            {line.quantity}
          </Text>
          <Pressable
            onPress={() => incrementLine(line.id)}
            accessibilityRole="button"
            accessibilityLabel={t('cart.increase', { name: line.name })}
            hitSlop={8}
            className="h-8 w-8 items-center justify-center rounded-full bg-primary-500 active:bg-primary-600"
          >
            <Ionicons name="add" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
