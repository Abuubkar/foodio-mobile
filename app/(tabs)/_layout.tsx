import { Pressable } from 'react-native';

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { ComposeTabButton } from '@/features/clips/components/ComposeTabButton';
import { selectItemCount, useCartStore } from '@/stores/cart.store';
import { colors } from '@/theme';

/* Hoisted: an inline arrow here is a new component identity on every render
   of the bar, which makes the navigator remount the button each time. */
const renderComposeButton = () => <ComposeTabButton />;

export default function TabsLayout() {
  const { t } = useTranslation();
  const itemCount = useCartStore(selectItemCount);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.gray[400],
        // The library leaves the Android ripple borderless with no radius, so
        // it's sized from the tab's full width — much wider than the bar is
        // tall — and bleeds past the top and bottom edges instead of landing
        // as a full circle.
        tabBarButton: ({ ref: _ref, ...props }) => (
          <Pressable
            {...props}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.32)', borderless: true, radius: 28 }}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clips"
        options={{
          title: t('tabs.clips'),
          // A white bar under a full-bleed video reads as a mistake. The Clips
          // tab owns a black one, whatever theme the phone itself is in — the
          // feed is black in both, so the bar follows the feed, not the OS.
          tabBarStyle: { backgroundColor: colors.black, borderTopColor: colors.gray[800] },
          tabBarActiveTintColor: colors.primary[400],
          tabBarInactiveTintColor: colors.gray[400],
          // The default ripple is black; on a black bar that is no ripple at all.
          tabBarButton: ({ ref: _ref, ...props }) => (
            <Pressable
              {...props}
              android_ripple={{ color: 'rgba(255, 255, 255, 0.24)', borderless: true, radius: 28 }}
            />
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          /* Renders itself entirely: it is a button that pushes a screen, not
             a destination you switch to, so none of the tab chrome applies. */
          tabBarButton: renderComposeButton,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          ...(itemCount > 0 ? { tabBarBadge: itemCount } : {}),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bag-handle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
