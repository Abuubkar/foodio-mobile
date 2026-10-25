import { FlatList, Pressable, RefreshControl, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  LoadingState,
  ScreenHeader,
  SignInRequired,
} from '@/components/shared';
import { Text } from '@/components/ui';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useSheetTarget } from '@/hooks/useSheetTarget';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';
import { formatDate } from '@/utils/date';

import { RateOrderAffordance } from '../components/RateOrderAffordance';
import { RateOrderSheet } from '../components/RateOrderSheet';
import { useOrders } from '../hooks/useOrders';
import { isTerminal } from '../types/order.types';

export function OrdersScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();

  const isSignedIn = useSessionStore((state) => state.person !== null);

  const {
    data: orders,
    isPending,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useOrders();

  /* One sheet for the whole list, not one per row: a Modal inside renderItem
     is mounted once per delivered order, and loses its first tap to the list
     while the comment keyboard is up (#211). */
  const rating = useSheetTarget<{ id: string; restaurantId: string; restaurantName: string }>();

  /* Orders belong to a Person. Signed out this screen showed the server's own
     "Not authenticated.", with no way to sign in — issue #177. */
  if (!isSignedIn) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-white">
        <ScreenHeader title={t('orders.title')} showBack={false} />
        <SignInRequired
          message={t('orders.signInRequired')}
          className="flex-1 items-center justify-center px-8"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <ScreenHeader title={t('orders.title')} showBack={false} />

      {isPending ? <LoadingState className="flex-1 items-center justify-center" /> : null}
      {error ? (
        <ErrorState
          error={error}
          onRetry={refetch}
          className="flex-1 items-center justify-center px-8"
        />
      ) : null}
      {!isPending && !error && orders?.length === 0 ? (
        <EmptyState
          message={t('orders.empty')}
          className="flex-1 items-center justify-center px-8"
        />
      ) : null}

      {orders && orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(order) => order.id}
          contentContainerClassName="px-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={() => void refetch()}
            />
          }
          onEndReached={() => {
            if (hasNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isFetchingNextPage ? <LoadingState /> : null}
          renderItem={({ item: order }) => (
            <Pressable
              onPress={() => guard(() => router.push(`/order/${order.id}`))}
              accessibilityRole="button"
              className="mb-3 rounded-2xl border border-gray-100 bg-white p-4 active:bg-gray-50"
            >
              <View className="flex-row items-center">
                <Text variant="bodyMedium" className="flex-1 text-gray-900" numberOfLines={1}>
                  {order.restaurantName}
                </Text>
                <Text variant="bodyMedium" className="text-gray-900">
                  {formatMoney(order.totalMinor, order.currency, i18n.language)}
                </Text>
              </View>

              <View className="mt-1 flex-row items-center">
                <Ionicons
                  name={isTerminal(order.status) ? 'checkmark-circle-outline' : 'time-outline'}
                  size={14}
                  color={isTerminal(order.status) ? colors.gray[400] : colors.primary[500]}
                />
                <Text
                  variant="caption"
                  className={
                    isTerminal(order.status) ? 'ml-1.5 text-gray-400' : 'ml-1.5 text-primary-700'
                  }
                >
                  {t(`order.status.${order.status}`)}
                </Text>
                <Text variant="caption" className="mx-1.5 text-gray-300">
                  •
                </Text>
                <Text variant="caption" className="text-gray-400">
                  {formatDate(order.placedAt, i18n.language)}
                </Text>
              </View>

              {order.status === 'delivered' ? (
                <RateOrderAffordance
                  orderId={order.id}
                  variant="row"
                  onRate={() =>
                    rating.open({
                      id: order.id,
                      restaurantId: order.restaurantId,
                      restaurantName: order.restaurantName,
                    })
                  }
                />
              ) : null}
            </Pressable>
          )}
        />
      ) : null}

      <RateOrderSheet
        visible={rating.visible}
        orderId={rating.target?.id ?? ''}
        restaurantId={rating.target?.restaurantId ?? ''}
        restaurantName={rating.target?.restaurantName ?? ''}
        onClose={rating.close}
      />
    </SafeAreaView>
  );
}
