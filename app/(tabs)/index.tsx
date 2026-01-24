/**
 * JidaiScope - Timeline Screen
 * Sprint 0: Tech Validation PoC
 *
 * 検証項目:
 * - Skia + Expo SDK 54 互換性
 * - ピンチズーム 60fps
 * - 時代帯描画
 */

import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import { PinchZoomTest } from '@/components/poc/PinchZoomTest';

export default function TimelineScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>JidaiScope</Text>
        <Text style={styles.subtitle}>Sprint 0: Tech Validation</Text>
      </View>

      {/* タイムライン PoC */}
      <View style={styles.timelineContainer}>
        <PinchZoomTest />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E14',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F7FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
  },
  timelineContainer: {
    flex: 1,
  },
});
