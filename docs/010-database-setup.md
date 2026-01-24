# 010: Database Setup（Sprint 1）

## 概要

**目的:** SQLite データベースの全体構成を確立し、MVPで必要なすべてのデータを格納・検索可能にする

**スコープ:**

- SQLite スキーマ設計（Era, Event, Person, Reign）
- 初期データセット埋め込み（縄文〜令和, 800件イベント）
- インデックス最適化
- 検索クエリの実装
- オフライン対応の確認

**成功基準:**

- ✅ 全テーブル作成完了
- ✅ 初期データ 1000+ 件インポート可能
- ✅ 検索クエリ < 100ms で結果取得
- ✅ オフライン環境で完全動作

---

## ユーザーストーリー

```
As a アプリ開発者
I want to SQLite で日本史データを効率的に管理したい
So that 高速で信頼性の高い検索・表示ができる
```

---

## 受け入れ条件

| #   | 条件                                             | 検証方法                     | 担当 |
| --- | ------------------------------------------------ | ---------------------------- | ---- |
| 1   | Era テーブル：15時代を定義可能                   | SELECT COUNT(\*) FROM era    | -    |
| 2   | Event テーブル：800件インポート可能              | Event数計測、典拠100件含む   | -    |
| 3   | Person テーブル：200-300名管理可能               | SELECT COUNT(\*) FROM person | -    |
| 4   | Reign テーブル：天皇126代 + 将軍45名管理可能     | テーブル構造確認             | -    |
| 5   | インデックス設定完了（startYear, endYear, name） | EXPLAIN QUERY PLAN で確認    | -    |
| 6   | 西暦検索「1868」で 10ms以内に結果取得            | EXPLAIN + 計測               | -    |
| 7   | オフライン環境で全クエリ動作                     | SQLite オフライン確認        | -    |

---

## 依存関係

| 種類             | 詳細                                                          |
| ---------------- | ------------------------------------------------------------- |
| ✓ 入力依存       | PRD v2.1 / 001 Tech Validation 完了                           |
| ✗ コード依存     | なし（第一優先）                                              |
| ✗ 他チケット依存 | なし（並行開発可）                                            |
| ✓ 出力依存       | チケット 020, 080, 090, 100, 110 等（全検索系がブロック解除） |

---

## Todo リスト

### Phase 1: スキーマ設計

- [ ] Era テーブル定義
  - `id (PK)`, `name`, `nameEn`, `startYear`, `endYear`, `parentEraId`, `color`
- [ ] Event テーブル定義
  - `id (PK)`, `title`, `startDate (ISO8601)`, `endDate`, `summary`, `tags`, `importanceLevel (0-3)`, `eraId (FK)`, `source (JSON)`, `relatedPersonIds (JSON)`, `relatedEventIds (JSON)`
- [ ] Person テーブル定義
  - `id (PK)`, `name`, `nameReading`, `birthYear`, `deathYear`, `activeStartYear`, `activeEndYear`, `summary`, `roles (JSON)`, `importanceLevel (0-3)`
- [ ] Reign テーブル定義
  - `id (PK)`, `personId (FK)`, `officeType (enum)`, `startYear`, `endYear`, `ordinal`
- [ ] Relation テーブル定義（イベント間の関連性）
  - `id (PK)`, `eventId1`, `eventId2`, `relationshipType`

### Phase 2: データ準備

- [ ] 時代区分データ作成（15区分）
  - 縄文、弥生、古墳、飛鳥、奈良、平安、鎌倉、室町、戦国、安土桃山、江戸、明治、大正、昭和、平成、令和
- [ ] 主要イベント 800 件 CSV 準備
  - [ ] 各時代平均 50 件
  - [ ] 典拠 100 件分、source フィールド追加
- [ ] 天皇 126 代データ準備
- [ ] 将軍 45 名データ準備（鎌倉/室町/江戸）
- [ ] 主要人物 200-300 名データ準備

### Phase 3: 実装

- [ ] expo-sqlite 初期化コード実装
- [ ] マイグレーションスクリプト作成（テーブル作成）
- [ ] 初期データインポート機能実装
- [ ] バージョニング機構（v1, v2, ...）

### Phase 4: インデックス最適化

- [ ] startYear, endYear インデックス作成
- [ ] name, title フルテキスト検索インデックス
- [ ] 検索クエリ計測・最適化

### Phase 5: API層実装

- [ ] repositories/EraRepository.ts
  - [ ] getAllEras()
  - [ ] getEraByYear(year)
  - [ ] getEraById(id)
- [ ] repositories/EventRepository.ts
  - [ ] getEventsByYear(year)
  - [ ] getEventsByName(name)
  - [ ] getEventById(id)
  - [ ] getEventsByEra(eraId)
  - [ ] getRelatedEvents(eventId)
- [ ] repositories/PersonRepository.ts
  - [ ] getPersonByName(name)
  - [ ] getPersonById(id)
  - [ ] getPersonsByYear(year)
- [ ] repositories/ReignRepository.ts
  - [ ] getReignsByYear(year)
  - [ ] getReignById(id)
  - [ ] getEmperorAtYear(year)
  - [ ] getShogunAtYear(year)

### Phase 6: テスト＆ドキュメント

- [ ] スキーマ検証テスト
- [ ] インポート機能テスト（各テーブル件数確認）
- [ ] クエリ性能計測ドキュメント
- [ ] データ更新フロー（v1.1 以降の版管理）ドキュメント

