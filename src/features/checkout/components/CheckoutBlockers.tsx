import { Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import type { CheckoutBlocker } from '../lib/reviewCheckout';

type CheckoutBlockersProps = {
  blockers: CheckoutBlocker[];
  currency: string;
  /**
   * Takes the customer to wherever this blocker is cleared.
   *
   * The box sits under the Order summary, which puts it a screen away from the
   * field it is talking about — the message and the fix were far apart (#159).
   * Saying what is wrong and being the way to fix it costs one tap instead of
   * a scroll and a hunt.
   */
  onFix?: (kind: CheckoutBlocker['kind']) => void;
};

/** The ones a customer can act on from here. The rest are statements of fact. */
const FIXABLE = new Set<CheckoutBlocker['kind']>(['not-signed-in', 'no-address', 'no-phone']);

function useBlockerMessage(currency: string) {
  const { t, i18n } = useTranslation();

  return (blocker: CheckoutBlocker): string => {
    switch (blocker.kind) {
      case 'out-of-range':
        return t('checkout.blockers.outOfRange', {
          distance: (blocker.distanceMeters / 1000).toFixed(1),
          radius: (blocker.radiusMeters / 1000).toFixed(1),
        });
      case 'price-changed':
        return t('checkout.blockers.priceChanged', {
          items: blocker.lines
            .map((line) =>
              t('checkout.blockers.priceChangedLine', {
                name: line.name,
                was: formatMoney(line.wasMinor, currency, i18n.language),
                now: formatMoney(line.nowMinor, currency, i18n.language),
              }),
            )
            .join(', '),
        });
      default:
        return t(`checkout.blockers.${blocker.kind}`);
    }
  };
}

export function CheckoutBlockers({ blockers, currency, onFix }: CheckoutBlockersProps) {
  const messageFor = useBlockerMessage(currency);

  if (blockers.length === 0) return null;

  return (
    <View className="mt-4 gap-2 rounded-2xl bg-error-500/10 p-4" accessibilityRole="alert">
      {blockers.map((blocker) => {
        const message = messageFor(blocker);
        const row = (
          <>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error[500]} />
            <Text variant="caption" className="ml-2 flex-1 text-gray-700">
              {message}
            </Text>
          </>
        );

        if (onFix === undefined || !FIXABLE.has(blocker.kind)) {
          return (
            <View key={blocker.kind} className="flex-row items-start">
              {row}
            </View>
          );
        }

        return (
          <Pressable
            key={blocker.kind}
            onPress={() => onFix(blocker.kind)}
            accessibilityRole="button"
            accessibilityLabel={message}
            className="flex-row items-start active:opacity-60"
          >
            {row}
            <Ionicons name="chevron-forward" size={14} color={colors.error[500]} />
          </Pressable>
        );
      })}
    </View>
  );
}
