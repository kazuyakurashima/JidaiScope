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
- ⏳ Repository API が動作（013 完了後にユニットテストで検証）
- ⏳ クエリ < 100ms（013 完了後に検証）
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
| 5   | 全 Repository API が動作                         | ユニットテスト（013 完了後） | -    |
| 6   | インデックス設定完了（FTS5 は v1.1）             | EXPLAIN QUERY PLAN で確認    | -    |

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

- [x] Era テーブル定義
- [x] Event テーブル定義（source フィールド含む）
- [x] Person テーブル定義
- [x] Reign テーブル定義

### Phase 2: TypeScript 型定義

- [x] types/database.ts（Era, Event, Person, Reign, Bookmark 統合）

### Phase 3: マイグレーション実装

- [x] data/database/migrations.ts
- [x] テーブル作成スクリプト
- [x] バージョニング機構

### Phase 4: Repository 層実装

- [x] EraRepository.ts
  - [x] getAllEras()
  - [x] getEraByYear(year)
  - [x] getEraById(id)
- [x] EventRepository.ts
  - [x] getEventsByYear(year)
  - [x] getEventsByEra(eraId)
  - [x] getEventById(id)
  - [x] searchEventsByName(keyword)
- [x] PersonRepository.ts
  - [x] getPersonById(id)
  - [x] searchPersonsByName(keyword)
  - [x] getPersonsByYear(year)
- [x] ReignRepository.ts
  - [x] getReignsByYear(year)
  - [x] getEmperorAtYear(year)
  - [x] getShogunAtYear(year)

### Phase 5: インデックス最適化

- [x] startYear, endYear インデックス
- [x] name, title インデックス（LIKE 検索用、FTS5 は v1.1 で導入予定）
- [ ] クエリ性能計測（013 完了後に実施）

### Phase 6: テスト

- [ ] Repository API ユニットテスト（013 完了後に実施）
- [ ] クエリ性能テスト（< 100ms）（013 完了後に実施）

> **Note:** MVP では LIKE 検索（800件程度なら十分な性能）。FTS5 は v1.1 で検討。

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
  tags TEXT DEFAULT '[]',
  importanceLevel INTEGER DEFAULT 1,
  eraId TEXT NOT NULL,
  source TEXT,
  relatedPersonIds TEXT DEFAULT '[]',
  relatedEventIds TEXT DEFAULT '[]',
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
  roles TEXT DEFAULT '[]',
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

-- Bookmark テーブル（V1で作成、V2でtitle列+UNIQUE制約追加）
CREATE TABLE IF NOT EXISTS bookmark (
  id TEXT PRIMARY KEY,
  targetType TEXT NOT NULL,          -- 'event' | 'person'
  targetId TEXT NOT NULL,
  title TEXT,                         -- V2で追加: スナップショット用キャッシュ
  createdAt TEXT NOT NULL,           -- ISO8601
  note TEXT,                          -- ユーザーメモ（オプション）
  UNIQUE(targetType, targetId)        -- V2で追加
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_event_startDate ON event(startDate);
CREATE INDEX IF NOT EXISTS idx_event_eraId ON event(eraId);
CREATE INDEX IF NOT EXISTS idx_event_title ON event(title);
CREATE INDEX IF NOT EXISTS idx_person_name ON person(name);
CREATE INDEX IF NOT EXISTS idx_reign_year ON reign(startYear, endYear);
CREATE INDEX IF NOT EXISTS idx_bookmark_target ON bookmark(targetType, targetId);
```

### TypeScript 型定義

```typescript
// types/database.ts
export type EventTag = 'politics' | 'war' | 'culture' | 'diplomacy' | 'economy' | 'social';
export type ImportanceLevel = 0 | 1 | 2 | 3;

export interface EventSource {
  title: string;
  page?: string;
  url?: string;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  startDate: string;           // YYYY-MM-DD or YYYY
  endDate: string | null;
  summary: string | null;
  tags: EventTag[];
  importanceLevel: ImportanceLevel;
  eraId: string;
  source: EventSource | null;
  relatedPersonIds: string[];
  relatedEventIds: string[];
}
```

### Repository パターン

```typescript
// data/repositories/EventRepository.ts
import type { EventRow, HistoricalEvent } from '@/types/database';
import { getDatabase } from '../database';

function parseEventRow(row: EventRow): HistoricalEvent {
  return {
    id: row.id,
    title: row.title,
    startDate: row.startDate,
    endDate: row.endDate,
    summary: row.summary,
    tags: JSON.parse(row.tags || '[]'),
    importanceLevel: row.importanceLevel,
    eraId: row.eraId,
    source: row.source ? JSON.parse(row.source) : null,
    relatedPersonIds: JSON.parse(row.relatedPersonIds || '[]'),
    relatedEventIds: JSON.parse(row.relatedEventIds || '[]'),
  };
}

export async function getEventsByYear(year: number): Promise<HistoricalEvent[]> {
  const db = await getDatabase();
  const yearStr = String(year);
  const rows = await db.getAllAsync<EventRow>(
    `SELECT * FROM event
     WHERE substr(startDate, 1, 4) <= ?
     AND (endDate IS NULL OR substr(endDate, 1, 4) >= ?)
     ORDER BY startDate ASC`,
    yearStr,
    yearStr
  );
  return rows.map(parseEventRow);
}
```

---

## DB 初期化の待機方法

DB アクセスを行う画面では `useIsDbReady()` で初期化完了を確認してください。

```tsx
import { useEffect, useState } from 'react';
import { useIsDbReady } from '@/stores';
import { getEventsByYear } from '@/data/repositories';
import type { HistoricalEvent } from '@/types/database';

function MyScreen() {
  const dbReady = useIsDbReady();
  const [events, setEvents] = useState<HistoricalEvent[]>([]);

  useEffect(() => {
    if (!dbReady) return;

    getEventsByYear(1600).then(setEvents);
  }, [dbReady]);

  if (!dbReady) {
    return <LoadingIndicator />;
  }

  return <EventList events={events} />;
}
```

> **Note:** `dbReady` フラグは `_layout.tsx` で `initializeDatabase()` 完了後に `true` に設定されます。

---

## ファイル構成

```
types/
└── database.ts           # Era, Event, Person, Reign, Bookmark 型定義

data/
├── index.ts              # エクスポート
├── database/
│   ├── index.ts          # エクスポート
│   ├── connection.ts     # DB接続管理（シングルトン）
│   └── migrations.ts     # テーブル作成・インデックス
└── repositories/
    ├── index.ts          # エクスポート
    ├── EraRepository.ts
    ├── EventRepository.ts
    ├── PersonRepository.ts
    ├── ReignRepository.ts
    └── BookmarkRepository.ts
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
**ステータス:** Complete（テスト検証は 013 完了後）
**ブロッカー:** 001 完了
