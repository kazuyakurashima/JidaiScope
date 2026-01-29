/**
 * Database Seeding Module
 *
 * Loads initial historical data from JSON files into SQLite database.
 * Called on first app launch or when database is empty.
 *
 * ## データ規約
 *
 * ### 進行中在位の終了年 (ONGOING_REIGN_END_YEAR)
 * 現在進行中の在位期間（今上天皇など）は `endYear: 2100` を暫定値として使用。
 * この値は `@/domain/timeline/constants.ts` の `ONGOING_REIGN_END_YEAR` で定義。
 * 関連ファイル: eras.json (era-reiwa), reigns.json (reign-emp-126)
 */

import { getDatabase } from '../database';
import type { PersonRole, OfficeType } from '@/types/database';

// Import seed data
import erasData from './eras.json';
import eventsData from './events.json';
import personsData from './persons.json';
import reignsData from './reigns.json';

// =============================================================================
// Role Mapping: Japanese to PersonRole[]
// =============================================================================

const ROLE_MAPPING: Record<string, PersonRole[]> = {
  // Emperor (在位天皇のみ)
  '天皇': ['emperor'],
  '天皇・上皇': ['emperor'],
  '皇族・天皇': ['emperor'],

  // Imperial family (非天皇)
  '皇族': ['politician'],
  '皇族・摂政': ['politician'],

  // Shogun
  '将軍': ['shogun'],
  '武士・将軍': ['shogun', 'military'],
  '武将・将軍': ['shogun', 'military'],

  // Politicians
  '政治家': ['politician'],
  '貴族': ['politician'],
  '貴族・摂政': ['politician'],
  '貴族・学者': ['politician', 'scholar'],
  '官人': ['politician'],
  '官人・文人': ['politician', 'scholar'],
  '官人・海賊': ['politician', 'other'],
  '公家・政治家': ['politician'],
  '老中': ['politician'],
  '大老': ['politician'],
  '大名': ['politician'],
  '奉行': ['politician'],
  '武将・奉行': ['military', 'politician'],
  '得宗': ['politician'],
  '武士・得宗': ['military', 'politician'],
  '武士・執権': ['military', 'politician'],
  '執権': ['politician'],

  // Military
  '武士': ['military'],
  '武将': ['military'],
  '武士・政治家': ['military', 'politician'],
  '武将・関白': ['military', 'politician'],
  '武将・大名': ['military', 'politician'],
  '軍人': ['military'],
  '軍人・外交官': ['military', 'politician'],
  '志士': ['military', 'politician'],

  // Scholars
  '学者': ['scholar'],
  '僧侶': ['scholar'],
  '思想家': ['scholar'],
  '思想家・教育者': ['scholar'],
  '教育者': ['scholar'],

  // Artists
  '芸術家': ['artist'],
  '作家': ['artist'],
  '女房・作家': ['artist'],
  '画家': ['artist'],

  // Religious
  '宣教師': ['scholar'],
  '宗教指導者': ['scholar'],

  // Other
  '女王': ['other'],
  '外交官': ['politician'],
};

// Track unmapped roles for debugging
const unmappedRoles = new Set<string>();

/**
 * Map Japanese role string to PersonRole array
 */
function mapRoleToPersonRoles(role: string | undefined): PersonRole[] {
  if (!role) return ['other'];
  const mapped = ROLE_MAPPING[role];
  if (!mapped) {
    unmappedRoles.add(role);
    return ['other'];
  }
  return mapped;
}

/**
 * Log any unmapped roles found during seeding
 */
function logUnmappedRoles(): void {
  if (unmappedRoles.size > 0) {
    console.warn('[Seed] Unmapped roles found:', Array.from(unmappedRoles));
  }
}

/**
 * Map reign type to OfficeType
 */
function mapTypeToOfficeType(type: string): OfficeType {
  switch (type) {
    case 'emperor':
      return 'emperor';
    case 'kamakura_shogun':
    case 'muromachi_shogun':
    case 'edo_shogun':
      return 'shogun';
    default:
      return 'other';
  }
}

