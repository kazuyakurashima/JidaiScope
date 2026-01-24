# 090: Event Detail Screen（Sprint 2）

## 概要

**目的:** タイムラインから選択されたイベントの詳細情報を表示する画面

**スコープ:**

- イベント基本情報（タイトル、日付、概要）
- 関連人物・関連イベントへのリンク
- **典拠（出典）表示**：主要100件のみ MVP対応
- ブックマーク機能
- 戻るナビゲーション

**成功基準:**

- ✅ Event 全属性表示
- ✅ 典拠が小フォント（10px）で見やすく表示
- ✅ 関連リンク（人物→100, イベント→090）でシームレス遷移
- ✅ ブックマークボタン機能
- ✅ オフライン環境で動作

---

## ユーザーストーリー

```
As a 学生
I want to 明治維新の詳細情報（参考文献も含む）を見たい
So that テスト勉強で正確な情報に基づいて学習できる
```

---

## 受け入れ条件

| #   | 条件                                                | 検証方法              | 担当 |
| --- | --------------------------------------------------- | --------------------- | ---- |
| 1   | Event のすべてのフィールド表示                      | 各フィールド値確認    | -    |
| 2   | 関連人物をタップ → Person Detail 画面へ遷移         | ナビゲーション確認    | -    |
| 3   | 関連イベントをタップ → 別の Event Detail 画面へ遷移 | ナビゲーション確認    | -    |
| 4   | 典拠（source フィールド）が 10px 灰色で表示         | ビジュアル確認        | -    |
| 5   | ブックマークボタン追加/削除が即座に反映             | UI 確認               | -    |
| 6   | 戻るボタンで 1階層戻る                              | iOS Back Gesture 対応 | -    |

---

## 依存関係

| 種類         | 詳細                                                |
| ------------ | --------------------------------------------------- |
| ✓ 入力依存   | 010 (Database), 080 (Search), 030 (Timeline)        |
| ✗ コード依存 | 100 (Person Detail) へ遷移                          |
| ✓ 出力依存   | 110 (Source Display) が本チケットの事件詳細内に統合 |

---

## データモデル

```typescript
// PRD セクション 10.2 から引用
interface Event {
  id: string;
  title: string;
  startDate: string; // ISO 8601 (e.g., "1868-01-25")
  endDate?: string;
  summary: string; // 100-200字
  tags: ("politics" | "war" | "culture" | "diplomacy")[];
  importanceLevel: 0 | 1 | 2 | 3; // LOD制御用
  eraId: string;
  relatedPersonIds: string[]; // 関連人物ID
  relatedEventIds: string[]; // 関連イベントID
  // MVP: 100件のみ典拠設定
  source?: {
    title: string; // 出典名例："山川 詳説日本史"
    page?: string; // "p.124" 等
    url?: string; // 参考URL (任意)
  };
}
```

---

## UI/UXデザイン

### レイアウト構成

```
┌─────────────────────────┐
│  [<] 戻る        [❤]   │  ← Header (戻る + ブックマーク)
├─────────────────────────┤
│                         │
│ 【明治維新】            │  ← Title (大フォント)
│                         │
│ 1868年1月25日〜1869年5月│  ← Date (西暦)
│ 慶応4年1月〜明治2年5月  │  ← Date (和暦)
│                         │
├─────────────────────────┤
│ 【概要】                │
│ 江戸幕府の政権を朝廷に返納... │  ← Summary (100-200字)
│                         │
├─────────────────────────┤
│ 【タグ】                │
│ #政治 #革命 #外交      │
│                         │
├─────────────────────────┤
│ 【関連人物】            │
│ • 明治天皇 (活動期)     │
│ • 大久保利通 (活動期)   │  ← タップで Person Detail へ
│                         │
├─────────────────────────┤
│ 【関連出来事】          │
│ • 戊辰戦争 (1868-1869)  │  ← タップで Event Detail へ
│ • 版籍奉還 (1869)       │
│                         │
├─────────────────────────┤
│ 【典拠】(10px, #718096)  │
│ 山川 詳説日本史, p.124  │  ← MVP: 100件のみ
│ (参考: https://...)    │
│                         │
└─────────────────────────┘
```

### カラー定義（PRD セクション 11.2 から）

```
--text-primary: #F7FAFC       // タイトル・主要情報
--text-secondary: #A0AEC0     // サブテキスト
--text-tertiary: #718096      // 典拠表示用（10px）
--color-tag-politics: #EF5350
--color-tag-war: #FF7043
--color-tag-culture: #9CCC65
--color-tag-diplomacy: #26A69A
```

---

## Todo リスト

### Phase 1: 画面コンポーネント作成

- [ ] EventDetail.tsx 作成
  - [ ] Header（戻るボタン + ブックマークボタン）
  - [ ] Title セクション
  - [ ] Date セクション（西暦 + 和暦）
  - [ ] Summary セクション
  - [ ] Tags セクション

### Phase 2: リレーション表示

- [ ] 関連人物セクション
  - [ ] getRelatedPersons(eventId) リポジトリ関数
  - [ ] Person リストUI（可脱タップエリア）
