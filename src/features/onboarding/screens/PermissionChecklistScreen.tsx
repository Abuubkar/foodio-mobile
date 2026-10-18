import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components/ui';
import { usePermissionRequest } from '@/hooks/usePermissionRequest';
import { logError } from '@/lib/logger';
import { PermissionType } from '@/services/permissions';
import { useOnboardingStore } from '@/stores/onboarding.store';

import { PermissionRow } from '../components/PermissionRow';

/**
 * Location only.
 *
 * Notifications used to sit here too and were the colder of the two asks: a
 * Person who has not yet seen a Restaurant has no reason to say yes, Android
 * never asks twice, and a refusal here silently costs every Order-status
 * notification they would have had. It is asked at the first placed Order
 * instead, where there is a reason to give — see #151.
 *
 * Location stays because it pays off on the very next screen: Restaurants
 * near you.
 */
const PERMISSIONS = [
  {
    type: PermissionType.Location,
    icon: 'location-outline',
    titleKey: 'onboarding.location.title',
    descriptionKey: 'onboarding.location.description',
  },
] as const satisfies readonly {
  type: PermissionType;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descriptionKey: string;
}[];

/**
 * Every permission on one screen. Each is optional — the app works without
 * either — so Continue is never gated on granting them, and asking twice is
 * impossible anyway: the OS prompts once per install.
 */
export default function PermissionChecklistScreen() {
  const { t } = useTranslation();
  const { request } = usePermissionRequest();
  const completePermissions = useOnboardingStore((state) => state.completePermissions);

  const [asked, setAsked] = useState<Partial<Record<PermissionType, boolean>>>({});
  const [granted, setGranted] = useState<Partial<Record<PermissionType, boolean>>>({});

  const ask = useCallback(
    async (type: PermissionType) => {
      // Marked asked up front: a throwing request still consumed the one prompt.
      setAsked((current) => ({ ...current, [type]: true }));
      try {
        const result = await request(type);
        setGranted((current) => ({ ...current, [type]: result.status === 'granted' }));
      } catch (error) {
        logError('onboarding.permission.request', error);
      }
    },
    [request],
  );

  // No navigation: completing unmounts the onboarding group.
  const finish = useCallback(async () => {
    try {
      await completePermissions();
    } catch (error) {
      logError('onboarding.permissions.complete', error);
    }
  }, [completePermissions]);

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        <Text variant="heading" className="text-gray-900">
          {t('onboarding.checklist.title')}
        </Text>
        <Text variant="body" className="mt-3 text-gray-500">
          {t('onboarding.checklist.description')}
        </Text>

        <View className="mt-6">
          {PERMISSIONS.map((permission) => (
            <PermissionRow
              key={permission.type}
              icon={permission.icon}
              titleKey={permission.titleKey}
              descriptionKey={permission.descriptionKey}
              granted={granted[permission.type] === true}
              onAllow={asked[permission.type] ? undefined : () => void ask(permission.type)}
            />
          ))}
        </View>
      </View>

      <View className="px-6 pb-6">
        <Button onPress={() => void finish()}>{t('common.continue')}</Button>
      </View>
    </View>
  );
}
