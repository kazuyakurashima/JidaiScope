# 030: Search Feature - 検索機能（Sprint 3）

## 概要

**目的:** 西暦、和暦、人物名、事件名での検索を実装し、ユーザーが目的の情報に素早くアクセスできるようにする

**スコープ:**

- インクリメンタルサーチ（2文字以上で発火）
- 西暦「1868」で検索 → 明治元年へジャンプ
- 和暦「明治元年」で検索 → 同上
- 人物名「織田信長」で検索
- 事件名「本能寺」で検索
- 検索履歴表示（直近10件）
- キャッシング（高速化）

**成功基準:**

- ✅ 全検索タイプが < 100ms で結果返却
- ✅ インクリメンタルサーチが快適（500ms デバウンス）
- ✅ 検索結果最大50件表示
- ✅ ゼロ結果時にサジェスト表示

---

## ユーザーストーリー

```
As a 受験生
I want to 「1868」と入力して明治元年の情報をすぐに見たい
So that 受験勉強の効率が上がる
```

---

## 受け入れ条件

| #   | 条件                                               | 検証方法                         | 担当 |
| --- | -------------------------------------------------- | -------------------------------- | ---- |
| 1   | 西暦数値で検索 → 該当年のイベント一覧              | 「1868」で明治関連イベント       | -    |
| 2   | 和暦で検索 → 全時代対応（大化645年〜令和）         | 「明治元年」で「1868」と同じ結果 | -    |
| 3   | 人物名で検索 → 人物と関連イベント                  | 「織田信長」で人物と戦国イベント | -    |
| 4   | 事件名で検索 → 事件と関連人物                      | 「本能寺」で事件と信長・光秀     | -    |
| 5   | 検索結果クリック → タイムラインジャンプ + 詳細表示 | ナビゲーション確認               | -    |

---

## 依存関係

| 種類             | 詳細                                                        |
| ---------------- | ----------------------------------------------------------- |
| ✓ 入力依存       | 012 (Database Schema), 014 (State Management), 020 (Timeline Core) |
| ✗ コード依存     | 031 (Event Detail) へ遷移                                   |
| ✗ 他チケット依存 | なし                                                        |
| ✓ 出力依存       | Bookmark 等で検索結果参照                                   |

---

## Todo リスト

### Phase 1: 検索クエリ実装

- [x] searchEventsByYear(year: number): Event[]（既存 EventRepository）
- [x] searchEventsByName(keyword: string): Event[]（既存 EventRepository）
- [x] searchPersonByName(keyword: string): Person[]（既存 PersonRepository）
- [x] searchEventsByWakaEra(wakaEraName: string): Event[]（wakaCalendar経由）

### Phase 2: 和暦 → 西暦変換

- [x] 和暦マッピングテーブル作成（utils/wakaCalendar.ts）
  ```
  "大化元年" → 645
  "明治元年" → 1868
  "令和3年" → 2021
  等
  ```
- [x] パーサー実装（wakaToSeireki, parseWaka）
- [x] **全時代対応（大化〜令和）**
  - 日本史上のすべての元号（約250元号）に対応
  - 元号マスターデータは 013 Data Preparation で整備
  - 南北朝時代（北朝・南朝）の元号も対応

### Phase 3: インクリメンタルサーチUI

- [x] SearchBar コンポーネント（app/(tabs)/search.tsx）
- [x] TextInput + Magnifying Glass アイコン
- [x] デバウンス実装（500ms）

### Phase 4: 検索結果表示

- [x] SearchResult コンポーネント（FlatList）
- [x] Item リスト（Event, Person 混在）
- [x] 各 Item → 詳細画面遷移（router.push）

### Phase 5: 検索履歴

- [x] searchStore.searchHistory 使用
- [x] cacheResults でキャッシュ保存
- [x] クリア機能（clearHistory）

### Phase 6: キャッシング・最適化

- [x] 検索結果キャッシュ（searchStore.cacheResults）
- [x] SQLite インデックス活用（Repository側で ORDER BY）

### Phase 7: テスト

- [x] TypeScript ビルド確認
- [x] ESLint チェック
- [ ] 実機テスト：西暦検索
- [ ] 実機テスト：和暦検索
- [ ] 実機テスト：名前検索

---

## 実装ガイドライン

