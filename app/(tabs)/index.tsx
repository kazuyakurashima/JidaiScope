/**
 * JidaiScope - Timeline Screen
 * Sprint 0: Tech Validation PoC
 *
 * 検証項目:
 * - Day 1: Skia + Expo SDK 54 互換性、ピンチズーム 60fps
 * - Day 2: LOD 切替、ハプティクス応答時間
 * - Day 3: 密集描画 (350events)、ビューポートカリング
 */

import { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { PinchZoomTest } from '@/components/poc/PinchZoomTest';
import { LODTest } from '@/components/poc/LODTest';
import { DenseRenderTest } from '@/components/poc/DenseRenderTest';

type TestMode = 'pinch' | 'lod' | 'dense';

export default function TimelineScreen() {
  const [testMode, setTestMode] = useState<TestMode>('dense');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>JidaiScope</Text>
        <Text style={styles.subtitle}>Sprint 0: Tech Validation</Text>

        {/* テスト切替ボタン */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, testMode === 'pinch' && styles.activeToggle]}
            onPress={() => setTestMode('pinch')}
          >
            <Text style={[styles.toggleText, testMode === 'pinch' && styles.activeToggleText]}>
              Day 1: Pinch
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, testMode === 'lod' && styles.activeToggle]}
            onPress={() => setTestMode('lod')}
          >
            <Text style={[styles.toggleText, testMode === 'lod' && styles.activeToggleText]}>
              Day 2: LOD
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, testMode === 'dense' && styles.activeToggle]}
            onPress={() => setTestMode('dense')}
          >
            <Text style={[styles.toggleText, testMode === 'dense' && styles.activeToggleText]}>
              Day 3: Dense
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* タイムライン PoC */}
      <View style={styles.timelineContainer}>
        {testMode === 'pinch' && <PinchZoomTest />}
        {testMode === 'lod' && <LODTest />}
        {testMode === 'dense' && <DenseRenderTest />}
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
  toggleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2D3748',
  },
  activeToggle: {
    backgroundColor: '#4FD1C5',
  },
  toggleText: {
    color: '#718096',
    fontSize: 12,
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#0A0E14',
  },
  timelineContainer: {
    flex: 1,
  },
});
