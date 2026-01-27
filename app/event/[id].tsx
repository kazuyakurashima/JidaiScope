/**
 * Event Detail Screen - イベント詳細
 * Sprint 1: 011 Navigation Architecture
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

// ダミーの関連人物データ（Sprint 2でDB連携）
const RELATED_PERSONS = [
  { id: 'person-001', name: '織田信長', role: '主要人物' },
  { id: 'person-002', name: '豊臣秀吉', role: '関連人物' },
  { id: 'person-003', name: '徳川家康', role: '関連人物' },
];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        {/* イベント情報 */}
        <Text style={[styles.title, { color: colors.text, fontSize: typography.size['2xl'] }]}>
          イベント詳細
        </Text>
        <Text style={[styles.id, { color: colors.primary, marginTop: spacing[2] }]}>
          ID: {id}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginTop: spacing[4] }]}>
          Sprint 2で詳細データ実装予定
        </Text>

        {/* 関連人物セクション */}
        <View style={[styles.section, { marginTop: spacing[8] }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: typography.size.lg }]}>
            関連人物
          </Text>
          <View style={[styles.personList, { marginTop: spacing[3] }]}>
            {RELATED_PERSONS.map((person) => (
              <Pressable
                key={person.id}
                style={[
                  styles.personItem,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderRadius: radius.md,
                    padding: spacing[4],
                    marginBottom: spacing[2],
                  },
                ]}
                onPress={() => router.push(`/person/${person.id}`)}
              >
                <View style={styles.personInfo}>
                  <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
                  <View style={{ marginLeft: spacing[3] }}>
                    <Text style={[styles.personName, { color: colors.text }]}>
                      {person.name}
                    </Text>
                    <Text style={[styles.personRole, { color: colors.textTertiary }]}>
                      {person.role}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontWeight: '600',
  },
  id: {
    fontSize: 16,
    fontFamily: 'Courier New',
  },
  subtitle: {
    fontSize: 14,
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  personList: {},
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personName: {
    fontSize: 16,
    fontWeight: '500',
  },
  personRole: {
    fontSize: 12,
    marginTop: 2,
  },
});
