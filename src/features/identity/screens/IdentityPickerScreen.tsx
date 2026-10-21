import { View } from 'react-native';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { ErrorState, ScreenHeader } from '@/components/shared';
import { Button, Text } from '@/components/ui';
import { colors } from '@/theme';

import { DevSignIn } from '../components/DevSignIn';
import { devSignInOffered, useProviderSignIn } from '../hooks/useProviderSignIn';

/**
 * Two ways in, and no code to type.
 *
 * The backend's ADR-0019 retired phone-and-OTP: every channel that carries a
 * code is metered, and the phone in this market already holds a Google account
 * Google has verified. The number is still asked for at checkout, because a
 * rider calls it — it is contact information now, not a credential.
 *
 * Apple appears only on iOS, where Apple requires it beside any other
 * third-party sign-in. On Android there is no Apple sheet to open.
 */
export function IdentityPickerScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { google, apple, dev, appleAvailable, pending, error } = useProviderSignIn();

  // Only on success. A cancelled sheet leaves the Person here, and a failed one
  // leaves them here with the reason on screen.
  const leaveIfSignedIn = (signedIn: boolean) => {
    if (signedIn) router.back();
  };

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('identity.signIn')} />

      <View className="gap-4 px-4 pb-8">
        <Text variant="caption" className="text-gray-500">
          {t('identity.providerHint')}
        </Text>

        <Button
          onPress={() => void google().then(leaveIfSignedIn)}
          disabled={pending !== null}
          icon={<Ionicons name="logo-google" size={18} color={colors.white} />}
        >
          {pending === 'google' ? t('identity.signingIn') : t('identity.continueWithGoogle')}
        </Button>

        {appleAvailable ? (
          <Button
            variant="secondary"
            onPress={() => void apple().then(leaveIfSignedIn)}
            disabled={pending !== null}
            icon={<Ionicons name="logo-apple" size={18} color={colors.gray[900]} />}
          >
            {pending === 'apple' ? t('identity.signingIn') : t('identity.continueWithApple')}
          </Button>
        ) : null}

        {devSignInOffered ? (
          <DevSignIn onSignIn={(handle) => void dev(handle).then(leaveIfSignedIn)} busy={pending} />
        ) : null}

        {error !== null ? <ErrorState error={error} /> : null}

        <Text variant="caption" className="text-gray-400">
          {t('identity.phoneLater')}
        </Text>
      </View>
    </View>
  );
}
