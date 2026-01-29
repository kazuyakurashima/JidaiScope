/**
 * SourceBadge - 典拠表示コンポーネント
 * Sprint 3: 031 Event Detail Screen, 033 Source Display
 */

import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventSource } from '@/types/database';
import { useTheme } from '@/hooks/useTheme';

// =============================================================================
// Component
// =============================================================================

interface SourceBadgeProps {
  source: EventSource;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const { spacing } = useTheme();

  const handleOpenURL = () => {
    if (source.url) {
      void Linking.openURL(source.url);
    }
  };

  const sourceText = source.page ? `${source.title}, ${source.page}` : source.title;

  return (
    <View style={[styles.container, { paddingVertical: spacing[1] }]}>
      {/* 出典名・ページ */}
      <Text style={styles.text}>{sourceText}</Text>

      {/* URL（タップで開く） */}
      {source.url && (
        <Pressable onPress={handleOpenURL} style={{ marginTop: spacing[1] }}>
          <Text style={[styles.text, styles.link]} numberOfLines={1}>
            {source.url}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {},
  text: {
    fontSize: 10,
    color: '#718096', // text-tertiary
    lineHeight: 14,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