---

## 実装ガイドライン

### テーブル定義例

```typescript
// Era テーブル
CREATE TABLE IF NOT EXISTS era (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nameEn TEXT,
  startYear INTEGER NOT NULL,
  endYear INTEGER NOT NULL,
  parentEraId TEXT,
  color TEXT,
  FOREIGN KEY (parentEraId) REFERENCES era(id)
);

// Event テーブル（典拠フィールド含む）
CREATE TABLE IF NOT EXISTS event (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  startDate TEXT NOT NULL, -- ISO8601
  endDate TEXT,
  summary TEXT,
  tags TEXT, -- JSON: ["politics", "war", ...]
  importanceLevel INTEGER, -- 0-3
  eraId TEXT NOT NULL,
  source TEXT, -- JSON: {title, page, url}
  relatedPersonIds TEXT, -- JSON array
  relatedEventIds TEXT, -- JSON array
  FOREIGN KEY (eraId) REFERENCES era(id)
);

// インデックス
CREATE INDEX idx_event_startYear ON event(startYear);
CREATE INDEX idx_event_endYear ON event(endYear);
CREATE INDEX idx_event_eraId ON event(eraId);
```

### リポジトリ実装パターン

```typescript
// data/repositories/EventRepository.ts
export async function getEventsByYear(year: number): Promise<Event[]> {
  const db = await openDatabaseAsync("jidaiscope.db");
  const result = await db.getAllAsync<Event>(
    `
    SELECT * FROM event 
    WHERE startYear <= ? AND endYear >= ?
    ORDER BY startYear ASC
  `,
    [year, year],
  );
  return result;
}

export async function searchEventsByName(keyword: string): Promise<Event[]> {
  const db = await openDatabaseAsync("jidaiscope.db");
  const result = await db.getAllAsync<Event>(
    `
    SELECT * FROM event 
    WHERE title LIKE ?
    LIMIT 50
  `,
    [`%${keyword}%`],
  );
  return result;
}
```

### データインポート

```typescript
// scripts/seedDatabase.ts
import { eras, events, persons, reigns } from './data';

export async function seedDatabase() {
  const db = await openDatabaseAsync('jidaiscope.db');

  // Era インサート
  for (const era of eras) {
    await db.runAsync(
      `INSERT OR REPLACE INTO era (id, name, ...) VALUES (?, ?, ...)`,
      [era.id, era.name, ...]
    );
  }

  // Event インサート
  for (const event of events) {
    await db.runAsync(
      `INSERT OR REPLACE INTO event (...) VALUES (...)`,
      [...]
    );
  }
}
```

---

## ファイル構成

```
data/
├── database/
│   ├── migrations.ts       # テーブル作成
│   └── seed.ts            # 初期データインポート
├── repositories/
│   ├── EraRepository.ts
│   ├── EventRepository.ts
│   ├── PersonRepository.ts
│   └── ReignRepository.ts
└── seed/
    ├── eras.json (15項目)
    ├── events.json (800項目)
    ├── persons.json (300項目)
    └── reigns.json (171項目)

types/
├── Era.ts
├── Event.ts
├── Person.ts
└── Reign.ts
```

---

## テスト項目

### Unit テスト

- [ ] getEventsByYear(1868) → 明治時代のイベント取得
- [ ] searchEventsByName("明治維新") → 該当イベント 1件
- [ ] getEmperorAtYear(1868) → 明治天皇
- [ ] getReignsByYear(1850) → 徳川将軍＋天皇

### Performance テスト

| クエリ             | 目標    | 計測方法      |
| ------------------ | ------- | ------------- |
| getEventsByYear    | < 50ms  | RxDB Profiler |
| searchEventsByName | < 100ms | 同上          |
| getEraByYear       | < 10ms  | 同上          |

### データ完全性

- [ ] 時代総数 = 15
- [ ] イベント総数 ≥ 800（典拠 100件含む）
- [ ] 天皇総数 = 126
- [ ] 将軍総数 ≥ 45
- [ ] 重複なし

---

## 注意事項

### データソース

- 時代・年号：文科省教科書基準
- イベント：山川出版社「詳説日本史」
- 天皇・将軍：Wikipedia 正史版

### 典拠対応

- MVP では **100件の主要イベント** に source フィールド設定
- v1.1 で全件対応（段階的）

### オフライン対応

- SQLite はデフォルトオフライン対応
- 全クエリがオフライン環境で動作することを確認

---

## 依存チケット（このチケット完了後）

| チケット            | 理由                    |
| ------------------- | ----------------------- |
| 080: Search Feature | データベース必須        |
| 090: Event Detail   | Event データアクセス    |
| 100: Person Detail  | Person データアクセス   |
| 110: Source Display | Event.source フィールド |
| 130: Bookmarks      | Event/Person ID参照     |

---

## 次のステップ

- ✅ 010 完了 → チケット 020 (State Management) 並行開始可
- ✅ 010 完了 → チケット 080 (Search) ブロック解除
- 📋 データ更新計画（v1.1 での新規イベント追加）ドキュメント化

---

**作成日:** 2025-01-25
**優先度:** P0 - Critical
**推定工数:** 2d
**ステータス:** Not Started
**ブロッカー:** 001 Tech Validation 完了
