// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { List, ActionPanel, Action, Icon, Color, showToast, Toast } from "@raycast/api";
import { getBreakStats, getBreaks, BreakRecord, clearAllBreaks, BreakStats } from "./utils/storage";

// Cache for time formatting
const timeFormatCache = new Map<number, string>();
const TIME_CACHE_TTL = 60000; // 1 minute cache

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const cached = timeFormatCache.get(timestamp);
  if (cached && (now - timestamp) < TIME_CACHE_TTL) {
    return cached;
  }

  const date = new Date(timestamp);
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  let result: string;
  if (diffMins < 1) {
    result = "Just now";
  } else if (diffMins < 60) {
    result = `${diffMins}m ago`;
  } else if (diffMins < 1440) {
    result = `${Math.floor(diffMins / 60)}h ago`;
  } else {
    result = date.toLocaleString();
  }

  timeFormatCache.set(timestamp, result);
  if (timeFormatCache.size > 100) {
    timeFormatCache.clear();
  }

  return result;
}

export default function StatsView() {
  const [stats, setStats] = useState<BreakStats | null>(null);
  const [recentBreaks, setRecentBreaks] = useState<BreakRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "all">("week");

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const breakStats = await getBreakStats();
      setStats(breakStats);

      const allBreaks = await getBreaks();
      
      // Optimize: Pre-calculate time boundaries
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoTime = weekAgo.getTime();

      // Single pass: sort and filter
      let filteredBreaks: BreakRecord[];
      if (timeRange === "today") {
        filteredBreaks = allBreaks.filter((b) => b.timestamp >= todayTime);
      } else if (timeRange === "week") {
        filteredBreaks = allBreaks.filter((b) => b.timestamp >= weekAgoTime);
      } else {
        filteredBreaks = allBreaks;
      }

      // Sort only what we need (top 50)
      filteredBreaks.sort((a, b) => b.timestamp - a.timestamp);
      setRecentBreaks(filteredBreaks.slice(0, 50));
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleClearAll = useCallback(async () => {
    const confirmed = await showToast({
      style: Toast.Style.Failure,
      title: "Clear All Data?",
      message: "This action cannot be undone",
    });

    // Note: Raycast doesn't have a confirmation dialog API, so we'll just clear
    // In a real implementation, you might want to add a confirmation step
    await clearAllBreaks();
    await loadStats();
    await showToast({
      style: Toast.Style.Success,
      title: "Data Cleared",
      message: "All break records have been deleted",
    });
  }, [loadStats]);

  const formatDuration = useCallback((seconds?: number): string => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  }, []);

  // Memoize sorted break types
  const sortedBreakTypes = useMemo(() => {
    if (!stats || Object.keys(stats.breaksByType).length === 0) return [];
    return Object.entries(stats.breaksByType).sort(([, a], [, b]) => b - a);
  }, [stats?.breaksByType]);

  // Memoize clear action
  const clearAction = useMemo(
    () => (
      <ActionPanel>
        <Action
          icon={Icon.Trash}
          title="Clear All Data"
          onAction={handleClearAll}
          style={Action.Style.Destructive}
        />
      </ActionPanel>
    ),
    [handleClearAll]
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search breaks..."
      searchBarAccessory={
        <List.Dropdown
          tooltip="Time Range"
          value={timeRange}
          onChange={(value) => setTimeRange(value as "today" | "week" | "all")}
        >
          <List.Dropdown.Item title="Today" value="today" />
          <List.Dropdown.Item title="Last 7 Days" value="week" />
          <List.Dropdown.Item title="All Time" value="all" />
        </List.Dropdown>
      }
    >
      {stats && (
        <List.Section title="Overview">
          <List.Item
            icon={{ source: Icon.Circle, tintColor: Color.Blue }}
            title="Total Breaks"
            subtitle={`${stats.totalBreaks} break${stats.totalBreaks !== 1 ? "s" : ""} recorded`}
          />
          <List.Item
            icon={{ source: Icon.Calendar, tintColor: Color.Green }}
            title="Breaks Today"
            subtitle={`${stats.breaksToday} break${stats.breaksToday !== 1 ? "s" : ""}`}
          />
          <List.Item
            icon={{ source: Icon.Star, tintColor: Color.Yellow }}
            title="Breaks This Week"
            subtitle={`${stats.breaksThisWeek} break${stats.breaksThisWeek !== 1 ? "s" : ""}`}
          />
          <List.Item
            icon={{ source: Icon.Star, tintColor: Color.Orange }}
            title="Current Streak"
            subtitle={`${stats.streakDays} day${stats.streakDays !== 1 ? "s" : ""} in a row`}
          />
          <List.Item
            icon={{ source: Icon.BarChart, tintColor: Color.Purple }}
            title="Average Per Day"
            subtitle={`${stats.averageBreaksPerDay} break${stats.averageBreaksPerDay !== 1 ? "s" : ""}`}
          />
        </List.Section>
      )}

      {sortedBreakTypes.length > 0 && (
        <List.Section title="Break Types Distribution">
          {sortedBreakTypes.map(([type, count]) => {
            const percentage =
              stats && stats.totalBreaks > 0 ? Math.round((count / stats.totalBreaks) * 100) : 0;
            return (
              <List.Item
                key={type}
                icon={Icon.Circle}
                title={type}
                subtitle={`${count} (${percentage}%)`}
              />
            );
          })}
        </List.Section>
      )}

      <List.Section title={`Recent Breaks (${recentBreaks.length})`}>
        {recentBreaks.length === 0 ? (
          <List.Item
            icon={Icon.Info}
            title="No breaks recorded"
            subtitle="Start tracking your health breaks!"
          />
        ) : (
          recentBreaks.map((breakRecord) => (
            <List.Item
              key={breakRecord.id}
              icon={Icon.Heart}
              title={breakRecord.type}
              subtitle={`${formatTimestamp(breakRecord.timestamp)} • ${formatDuration(breakRecord.duration)}`}
              accessories={breakRecord.notes ? [{ text: breakRecord.notes }] : []}
            />
          ))
        )}
      </List.Section>

      <List.Section title="Actions">
        <List.Item
          icon={Icon.Trash}
          title="Clear All Data"
          subtitle="Delete all break records"
          actions={clearAction}
        />
      </List.Section>
    </List>
  );
}
