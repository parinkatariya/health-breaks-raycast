import { LocalStorage } from "@raycast/api";

export interface BreakRecord {
  id: string;
  type: string;
  timestamp: number;
  duration?: number; // in seconds
  notes?: string;
}

export interface BreakStats {
  totalBreaks: number;
  breaksByType: Record<string, number>;
  breaksToday: number;
  breaksThisWeek: number;
  averageBreaksPerDay: number;
  lastBreakTime?: number;
  streakDays: number;
}

const STORAGE_KEYS = {
  BREAKS: "health-breaks-records",
  LAST_REMINDER: "last-reminder-time",
  SETTINGS: "health-breaks-settings",
  STATS_CACHE: "health-breaks-stats-cache",
  STATS_CACHE_TIMESTAMP: "health-breaks-stats-cache-timestamp",
} as const;

// In-memory cache for performance
let breaksCache: BreakRecord[] | null = null;
let breaksCacheTimestamp: number = 0;
let statsCache: BreakStats | null = null;
let statsCacheTimestamp: number = 0;
const CACHE_TTL = 1000; // 1 second cache TTL

/**
 * Invalidate caches when data changes
 */
function invalidateCaches(): void {
  breaksCache = null;
  breaksCacheTimestamp = 0;
  statsCache = null;
  statsCacheTimestamp = 0;
}

export async function saveBreak(breakRecord: BreakRecord): Promise<void> {
  const existingBreaks = await getBreaks();
  existingBreaks.push(breakRecord);
  await LocalStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(existingBreaks));
  // Update cache
  breaksCache = existingBreaks;
  breaksCacheTimestamp = Date.now();
  // Invalidate stats cache
  invalidateCaches();
}

export async function getBreaks(): Promise<BreakRecord[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (breaksCache && (now - breaksCacheTimestamp) < CACHE_TTL) {
    return breaksCache;
  }

  const data = await LocalStorage.getItem<string>(STORAGE_KEYS.BREAKS);
  if (!data) {
    breaksCache = [];
    breaksCacheTimestamp = now;
    return [];
  }
  
  try {
    const parsed = JSON.parse(data) as BreakRecord[];
    breaksCache = parsed;
    breaksCacheTimestamp = now;
    return parsed;
  } catch {
    breaksCache = [];
    breaksCacheTimestamp = now;
    return [];
  }
}

export async function getBreaksByDateRange(startDate: Date, endDate: Date): Promise<BreakRecord[]> {
  const allBreaks = await getBreaks();
  const start = startDate.getTime();
  const end = endDate.getTime();
  
  // Optimize: early exit for empty arrays
  if (allBreaks.length === 0) return [];
  
  // Use binary search for large datasets (if sorted)
  // For now, simple filter is fast enough for typical use cases
  const result: BreakRecord[] = [];
  for (const breakRecord of allBreaks) {
    if (breakRecord.timestamp >= start && breakRecord.timestamp <= end) {
      result.push(breakRecord);
    }
  }
  return result;
}

/**
 * Optimized date key generation - cached for performance
 */
const dateKeyCache = new Map<number, string>();
function getDateKey(timestamp: number): string {
  if (dateKeyCache.has(timestamp)) {
    return dateKeyCache.get(timestamp)!;
  }
  const date = new Date(timestamp);
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  dateKeyCache.set(timestamp, key);
  return key;
}

/**
 * Clear date key cache periodically to prevent memory leaks
 */
function clearDateKeyCache(): void {
  if (dateKeyCache.size > 1000) {
    dateKeyCache.clear();
  }
}

export async function getBreakStats(): Promise<BreakStats> {
  const now = Date.now();
  
  // Return cached stats if still valid (1 second TTL)
  if (statsCache && (now - statsCacheTimestamp) < CACHE_TTL) {
    return statsCache;
  }

  const allBreaks = await getBreaks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoTime = weekAgo.getTime();

  // Optimize: single pass for filtering and counting
  let breaksToday = 0;
  let breaksThisWeek = 0;
  const breaksByType: Record<string, number> = {};
  const uniqueDays = new Set<string>();
  let lastBreakTime: number | undefined;
  let maxTimestamp = 0;

  // Single pass through all breaks
  for (const breakRecord of allBreaks) {
    const timestamp = breakRecord.timestamp;
    
    // Track latest break
    if (timestamp > maxTimestamp) {
      maxTimestamp = timestamp;
      lastBreakTime = timestamp;
    }

    // Count by type
    breaksByType[breakRecord.type] = (breaksByType[breakRecord.type] || 0) + 1;

    // Filter and count in one pass
    if (timestamp >= todayTime) {
      breaksToday++;
    }
    if (timestamp >= weekAgoTime) {
      breaksThisWeek++;
    }

    // Track unique days
    uniqueDays.add(getDateKey(timestamp));
  }

  // Optimized streak calculation
  const sortedDays = Array.from(uniqueDays).sort().reverse();
  const todayKey = getDateKey(todayTime);
  let streakDays = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedKey = getDateKey(expectedDate.getTime());

    if (sortedDays[i] === expectedKey) {
      streakDays++;
    } else {
      break;
    }
  }

  const daysWithBreaks = uniqueDays.size;
  const averageBreaksPerDay = daysWithBreaks > 0 ? allBreaks.length / daysWithBreaks : 0;

  // Clear cache periodically
  clearDateKeyCache();

  const stats: BreakStats = {
    totalBreaks: allBreaks.length,
    breaksByType,
    breaksToday,
    breaksThisWeek,
    averageBreaksPerDay: Math.round(averageBreaksPerDay * 10) / 10,
    lastBreakTime,
    streakDays,
  };

  // Cache the stats
  statsCache = stats;
  statsCacheTimestamp = now;

  return stats;
}

export async function getLastReminderTime(): Promise<number | null> {
  const time = await LocalStorage.getItem<string>(STORAGE_KEYS.LAST_REMINDER);
  return time ? parseInt(time, 10) : null;
}

export async function setLastReminderTime(timestamp: number): Promise<void> {
  await LocalStorage.setItem(STORAGE_KEYS.LAST_REMINDER, timestamp.toString());
}

export async function clearAllBreaks(): Promise<void> {
  await LocalStorage.removeItem(STORAGE_KEYS.BREAKS);
  invalidateCaches();
  dateKeyCache.clear();
}
