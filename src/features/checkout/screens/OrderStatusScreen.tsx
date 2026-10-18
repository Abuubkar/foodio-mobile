import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components/shared';
import { Button, Text } from '@/components/ui';
import { OrderNotificationPrompt, useOrderNotificationPrompt } from '@/features/notifications';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';

import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
import { RateOrderAffordance } from '../components/RateOrderAffordance';
import { RateOrderSheet } from '../components/RateOrderSheet';
import { useCancelOrder, useOrder } from '../hooks/useOrders';
import { customerPaymentKey } from '../lib/payment';
import { isCancellable } from '../types/order.types';

/** An Order that has stopped moving has nothing left to notify about. */
const SETTLED = new Set(['delivered', 'rejected', 'cancelled', 'delivery_failed']);

export function OrderStatusScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isPending, error, refetch } = useOrder(id);
  const cancelOrder = useCancelOrder();

  /* Beside the scroll, not inside it: the sheet's Submit loses its first tap
     to the ScrollView while the comment keyboard is up (#211). */
  const [rating, setRating] = useState(false);

  /* The first placed Order is where notifications can be asked for with a
     reason, rather than cold on the second onboarding screen (#151). */
  const notify = useOrderNotificationPrompt();

  if (isPending) {
    return (
      <Shell>
        <LoadingState className="flex-1 items-center justify-center" />
      </Shell>
    );
  }

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

  if (!order) {
    return (
      <Shell>
        <EmptyState
          message={t('order.notFound')}
          className="flex-1 items-center justify-center px-8"
        />
      </Shell>
    );
  }

  const money = (minor: number) => formatMoney(minor, order.currency, i18n.language);
  const paymentKey = customerPaymentKey(order.payment);

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('order.title')} />

      <ScrollView contentContainerClassName="px-4 pb-8">
        <Text variant="heading" className="text-gray-900">
          {t(`order.status.${order.status}`)}
        </Text>
        <Text variant="caption" className="mt-1 text-gray-500">
          {t('order.fromRestaurant', { restaurant: order.restaurantName })}
        </Text>

        <OrderStatusTimeline status={order.status} />

        {/* Only while the Order is still moving: there is nothing left to be
            told about one that has already arrived. */}
        {notify.visible && !SETTLED.has(order.status) ? (
          <OrderNotificationPrompt
            onAccept={() => void notify.accept()}
            onDecline={notify.decline}
          />
        ) : null}

        <View className="mt-6 rounded-2xl bg-gray-50 p-4">
          <View className="flex-row items-start">
            <Ionicons name="location-outline" size={16} color={colors.gray[500]} />
            <Text variant="caption" className="ml-2 flex-1 text-gray-600">
              {[order.address.line1, order.address.city, order.address.postcode].join(', ')}
            </Text>
          </View>
          {order.address.notes ? (
            <Text variant="caption" className="mt-2 text-gray-400">
              {order.address.notes}
            </Text>
          ) : null}
        </View>

        <View className="mt-6">
          <Text variant="bodyMedium" className="mb-2 text-gray-900">
            {t('checkout.summary')}
          </Text>
          {/* One dish can appear twice, differing only by instruction. */}
          {order.lines.map((line, index) => (
            <View key={`${line.menuItemId}-${index}`} className="flex-row justify-between py-1">
              <View className="flex-1 pr-2">
                <Text variant="caption" className="text-gray-600">
                  {line.quantity} × {line.name}
                </Text>
                {line.instruction ? (
                  <Text variant="caption" className="text-gray-400">
                    {line.instruction}
                  </Text>
                ) : null}
              </View>
              <Text variant="caption" className="text-gray-900">
                {money(line.unitPriceMinor * line.quantity)}
              </Text>
            </View>
          ))}
          <View className="mt-3 flex-row justify-between border-t border-gray-200 pt-3">
            <Text variant="bodyMedium" className="text-gray-900">
              {t('cart.total')}
            </Text>
            <Text variant="bodyMedium" className="text-gray-900">
              {money(order.totalMinor)}
            </Text>
          </View>

          {/* Silent for orders that predate order payments — no record is not
              the same as unpaid, and a guess here is a guess about money. */}
          {paymentKey === null ? null : (
            <Text variant="caption" className="mt-2 text-gray-500">
              {t(paymentKey)}
            </Text>
          )}
        </View>

        {order.status === 'delivered' ? (
          <RateOrderAffordance orderId={order.id} variant="button" onRate={() => setRating(true)} />
        ) : null}

        {isCancellable(order.status) ? (
          <Button
            variant="secondary"
            onPress={() => cancelOrder.mutate(order.id)}
            disabled={cancelOrder.isPending}
            className="mt-6"
          >
            {t('order.cancel')}
          </Button>
        ) : null}

        <Button variant="ghost" onPress={() => router.replace('/')} className="mt-2">
          {t('order.backToBrowsing')}
        </Button>
      </ScrollView>

      <RateOrderSheet
        visible={rating}
        orderId={order.id}
        restaurantName={order.restaurantName}
        onClose={() => setRating(false)}
      />
    </View>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('order.title')} />
      {children}
    </View>
  );
}
