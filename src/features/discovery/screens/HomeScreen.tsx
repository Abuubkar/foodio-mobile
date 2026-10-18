import { View } from 'react-native';

import { useRouter } from 'expo-router';

import { SafeAreaView } from 'react-native-safe-area-context';

import { queryKeys } from '@/constants/queryKeys';
// Deep import: the identity barrel would close a cycle through restaurants.
import { IdentityChip } from '@/features/identity/components/IdentityChip';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

import { CategoryRail } from '../components/CategoryRail';
import { RecentClips } from '../components/RecentClips';
import { RestaurantCarousel } from '../components/RestaurantCarousel';
import { RestaurantList } from '../components/RestaurantList';
import { SearchTrigger } from '../components/SearchTrigger';

// Everything the home surface renders: the carousel and its clip shelves.
const HOME_KEYS = [queryKeys.restaurants.all, queryKeys.clips.all] as const;

export function HomeScreen() {
  const router = useRouter();
  const guard = useNavigationGuard();
  const { refreshing, onRefresh } = usePullToRefresh(HOME_KEYS);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-white">
      <RestaurantList
        refreshing={refreshing}
        onRefresh={onRefresh}
        header={
          <>
            <View className="flex-row items-center gap-2 px-3">
              <SearchTrigger onPress={() => guard(() => router.push('/search'))} />
              <IdentityChip />
            </View>

            <CategoryRail />
            <RestaurantCarousel />
            <RecentClips />
          </>
        }
      />
    </SafeAreaView>
  );
}
