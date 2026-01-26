/**
 * mockEvents.ts - Sprint 0 Day 3 PoC
 *
 * 密集描画検証用モックデータ
 *
 * 検証項目:
 * - 受け入れ条件 #4: 50events/10yr 密度での描画パフォーマンス
 * - メモリ使用量 < 150MB
 *
 * データ構成:
 * - 通常イベント: 約350件（時代別分布）
 * - 密集テスト期間 (1850-1920): 350件（50events/10yr × 7 decades）
 * - 合計: 約700件
 */

// 時代定義（年代範囲付き）
export interface Era {
  id: string;
  name: string;
  nameJa: string;
  startYear: number;
  endYear: number;
  color: string;
}

// イベント定義
export interface HistoricalEvent {
  id: string;
  year: number;
  title: string;
  titleJa: string;
  eraId: string;
  importance: 'major' | 'medium' | 'minor';
  category: 'political' | 'cultural' | 'military' | 'economic' | 'social';
}

// 時代データ（PRD セクション 11.2 準拠）
export const ERAS: Era[] = [
  { id: 'jomon', name: 'Jomon', nameJa: '縄文', startYear: -14000, endYear: -300, color: '#8B7355' },
  { id: 'yayoi', name: 'Yayoi', nameJa: '弥生', startYear: -300, endYear: 300, color: '#D4A574' },
  { id: 'kofun', name: 'Kofun', nameJa: '古墳', startYear: 300, endYear: 538, color: '#B8860B' },
  { id: 'asuka', name: 'Asuka', nameJa: '飛鳥', startYear: 538, endYear: 710, color: '#CD853F' },
  { id: 'nara', name: 'Nara', nameJa: '奈良', startYear: 710, endYear: 794, color: '#DAA520' },
  { id: 'heian', name: 'Heian', nameJa: '平安', startYear: 794, endYear: 1185, color: '#9370DB' },
  { id: 'kamakura', name: 'Kamakura', nameJa: '鎌倉', startYear: 1185, endYear: 1333, color: '#4682B4' },
  { id: 'muromachi', name: 'Muromachi', nameJa: '室町', startYear: 1336, endYear: 1573, color: '#6B8E23' },
  { id: 'sengoku', name: 'Sengoku', nameJa: '戦国', startYear: 1467, endYear: 1615, color: '#DC143C' },
  { id: 'edo', name: 'Edo', nameJa: '江戸', startYear: 1603, endYear: 1868, color: '#4169E1' },
  { id: 'meiji', name: 'Meiji', nameJa: '明治', startYear: 1868, endYear: 1912, color: '#228B22' },
  { id: 'taisho', name: 'Taisho', nameJa: '大正', startYear: 1912, endYear: 1926, color: '#9932CC' },
  { id: 'showa', name: 'Showa', nameJa: '昭和', startYear: 1926, endYear: 1989, color: '#1E90FF' },
  { id: 'heisei', name: 'Heisei', nameJa: '平成', startYear: 1989, endYear: 2019, color: '#FF69B4' },
  { id: 'reiwa', name: 'Reiwa', nameJa: '令和', startYear: 2019, endYear: 2030, color: '#00CED1' },
];

// 重要度の分布（major: 10%, medium: 30%, minor: 60%）
const IMPORTANCE_DISTRIBUTION: Array<'major' | 'medium' | 'minor'> = [
  'major', // 10%
  'medium', 'medium', 'medium', // 30%
  'minor', 'minor', 'minor', 'minor', 'minor', 'minor', // 60%
];

// カテゴリの分布
const CATEGORIES: Array<'political' | 'cultural' | 'military' | 'economic' | 'social'> = [
  'political', 'cultural', 'military', 'economic', 'social',
];

// イベントタイトルテンプレート
const EVENT_TEMPLATES = {
  political: ['Reform', 'Edict', 'Treaty', 'Law', 'Constitution'],
  cultural: ['Festival', 'Art', 'Literature', 'Temple', 'Shrine'],
  military: ['Battle', 'War', 'Rebellion', 'Siege', 'Campaign'],
  economic: ['Trade', 'Currency', 'Tax', 'Commerce', 'Industry'],
  social: ['Movement', 'Reform', 'Migration', 'Education', 'Health'],
};

