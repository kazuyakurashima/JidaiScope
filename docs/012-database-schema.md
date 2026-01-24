# 012: Database Schema & API（Sprint 1）

## 概要

**目的:** SQLite データベースのスキーマ設計と Repository 層を実装し、アプリ全体のデータアクセス基盤を構築

**スコープ:**

- SQLite テーブル定義（Era, Event, Person, Reign）
- マイグレーションスクリプト
- Repository 層（データアクセス API）
- インデックス最適化
- TypeScript 型定義

**成功基準:**

- ✅ 全テーブル作成完了
- ✅ Repository API が動作
- ✅ クエリ < 100ms
- ✅ オフライン環境で完全動作

**注意:** データ準備（実際のイベント・人物データ）は 013 で行う

---

## ユーザーストーリー

```
As a アプリ開発者
I want to SQLite でデータを効率的に管理したい
So that 高速で信頼性の高い検索・表示ができる
```

---

## 受け入れ条件

| #   | 条件                                             | 検証方法                     | 担当 |
| --- | ------------------------------------------------ | ---------------------------- | ---- |
| 1   | Era テーブル定義完了                             | SQLite で確認                | -    |
| 2   | Event テーブル定義完了（sourceフィールド含む）   | SQLite で確認                | -    |
| 3   | Person テーブル定義完了                          | SQLite で確認                | -    |
| 4   | Reign テーブル定義完了                           | SQLite で確認                | -    |
| 5   | 全 Repository API が動作                         | ユニットテスト               | -    |
| 6   | インデックス設定完了                             | EXPLAIN QUERY PLAN で確認    | -    |

---

## 依存関係

| 種類             | 詳細                                                    |
| ---------------- | ------------------------------------------------------- |
| ✓ 入力依存       | 001 Tech Validation 完了                                |
| ✗ コード依存     | なし（第一優先）                                        |
| ✗ 他チケット依存 | なし                                                    |
| ✓ 出力依存       | 013, 020, 030, 031, 032, 033, 034 がブロック解除      |

---

## Todo リスト

### Phase 1: スキーマ設計

- [ ] Era テーブル定義
- [ ] Event テーブル定義（source フィールド含む）
- [ ] Person テーブル定義
- [ ] Reign テーブル定義

### Phase 2: TypeScript 型定義

- [ ] types/Era.ts
- [ ] types/Event.ts
- [ ] types/Person.ts
- [ ] types/Reign.ts

### Phase 3: マイグレーション実装

- [ ] data/database/migrations.ts
- [ ] テーブル作成スクリプト
- [ ] バージョニング機構

### Phase 4: Repository 層実装

- [ ] EraRepository.ts
  - [ ] getAllEras()
  - [ ] getEraByYear(year)
  - [ ] getEraById(id)
- [ ] EventRepository.ts
  - [ ] getEventsByYear(year)
  - [ ] getEventsByEra(eraId)
  - [ ] getEventById(id)
  - [ ] searchEventsByName(keyword)
- [ ] PersonRepository.ts
  - [ ] getPersonById(id)
  - [ ] searchPersonsByName(keyword)
  - [ ] getPersonsByYear(year)
- [ ] ReignRepository.ts
  - [ ] getReignsByYear(year)
  - [ ] getEmperorAtYear(year)
  - [ ] getShogunAtYear(year)

### Phase 5: インデックス最適化

- [ ] startYear, endYear インデックス
- [ ] name, title フルテキスト検索インデックス
- [ ] クエリ性能計測

### Phase 6: テスト

- [ ] Repository API ユニットテスト
- [ ] クエリ性能テスト（< 100ms）

---

## 実装ガイドライン

### テーブル定義

```sql
-- Era テーブル
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

-- Event テーブル
CREATE TABLE IF NOT EXISTS event (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT,
  summary TEXT,
  tags TEXT,
  importanceLevel INTEGER DEFAULT 1,
  eraId TEXT NOT NULL,
  source TEXT,
  relatedPersonIds TEXT,
  relatedEventIds TEXT,
  FOREIGN KEY (eraId) REFERENCES era(id)
);

-- Person テーブル
CREATE TABLE IF NOT EXISTS person (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nameReading TEXT,
  birthYear INTEGER,
  deathYear INTEGER,
  activeStartYear INTEGER,
  activeEndYear INTEGER,
  summary TEXT,
  roles TEXT,
  importanceLevel INTEGER DEFAULT 1
);

-- Reign テーブル
CREATE TABLE IF NOT EXISTS reign (
  id TEXT PRIMARY KEY,
  personId TEXT NOT NULL,
  officeType TEXT NOT NULL,
  startYear INTEGER NOT NULL,
  endYear INTEGER NOT NULL,
  ordinal INTEGER,
  FOREIGN KEY (personId) REFERENCES person(id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_event_startDate ON event(startDate);
CREATE INDEX IF NOT EXISTS idx_event_eraId ON event(eraId);
CREATE INDEX IF NOT EXISTS idx_event_title ON event(title);
CREATE INDEX IF NOT EXISTS idx_person_name ON person(name);
CREATE INDEX IF NOT EXISTS idx_reign_year ON reign(startYear, endYear);
```

### TypeScript 型定義

```typescript
// types/Event.ts
export interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  summary: string;
  tags: ('politics' | 'war' | 'culture' | 'diplomacy')[];
  importanceLevel: 0 | 1 | 2 | 3;
  eraId: string;
  source?: {
    title: string;
    page?: string;
    url?: string;
  };
  relatedPersonIds: string[];
  relatedEventIds: string[];
}
```

### Repository パターン

```typescript
// data/repositories/EventRepository.ts
import { openDatabaseAsync } from 'expo-sqlite';
import type { Event } from '@/types/Event';

const DB_NAME = 'jidaiscope.db';

export async function getEventsByYear(year: number): Promise<Event[]> {
  const db = await openDatabaseAsync(DB_NAME);
  const result = await db.getAllAsync<Event>(
    `SELECT * FROM event
     WHERE substr(startDate, 1, 4) <= ?
     AND (endDate IS NULL OR substr(endDate, 1, 4) >= ?)
     ORDER BY startDate ASC`,
    [String(year), String(year)]
  );
  return result.map(parseEventRow);
}

function parseEventRow(row: any): Event {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    source: row.source ? JSON.parse(row.source) : undefined,
    relatedPersonIds: JSON.parse(row.relatedPersonIds || '[]'),
    relatedEventIds: JSON.parse(row.relatedEventIds || '[]'),
  };
}
```

---

## ファイル構成

```
types/
├── Era.ts
├── Event.ts
├── Person.ts
└── Reign.ts

data/
├── database/
│   ├── connection.ts      # DB接続管理
│   └── migrations.ts      # テーブル作成
└── repositories/
    ├── EraRepository.ts
    ├── EventRepository.ts
    ├── PersonRepository.ts
    └── ReignRepository.ts
```

---

## テスト項目

| テスト             | 目標    |
| ------------------ | ------- |
| getEventsByYear    | < 50ms  |
| searchEventsByName | < 100ms |
| getEraByYear       | < 10ms  |
| Repository API     | 全て成功 |

---

**作成日:** 2025-01-25
**優先度:** P0 - Critical
**推定工数:** 1.5d
**ステータス:** Not Started
**ブロッカー:** 001 完了
