import { Pressable, ScrollView, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui';
import { cn } from '@/lib/cn';

import type { HomeView } from '../lib/homeViews';
import { HOME_VIEWS } from '../lib/homeViews';

type HomeViewTabsProps = {
  view: HomeView;
  onChange: (view: HomeView) => void;
};

/**
 * The list's own header: one row of views, one on at a time. It sits on the
 * list it changes and stays put while the list scrolls, so the reader always
 * knows which way they are looking at it.
 */
export function HomeViewTabs({ view, onChange }: HomeViewTabsProps) {
  const { t } = useTranslation();

  return (
    // The rule is the row's own bottom edge, so the air the first card needs
    // goes under the rule, not above it. Padding inside the bordered view would
    // push the rule down instead, away from the tabs it belongs to.
    <View className="bg-white px-3 pb-4" accessibilityRole="tablist">
      <View className="border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-6"
        >
          {HOME_VIEWS.map((candidate) => {
            const on = candidate === view;
            return (
              <Pressable
                key={candidate}
                onPress={() => onChange(candidate)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                // The underline sits *on* the rule rather than a pixel above
                // it, so the row reads as one line with a thicker coloured
                // segment — not as two stacked lines.
                style={{ marginBottom: -1 }}
                className={cn('border-b-2 py-3', on ? 'border-primary-500' : 'border-transparent')}
              >
                <Text variant="label" className={on ? 'text-gray-900' : 'text-gray-500'}>
                  {t(`home.views.${candidate}`)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
