import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import type { Selection } from '../lib/chooseOptions';
import { isChosen } from '../lib/chooseOptions';
import type { MenuOptionGroup } from '../types/menu.types';

type OptionGroupPickerProps = {
  group: MenuOptionGroup;
  selection: Selection;
  currency: string;
  onToggle: (choiceId: string) => void;
};

/**
 * One question and its answers.
 *
 * A group that takes one answer draws radios, one that takes several draws
 * checkboxes — the shape of the control says how many you may pick before you
 * try, which no amount of helper text does as well.
 */
export function OptionGroupPicker({
  group,
  selection,
  currency,
  onToggle,
}: OptionGroupPickerProps) {
  const { t, i18n } = useTranslation();

  const single = group.maxChoices === 1;
  const required = group.minChoices > 0;

  return (
    <View className="mt-6">
      <View className="flex-row items-center">
        <Text variant="label" className="flex-1 text-gray-900">
          {group.name}
        </Text>
        <Text variant="caption" className={required ? 'text-primary-600' : 'text-gray-400'}>
          {required ? t('menu.options.required') : t('menu.options.optional')}
        </Text>
      </View>

      {!single ? (
        <Text variant="caption" className="mt-0.5 text-gray-400">
          {t('menu.options.upTo', { count: group.maxChoices })}
        </Text>
      ) : null}

      <View className="mt-2" accessibilityRole={single ? 'radiogroup' : undefined}>
        {group.choices.map((choice) => {
          const chosen = isChosen(selection, group.id, choice.id);
          const soldOut = choice.isAvailable === false;

          const icon = single
            ? chosen
              ? 'radio-button-on'
              : 'radio-button-off'
            : chosen
              ? 'checkbox'
              : 'square-outline';

          return (
            <Pressable
              key={choice.id}
              onPress={() => onToggle(choice.id)}
              disabled={soldOut}
              accessibilityRole={single ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: chosen, disabled: soldOut }}
              accessibilityLabel={choice.name}
              className={
                soldOut
                  ? 'flex-row items-center py-3 opacity-40'
                  : 'flex-row items-center py-3 active:opacity-70'
              }
            >
              <Ionicons
                name={icon}
                size={20}
                color={chosen ? colors.primary[500] : colors.gray[300]}
              />
              <Text variant="body" className="ml-3 flex-1 text-gray-900">
                {choice.name}
              </Text>

              {soldOut ? (
                <Text variant="caption" className="text-gray-400">
                  {t('menu.soldOut')}
                </Text>
              ) : choice.priceDeltaMinor === 0 ? null : (
                <Text variant="caption" className="text-gray-500">
                  {/* Signed on purpose: "−Rs 200" is as real an answer as "+Rs 120". */}
                  {choice.priceDeltaMinor > 0 ? '+' : '−'}
                  {formatMoney(Math.abs(choice.priceDeltaMinor), currency, i18n.language)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
