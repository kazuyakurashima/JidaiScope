/**
 * BookmarkButton - ブックマークボタンコンポーネント
 * Sprint 3: 031 Event Detail Screen, 034 Bookmarks Feature
 */

import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { useBookmarkStore } from '@/stores/bookmarkStore';
import { triggerHaptic } from '@/utils/haptics';

// =============================================================================
// Component
// =============================================================================

interface BookmarkButtonProps {
  /** ターゲットの種類 */
  targetType: 'event' | 'person';
  /** ターゲットのID */
  targetId: string;
  /** 表示用タイトル（ブックマーク保存時に使用） */
  title: string;
  /** ボタンサイズ */
  size?: number;
}

export function BookmarkButton({
  targetType,
  targetId,
  title,
  size = 24,
}: BookmarkButtonProps) {
  const { colors, spacing } = useTheme();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarkStore();

  const bookmarked = isBookmarked(targetType, targetId);

  const handlePress = async () => {
    void triggerHaptic('light');

    if (bookmarked) {
      await removeBookmark(targetType, targetId);
    } else {
      await addBookmark(targetType, targetId, title);
    }
  };

  return (
    <Pressable
      style={[styles.button, { padding: spacing[2] }]}
      onPress={handlePress}
      hitSlop={8}
    >
      <Ionicons
        name={bookmarked ? 'star' : 'star-outline'}
        size={size}
        color={bookmarked ? '#FDB813' : colors.textSecondary}
      />
    </Pressable>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  button: {},
});