```typescript
// domain/search/searchService.ts
export async function searchByKeyword(keyword: string) {
  if (keyword.length < 2) return [];

  // 西暦判定
  if (/^\d{3,4}$/.test(keyword)) {
    return searchEventsByYear(parseInt(keyword));
  }

  // 和暦判定
  const wakaYear = wakaToSeireki(keyword);
  if (wakaYear) {
    return searchEventsByYear(wakaYear);
  }

  // 名前検索（人物 + イベント）
  const persons = await searchPersonByName(keyword);
  const events = await searchEventsByName(keyword);

  return [
    ...persons.map(p => ({ type: 'person', data: p })),
    ...events.map(e => ({ type: 'event', data: e })),
  ].slice(0, 50);
}

// components/search/SearchBar.tsx
export function SearchBar() {
  const { searchHistory, search } = useSearchStore();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  const debouncedSearch = useMemo(
    () => debounce(async (text: string) => {
      const res = await searchByKeyword(text);
      setResults(res);
    }, 500),
    []
  );

  return (
    <View>
      <TextInput
        placeholder="西暦・和暦・人物名で検索..."
        value={keyword}
        onChangeText={(text) => {
          setKeyword(text);
          debouncedSearch(text);
        }}
      />
      {results.length > 0 && <SearchResults items={results} />}
      {keyword === '' && searchHistory.length > 0 && (
        <SearchHistory items={searchHistory} />
      )}
    </View>
  );
}

// utils/wakaCalendar.ts
// 全時代対応（大化645年〜令和）
// 元号マスターデータはDBから動的に取得
export function wakaToSeireki(wakaText: string): number | null {
  // 元号マスター（DBから取得、ここでは簡略化）
  // 約250元号すべてに対応
  const eraPatterns = getEraPatterns(); // DBから取得

  for (const { eraName, startYear } of eraPatterns) {
    const regex = new RegExp(`${eraName}(\\d+)年`);
    const match = wakaText.match(regex);
    if (match) {
      const eraYear = parseInt(match[1]);
      return startYear + eraYear - 1;
    }
  }

  // 元号名のみ（年なし）で検索した場合は開始年を返す
  for (const { eraName, startYear } of eraPatterns) {
    if (wakaText.includes(eraName)) {
      return startYear;
    }
  }

  return null;
}

// 例:
// "大化元年" → 645
// "天平勝宝8年" → 756
// "慶応3年" → 1867
// "明治元年" → 1868
```

---

## ファイル構成

```
domain/
└── search/
    ├── searchService.ts        # 統合検索サービス
    └── index.ts                # エクスポート

utils/
└── wakaCalendar.ts             # 和暦⇔西暦変換

data/
└── repositories/
    ├── EventRepository.ts      # イベント検索（既存）
    └── PersonRepository.ts     # 人物検索（既存）

stores/
└── searchStore.ts              # 検索履歴・キャッシュ管理

app/
└── (tabs)/search.tsx           # 検索画面（タブ）
```

---

## テスト項目

| テスト項目               | 手順                           | 期待値                    | 状態 |
| ------------------------ | ------------------------------ | ------------------------- | ---- |
| TypeScript               | npx tsc --noEmit               | エラーなし                | ✅   |
| ESLint                   | npm run lint                   | エラーなし                | ✅   |
| 西暦検索                 | 「1868」と入力                 | 明治関連イベント取得      | -    |
| 和暦検索                 | 「明治元年」と入力             | 同じ結果                  | -    |
| 人物検索                 | 「織田信長」と入力             | 人物+関連イベント         | -    |
| 結果タップ               | 検索結果をタップ               | 詳細画面へ遷移            | -    |
| パフォーマンス           | 検索実行                       | < 100ms で結果返却        | -    |
| デバウンス               | 連続入力                       | 500ms 後に検索実行        | -    |
| 履歴表示                 | 検索後、入力クリア             | 検索履歴表示              | -    |

---

**作成日:** 2025-01-25
**更新日:** 2026-01-31
**優先度:** P0
**推定工数:** 2d
**ステータス:** Done (Phase 1-6 実装完了、Phase 7 実機テスト待ち)
**ブロッカー:** 012, 014, 020 完了 ✓

---

## 変更履歴

### v1.1 (2026-01-31)
- 和暦対応を「明治〜令和」→「全時代（大化645年〜令和）」に拡張
- 約250元号すべてに対応する設計に変更
- 元号マスターデータはDB（013 Data Preparation）から取得する方式に更新
