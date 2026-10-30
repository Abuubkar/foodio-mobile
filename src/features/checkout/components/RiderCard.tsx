import { View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { PersonAvatar } from '@/features/identity/components/PersonAvatar';
import { formatTime } from '@/utils/date';

import { riderState } from '../lib/arrival';
import type { ArrivalWindow, OrderRider, OrderStatus } from '../types/order.types';

type RiderCardProps = {
  rider: OrderRider;
  arrival: ArrivalWindow | undefined;
  status: OrderStatus;
};

/**
 * Who has your food, and roughly when it lands.
 *
 * A face and a window rather than a map: there is no position to draw, and
 * backend ADR-0024 records why. The window is deliberately a range — the
 * server measures a straight line over an uncalibrated speed, and a single
 * minute would claim a precision neither supports.
 *
 * `new Date()` in the body rather than a timer. The screen already polls every
 * five seconds while the order is live, so the flip to "running late" arrives
 * with the next poll for free.
 */
export function RiderCard({ rider, arrival, status }: RiderCardProps) {
  const { t, i18n } = useTranslation();

  const state = riderState(status, arrival, new Date());
  if (state === 'hidden') return null;

  const headline =
    state === 'delivered'
      ? t('order.rider.delivered', { name: rider.displayName })
      : t('order.rider.onTheWay', { name: rider.displayName });

  return (
    <View className="mt-6 flex-row items-center rounded-2xl bg-gray-50 p-4">
      <PersonAvatar displayName={rider.displayName} avatarUrl={rider.avatarUrl} size={40} />

      <View className="ml-3 flex-1">
        <Text variant="bodyMedium" className="text-gray-900" numberOfLines={1}>
          {headline}
        </Text>

        {state === 'on-the-way' && arrival ? (
          <Text variant="caption" className="mt-0.5 text-gray-600">
            {t('order.rider.arriving', {
              from: formatTime(arrival.from, i18n.language),
              to: formatTime(arrival.to, i18n.language),
            })}
          </Text>
        ) : null}

        {state === 'overdue' ? (
          <Text variant="caption" className="mt-0.5 text-gray-600">
            {t('order.rider.overdue')}
          </Text>
        ) : null}

        {state === 'unknown' ? (
          <Text variant="caption" className="mt-0.5 text-gray-600">
            {t('order.rider.unknown')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
