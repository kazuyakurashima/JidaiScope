/**
 * JidaiScope - Timeline Screen
 * Sprint 2: 020 Timeline Core
 * Sprint 3: 035 Screenshot Sharing
 *
 * メインタイムライン画面。真比率タイムラインで日本史を探索。
 */

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

import { TimelineCanvas, EraPickerBar, ContextHeader } from '@/components/timeline';
import { TipModal } from '@/components/ui/TipModal';
import { useTheme } from '@/hooks/useTheme';
import { useTimelineData } from '@/hooks/useTimelineData';
import { useAppStore, useTimelineStore, useLayerTipShown, useLaunchCount, useIsOnboardingInitialized } from '@/stores';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { triggerHaptic } from '@/utils/haptics';
import { generateCaption } from '@/utils/screenshotCaption';
import type { Era } from '@/types/database';

// Expo Go では react-native-share が動作しないため環境判定
const isExpoGo = Constants.appOwnership === 'expo';

export default function TimelineScreen() {
  const router = useRouter();
  const { colors, typography, spacing, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const timelineRef = useRef<View>(null);

  // データベース状態
  const dbReady = useAppStore((s) => s.dbReady);

  // タイムラインデータ
  const { eras, events, reigns, isLoading, error } = useTimelineData();

  // ローディング・エラー表示
  const showLoading = !dbReady || isLoading;
  const showError = error !== null;

  const [isCapturing, setIsCapturing] = useState(false);

  // プログレッシブ開示: 3回目起動時のレイヤー設定Tip
  const onboardingInitialized = useIsOnboardingInitialized();
  const layerTipShown = useLayerTipShown();
  const launchCount = useLaunchCount();
  const markLayerTipShown = useOnboardingStore((s) => s.markLayerTipShown);
  const [showLayerTip, setShowLayerTip] = useState(false);

  // 3回目起動時にレイヤー設定Tipを表示（initialized完了後のみ判定）
  useEffect(() => {
    if (onboardingInitialized && launchCount === 3 && !layerTipShown && !showLoading) {
      const timer = setTimeout(() => {
        setShowLayerTip(true);
      }, 1500); // データ読み込み完了後に表示
      return () => clearTimeout(timer);
    }
  }, [onboardingInitialized, launchCount, layerTipShown, showLoading]);

  const handleLayerTipClose = useCallback(() => {
    setShowLayerTip(false);
    void markLayerTipShown();
  }, [markLayerTipShown]);

  const handleLayerTipSettings = useCallback(() => {
    setShowLayerTip(false);
    void markLayerTipShown();
    router.push('/settings');
  }, [markLayerTipShown, router]);

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

      if (isExpoGo) {
        // Expo Go: expo-sharing を使用（キャプションは dialogTitle のみ、本文には載らない）
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            dialogTitle: caption,
          });
        }
      } else {
        // Development Build / Standalone: react-native-share でキャプション本文共有
        // 動的インポート（Expo Go でのインポートエラーを回避）
        const Share = (await import('react-native-share')).default;
        await Share.open({
          url: uri,
          message: caption,
          title: 'JidaiScope タイムライン',
        });
      }
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

  // 時代チップ長押し → 時代詳細画面へ遷移
  const handleEraLongPress = (era: Era) => {
    void triggerHaptic('medium');
    router.push(`/era/${era.id}`);
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
        {/* Context Header - 現在位置表示 */}
        {!showLoading && !showError && eras.length > 0 && (
          <ContextHeader eras={eras} reigns={reigns} />
        )}

        {/* Era Picker Bar */}
        {!showLoading && !showError && eras.length > 0 && (
          <EraPickerBar eras={eras} onEraLongPress={handleEraLongPress} />
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
              reigns={reigns}
              onEraPress={(eraId) => {
                // タップで時代選択（EraPickerBarと同期）
                useTimelineStore.getState().selectEra(eraId);
              }}
              onEraLongPress={(eraId) => {
                // 長押しで詳細画面へ（ハプティクスはCanvas側で発火済み）
                router.push(`/era/${eraId}`);
              }}
            />
          )}
        </View>
      </View>

      {/* プログレッシブ開示: 3回目起動時のレイヤー設定Tip */}
      <TipModal
        visible={showLayerTip}
        title="知ってた？"
        description="設定で天皇・将軍レイヤーをON/OFFできます。表示情報をカスタマイズしましょう！"
        icon="layers-outline"
        primaryButtonText="見てみる"
        secondaryButtonText="あとで"
        onPrimaryPress={handleLayerTipSettings}
        onSecondaryPress={handleLayerTipClose}
        onClose={handleLayerTipClose}
      />
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
