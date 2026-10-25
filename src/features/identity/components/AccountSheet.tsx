import { Pressable, View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SheetContainer, Text } from '@/components/ui';
import { useRestaurants } from '@/features/restaurants/hooks/useRestaurants';
import { selectSavedCount, useSavedStore } from '@/stores/saved.store';
import { useSessionStore } from '@/stores/session.store';
import { colors } from '@/theme';

import type { ActiveRole } from '../types/identity.types';
import { roleOptionsFor, sameRole } from '../types/identity.types';

type AccountSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tint?: string;
  trailing?: ReactNode;
};

function Row({ icon, label, onPress, tint = colors.gray[500], trailing }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center py-3.5 active:opacity-60"
    >
      <Ionicons name={icon} size={18} color={tint} />
      <Text variant="body" className="ml-3 flex-1 text-gray-900" numberOfLines={1}>
        {label}
      </Text>
      {trailing}
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-gray-100" />;
}

/**
 * Everything a Person has, in one place.
 *
 * The chip used to hold identity and the Role switcher and nothing else, which
 * made it honest and useless: it is where people look for *my orders* and *my
 * addresses*, and it offered neither. Issue #161 decided it becomes an account
 * sheet rather than staying small, with the pilot's concierge onboarding in
 * mind — whatever is hard to find is what somebody has to point at.
 *
 * A bottom sheet rather than the old anchored dropdown: six rows and a role
 * list do not fit a 64-wide popover without becoming a menu of truncations.
 */
export function AccountSheet({ visible, onClose }: AccountSheetProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const person = useSessionStore((state) => state.person);
  const role = useSessionStore((state) => state.role);
  const setRole = useSessionStore((state) => state.setRole);
  const signOut = useSessionStore((state) => state.signOut);

  // Names, not ids: "Taco Fiesta · Kitchen" is a place, "rest-1" is a slug.
  const savedCount = useSavedStore(selectSavedCount);

  const { data: restaurants } = useRestaurants();
  const nameOf = (id: string) => restaurants?.find((item) => item.id === id)?.name ?? id;

  if (!person) return null;

  const roles = roleOptionsFor(person);

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const choose = async (next: ActiveRole) => {
    await setRole(next);
    onClose();
  };

  /*
    The customer tabs and the address screen are registered only under the
    customer role (see app/_layout.tsx), so offering them from a Kitchen
    tablet would push a route that does not exist there.
  */
  const isCustomer = role.kind === 'customer';

  return (
    <SheetContainer visible={visible} onClose={onClose}>
      <View className="mb-2 flex-row items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-500">
          <Text variant="subheading" className="text-white">
            {person.displayName.charAt(0)}
          </Text>
        </View>
        <View className="ml-3 flex-1">
          <Text variant="bodyMedium" className="text-gray-900" numberOfLines={1}>
            {person.displayName}
          </Text>
          <Text variant="caption" className="text-gray-400" numberOfLines={1}>
            {person.phone ?? t('identity.signedInAs')}
          </Text>
        </View>
      </View>

      {/*
        At the top, as the issue asks — but only when there is something to
        switch to. Everyone is a customer, so a lone "Customer" row with a tick
        beside it is a control that cannot do anything.
      */}
      {roles.length > 1 ? (
        <>
          <Divider />
          <Text variant="caption" className="mt-3 text-gray-400">
            {t('identity.actingAs')}
          </Text>
          {roles.map((option) => {
            const isCurrent = sameRole(option.role, role);
            const label =
              option.role.kind === 'customer'
                ? t('identity.customer')
                : `${nameOf(option.restaurantId ?? '')} · ${t(`identity.${option.role.kind}`)}`;

            return (
              <Pressable
                key={`${option.role.kind}-${option.restaurantId ?? 'me'}`}
                onPress={() => void choose(option.role)}
                accessibilityRole="button"
                accessibilityState={{ selected: isCurrent }}
                accessibilityLabel={label}
                className="flex-row items-center py-3 active:opacity-60"
              >
                <Ionicons
                  name={isCurrent ? 'checkmark-circle' : iconFor(option.role)}
                  size={18}
                  color={isCurrent ? colors.primary[600] : colors.gray[500]}
                />
                <Text
                  variant="body"
                  className={
                    isCurrent ? 'ml-3 flex-1 text-primary-700' : 'ml-3 flex-1 text-gray-900'
                  }
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </>
      ) : null}

      {isCustomer ? (
        <>
          <Divider />
          <Row
            icon="receipt-outline"
            label={t('identity.yourOrders')}
            onPress={() => go('/orders')}
          />
          <Row
            icon="person-circle-outline"
            label={t('identity.yourProfile')}
            onPress={() => go('/edit-profile')}
          />
          <Row
            icon="bookmark-outline"
            label={t('identity.savedClips')}
            onPress={() => go('/saved')}
            trailing={
              savedCount > 0 ? (
                <Text variant="caption" className="text-gray-400">
                  {savedCount}
                </Text>
              ) : undefined
            }
          />
          <Row
            icon="location-outline"
            label={t('identity.deliveryAddresses')}
            onPress={() => go('/address')}
          />
        </>
      ) : null}

      <Divider />

      {/*
        Quiet, below the rest: neither is a role, and both are rare. t5
        rejected putting "list your restaurant" on the customer home — it
        advertises a path almost no user should take, in front of the people
        least likely to want it.
      */}
      <Row
        icon="storefront-outline"
        label={t('identity.listRestaurant')}
        onPress={() => go('/claim')}
      />
      <Row icon="key-outline" label={t('identity.joinRestaurant')} onPress={() => go('/join')} />

      <Divider />

      <Row
        icon="log-out-outline"
        label={t('identity.signOut')}
        tint={colors.error[500]}
        onPress={() => void signOut().then(onClose)}
      />
    </SheetContainer>
  );
}

const iconFor = (role: ActiveRole) =>
  role.kind === 'kitchen'
    ? 'restaurant-outline'
    : role.kind === 'delivery'
      ? 'bicycle-outline'
      : 'bag-handle-outline';
