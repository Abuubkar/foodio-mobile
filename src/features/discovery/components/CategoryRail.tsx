import { Pressable, ScrollView, View } from 'react-native';

import { useRouter } from 'expo-router';

import { Text } from '@/components/ui';
import { useActiveAddress } from '@/features/checkout/hooks/useActiveAddress';
import { useRestaurants } from '@/features/restaurants';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';

import { categoriesFrom } from '../lib/categories';

/**
 * A rail of cuisines under the search bar — the categories row every food app
 * has, built from what the loaded Restaurants actually serve rather than a list
 * somebody typed once. Tapping one opens search already narrowed to it.
 *
 * Owns its query like the carousel does: it is the same list request, so this
 * is a cache read, and a failure here renders nothing rather than an error
 * card over a row nobody asked for.
 */
export function CategoryRail() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { address } = useActiveAddress();
  const coordinates = address
    ? { latitude: address.latitude, longitude: address.longitude }
    : undefined;
  const { data: restaurants } = useRestaurants(undefined, coordinates);

  const categories = categoriesFrom(restaurants ?? []);
  if (categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-5 flex-grow-0"
      contentContainerClassName="px-3"
    >
      {categories.map((category) => (
        <Pressable
          key={category.name}
          onPress={() =>
            guard(() => router.push({ pathname: '/search', params: { cuisine: category.name } }))
          }
          accessibilityRole="button"
          accessibilityLabel={category.name}
          className="mr-3 w-16 items-center active:opacity-70"
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-50">
            <Text className="text-2xl">{category.emoji}</Text>
          </View>
          <Text variant="caption" numberOfLines={1} className="mt-1.5 text-gray-700">
            {category.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
