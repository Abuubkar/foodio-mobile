import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { ScreenHeader, SignInRequired } from '@/components/shared';
import { Button, Text, TextField } from '@/components/ui';
import { uploadPhoto } from '@/features/photos/api/photo.api';
import { pickAndShrink, UPLOAD_CONTENT_TYPE } from '@/features/photos/lib/pickAndShrink';
import { logError } from '@/lib/logger';
import { expoPermissionAdapter, PermissionType, requestPermission } from '@/services/permissions';
import { useSessionStore } from '@/stores/session.store';

import { signAvatarUpload, updateMe } from '../api/identity.api';
import { PersonAvatar } from '../components/PersonAvatar';
import { handleSchema } from '../types/identity.types';

/**
 * Setting a name, a handle and a face.
 *
 * The handle is checked here before sending, because the server's answer for a
 * malformed one is a 400 with a field path and this screen can say the actual
 * rule instead. A **taken** one is still the server's call — nothing the app
 * knows can answer that, and asking first would be a guess that goes stale
 * between the question and the save.
 */
export function EditProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const person = useSessionStore((state) => state.person);
  const refreshPerson = useSessionStore((state) => state.refreshPerson);

  const [displayName, setDisplayName] = useState(person?.displayName ?? '');
  const [handle, setHandle] = useState(person?.handle ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [handleError, setHandleError] = useState<string | undefined>(undefined);

  const pickFace = async () => {
    try {
      const permission = await requestPermission(
        expoPermissionAdapter,
        PermissionType.PhotoLibrary,
      );
      if (permission.status !== 'granted') return;

      const picked = await pickAndShrink();
      if (picked) setAvatarUri(picked.uri);
    } catch (error) {
      // Backing out of a picker is not a failure, and neither is a library
      // that refused to open.
      logError('profile.avatar.pick', error);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      let avatarPath: string | undefined;

      if (avatarUri !== null) {
        const signed = await signAvatarUpload(UPLOAD_CONTENT_TYPE);
        const file = await fetch(avatarUri).then((response) => response.blob());
        await uploadPhoto(signed.uploadUrl, file, UPLOAD_CONTENT_TYPE);
        // The path, never the URL the client built. See backend ADR-0023.
        avatarPath = signed.path;
      }

      return updateMe({
        displayName: displayName.trim(),
        ...(handle.trim() === '' ? {} : { handle: handle.trim().toLowerCase() }),
        ...(avatarPath === undefined ? {} : { avatarPath }),
      });
    },
    onSuccess: () => {
      // Re-read rather than set from the response: the store already owns how
      // a person is loaded, and entitlements resolve per request (ADR-0007).
      void refreshPerson();
      router.back();
    },
    onError: (error: unknown) => {
      logError('profile.save', error);
      Alert.alert(t('profile.saveFailedTitle'), t('profile.saveFailedBody'));
    },
  });

  const onSave = () => {
    const wanted = handle.trim();

    if (wanted !== '' && !handleSchema.safeParse(wanted).success) {
      setHandleError(t('profile.handleRule'));
      return;
    }

    setHandleError(undefined);
    save.mutate();
  };

  if (!person) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title={t('profile.editTitle')} />
        <SignInRequired
          message={t('profile.signInRequired')}
          className="flex-1 items-center justify-center px-8"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={t('profile.editTitle')} />

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center gap-3">
          <PersonAvatar
            displayName={displayName}
            avatarUrl={avatarUri ?? person.avatarUrl}
            size={96}
          />
          <Button variant="secondary" onPress={() => void pickFace()} disabled={save.isPending}>
            {t('profile.changeFace')}
          </Button>
        </View>

        <TextField
          label={t('profile.displayName')}
          value={displayName}
          onChangeText={setDisplayName}
          editable={!save.isPending}
        />

        <View className="gap-1">
          <TextField
            label={t('profile.handle')}
            value={handle}
            onChangeText={setHandle}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!save.isPending}
          />
          <Text variant="caption" className={handleError ? 'text-error-600' : 'text-neutral-600'}>
            {handleError ?? t('profile.handleHint')}
          </Text>
        </View>

        <Button onPress={onSave} disabled={save.isPending || displayName.trim() === ''}>
          {save.isPending ? t('profile.saving') : t('profile.save')}
        </Button>
      </ScrollView>
    </View>
  );
}
