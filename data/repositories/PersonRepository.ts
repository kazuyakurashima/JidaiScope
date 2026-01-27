/**
 * Person Repository - 人物データアクセス
 * Sprint 1: 012 Database Schema & API
 */

import type { ImportanceLevel, Person, PersonRole, PersonRow } from '@/types/database';

import { getDatabase } from '../database';

/**
 * Row → Entity 変換
 */
function parsePersonRow(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    nameReading: row.nameReading,
    birthYear: row.birthYear,
    deathYear: row.deathYear,
    activeStartYear: row.activeStartYear,
    activeEndYear: row.activeEndYear,
    summary: row.summary,
    roles: JSON.parse(row.roles || '[]') as PersonRole[],
    importanceLevel: row.importanceLevel as ImportanceLevel,
  };
}

/**
 * ID で人物を取得
 */
export async function getPersonById(id: string): Promise<Person | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PersonRow>(
    'SELECT * FROM person WHERE id = ?',
    id
  );
  return row ? parsePersonRow(row) : null;
}

/**
 * 名前で人物を検索
 */
export async function searchPersonsByName(keyword: string): Promise<Person[]> {
  const db = await getDatabase();
  const searchTerm = `%${keyword}%`;
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT * FROM person
     WHERE name LIKE ? OR nameReading LIKE ?
     ORDER BY importanceLevel DESC, name ASC
     LIMIT 100`,
    searchTerm,
    searchTerm
  );
  return rows.map(parsePersonRow);
}

/**
 * 指定年に活動していた人物を取得
 */
export async function getPersonsByYear(year: number): Promise<Person[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT * FROM person
     WHERE (birthYear IS NULL OR birthYear <= ?)
     AND (deathYear IS NULL OR deathYear >= ?)
     ORDER BY importanceLevel DESC, name ASC`,
    year,
    year
  );
  return rows.map(parsePersonRow);
}

/**
 * 指定年範囲で活動していた人物を取得
 */
export async function getPersonsByYearRange(
  startYear: number,
  endYear: number
): Promise<Person[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT * FROM person
     WHERE (activeStartYear IS NULL OR activeStartYear <= ?)
     AND (activeEndYear IS NULL OR activeEndYear >= ?)
     ORDER BY importanceLevel DESC, activeStartYear ASC`,
    endYear,
    startYear
  );
  return rows.map(parsePersonRow);
}

/**
 * 役割で人物を取得
 */
export async function getPersonsByRole(role: PersonRole): Promise<Person[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PersonRow>(
    `SELECT * FROM person
     WHERE roles LIKE ?
     ORDER BY importanceLevel DESC, name ASC`,
    `%"${role}"%`
  );
  return rows.map(parsePersonRow);
}

/**
 * 全人物を取得
 */
export async function getAllPersons(): Promise<Person[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PersonRow>(
    'SELECT * FROM person ORDER BY importanceLevel DESC, name ASC'
  );
  return rows.map(parsePersonRow);
}

/**
 * 人物を挿入
 */
export async function insertPerson(person: Person): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO person
     (id, name, nameReading, birthYear, deathYear, activeStartYear, activeEndYear, summary, roles, importanceLevel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    person.id,
    person.name,
    person.nameReading,
    person.birthYear,
    person.deathYear,
    person.activeStartYear,
    person.activeEndYear,
    person.summary,
    JSON.stringify(person.roles),
    person.importanceLevel
  );
}

/**
 * 複数の人物を一括挿入
 */
export async function insertPersons(persons: Person[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const person of persons) {
      await db.runAsync(
        `INSERT OR REPLACE INTO person
         (id, name, nameReading, birthYear, deathYear, activeStartYear, activeEndYear, summary, roles, importanceLevel)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        person.id,
        person.name,
        person.nameReading,
        person.birthYear,
        person.deathYear,
        person.activeStartYear,
        person.activeEndYear,
        person.summary,
        JSON.stringify(person.roles),
        person.importanceLevel
      );
    }
  });
}

/**
 * 人物の件数を取得
 */
export async function getPersonCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM person'
  );
  return result?.count ?? 0;
}
