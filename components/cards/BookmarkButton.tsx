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
  /** ブックマーク対象のID（event-xxx または person-xxx） */
  targetId: string;
  /** ボタンサイズ */
  size?: number;
}

export function BookmarkButton({ targetId, size = 24 }: BookmarkButtonProps) {
  const { colors, spacing } = useTheme();
  const { bookmarks, addBookmark, removeBookmark } = useBookmarkStore();

  const isBookmarked = bookmarks.includes(targetId);

  const handlePress = async () => {
    void triggerHaptic('light');

    if (isBookmarked) {
      await removeBookmark(targetId);
    } else {
      await addBookmark(targetId);
    }
  };

  return (
    <Pressable
      style={[styles.button, { padding: spacing[2] }]}
      onPress={handlePress}
      hitSlop={8}
    >
      <Ionicons
        name={isBookmarked ? 'heart' : 'heart-outline'}
        size={size}
        color={isBookmarked ? colors.error : colors.textSecondary}
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
