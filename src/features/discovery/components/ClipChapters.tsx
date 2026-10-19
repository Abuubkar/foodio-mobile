import { Pressable, View } from 'react-native';

import { useTranslation } from 'react-i18next';

type ClipChaptersProps = {
  count: number;
  index: number;
  onSelect: (index: number) => void;
};

/**
 * Which of this kitchen's clips you are on.
 *
 * Segments rather than a scrubber: they say how many there are before you
 * touch anything, which a progress bar cannot. A kitchen with one clip draws
 * one full segment — honest, and the catalogue is mostly that case today.
 *
 * Deliberately not fed by playback position. The bar answers "where am I in
 * this kitchen", and ClipProgress already answers "where am I in this clip";
 * driving both from the player would re-render this four times a second for
 * nothing.
 */
export function ClipChapters({ count, index, onSelect }: ClipChaptersProps) {
  const { t } = useTranslation();

  if (count <= 1) return null;

  return (
    <View pointerEvents="box-none" className="flex-row px-3.5">
      {Array.from({ length: count }, (_, position) => (
        <Pressable
          key={position}
          onPress={() => onSelect(position)}
          accessibilityRole="tab"
          accessibilityState={{ selected: position === index }}
          accessibilityLabel={t('clips.chapter', { number: position + 1, count })}
          hitSlop={{ top: 10, bottom: 10 }}
          className={position === 0 ? 'h-0.5 flex-1' : 'ml-1 h-0.5 flex-1'}
        >
          <View
            className={
              position <= index ? 'h-full rounded-sm bg-white' : 'h-full rounded-sm bg-white/30'
            }
          />
        </Pressable>
      ))}
    </View>
  );
}
