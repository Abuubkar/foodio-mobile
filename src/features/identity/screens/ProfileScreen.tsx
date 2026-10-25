import { ScrollView, View } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { useTranslation } from 'react-i18next';

import { EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components/shared';
import { Text } from '@/components/ui';
import { SavedClipTile } from '@/features/discovery/components/SavedClipTile';
import { usePersonClips } from '@/features/discovery/hooks/usePersonClips';
import { clipHeading } from '@/features/discovery/types/clip.types';

import { PersonAvatar } from '../components/PersonAvatar';
import { useProfile } from '../hooks/useProfile';

/**
 * Somebody's public page: a name, a face, a handle, and what they have posted.
 *
 * `personId` comes from the route because the public profile deliberately does
 * not carry one — it is a name, a face and a handle, and nothing else. A cell
 * that links here already has the author's id, so it passes it along. A deep
 * link with only a handle still shows the person; it just cannot list their
 * clips, which is the honest answer rather than widening the public shape.
 */
export function ProfileScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ handle?: string; personId?: string }>();

  const profile = useProfile(params.handle);
  const clips = usePersonClips(params.personId);

  if (profile.isPending) {
    return <LoadingState className="flex-1 items-center justify-center bg-white" />;
  }

  if (profile.error || !profile.data) {
    return (
      <View className="flex-1 bg-white">
        <ScreenHeader title={t('profile.title')} />
        <ErrorState
          error={profile.error}
          onRetry={profile.refetch}
          className="flex-1 items-center justify-center px-8"
        />
      </View>
    );
  }

  const person = profile.data;

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader title={person.displayName} />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="items-center gap-2">
          <PersonAvatar displayName={person.displayName} avatarUrl={person.avatarUrl} size={88} />
          <Text variant="heading">{person.displayName}</Text>
          <Text variant="caption" className="text-neutral-600">
            @{person.handle}
          </Text>
        </View>

        {params.personId === undefined ? null : (
          <View className="gap-3">
            <Text variant="label">{t('profile.theirClips')}</Text>

            {clips.isPending ? <LoadingState /> : null}

            {clips.data && clips.data.length === 0 ? (
              <EmptyState message={t('profile.noClips')} className="py-6" />
            ) : null}

            <View className="flex-row flex-wrap gap-2">
              {(clips.data ?? []).map((clip, index) => (
                <SavedClipTile
                  key={clip.id}
                  clip={clip}
                  title={clip.caption}
                  subtitle={clipHeading(clip)}
                  // Every third tile taller, so the grid has a rhythm rather
                  // than reading as a spreadsheet.
                  tall={index % 3 === 2}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
