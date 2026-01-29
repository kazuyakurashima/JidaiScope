/**
 * JidaiScope - Timeline Screen
 * Sprint 2: 020 Timeline Core
 * Sprint 3: 035 Screenshot Sharing
 *
 * メインタイムライン画面。真比率タイムラインで日本史を探索。
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import Share from 'react-native-share';
import { captureRef } from 'react-native-view-shot';

import { TimelineCanvas, EraPickerBar } from '@/components/timeline';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineData } from '@/hooks/useTimelineData';
import { useAppStore } from '@/stores';
import { triggerHaptic } from '@/utils/haptics';
import { generateCaption } from '@/utils/screenshotCaption';

export default function TimelineScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const timelineRef = useRef<View>(null);

  // データベース状態
  const dbReady = useAppStore((s) => s.dbReady);

  // タイムラインデータ
  const { eras, events, isLoading, error } = useTimelineData();

  // ローディング・エラー表示
  const showLoading = !dbReady || isLoading;
  const showError = error !== null;

  const [isCapturing, setIsCapturing] = useState(false);

  // スクリーンショットをキャプチャ
  const captureScreenshot = async (): Promise<string | null> => {
    if (!timelineRef.current) return null;

    try {
      const uri = await captureRef(timelineRef, {
        format: 'png',
        quality: 0.9,
      });
      return uri;
    } catch (error) {
      console.error('Capture failed:', error);
      return null;
    }
  };

  // SNS共有
  const shareScreenshot = async () => {
    setIsCapturing(true);
    try {
      const uri = await captureScreenshot();
      if (!uri) return;

      const caption = generateCaption(eras, events, screenWidth);

      await Share.open({
        url: uri,
        message: caption,
        title: 'JidaiScope タイムライン',
      });
    } catch (error) {
      // ユーザーがキャンセルした場合は無視
      if ((error as Error).message !== 'User did not share') {
        console.error('Share failed:', error);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // ローカル保存
  const saveToPhotos = async () => {
    setIsCapturing(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          '権限が必要です',
          '写真を保存するにはフォトライブラリへのアクセス許可が必要です。',
          [{ text: 'OK' }]
        );
        return;
      }

      const uri = await captureScreenshot();
      if (!uri) return;

      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存完了', 'タイムラインを写真に保存しました。', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Save failed:', error);
      Alert.alert('エラー', '保存に失敗しました。', [{ text: 'OK' }]);
    } finally {
      setIsCapturing(false);
    }
  };

  // シェアボタンタップ時のアクション
  const handleSharePress = () => {
    if (showLoading || showError || isCapturing) return;

    void triggerHaptic('light');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['キャンセル', 'SNSで共有', '写真に保存'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            void shareScreenshot();
          } else if (buttonIndex === 2) {
            void saveToPhotos();
          }
        }
      );
    } else {
      // Android: アラートで選択
      Alert.alert(
        'スクリーンショット',
        '操作を選択してください',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: '写真に保存', onPress: () => void saveToPhotos() },
          { text: 'SNSで共有', onPress: () => void shareScreenshot() },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ヘッダー */}
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.border,
            paddingHorizontal: spacing[4],
            paddingTop: spacing[2],
            paddingBottom: spacing[3],
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: typography.size['4xl'],
                },
              ]}
            >
              JidaiScope
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textTertiary,
                  fontSize: typography.size.base,
                  marginTop: spacing[1],
                },
              ]}
            >
              {showLoading ? 'Loading...' : `${eras.length} eras / ${events.length} events`}
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {/* Share ボタン */}
            <Pressable
              onPress={handleSharePress}
              style={[styles.headerButton, { padding: spacing[2] }]}
              disabled={showLoading || showError || isCapturing}
            >
              <Ionicons
                name="share-social-outline"
                size={spacing[6]}
                color={showLoading || showError || isCapturing ? colors.textTertiary : colors.textSecondary}
              />
            </Pressable>

            {/* Settings ボタン */}
            <Pressable onPress={() => router.push('/settings')} style={{ padding: spacing[2] }}>
              <Ionicons name="settings-outline" size={spacing[6]} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>
      </View>

      {/* スクリーンショットキャプチャ対象エリア */}
      <View ref={timelineRef} style={styles.captureArea} collapsable={false}>
        {/* Era Picker Bar */}
        {!showLoading && !showError && eras.length > 0 && (
          <EraPickerBar eras={eras} />
        )}

        {/* タイムライン本体 */}
        <View style={styles.timelineContainer}>
          {showLoading && (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: spacing[3] }]}>
                Loading timeline data...
              </Text>
            </View>
          )}

          {showError && !showLoading && (
            <View style={styles.centerContent}>
              <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error, marginTop: spacing[3] }]}>
                Failed to load timeline data
              </Text>
              <Text style={[styles.errorDetail, { color: colors.textSecondary, marginTop: spacing[2] }]}>
                {error?.message}
              </Text>
            </View>
          )}

          {!showLoading && !showError && eras.length > 0 && (
            <TimelineCanvas
              eras={eras}
              events={events}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {},
  title: {
    fontWeight: '700',
  },
  subtitle: {},
  captureArea: {
    flex: 1,
  },
  timelineContainer: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
