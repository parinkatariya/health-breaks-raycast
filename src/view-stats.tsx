// @ts-nocheck
import { useState, useEffect } from "react";
import { List, ActionPanel, Action, Icon, Color, showToast, Toast } from "@raycast/api";
import { getBreakStats, getBreaks, BreakRecord, clearAllBreaks, BreakStats } from "./utils/storage";

export default function StatsView() {
  const [stats, setStats] = useState<BreakStats | null>(null);
  const [recentBreaks, setRecentBreaks] = useState<BreakRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "all">("week");

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  async function loadStats() {
    setIsLoading(true);
    const breakStats = await getBreakStats();
    setStats(breakStats);

    const allBreaks = await getBreaks();
    const sortedBreaks = [...allBreaks].sort((a, b) => b.timestamp - a.timestamp);

    let filteredBreaks = sortedBreaks;
    if (timeRange === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filteredBreaks = sortedBreaks.filter((b) => b.timestamp >= today.getTime());
    } else if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredBreaks = sortedBreaks.filter((b) => b.timestamp >= weekAgo.getTime());
    }

    setRecentBreaks(filteredBreaks.slice(0, 50));
    setIsLoading(false);
  }

  async function handleClearAll() {
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
  }

  function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  }

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

      {stats && Object.keys(stats.breaksByType).length > 0 && (
        <List.Section title="Break Types Distribution">
          {Object.entries(stats.breaksByType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const percentage =
                stats.totalBreaks > 0 ? Math.round((count / stats.totalBreaks) * 100) : 0;
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
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Trash}
                title="Clear All Data"
                onAction={handleClearAll}
                style={Action.Style.Destructive}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
