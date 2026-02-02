/**
 * Onboarding Screen - 初回起動時のオンボーディング（3ステップ）
 * Sprint 3: 043 Onboarding Flow
 *
 * Step 1: ウェルカム - JidaiScope紹介
 * Step 2: ピンチズーム - 最重要ジェスチャー
 * Step 3: 時代ジャンプ - EraPickerBar紹介
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/stores/onboardingStore';

// 3ステップ構成（043-onboarding-flow.md v4.1）
const STEPS = [
  {
    id: 'welcome',
    icon: 'time-outline' as const,
    title: 'JidaiScope へようこそ',
    description: '日本史を時間軸で理解しよう\n\n縄文時代から令和まで、\n真比率タイムラインで歴史を探索',
  },
  {
    id: 'gesture',
    icon: 'hand-left-outline' as const,
    title: 'ピンチで時代を探索',
    description:
      '2本の指で広げると：\n\n・年代目盛りが詳細に\n・イベント・人物が登場\n・タップで詳細表示',
  },
  {
    id: 'era-jump',
    icon: 'navigate-outline' as const,
    title: '時代へすぐジャンプ',
    description: '画面上部のバーから\n見たい時代を選んでタップ\n\n縄文・弥生・古墳...令和まで\nワンタップで移動！',
  },
] as const;

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();
  const markCompleted = useOnboardingStore((s) => s.markCompleted);
  const { colors, spacing, typography } = useTheme();

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await markCompleted();
      router.replace('/(tabs)');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    await markCompleted();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* プログレスドット */}
      <View style={[styles.progressContainer, { marginTop: spacing[4] }]}>
        <View style={styles.progressBar}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                { backgroundColor: colors.bgTertiary },
                index <= currentStep && { backgroundColor: colors.primary },
              ]}
            />
          ))}
        </View>
      </View>

      {/* ステップコンテンツ */}
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.bgSecondary },
          ]}
        >
          <Ionicons name={step.icon} size={64} color={colors.primary} />
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.size['2xl'],
              marginTop: spacing[6],
            },
          ]}
        >
          {step.title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.textSecondary,
              marginTop: spacing[4],
              lineHeight: 24,
            },
          ]}
        >
          {step.description}
        </Text>

        {/* Step 2: ジェスチャーデモ */}
        {step.id === 'gesture' && (
          <View style={[styles.gestureDemo, { marginTop: spacing[6] }]}>
            <View
              style={[
                styles.gestureDemoBox,
                { backgroundColor: colors.bgSecondary },
              ]}
            >
              <Ionicons
                name="contract-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Ionicons
                name="arrow-forward"
                size={24}
                color={colors.textTertiary}
                style={{ marginHorizontal: 8 }}
              />
              <Ionicons
                name="expand-outline"
                size={48}
                color={colors.primary}
              />
            </View>
          </View>
        )}

        {/* Step 3: EraPickerプレビュー */}
        {step.id === 'era-jump' && (
          <View style={[styles.eraPreview, { marginTop: spacing[6] }]}>
            <View style={styles.eraPreviewRow}>
              {['縄文', '弥生', '古墳', '...', '令和'].map((era, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.eraChip,
                    {
                      backgroundColor:
                        era === '...'
                          ? 'transparent'
                          : idx === 4
                            ? colors.primary
                            : colors.bgSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.eraChipText,
                      {
                        color:
                          era === '...'
                            ? colors.textTertiary
                            : idx === 4
                              ? colors.bg
                              : colors.textSecondary,
                      },
                    ]}
                  >
                    {era}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* ボタン */}
      <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.nextButtonText, { color: colors.bg }]}>
            {currentStep === 0
              ? 'はじめる'
              : isLastStep
                ? '探索開始！'
                : '次へ'}
          </Text>
          {!isLastStep && (
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.bg}
              style={{ marginLeft: 4 }}
            />
          )}
        </Pressable>

        {!isLastStep && (
          <Pressable
            onPress={handleSkip}
            style={[styles.skipButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              スキップ
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
  gestureDemo: {
    alignItems: 'center',
  },
  gestureDemoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  eraPreview: {
    alignItems: 'center',
  },
  eraPreviewRow: {
    flexDirection: 'row',
    gap: 6,
  },
  eraChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  eraChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 24,
    gap: 12,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
