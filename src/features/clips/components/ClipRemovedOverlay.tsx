import { View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Covers a cell whose clip the server has confirmed gone.
 *
 * The feed is refetching underneath, which takes a moment: without this the
 * removal looks like nothing happened until the list redraws. Shaped like the
 * reported overlay on purpose — same scrim, same place — because both mean
 * "this cell is finished", and a second visual language for that would only
 * raise the question of what the difference is.
 */
export function ClipRemovedOverlay() {
  const { t } = useTranslation();

  return (
    <View pointerEvents="none" className="absolute inset-0 items-center justify-center bg-black/65">
      <Ionicons name="trash" size={22} color={colors.white} />
      <Text variant="caption" className="mt-1 text-white">
        {t('clips.remove.removedShort')}
      </Text>
    </View>
  );
}
