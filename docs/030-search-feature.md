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
| 2   | 和暦で検索 → 変換して検索（MVP: 明治〜令和のみ）   | 「明治元年」で「1868」と同じ結果 | -    |
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

- [ ] searchEventsByYear(year: number): Event[]
- [ ] searchEventsByName(keyword: string): Event[]
- [ ] searchPersonByName(keyword: string): Person[]
- [ ] searchEventsByWakaEra(wakaEraName: string): Event[]

### Phase 2: 和暦 → 西暦変換

- [ ] 和暦マッピングテーブル作成
  ```
  "明治元年" → 1868
  "令和3年" → 2021
  等
  ```
- [ ] パーサー実装
- [ ] **MVP スコープ:** 明治〜令和（5元号）のみ対応
  - 明治（1868-1912）、大正（1912-1926）、昭和（1926-1989）、平成（1989-2019）、令和（2019-）
  - 古い元号（慶応以前）は v1.1 で対応予定

### Phase 3: インクリメンタルサーチUI

- [ ] SearchBar コンポーネント
- [ ] TextInput + Magnifying Glass アイコン
- [ ] デバウンス実装（500ms）

### Phase 4: 検索結果表示

- [ ] SearchResult コンポーネント
- [ ] Item リスト（Event, Person 混在）
- [ ] 各 Item → 詳細画面遷移

### Phase 5: 検索履歴

- [ ] searchStore.searchHistory 使用
- [ ] AsyncStorage 保存
- [ ] クリア機能

### Phase 6: キャッシング・最適化

- [ ] 検索結果キャッシュ（直近100クエリ）
- [ ] SQLite インデックス活用

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
// MVP スコープ: 明治〜令和（5元号）のみ対応
// v1.1 で慶応以前の元号を追加予定
export function wakaToSeireki(wakaText: string): number | null {
  // MVP: 明治〜令和の5元号
  const patterns = [
    { regex: /明治(\d+)年/, baseYear: 1868, adjustment: -1 },
    { regex: /大正(\d+)年/, baseYear: 1912, adjustment: -1 },
    { regex: /昭和(\d+)年/, baseYear: 1926, adjustment: -1 },
    { regex: /平成(\d+)年/, baseYear: 1989, adjustment: -1 },
    { regex: /令和(\d+)年/, baseYear: 2019, adjustment: -1 },
  ];

  for (const { regex, baseYear, adjustment } of patterns) {
    const match = wakaText.match(regex);
    if (match) {
      return baseYear + parseInt(match[1]) + adjustment;
    }
  }

  // v1.1: 慶応以前の元号対応（江戸時代以前は元号が複雑）
  // TODO: 元号テーブルをDBに追加し、動的にマッチング
  return null;
}
```

---

## ファイル構成

```
domain/
└── search/
    ├── searchService.ts        # 検索ロジック
    ├── wakaCalendar.ts        # 和暦変換

components/
└── search/
    ├── SearchBar.tsx          # 検索入力UI
    ├── SearchResults.tsx      # 結果一覧
    └── SearchHistory.tsx      # 履歴表示

app/
└── search.tsx                 # 検索画面（タブ）
```

---

## テスト項目

- [ ] 西暦「1868」→ 明治イベント取得
- [ ] 和暦「明治元年」→ 同じ結果
- [ ] 人物名「織田信長」→ 人物 + 戦国イベント
- [ ] 検索結果クリック → 詳細表示
- [ ] パフォーマンス：< 100ms で結果返却

---

**作成日:** 2025-01-25
**優先度:** P0
**推定工数:** 2d
**ステータス:** Not Started
**ブロッカー:** 012, 014, 020 完了
