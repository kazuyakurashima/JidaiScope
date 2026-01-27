/**
 * EmptyState - 空状態表示コンポーネント
 * Sprint 1: 015 Design Tokens
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'folder-open-outline',
  title = 'データがありません',
  message = 'まだデータが登録されていません。',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { colors, typography, spacing, uiStates } = useTheme();

  const iconColor = colors[uiStates.empty.iconColor];
  const titleSize = typography.size[uiStates.empty.titleSize];
  const messageSize = typography.size[uiStates.empty.messageSize];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { maxWidth: uiStates.empty.illustrationMaxWidth },
        ]}
      >
        <Ionicons
          name={icon}
          size={uiStates.empty.iconSize}
          color={iconColor}
        />
      </View>
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
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.primary,
              marginTop: spacing[6],
            },
          ]}
        >
          <Text style={[styles.actionText, { color: colors.bg }]}>
            {actionLabel}
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
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
