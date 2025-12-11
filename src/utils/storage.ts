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
} as const;

export async function saveBreak(breakRecord: BreakRecord): Promise<void> {
  const existingBreaks = await getBreaks();
  existingBreaks.push(breakRecord);
  await LocalStorage.setItem(STORAGE_KEYS.BREAKS, JSON.stringify(existingBreaks));
}

export async function getBreaks(): Promise<BreakRecord[]> {
  const data = await LocalStorage.getItem<string>(STORAGE_KEYS.BREAKS);
  if (!data) return [];
  try {
    return JSON.parse(data) as BreakRecord[];
  } catch {
    return [];
  }
}

export async function getBreaksByDateRange(startDate: Date, endDate: Date): Promise<BreakRecord[]> {
  const allBreaks = await getBreaks();
  const start = startDate.getTime();
  const end = endDate.getTime();
  return allBreaks.filter(
    (breakRecord) => breakRecord.timestamp >= start && breakRecord.timestamp <= end,
  );
}

export async function getBreakStats(): Promise<BreakStats> {
  const allBreaks = await getBreaks();
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const breaksToday = allBreaks.filter((b) => b.timestamp >= today.getTime()).length;
  const breaksThisWeek = allBreaks.filter((b) => b.timestamp >= weekAgo.getTime()).length;

  const breaksByType: Record<string, number> = {};
  allBreaks.forEach((breakRecord) => {
    breaksByType[breakRecord.type] = (breaksByType[breakRecord.type] || 0) + 1;
  });

  // Calculate streak
  const sortedBreaks = [...allBreaks].sort((a, b) => b.timestamp - a.timestamp);
  let streakDays = 0;
  const uniqueDays = new Set<string>();

  sortedBreaks.forEach((breakRecord) => {
    const date = new Date(breakRecord.timestamp);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    uniqueDays.add(dateKey);
  });

  const sortedDays = Array.from(uniqueDays).sort().reverse();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  for (let i = 0; i < sortedDays.length; i++) {
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    const expectedKey = `${expectedDate.getFullYear()}-${expectedDate.getMonth()}-${expectedDate.getDate()}`;

    if (sortedDays[i] === expectedKey) {
      streakDays++;
    } else {
      break;
    }
  }

  const daysWithBreaks = uniqueDays.size;
  const averageBreaksPerDay = daysWithBreaks > 0 ? allBreaks.length / daysWithBreaks : 0;

  return {
    totalBreaks: allBreaks.length,
    breaksByType,
    breaksToday,
    breaksThisWeek,
    averageBreaksPerDay: Math.round(averageBreaksPerDay * 10) / 10,
    lastBreakTime: sortedBreaks[0]?.timestamp,
    streakDays,
  };
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
}
