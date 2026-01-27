/**
 * ErrorState - エラー表示コンポーネント
 * Sprint 1: 015 Design Tokens
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'エラーが発生しました',
  message = '問題が発生しました。しばらくしてから再度お試しください。',
  onRetry,
  retryLabel = '再試行',
}: ErrorStateProps) {
  const { colors, typography, spacing, radius, uiStates } = useTheme();

  const iconColor = colors[uiStates.error.iconColor];
  const titleSize = typography.size[uiStates.error.titleSize];
  const messageSize = typography.size[uiStates.error.messageSize];
  // retryButtonVariant トークンを使用
  const retryButtonColor = colors[uiStates.error.retryButtonVariant];

  return (
    <View style={[styles.container, { padding: spacing[6] }]}>
      <Ionicons
        name="alert-circle-outline"
        size={uiStates.error.iconSize}
        color={iconColor}
      />
      <Text
        style={[
          styles.title,
          {
            color: colors.text,
            fontSize: titleSize,
            marginTop: spacing[4],
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          {
            color: colors.textSecondary,
            fontSize: messageSize,
            marginTop: spacing[2],
          },
        ]}
      >
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={[
            styles.retryButton,
            {
              backgroundColor: retryButtonColor,
              marginTop: spacing[6],
              paddingVertical: spacing[3],
              paddingHorizontal: spacing[6],
              borderRadius: radius.md,
            },
          ]}
        >
          <Text
            style={[
              styles.retryText,
              {
                color: colors.bg,
                fontSize: typography.size.base,
              },
            ]}
          >
            {retryLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  retryButton: {},
  retryText: {
    fontWeight: '600',
  },
});

export default ErrorState;
