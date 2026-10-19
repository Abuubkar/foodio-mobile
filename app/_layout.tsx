import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { Stack } from 'expo-router';

import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { setAuthTokenSource, setUnauthorizedHandler } from '@/api/client';
import { useNotificationListener, useSyncPushToken } from '@/features/notifications';
import { QueryProvider } from '@/providers/QueryProvider';
import { useActiveAddressStore } from '@/stores/activeAddress.store';
import { useCartStore } from '@/stores/cart.store';
import { OnboardingStep, useOnboardingStore } from '@/stores/onboarding.store';
import { useSavedStore } from '@/stores/saved.store';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';

import '../global.css';

import '@/i18n';

// One place attaches identity to requests; no call site asserts who is asking.
setAuthTokenSource(() => useSessionStore.getState().accessToken);
// One place rotates an expired token; every other 401 stays a real error.
setUnauthorizedHandler(() => useSessionStore.getState().refreshTokens());

export default function RootLayout() {
  return (
    <QueryProvider>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </QueryProvider>
  );
}

/** Split out so it can read insets, which requires being inside the provider. */
function RootNavigator() {
  const insets = useSafeAreaInsets();

  const step = useOnboardingStore((state) => state.step);
  const isHydrated = useOnboardingStore((state) => state.isHydrated);
  const hydrate = useOnboardingStore((state) => state.hydrate);

  const sessionHydrated = useSessionStore((state) => state.isHydrated);
  // The active role picks the navigator; switching resets to its home (#59).
  const role = useSessionStore((state) => state.role);
  const hydrateSession = useSessionStore((state) => state.hydrate);

  useEffect(() => {
    if (!isHydrated) {
      void hydrate();
    }
  }, [isHydrated, hydrate]);

  useEffect(() => {
    if (sessionHydrated) return;

    // A stored token is a claim, not proof — hydrate resolves it through the
    // server, and its own 401 handling recovers a merely-expired access token.
    void hydrateSession();
  }, [sessionHydrated, hydrateSession]);

  const activeAddressHydrated = useActiveAddressStore((state) => state.isHydrated);
  const hydrateActiveAddress = useActiveAddressStore((state) => state.hydrate);

  useEffect(() => {
    if (activeAddressHydrated) return;

    // Not part of the splash gate below: nothing about which navigator shows
    // depends on it, unlike onboarding/session — Checkout just resolves to no
    // active address for the instant before this settles.
    void hydrateActiveAddress();
  }, [activeAddressHydrated, hydrateActiveAddress]);

  const cartHydrated = useCartStore((state) => state.isHydrated);
  const hydrateCart = useCartStore((state) => state.hydrate);

  useEffect(() => {
    if (cartHydrated) return;

    // Like the active address, outside the splash gate: no navigator depends
    // on the Cart, and the badge simply counts nothing for the instant before
    // this settles.
    void hydrateCart();
  }, [cartHydrated, hydrateCart]);

  const savedHydrated = useSavedStore((state) => state.isHydrated);
  const hydrateSaved = useSavedStore((state) => state.hydrate);

  useEffect(() => {
    if (savedHydrated) return;

    // Same reasoning as the Cart: nothing renders differently for the instant
    // before this settles, except a bookmark that is briefly not filled in.
    void hydrateSaved();
  }, [savedHydrated, hydrateSaved]);

  // Neither gates the splash screen: a push isn't needed for any screen to render.
  useSyncPushToken();
  useNotificationListener();

  if (!isHydrated || !sessionHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  const hasOnboarded = step === OnboardingStep.Complete;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Safe areas for every screen. Opt out per screen via its own contentStyle.
        contentStyle: {
          backgroundColor: colors.white,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      }}
    >
      <Stack.Protected guard={!hasOnboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>

      <Stack.Protected guard={hasOnboarded && role.kind === 'kitchen'}>
        <Stack.Screen
          name="(kitchen)"
          options={{ contentStyle: { backgroundColor: colors.white } }}
        />
        {/* The Manage hub pushes over the queue rather than joining the tab bar — t4. */}
        <Stack.Screen name="manage/index" />
        <Stack.Screen name="manage/profile" />
        <Stack.Screen name="manage/hours" />
        <Stack.Screen name="manage/area" />
        <Stack.Screen name="manage/staff" />
        <Stack.Screen name="manage/add-location" />
        <Stack.Screen name="manage/subscription" />
        <Stack.Screen name="manage/menu" />
        <Stack.Screen name="manage/dish" />
        <Stack.Screen name="manage/live" />
      </Stack.Protected>

      <Stack.Protected guard={hasOnboarded && role.kind === 'delivery'}>
        <Stack.Screen
          name="(delivery)"
          options={{ contentStyle: { backgroundColor: colors.white } }}
        />
      </Stack.Protected>

      <Stack.Protected guard={hasOnboarded && role.kind === 'customer'}>
        {/* No root insets: the tab bar owns the bottom edge and each tab its top. */}
        <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: colors.white } }} />
        <Stack.Screen name="restaurant/[id]/index" />
        <Stack.Screen name="restaurant/[id]/reviews" />
        <Stack.Screen name="menu-item/[id]" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="search" />
        {/* Full-bleed video: black, no insets — the screen places its own controls. */}
        <Stack.Screen name="clip/[id]" options={{ contentStyle: { backgroundColor: 'black' } }} />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="address" />
        {/* Dark like the Clips feed it collects from, not the white app. */}
        <Stack.Screen name="saved" options={{ contentStyle: { backgroundColor: colors.black } }} />
        <Stack.Screen name="order/[id]" />
      </Stack.Protected>

      {/*
        Registered once, outside the role guards. Joining belongs to no role —
        a customer, a rider and a cook can all redeem a code — and expo-router
        requires screen names to be unique across the whole Stack, so three
        role-scoped registrations crash it at render.
      */}
      <Stack.Protected guard={hasOnboarded}>
        <Stack.Screen name="join" />
        {/* Claiming belongs to no role either: a customer starts it, and is a
            kitchen by the time it finishes. */}
        <Stack.Screen name="claim" />
      </Stack.Protected>
    </Stack>
  );
}
