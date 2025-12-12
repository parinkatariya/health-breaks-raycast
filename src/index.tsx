// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { List, ActionPanel, Action, Icon, Color, launchCommand, LaunchType } from "@raycast/api";
import { getBreakStats, BreakStats } from "./utils/storage";
import { showBreakReminder, shouldShowReminder } from "./utils/notifications";
import { getPreferences } from "./utils/preferences";
import TrackBreakView from "./track-break";
import StatsView from "./view-stats";
import ConfigureView from "./configure";

// Cache for time formatting to avoid repeated calculations
const timeFormatCache = new Map<number, string>();
const TIME_CACHE_TTL = 60000; // 1 minute cache

function formatTime(timestamp?: number): string {
  if (!timestamp) return "Never";
  
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
    result = date.toLocaleDateString();
  }

  timeFormatCache.set(timestamp, result);
  // Clean cache periodically
  if (timeFormatCache.size > 100) {
    timeFormatCache.clear();
  }

  return result;
}

export default function HealthBreaks() {
  const [stats, setStats] = useState<BreakStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize preferences to avoid recalculation
  const preferences = useMemo(() => getPreferences(), []);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const breakStats = await getBreakStats();
      setStats(breakStats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkReminder = useCallback(async () => {
    if (await shouldShowReminder()) {
      await showBreakReminder();
    }
  }, []);

  useEffect(() => {
    loadStats();
    checkReminder();
  }, [loadStats, checkReminder]);

  // Memoize sorted break types to avoid recalculation
  const sortedBreakTypes = useMemo(() => {
    if (!stats || Object.keys(stats.breaksByType).length === 0) return [];
    return Object.entries(stats.breaksByType).sort(([, a], [, b]) => b - a);
  }, [stats?.breaksByType]);

  // Memoize action panels to prevent recreation
  const trackBreakAction = useMemo(
    () => (
      <ActionPanel>
        <Action.Push title="Track Break" target={<TrackBreakView onBreakLogged={loadStats} />} />
      </ActionPanel>
    ),
    [loadStats]
  );

  const viewStatsAction = useMemo(
    () => (
      <ActionPanel>
        <Action.Push title="View Stats" target={<StatsView />} />
      </ActionPanel>
    ),
    []
  );

  const configureAction = useMemo(
    () => (
      <ActionPanel>
        <Action.Push title="Configure" target={<ConfigureView />} />
      </ActionPanel>
    ),
    []
  );

  const menubarAction = useMemo(
    () => (
      <ActionPanel>
        <Action
          icon={Icon.AppWindow}
          title="Open Menubar Command"
          onAction={() => launchCommand({ name: "menubar", type: LaunchType.UserInitiated })}
        />
      </ActionPanel>
    ),
    []
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Health Breaks Tracker">
      <List.Section title="Quick Actions">
        <List.Item
          icon={Icon.Heart}
          title="Track a Break"
          subtitle="Log a health break activity"
          actions={trackBreakAction}
        />
        <List.Item
          icon={Icon.BarChart}
          title="View Statistics"
          subtitle="See your break activity over time"
          actions={viewStatsAction}
        />
        <List.Item
          icon={Icon.Gear}
          title="Configure Settings"
          subtitle="Adjust reminder intervals and preferences"
          actions={configureAction}
        />
      </List.Section>

      {stats && (
        <List.Section title="Today's Summary">
          <List.Item
            icon={{ source: Icon.Calendar, tintColor: Color.Blue }}
            title="Breaks Today"
            subtitle={`${stats.breaksToday} break${stats.breaksToday !== 1 ? "s" : ""}`}
          />
          <List.Item
            icon={{ source: Icon.Star, tintColor: Color.Orange }}
            title="Current Streak"
            subtitle={`${stats.streakDays} day${stats.streakDays !== 1 ? "s" : ""}`}
          />
          <List.Item
            icon={{ source: Icon.Clock, tintColor: Color.Green }}
            title="Last Break"
            subtitle={formatTime(stats.lastBreakTime)}
          />
          <List.Item
            icon={{ source: Icon.Star, tintColor: Color.Yellow }}
            title="Average Breaks/Day"
            subtitle={`${stats.averageBreaksPerDay} break${stats.averageBreaksPerDay !== 1 ? "s" : ""}`}
          />
        </List.Section>
      )}

      {sortedBreakTypes.length > 0 && (
        <List.Section title="Break Types">
          {sortedBreakTypes.map(([type, count]) => (
            <List.Item
              key={type}
              icon={Icon.Circle}
              title={type}
              subtitle={`${count} time${count !== 1 ? "s" : ""}`}
            />
          ))}
        </List.Section>
      )}

      <List.Section title="Settings">
        <List.Item
          icon={Icon.Bell}
          title="Reminder Interval"
          subtitle={`${preferences.reminderInterval} minutes`}
        />
        <List.Item
          icon={preferences.enableNotifications ? Icon.Bell : Icon.BellDisabled}
          title="Notifications"
          subtitle={
            preferences.enableNotifications
              ? preferences.notificationType === "hud"
                ? "Enabled (HUD)"
                : "Enabled (Toast)"
              : "Disabled"
          }
        />
      </List.Section>

      <List.Section title="Menubar">
        <List.Item
          icon={Icon.AppWindow}
          title="Menubar Command"
          subtitle="Quick access from menu bar - Search 'Health Breaks Menubar' to enable"
          actions={menubarAction}
        />
      </List.Section>
    </List>
  );
}