const EVENT_TEMPLATES_JA = {
  political: ['改革', '令', '条約', '法', '憲法'],
  cultural: ['祭', '美術', '文学', '寺院', '神社'],
  military: ['戦い', '戦争', '乱', '包囲', '遠征'],
  economic: ['貿易', '通貨', '税', '商業', '産業'],
  social: ['運動', '改革', '移住', '教育', '衛生'],
};

/**
 * モックイベントを生成
 *
 * 分布:
 * - 縄文〜弥生（古代前期）: 20件（データが少ない）
 * - 古墳〜奈良（古代後期）: 45件
 * - 平安（中世前期）: 40件
 * - 鎌倉〜室町（中世後期）: 50件
 * - 戦国〜江戸（近世）: 100件
 * - 明治〜令和（近現代）: 95件
 * - 密集テスト期間 (1850-1920): 350件（50events/10yr × 7 decades）
 *
 * 合計: 約700件（密集テスト期間含む）
 *
 * 密集描画検証要件:
 * - 受け入れ条件 #4: 50events/10yr 密度での描画パフォーマンス
 * - 検証期間: 1850-1920（明治維新前後の激動期）
 */
function generateMockEvents(): HistoricalEvent[] {
  const events: HistoricalEvent[] = [];
  let eventId = 1;

  // 時代別のイベント数（通常分布）
  const eraEventCounts: Record<string, number> = {
    jomon: 10,
    yayoi: 10,
    kofun: 15,
    asuka: 15,
    nara: 15,
    heian: 40,
    kamakura: 25,
    muromachi: 25,
    sengoku: 40,
    edo: 60,
    meiji: 40,
    taisho: 15,
    showa: 25,
    heisei: 10,
    reiwa: 5,
  };

  // 通常のイベント生成
  for (const era of ERAS) {
    const count = eraEventCounts[era.id] || 10;
    const yearRange = era.endYear - era.startYear;

    for (let i = 0; i < count; i++) {
      // 年代をランダムに分布（時代内で均等）
      const year = era.startYear + Math.floor((yearRange * i) / count) + Math.floor(Math.random() * (yearRange / count));

      // 重要度をランダムに選択（分布に従う）
      const importance = IMPORTANCE_DISTRIBUTION[Math.floor(Math.random() * IMPORTANCE_DISTRIBUTION.length)];

      // カテゴリをランダムに選択
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

      // タイトル生成
      const templateIndex = Math.floor(Math.random() * EVENT_TEMPLATES[category].length);
      const title = `${era.name} ${EVENT_TEMPLATES[category][templateIndex]} ${i + 1}`;
      const titleJa = `${era.nameJa}${EVENT_TEMPLATES_JA[category][templateIndex]}${i + 1}`;

      events.push({
        id: `event-${eventId++}`,
        year: Math.min(Math.max(year, era.startYear), era.endYear - 1),
        title,
        titleJa,
        eraId: era.id,
        importance,
        category,
      });
    }
  }

  // 密集テスト期間 (1850-1920): 50events/10yr × 7 decades = 350件
  // 受け入れ条件 #4 の検証用
  const DENSE_START = 1850;
  const DENSE_END = 1920;
  const EVENTS_PER_DECADE = 50;

  for (let decade = DENSE_START; decade < DENSE_END; decade += 10) {
    for (let i = 0; i < EVENTS_PER_DECADE; i++) {
      // 10年間で均等に分布
      const year = decade + Math.floor((10 * i) / EVENTS_PER_DECADE) + Math.floor(Math.random() * (10 / EVENTS_PER_DECADE));

      const importance = IMPORTANCE_DISTRIBUTION[Math.floor(Math.random() * IMPORTANCE_DISTRIBUTION.length)];
      const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

      // 時代判定（年から時代を特定）
      const era = ERAS.find(e => year >= e.startYear && year < e.endYear) || ERAS[10]; // fallback: meiji

      const templateIndex = Math.floor(Math.random() * EVENT_TEMPLATES[category].length);
      const title = `Dense ${EVENT_TEMPLATES[category][templateIndex]} ${decade}-${i + 1}`;
      const titleJa = `密集${EVENT_TEMPLATES_JA[category][templateIndex]}${decade}-${i + 1}`;

      events.push({
        id: `event-dense-${eventId++}`,
        year: Math.min(Math.max(year, DENSE_START), DENSE_END - 1),
        title,
        titleJa,
        eraId: era.id,
        importance,
        category,
      });
    }
  }

  // 年代順にソート
  events.sort((a, b) => a.year - b.year);

  return events;
}

