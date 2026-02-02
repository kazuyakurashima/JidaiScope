/**
 * TipModal - プログレッシブ開示用のTipモーダル
 * Sprint 3: 043 Onboarding Flow
 *
 * 初回イベントタップ、3回目起動、初回検索など
 * 特定タイミングで高度な機能を紹介するためのモーダル
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface TipModalProps {
  /** 表示状態 */
  visible: boolean;
  /** タイトル */
  title: string;
  /** 説明文 */
  description: string;
  /** アイコン名（Ionicons） */
  icon?: keyof typeof Ionicons.glyphMap;
  /** プライマリボタンテキスト */
  primaryButtonText?: string;
  /** セカンダリボタンテキスト（省略可能） */
  secondaryButtonText?: string;
  /** プライマリボタン押下時 */
  onPrimaryPress: () => void;
  /** セカンダリボタン押下時 */
  onSecondaryPress?: () => void;
  /** 閉じる時（背景タップなど） */
  onClose: () => void;
  /** 自動的に閉じるまでの時間（ms、0で無効） */
  autoCloseDelay?: number;
}

export function TipModal({
  visible,
  title,
  description,
  icon = 'bulb-outline',
  primaryButtonText = 'OK',
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onClose,
  autoCloseDelay = 0,
}: TipModalProps) {
  const { colors, spacing, typography } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // 表示時のアニメーション
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  // 自動クローズ
  useEffect(() => {
    if (visible && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [visible, autoCloseDelay, onClose]);

  const handlePrimaryPress = useCallback(() => {
    onPrimaryPress();
    onClose();
  }, [onPrimaryPress, onClose]);

  const handleSecondaryPress = useCallback(() => {
    onSecondaryPress?.();
    onClose();
  }, [onSecondaryPress, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.bgSecondary,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* コンテンツ領域タップでモーダルが閉じないようイベント伝播を明示的にブロック */}
          <Pressable onPress={() => {}}>
            {/* アイコン */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: colors.primaryMuted },
              ]}
            >
              <Ionicons name={icon} size={28} color={colors.primary} />
            </View>

            {/* タイトル */}
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: typography.size.lg,
                  marginTop: spacing[3],
                },
              ]}
            >
              {title}
            </Text>

            {/* 説明文 */}
            <Text
              style={[
                styles.description,
                {
                  color: colors.textSecondary,
                  fontSize: typography.size.sm,
                  marginTop: spacing[2],
                },
              ]}
            >
              {description}
            </Text>

            {/* ボタン */}
            <View style={[styles.buttonContainer, { marginTop: spacing[4] }]}>
              {secondaryButtonText && (
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { borderColor: colors.border },
                  ]}
                  onPress={handleSecondaryPress}
                >
                  <Text
                    style={[
                      styles.secondaryButtonText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {secondaryButtonText}
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: colors.primary,
                    flex: secondaryButtonText ? 1 : undefined,
                  },
                ]}
                onPress={handlePrimaryPress}
              >
                <Text style={[styles.primaryButtonText, { color: colors.bg }]}>
                  {primaryButtonText}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  primaryButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    fontWeight: '500',
    fontSize: 14,
  },
});
