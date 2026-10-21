import { useState } from 'react';
import { View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';

type DevSignInProps = {
  onSignIn: (handle: string) => void;
  /** Which provider is mid-flight, or null. */
  busy: string | null;
};

/**
 * The local door, drawn only in a dev build with the flag on.
 *
 * Deliberately ugly and deliberately labelled. This is the one control in the
 * app that hands out an identity without anybody proving anything, and it
 * should look like scaffolding rather than a feature — somebody seeing it in a
 * screenshot should immediately ask what it is doing there.
 *
 * The handle doubles as a person picker, the same way `mocks/middlewares.cjs`
 * already works: a seeded person's id signs you in as them, so the kitchen and
 * rider surfaces stay reachable without real staff accounts.
 */
export function DevSignIn({ onSignIn, busy }: DevSignInProps) {
  const [handle, setHandle] = useState('customer');

  return (
    <View className="mt-2 rounded-2xl border border-dashed border-warning-500 bg-warning-50 p-3">
      <Text variant="label" className="text-warning-700">
        Dev sign-in
      </Text>
      <Text variant="caption" className="mt-0.5 text-warning-700">
        This build trusts any handle. Not present in a release build.
      </Text>

      <TextField
        label="Handle"
        value={handle}
        onChangeText={setHandle}
        autoCapitalize="none"
        autoCorrect={false}
        className="mt-2"
      />

      <Button
        variant="secondary"
        onPress={() => onSignIn(handle)}
        disabled={busy !== null || handle.trim() === ''}
        className="mt-2"
      >
        {busy === 'dev' ? 'Signing in…' : 'Continue as this handle'}
      </Button>
    </View>
  );
}
