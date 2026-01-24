# 100: Person Detail Screen（Sprint 2）

## 概要

**目的:** タイムラインから選択された人物の詳細情報と、その人物が関連するイベントを表示

**スコープ:**

- 人物基本情報（氏名、生没年、活動期間）
- 人物概要
- 役職・称号
- 関連イベント一覧

**成功基準:**

- ✅ Person 全属性表示
- ✅ 関連イベントをタップで Event Detail へ遷移
- ✅ 戻るナビゲーション機能
- ✅ オフライン環境で動作

---

## ユーザーストーリー

```
As a 歴史好きな大人
I want to 織田信長の生涯と、彼が関わった戦国イベントを一覧で見たい
So that 1人の人物から歴史の流れを理解できる
```

---

## 受け入れ条件

| #   | 条件                                                     | 検証方法                 | 担当 |
| --- | -------------------------------------------------------- | ------------------------ | ---- |
| 1   | Person のすべてのフィールド表示                          | 各フィールド値確認       | -    |
| 2   | 生没年の存在判定（birthYear, deathYear）                 | データがある場合のみ表示 | -    |
| 3   | 関連イベント一覧が表示される                             | リスト表示確認           | -    |
| 4   | イベントリストアイテムをタップ → Event Detail 画面へ遷移 | ナビゲーション確認       | -    |
| 5   | 戻るボタン → 前画面へ戻る                                | iOS Back Gesture 対応    | -    |

---

## 依存関係

| 種類         | 詳細                               |
| ------------ | ---------------------------------- |
| ✓ 入力依存   | 010 (Database), 090 (Event Detail) |
| ✗ コード依存 | なし                               |
| ✓ 出力依存   | なし                               |

---

## データモデル

```typescript
// PRD セクション 10.2 から引用
interface Person {
  id: string;
  name: string;
  nameReading: string; // ひらがな読み
  birthYear?: number; // 例：1534
  deathYear?: number; // 例：1582
  activeStartYear: number; // 活動開始年
  activeEndYear: number; // 活動終了年
  summary: string; // 100-200字の概要
  roles: string[]; // ["織田信長", "戦国大名", "統一者"]
  importanceLevel: 0 | 1 | 2 | 3; // LOD制御用
}
```

---

## UI/UXデザイン

### レイアウト構成

```
┌─────────────────────────┐
│  [<] 戻る               │  ← Header
├─────────────────────────┤
│                         │
│ 【織田信長】            │  ← Name (大フォント)
│ おだ のぶなが           │  ← nameReading
│                         │
├─────────────────────────┤
│ 【生没年】              │
│ 永禄3年 (1534年)〜      │  ← birthYear (和暦 + 西暦)
│ 天正10年 (1582年)       │  ← deathYear
│                         │
│ 【活動期間】            │
│ 1560年〜1582年          │  ← activeStartYear/endYear
│                         │
├─────────────────────────┤
│ 【概要】                │
│ 尾張守護代からの下克上... │  ← summary
│                         │
├─────────────────────────┤
│ 【役職】                │
│ • 織田家当主            │
│ • 尾張守護              │
│ • 太政大臣              │
│                         │
├─────────────────────────┤
│ 【関連出来事】          │
│ • 桶狭間の戦い (1560)   │  ← タップで Event Detail へ
│ • 本能寺の変 (1582)     │
│ • 安土城築城 (1576)     │
│                         │
└─────────────────────────┘
```

---

## Todo リスト

### Phase 1: 画面コンポーネント作成

- [ ] PersonDetail.tsx 作成
  - [ ] Header（戻るボタン）
  - [ ] Name セクション（name + nameReading）
  - [ ] 生没年セクション（birthYear/deathYear）
  - [ ] 活動期間セクション
  - [ ] 概要セクション
  - [ ] 役職セクション

### Phase 2: 関連イベント表示

- [ ] getRelatedEvents(personId) リポジトリ関数
  - [ ] 実装例：Event テーブルの relatedPersonIds に personId を含むイベントを抽出
- [ ] イベントリスト UI
  - [ ] 各イベントの年号・タイトル
  - [ ] タップ → Event Detail へ遷移

### Phase 3: ナビゲーション

- [ ] イベントアイテムをタップ → router.push(`/event/${eventId}`)
- [ ] 戻るボタン → router.back()

### Phase 4: データ処理

- [ ] 和暦変換ロジック統合（年号表示用）
- [ ] Optional フィールド（birthYear, deathYear）の存在判定

### Phase 5: テスト

- [ ] 人物データ完全性確認
- [ ] 関連イベント表示確認
- [ ] ナビゲーション確認
- [ ] オフライン動作確認

---

## 実装ガイドライン

```typescript
// app/person/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { getPersonById, getEventsByPersonId } from '@/data/repositories';

export default function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const personData = await getPersonById(id!);
      setPerson(personData);

      // 関連イベント取得
      const relatedEvents = await getEventsByPersonId(id!);
      setEvents(relatedEvents);
    };

    loadData();
  }, [id]);

  if (!person) return <LoadingIndicator />;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </Pressable>
      </View>

      {/* Name */}
      <Text style={styles.name}>{person.name}</Text>
      <Text style={styles.nameReading}>{person.nameReading}</Text>

      {/* Birth/Death */}
      {(person.birthYear || person.deathYear) && (
        <View style={styles.lifespan}>
          {person.birthYear && (
            <Text>{seirekiToWaka(person.birthYear)} ({person.birthYear}年)</Text>
          )}
          {person.deathYear && (
            <Text>～ {seirekiToWaka(person.deathYear)} ({person.deathYear}年)</Text>
          )}
        </View>
      )}

      {/* Active Period */}
      <Text style={styles.activePeriod}>
        活動期間: {person.activeStartYear}年～{person.activeEndYear}年
      </Text>

      {/* Summary */}
      <Text style={styles.summary}>{person.summary}</Text>

      {/* Roles */}
      {person.roles.length > 0 && (
        <Section title="役職">
          {person.roles.map((role) => (
            <Text key={role} style={styles.role}>• {role}</Text>
          ))}
        </Section>
      )}

      {/* Related Events */}
      {events.length > 0 && (
        <Section title="関連出来事">
          {events.map((event) => (
            <EventLink
              key={event.id}
              event={event}
              onPress={() => router.push(`/event/${event.id}`)}
            />
          ))}
        </Section>
      )}
    </ScrollView>
  );
}
```

### リポジトリ関数追加

```typescript
// data/repositories/PersonRepository.ts
export async function getEventsByPersonId(personId: string): Promise<Event[]> {
  const db = await openDatabaseAsync("jidaiscope.db");

  // relatedPersonIds (JSON 配列) に personId を含むイベント抽出
  const result = await db.getAllAsync<Event>(
    `
    SELECT * FROM event
    WHERE json_extract(relatedPersonIds, '$') LIKE ?
    ORDER BY startYear ASC
  `,
    [`%"${personId}"%`],
  );

  return result;
}
```

---

## テスト項目

| テスト         | 方法                                  | 期待値                   |
| -------------- | ------------------------------------- | ------------------------ |
| Person データ  | 各フィールド表示確認                  | すべての属性が正確に表示 |
| オプショナル値 | birthYear/deathYear が null/undefined | 表示セクション非表示     |
| 関連イベント   | イベント一覧表示                      | 複数イベントが表示される |
| ナビゲーション | イベント タップ → Event Detail        | 遷移確認                 |
| オフライン     | WiFi OFF 状態                         | すべての情報表示可能     |

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 010, 090 完了
