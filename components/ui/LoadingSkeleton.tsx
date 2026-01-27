/**
 * LoadingSkeleton - スケルトンプレースホルダーコンポーネント
 * Sprint 1: 015 Design Tokens
 */

import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';

interface LoadingSkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function LoadingSkeleton({
  width = '100%',
  height = 16,
  borderRadius,
  style,
}: LoadingSkeletonProps) {
  const { skeleton, isDark } = useTheme();
  const opacity = useSharedValue(1);

  const skeletonColors = isDark ? skeleton.colors.dark : skeleton.colors.light;
  const radius = borderRadius ?? skeleton.borderRadius;

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: skeleton.shimmerDuration }),
      -1,
      true
    );
  }, [opacity, skeleton.shimmerDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: skeletonColors.base,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonGroupProps {
  count?: number;
  gap?: number;
  children?: React.ReactNode;
}

export function SkeletonGroup({ count = 3, gap = 8, children }: SkeletonGroupProps) {
  if (children) {
    return <View style={{ gap }}>{children}</View>;
  }

  return (
    <View style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default LoadingSkeleton;
