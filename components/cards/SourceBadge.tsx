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

  // URL オープン（canOpenURL + try/catch でガード）
  const handleOpenURL = async () => {
    if (!source.url) return;
    try {
      const canOpen = await Linking.canOpenURL(source.url);
      if (canOpen) {
        await Linking.openURL(source.url);
      }
    } catch (error) {
      console.warn('URL open failed:', error);
    }
  };

  // ページ表示: 常に p. を付与（既に p で始まる場合は除く）
  const pageText =
    source.page && !source.page.toLowerCase().startsWith('p')
      ? `p.${source.page}`
      : source.page;
  const sourceText = pageText ? `${source.title} - ${pageText}` : source.title;

  return (
    <View style={[styles.container, { paddingVertical: spacing[1] }]}>
      {/* 出典名・ページ */}
      <Text style={styles.text}>{sourceText}</Text>

      {/* URL（タップで開く）- 最小44ptタップ領域確保 */}
      {source.url && (
        <Pressable
          onPress={handleOpenURL}
          style={[styles.urlButton, { marginTop: spacing[1] }]}
          hitSlop={{ top: 15, bottom: 15, left: 12, right: 12 }}
        >
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
  urlButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
