import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';

import { AccountSheet } from './AccountSheet';

/**
 * Identity, not a mode toggle. Present for everyone: most people have nothing
 * to switch to, but they still need somewhere to sign out — and iOS keeps
 * Secure Store across uninstall, so sign-out is required. See issue #58.
 *
 * What sits behind it is an account sheet, decided in #161: Orders, Delivery
 * Addresses and sign-out, with the Role switcher on top when there is one.
 */
export function IdentityChip() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const person = useSessionStore((state) => state.person);

  if (!person) {
    return (
      <Pressable
        onPress={() => router.push('/sign-in')}
        accessibilityRole="button"
        accessibilityLabel={t('identity.signIn')}
        hitSlop={8}
        className="h-11 justify-center rounded-2xl bg-gray-100 px-3 active:bg-gray-200"
      >
        <Text variant="caption" className="font-semibold text-gray-700">
          {t('identity.signIn')}
        </Text>
      </Pressable>
    );
  }

  return (
    <>
      {/* The chevron is the affordance: an avatar alone reads as decoration,
          not as a control. Pill rather than a circle so the two read as one
          object — and it inverts on press, which a bare avatar cannot. */}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={person.displayName}
        accessibilityHint={t('identity.chipHint')}
        accessibilityState={{ expanded: open }}
        hitSlop={8}
        className="h-11 flex-row items-center rounded-full border border-gray-200 bg-white pl-1 pr-2.5 active:bg-gray-100"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-500">
          <Text variant="label" className="text-white">
            {person.displayName.charAt(0)}
          </Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.gray[500]}
          style={{ marginLeft: 4 }}
        />
      </Pressable>
      <AccountSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}
