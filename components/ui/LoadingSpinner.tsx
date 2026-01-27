/**
 * LoadingSpinner - ローディングスピナーコンポーネント
 * Sprint 1: 015 Design Tokens
 */

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large' | number;
  overlay?: boolean;
}

export function LoadingSpinner({ size, overlay = false }: LoadingSpinnerProps) {
  const { colors, uiStates, isDark } = useTheme();

  const spinnerSize = size ?? uiStates.loading.spinnerSize;
  const spinnerColor = colors[uiStates.loading.spinnerColor];
  const overlayOpacity = uiStates.loading.overlayOpacity;

  // overlayOpacityトークンを使用してオーバーレイ背景色を生成
  const overlayBackgroundColor = isDark
    ? `rgba(0, 0, 0, ${overlayOpacity})`
    : `rgba(255, 255, 255, ${overlayOpacity})`;

  if (overlay) {
    return (
      <View style={[styles.overlay, { backgroundColor: overlayBackgroundColor }]}>
        <ActivityIndicator size={spinnerSize} color={spinnerColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size={spinnerSize} color={spinnerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoadingSpinner;