// 350件のモックイベント（キャッシュ）
export const MOCK_EVENTS = generateMockEvents();

// 統計情報
export const EVENT_STATS = {
  total: MOCK_EVENTS.length,
  byImportance: {
    major: MOCK_EVENTS.filter(e => e.importance === 'major').length,
    medium: MOCK_EVENTS.filter(e => e.importance === 'medium').length,
    minor: MOCK_EVENTS.filter(e => e.importance === 'minor').length,
  },
  byCategory: CATEGORIES.reduce((acc, cat) => {
    acc[cat] = MOCK_EVENTS.filter(e => e.category === cat).length;
    return acc;
  }, {} as Record<string, number>),
  byEra: ERAS.reduce((acc, era) => {
    acc[era.id] = MOCK_EVENTS.filter(e => e.eraId === era.id).length;
    return acc;
  }, {} as Record<string, number>),
};

/**
 * 指定範囲のイベントを取得（ビューポート最適化用）
 */
export function getEventsInRange(startYear: number, endYear: number): HistoricalEvent[] {
  return MOCK_EVENTS.filter(e => e.year >= startYear && e.year <= endYear);
}

/**
 * 指定時代のイベントを取得
 */
export function getEventsByEra(eraId: string): HistoricalEvent[] {
  return MOCK_EVENTS.filter(e => e.eraId === eraId);
}

/**
 * 年をX座標に変換（タイムライン描画用）
 * @param year 年
 * @param timelineWidth タイムライン幅
 * @param startYear 表示開始年（デフォルト: 紀元前300年）
 * @param endYear 表示終了年（デフォルト: 2030年）
 */
export function yearToX(
  year: number,
  timelineWidth: number,
  startYear = -300,
  endYear = 2030
): number {
  const totalYears = endYear - startYear;
  const relativeYear = year - startYear;
  return (relativeYear / totalYears) * timelineWidth;
}

/**
 * X座標を年に変換
 */
export function xToYear(
  x: number,
  timelineWidth: number,
  startYear = -300,
  endYear = 2030
): number {
  const totalYears = endYear - startYear;
  const relativeX = x / timelineWidth;
  return Math.round(startYear + relativeX * totalYears);
}

/**
 * 密集描画要件の検証（50events/10yr）
 * 1850-1920 の各10年間で50件以上のイベントがあるか確認
 */
export function validateDenseDataRequirement(): {
  valid: boolean;
  details: Array<{ decade: number; count: number; pass: boolean }>;
} {
  const details: Array<{ decade: number; count: number; pass: boolean }> = [];

  for (let decade = 1850; decade < 1920; decade += 10) {
    const count = MOCK_EVENTS.filter(
      e => e.year >= decade && e.year < decade + 10
    ).length;
    details.push({
      decade,
      count,
      pass: count >= 50,
    });
  }

  const valid = details.every(d => d.pass);
  return { valid, details };
}

// 密集描画要件の統計
export const DENSE_STATS = validateDenseDataRequirement();

export default {
  ERAS,
  MOCK_EVENTS,
  EVENT_STATS,
  DENSE_STATS,
  getEventsInRange,
  getEventsByEra,
  yearToX,
  xToYear,
  validateDenseDataRequirement,
};
