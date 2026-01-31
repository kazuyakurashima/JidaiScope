/**
 * Repositories Module - エクスポート
 * Sprint 1: 012 Database Schema & API
 */

// Bookmark Repository
export {
  addBookmark,
  getAllBookmarks,
  getBookmarkById,
  getBookmarkByTarget,
  getBookmarkCount,
  getBookmarksByType,
  isBookmarked,
  removeBookmark,
  removeBookmarkByTarget,
  updateBookmarkNote,
} from './BookmarkRepository';

// Era Repository
export {
  getAllEras,
  getChildEras,
  getEraById,
  getEraByYear,
  getEraCount,
  insertEra,
  insertEras,
} from './EraRepository';

// Event Repository
export {
  getEventById,
  getEventCount,
  getEventsByEra,
  getEventsByImportance,
  getEventsByYear,
  getEventsByYearRange,
  getRelatedEvents,
  insertEvent,
  insertEvents,
  searchEventsByName,
} from './EventRepository';

// Person Repository
export {
  getAllPersons,
  getPersonById,
  getPersonCount,
  getPersonsByRole,
  getPersonsByYear,
  getPersonsByYearRange,
  insertPerson,
  insertPersons,
  searchPersonsByName,
} from './PersonRepository';

// Reign Repository
export {
  getEmperorAtYear,
  getReignById,
  getReignCount,
  getReignsByOfficeType,
  getReignsByPerson,
  getReignsByYear,
  getReignsByYearRange,
  getShogunAtYear,
  insertReign,
  insertReigns,
} from './ReignRepository';

// Wareki Repository (元号マスター)
export {
  getAllWarekiEras,
  getWarekiByName,
  getWarekiByYear,
  getWarekiByPeriod,
  getWarekiCount,
  hasWarekiData,
  insertWarekiEra,
  insertWarekiEras,
  searchWarekiByName,
} from './WarekiRepository';
export type { WarekiEra } from './WarekiRepository';