// =============================================================================
// Database Seeding Functions
// =============================================================================

/**
 * Check if database needs seeding (is empty)
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM era'
  );
  return (result?.count ?? 0) > 0;
}

/**
 * Seed all tables with initial data
 */
export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();

  console.log('[Seed] Starting database seeding...');

  try {
    // Use transaction for better performance and atomicity
    await db.execAsync('BEGIN TRANSACTION');

    // Seed eras
    await seedEras(db);

    // Seed persons (including auto-generated from reigns)
    await seedPersons(db);

    // Seed events
    await seedEvents(db);

    // Seed reigns (emperors and shoguns)
    await seedReigns(db);

    await db.execAsync('COMMIT');

    console.log('[Seed] Database seeding completed successfully');

    // Log stats
    const stats = await getSeedingStats();
    console.log('[Seed] Stats:', stats);
  } catch (error) {
    await db.execAsync('ROLLBACK');
    console.error('[Seed] Database seeding failed:', error);
    throw error;
  }
}

/**
 * Seed era table
 */
async function seedEras(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  console.log(`[Seed] Inserting ${erasData.length} eras...`);

  for (const era of erasData) {
    await db.runAsync(
      `INSERT OR REPLACE INTO era (id, name, nameEn, startYear, endYear, parentEraId, color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      era.id,
      era.name,
      null, // nameEn
      era.startYear,
      era.endYear,
      null, // parentEraId
      era.color
    );
  }

  console.log(`[Seed] Inserted ${erasData.length} eras`);
}

/**
 * Seed person table (including auto-generated from reigns)
 */
async function seedPersons(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  // Build set of existing person IDs from personsData
  const existingPersonIds = new Set(personsData.map((p: { id: string }) => p.id));

  // Collect all personIds from reigns that need to be auto-generated
  const reignPersons: Array<{
    id: string;
    name: string;
    roles: PersonRole[];
  }> = [];

  // Process emperors
  for (const emperor of reignsData.emperors) {
    if (!existingPersonIds.has(emperor.personId)) {
      reignPersons.push({
        id: emperor.personId,
        name: emperor.title,
        roles: ['emperor'],
      });
      existingPersonIds.add(emperor.personId);
    }
  }

  // Process shoguns
  for (const shogun of reignsData.shoguns) {
    if (!existingPersonIds.has(shogun.personId)) {
      reignPersons.push({
        id: shogun.personId,
        name: shogun.title,
        roles: ['shogun', 'military'],
      });
      existingPersonIds.add(shogun.personId);
    }
  }

  const totalPersons = personsData.length + reignPersons.length;
  console.log(`[Seed] Inserting ${totalPersons} persons (${personsData.length} from JSON, ${reignPersons.length} auto-generated from reigns)...`);

  // Insert persons from JSON
  for (const person of personsData as Array<{
    id: string;
    name: string;
    birthYear: number | null;
    deathYear: number | null;
    summary: string;
    role: string;
    importanceLevel: number;
  }>) {
    const roles = mapRoleToPersonRoles(person.role);

    await db.runAsync(
      `INSERT OR REPLACE INTO person (id, name, nameReading, birthYear, deathYear, activeStartYear, activeEndYear, summary, roles, importanceLevel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      person.id,
      person.name,
      null, // nameReading
      person.birthYear,
      person.deathYear,
      null, // activeStartYear
      null, // activeEndYear
      person.summary,
      JSON.stringify(roles),
      person.importanceLevel
    );
  }

  // Insert auto-generated persons from reigns
  for (const person of reignPersons) {
    await db.runAsync(
      `INSERT OR REPLACE INTO person (id, name, nameReading, birthYear, deathYear, activeStartYear, activeEndYear, summary, roles, importanceLevel)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      person.id,
      person.name,
      null, // nameReading
      null, // birthYear
      null, // deathYear
      null, // activeStartYear
      null, // activeEndYear
      null, // summary
      JSON.stringify(person.roles),
      2 // default importanceLevel
    );
  }

  console.log(`[Seed] Inserted ${totalPersons} persons`);

  // Log any unmapped roles for debugging
  logUnmappedRoles();
}

/**
 * Seed event table
 */
async function seedEvents(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  console.log(`[Seed] Inserting ${eventsData.length} events...`);

  for (const event of eventsData as Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string | null;
    summary: string;
    tags: string[];
    importanceLevel: number;
    eraId: string;
    source: { title: string; page?: string; url?: string } | null;
    relatedPersonIds: string[];
    relatedEventIds: string[];
  }>) {
    await db.runAsync(
      `INSERT OR REPLACE INTO event (id, title, startDate, endDate, summary, tags, importanceLevel, eraId, source, relatedPersonIds, relatedEventIds)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.title,
      event.startDate,
      event.endDate,
      event.summary,
      JSON.stringify(event.tags),
      event.importanceLevel,
      event.eraId,
      event.source ? JSON.stringify(event.source) : null,
      JSON.stringify(event.relatedPersonIds),
      JSON.stringify(event.relatedEventIds)
    );
  }

  console.log(`[Seed] Inserted ${eventsData.length} events`);
}

/**
 * Seed reign table (emperors and shoguns)
 */
async function seedReigns(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  const emperors = reignsData.emperors;
  const shoguns = reignsData.shoguns;
  const totalReigns = emperors.length + shoguns.length;

  console.log(`[Seed] Inserting ${totalReigns} reigns (${emperors.length} emperors, ${shoguns.length} shoguns)...`);

  // Insert emperors with ordinal based on array position
  let ordinal = 1;
  for (const emperor of emperors) {
    const officeType = mapTypeToOfficeType(emperor.type);

    await db.runAsync(
      `INSERT OR REPLACE INTO reign (id, personId, officeType, startYear, endYear, ordinal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      emperor.id,
      emperor.personId,
      officeType,
      emperor.startYear,
      emperor.endYear,
      ordinal++
    );
  }

  // Insert shoguns with ordinal based on array position (grouped by bakufu)
  // Kamakura
  ordinal = 1;
  const kamakuraShoguns = shoguns.filter(s => s.type === 'kamakura_shogun');
  for (const shogun of kamakuraShoguns) {
    const officeType = mapTypeToOfficeType(shogun.type);

    await db.runAsync(
      `INSERT OR REPLACE INTO reign (id, personId, officeType, startYear, endYear, ordinal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      shogun.id,
      shogun.personId,
      officeType,
      shogun.startYear,
      shogun.endYear,
      ordinal++
    );
  }

  // Muromachi
  ordinal = 1;
  const muromachiShoguns = shoguns.filter(s => s.type === 'muromachi_shogun');
  for (const shogun of muromachiShoguns) {
    const officeType = mapTypeToOfficeType(shogun.type);

    await db.runAsync(
      `INSERT OR REPLACE INTO reign (id, personId, officeType, startYear, endYear, ordinal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      shogun.id,
      shogun.personId,
      officeType,
      shogun.startYear,
      shogun.endYear,
      ordinal++
    );
  }

  // Edo
  ordinal = 1;
  const edoShoguns = shoguns.filter(s => s.type === 'edo_shogun');
  for (const shogun of edoShoguns) {
    const officeType = mapTypeToOfficeType(shogun.type);

    await db.runAsync(
      `INSERT OR REPLACE INTO reign (id, personId, officeType, startYear, endYear, ordinal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      shogun.id,
      shogun.personId,
      officeType,
      shogun.startYear,
      shogun.endYear,
      ordinal++
    );
  }

  console.log(`[Seed] Inserted ${totalReigns} reigns`);
}

/**
 * Get seeding statistics
 */
export async function getSeedingStats(): Promise<{
  eras: number;
  events: number;
  persons: number;
  reigns: number;
}> {
  const db = await getDatabase();

  const [erasCount, eventsCount, personsCount, reignsCount] = await Promise.all([
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM era'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM event'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM person'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM reign'),
  ]);

  return {
    eras: erasCount?.count ?? 0,
    events: eventsCount?.count ?? 0,
    persons: personsCount?.count ?? 0,
    reigns: reignsCount?.count ?? 0,
  };
}
