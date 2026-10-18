import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TextInput } from 'react-native';

import { EmptyState, ErrorState, ScreenHeader } from '@/components/shared';
import { Button, Text } from '@/components/ui';
import { PhoneField, phoneSchema, updateMe } from '@/features/identity';
import { useRestaurantMenu } from '@/features/menu';
import { useRestaurant } from '@/features/restaurants';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { useCartStore } from '@/stores/cart.store';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';
import { formatMoney } from '@/utils/currency';
import { generateIdempotencyKey } from '@/utils/idempotencyKey';

import { CheckoutBlockers } from '../components/CheckoutBlockers';
import { PaymentMethods } from '../components/PaymentMethods';
import { useActiveAddress } from '../hooks/useActiveAddress';
import { usePlaceOrder } from '../hooks/useOrders';
import type { CheckoutBlocker } from '../lib/reviewCheckout';
import { reviewCheckout } from '../lib/reviewCheckout';
import type { NewOrder, PaymentMethod } from '../types/order.types';

export function CheckoutScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const guard = useNavigationGuard();

  const cartRestaurant = useCartStore((state) => state.restaurant);
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clear);
  const { address } = useActiveAddress();

  const { data: restaurant } = useRestaurant(cartRestaurant?.id);

  /**
   * The number a rider calls about a gate number — contact information, not a
   * credential, since sign-in moved to Google and Apple (backend ADR-0019).
   * Asked for here because this is the first moment it matters, and saved to
   * the person so a second order never asks again.
   */
  const person = useSessionStore((state) => state.person);
  const refreshPerson = useSessionStore((state) => state.refreshPerson);
  const [phoneDraft, setPhoneDraft] = useState('');

  /**
   * Saved as part of placing the Order rather than behind its own button.
   *
   * One flow, one tap: a separate save put an extra round trip in the middle of
   * the only screen that ends in money. If it fails — a number another account
   * already uses answers 409 — the Order is not placed, because an Order nobody
   * can call about is worse than one that was refused.
   */
  const savePhone = useMutation({
    mutationFn: (phone: string) => updateMe({ phone }),
    onSuccess: async () => {
      await refreshPerson();
    },
  });

  const isSignedIn = person !== null;
  const needsPhone = isSignedIn && person.phone === null;
  const draftIsValid = phoneSchema.safeParse(phoneDraft).success;

  /**
   * The first method the restaurant offers, until the customer says otherwise.
   * Not hardcoded to cash: the list is served (standing constraint 2), so a
   * second method arriving needs no app release.
   */
  /*
    A blocker names what is wrong; these let it be the way to fix it too. The
    box sits under the Order summary, a screen away from the field it is
    talking about, so without this the customer reads the message and then has
    to go and find the thing — see #159.
  */
  const scroller = useRef<ScrollView>(null);
  const phoneInput = useRef<TextInput>(null);
  const phoneTop = useRef(0);

  const fix = (kind: CheckoutBlocker['kind']) => {
    if (kind === 'not-signed-in') {
      guard(() => router.push('/sign-in'));
      return;
    }

    if (kind === 'no-address') {
      guard(() => router.push('/address'));
      return;
    }

    // Scroll first, then focus: focusing alone moves the keyboard over a field
    // that may still be off screen.
    scroller.current?.scrollTo({ y: Math.max(phoneTop.current - 16, 0), animated: true });
    phoneInput.current?.focus();
  };

  const [chosenMethod, setChosenMethod] = useState<PaymentMethod | null>(null);
  const offered = restaurant?.paymentMethods ?? ['cash_on_delivery'];
  const paymentMethod = chosenMethod ?? offered[0] ?? 'cash_on_delivery';
  const setPaymentMethod = setChosenMethod;
  const { data: categories } = useRestaurantMenu(cartRestaurant?.id);
  const placeOrder = usePlaceOrder();

  // One key for the life of this screen: generated at intent, survives every
  // retry of the same tap, thrown away with the screen once the order lands.
  // See backend ADR-0011.
  const [idempotencyKey] = useState(generateIdempotencyKey);

  const currency = cartRestaurant?.currency ?? 'USD';
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);

  const review = reviewCheckout({
    cartRestaurant,
    isSignedIn,
    lines,
    restaurant,
    address,
    // A number typed but not yet saved still clears the blocker: it is saved on
    // the way to the Order, a moment later.
    phone: person?.phone ?? (draftIsValid ? phoneDraft : null),
    currentPrices: (categories ?? []).flatMap((category) => category.menuItems),
    now: new Date(),
  });

  if (!cartRestaurant || lines.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title={t('checkout.title')} />
        <EmptyState message={t('cart.empty')} className="flex-1 items-center justify-center px-8" />
      </View>
    );
  }

  const submit = async () => {
    if (!review.canPlaceOrder || !address || !restaurant) return;

    if (needsPhone) {
      try {
        await savePhone.mutateAsync(phoneDraft);
      } catch {
        // The reason is already on the field; the Order does not go without it.
        return;
      }
    }

    const order: NewOrder = {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      currency: restaurant.currency,
      lines: lines.map((line) => ({
        menuItemId: line.menuItemId,
        name: line.name,
        image: line.image,
        unitPriceMinor: line.unitPriceMinor,
        quantity: line.quantity,
        // Absent and empty should not be two ways of saying nothing.
        ...(line.instruction ? { instruction: line.instruction } : {}),
      })),
      subtotalMinor: review.subtotalMinor,
      deliveryFeeMinor: review.deliveryFeeMinor,
      totalMinor: review.totalMinor,
      address,
      paymentMethod,
    };

    placeOrder.mutate(
      { order, idempotencyKey },
      {
        onSuccess: (placed) => {
          clearCart();
          router.replace(`/order/${placed.id}`);
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('checkout.title')} />

      {/* The phone field puts a keyboard over this screen, and a ScrollView
          spends the first tap dismissing it — including the tap on Place
          order, and on the country picker's chevron (#211). `handled` keeps
          that behaviour for taps on nothing, and lets buttons through. */}
      <ScrollView
        ref={scroller}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-8"
      >
        <Text variant="caption" className="text-gray-400">
          {t('cart.fromRestaurant', { restaurant: cartRestaurant.name })}
        </Text>

        <Section title={t('checkout.deliverTo')}>
          <Pressable
            onPress={() => guard(() => router.push('/address'))}
            accessibilityRole="button"
            className="flex-row items-center rounded-2xl bg-gray-50 p-4 active:bg-gray-100"
          >
            <Ionicons name="location-outline" size={18} color={colors.gray[500]} />
            <View className="ml-3 flex-1">
              {address ? (
                <>
                  <Text variant="label" className="text-gray-900">
                    {address.label}
                  </Text>
                  <Text variant="caption" className="text-gray-500">
                    {[address.line1, address.city, address.postcode].join(', ')}
                  </Text>
                </>
              ) : (
                <Text variant="body" className="text-gray-500">
                  {t('checkout.addAddress')}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
          </Pressable>
        </Section>

        {needsPhone ? (
          <View onLayout={(event) => (phoneTop.current = event.nativeEvent.layout.y)}>
            <Section title={t('checkout.contactNumber')}>
              <Text variant="caption" className="mb-2 text-gray-500">
                {t('checkout.contactHint')}
              </Text>

              <PhoneField value={phoneDraft} onChange={setPhoneDraft} inputRef={phoneInput} />

              {savePhone.isError ? <ErrorState error={savePhone.error} className="mt-2" /> : null}
            </Section>
          </View>
        ) : null}

        <Section title={t('checkout.payment')}>
          <PaymentMethods
            methods={restaurant?.paymentMethods ?? ['cash_on_delivery']}
            chosen={paymentMethod}
            onChoose={setPaymentMethod}
          />
        </Section>

        <Section title={t('checkout.summary')}>
          {lines.map((line) => (
            <View key={line.id} className="flex-row justify-between py-1">
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

          <View className="mt-3 border-t border-gray-200 pt-3">
            <Row label={t('cart.subtotal')} value={money(review.subtotalMinor)} />
            <Row
              label={t('cart.deliveryFee')}
              value={
                review.deliveryFeeMinor === 0 ? t('cart.free') : money(review.deliveryFeeMinor)
              }
            />
            <Row label={t('cart.total')} value={money(review.totalMinor)} emphasised />
          </View>
        </Section>

        <CheckoutBlockers blockers={review.blockers} currency={currency} onFix={fix} />

        {placeOrder.isError ? (
          <ErrorState error={placeOrder.error} onRetry={submit} className="mt-4 px-2" />
        ) : null}

        {/* One thing to do. A disabled Place order under blockers nobody can
            clear is the wall issue #177 describes. */}
        {isSignedIn ? (
          <Button
            onPress={() => void submit()}
            disabled={!review.canPlaceOrder || placeOrder.isPending || savePhone.isPending}
            className="mt-6"
          >
            {placeOrder.isPending
              ? t('checkout.placing')
              : t('checkout.placeOrder', { total: money(review.totalMinor) })}
          </Button>
        ) : (
          <Button onPress={() => guard(() => router.push('/sign-in'))} className="mt-6">
            {t('identity.signIn')}
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-5">
      <Text variant="bodyMedium" className="mb-2 text-gray-900">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  emphasised = false,
}: {
  label: string;
  value: string;
  emphasised?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text
        variant={emphasised ? 'bodyMedium' : 'caption'}
        className={emphasised ? 'text-gray-900' : 'text-gray-500'}
      >
        {label}
      </Text>
      <Text
        variant={emphasised ? 'bodyMedium' : 'caption'}
        className={emphasised ? 'text-gray-900' : 'text-gray-600'}
      >
        {value}
      </Text>
    </View>
  );
}
