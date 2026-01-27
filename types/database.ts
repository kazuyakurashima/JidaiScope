/**
 * Database Types - SQLite テーブル型定義
 * Sprint 1: 012 Database Schema & API
 */

// =============================================================================
// Era（時代）
// =============================================================================

export interface Era {
  id: string;
  name: string;
  nameEn: string | null;
  startYear: number;
  endYear: number;
  parentEraId: string | null;
  color: string | null;
}

export interface EraRow {
  id: string;
  name: string;
  nameEn: string | null;
  startYear: number;
  endYear: number;
  parentEraId: string | null;
  color: string | null;
}

// =============================================================================
// Event（イベント・事件）
// =============================================================================

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
  startDate: string; // YYYY-MM-DD or YYYY
  endDate: string | null;
  summary: string | null;
  tags: EventTag[];
  importanceLevel: ImportanceLevel;
  eraId: string;
  source: EventSource | null;
  relatedPersonIds: string[];
  relatedEventIds: string[];
}

export interface EventRow {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  summary: string | null;
  tags: string; // JSON string
  importanceLevel: number;
  eraId: string;
  source: string | null; // JSON string
  relatedPersonIds: string; // JSON string
  relatedEventIds: string; // JSON string
}

// =============================================================================
// Person（人物）
// =============================================================================

export type PersonRole = 'emperor' | 'shogun' | 'politician' | 'military' | 'scholar' | 'artist' | 'other';

export interface Person {
  id: string;
  name: string;
  nameReading: string | null;
  birthYear: number | null;
  deathYear: number | null;
  activeStartYear: number | null;
  activeEndYear: number | null;
  summary: string | null;
  roles: PersonRole[];
  importanceLevel: ImportanceLevel;
}

export interface PersonRow {
  id: string;
  name: string;
  nameReading: string | null;
  birthYear: number | null;
  deathYear: number | null;
  activeStartYear: number | null;
  activeEndYear: number | null;
  summary: string | null;
  roles: string; // JSON string
  importanceLevel: number;
}

// =============================================================================
// Reign（在位・治世）
// =============================================================================

export type OfficeType = 'emperor' | 'shogun' | 'regent' | 'other';

export interface Reign {
  id: string;
  personId: string;
  officeType: OfficeType;
  startYear: number;
  endYear: number;
  ordinal: number | null;
}

export interface ReignRow {
  id: string;
  personId: string;
  officeType: string;
  startYear: number;
  endYear: number;
  ordinal: number | null;
}

// =============================================================================
// Bookmark（ブックマーク）
// =============================================================================

export type BookmarkTargetType = 'event' | 'person' | 'era';

export interface Bookmark {
  id: string;
  targetType: BookmarkTargetType;
  targetId: string;
  createdAt: string; // ISO 8601
  note: string | null;
}

export interface BookmarkRow {
  id: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  note: string | null;
}

// =============================================================================
// Database Version
// =============================================================================

export interface DbVersion {
  version: number;
  appliedAt: string;
}