- [ ] 関連イベントセクション
  - [ ] getRelatedEvents(eventId) リポジトリ関数
  - [ ] Event リストUI（可脱タップエリア）

### Phase 3: 典拠表示（110 と統合）

- [ ] Source オブジェクト存在判定
- [ ] SourceBadge コンポーネント（10px, #718096）
  - title, page, url を表示
  - url がある場合、タップで Linking.openURL()
- [ ] MVP 対応：source が null の場合、セクション非表示

### Phase 4: ブックマーク機能

- [ ] BookmarkButton コンポーネント統合
  - [ ] useBookmarkStore から isSaved 判定
  - [ ] ハート アイコン（filled/unfilled）
  - [ ] onPress で addBookmark / removeBookmark

### Phase 5: ナビゲーション

- [ ] 関連人物タップ → useRouter.push(`/person/${personId}`)
- [ ] 関連イベントタップ → useRouter.push(`/event/${eventId}`)
  - [ ] スタック操作（戻るボタン有効）
- [ ] 戻るボタン → router.back()

### Phase 6: テスト

- [ ] すべてのフィールド表示確認
- [ ] 関連リンク遷移確認
- [ ] ブックマーク保存/削除確認
- [ ] オフライン動作確認

---

## 実装ガイドライン

```typescript
// app/event/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { getEventById, getRelatedPersons, getRelatedEvents } from '@/data/repositories';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedPersons, setRelatedPersons] = useState<Person[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const eventData = await getEventById(id!);
      setEvent(eventData);

      if (eventData?.relatedPersonIds) {
        const persons = await getRelatedPersons(eventData.relatedPersonIds);
        setRelatedPersons(persons);
      }

      if (eventData?.relatedEventIds) {
        const events = await getRelatedEvents(eventData.relatedEventIds);
        setRelatedEvents(events);
      }
    };

    loadData();
  }, [id]);

  if (!event) return <LoadingIndicator />;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← 戻る</Text>
        </Pressable>
        <BookmarkButton eventId={id!} />
      </View>

      {/* Title */}
      <Text style={styles.title}>{event.title}</Text>

      {/* Dates */}
      <Text style={styles.date}>
        {event.startDate} ～ {event.endDate || '〜"}
      </Text>

      {/* Summary */}
      <Text style={styles.summary}>{event.summary}</Text>

      {/* Tags */}
      <View style={styles.tags}>
        {event.tags.map((tag) => (
          <TagBadge key={tag} tag={tag} />
        ))}
      </View>

      {/* Related Persons */}
      {relatedPersons.length > 0 && (
        <Section title="関連人物">
          {relatedPersons.map((person) => (
            <PersonLink
              key={person.id}
              person={person}
              onPress={() => router.push(`/person/${person.id}`)}
            />
          ))}
        </Section>
      )}

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <Section title="関連出来事">
          {relatedEvents.map((evt) => (
            <EventLink
              key={evt.id}
              event={evt}
              onPress={() => router.push(`/event/${evt.id}`)}
            />
          ))}
        </Section>
      )}

      {/* Source/典拠 */}
      {event.source && (
        <Section title="典拠">
          <SourceBadge source={event.source} />
        </Section>
      )}
    </ScrollView>
  );
}
```

### SourceBadge コンポーネント

```typescript
// components/cards/SourceBadge.tsx
import { Linking } from 'react-native';

interface SourceBadgeProps {
  source: {
    title: string;
    page?: string;
    url?: string;
  };
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const handleOpenURL = () => {
    if (source.url) {
      Linking.openURL(source.url);
    }
  };

  return (
    <Pressable onPress={handleOpenURL} disabled={!source.url}>
      <Text style={styles.source}>
        {source.title}
        {source.page && ` - p.${source.page}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  source: {
    fontSize: 10,
    color: '#718096', // --text-tertiary
    fontFamily: 'Hiragino Sans',
  },
});
```

---

## テスト項目

| テスト             | 方法                     | 期待値                          |
| ------------------ | ------------------------ | ------------------------------- |
| Event データ完全性 | 各フィールド表示確認     | すべての属性が正確に表示        |
| 関連リンク         | 人物/イベント タップ     | 対応する詳細画面へ遷移          |
| 典拠表示           | SourceBadge レンダリング | 小フォント(10px)、灰色、URL対応 |
| ブックマーク       | 追加/削除                | AsyncStorage に即座に反映       |
| オフライン         | WiFi OFF 状態            | すべての情報表示可能            |

---

## ファイル構成

```
app/
├── event/
│   └── [id].tsx              # Event Detail Screen

components/
├── cards/
│   ├── SourceBadge.tsx       # 典拠表示
│   ├── PersonLink.tsx        # 人物リンク
│   └── EventLink.tsx         # イベントリンク
└── common/
    ├── TagBadge.tsx          # タグ表示
    └── BookmarkButton.tsx    # ブックマーク

data/
└── repositories/
    └── EventRepository.ts    # getRelatedPersons, getRelatedEvents 追加
```

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 010, 080, 030 完了
