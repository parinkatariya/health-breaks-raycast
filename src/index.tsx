// @ts-nocheck
import { useState, useEffect } from "react";
import { List, ActionPanel, Action, Icon, Color, launchCommand, LaunchType } from "@raycast/api";
import { getBreakStats, BreakStats } from "./utils/storage";
import { showBreakReminder, shouldShowReminder } from "./utils/notifications";
import { getPreferences } from "./utils/preferences";
import TrackBreakView from "./track-break";
import StatsView from "./view-stats";
import ConfigureView from "./configure";

export default function HealthBreaks() {
  const [stats, setStats] = useState<BreakStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preferences = getPreferences();

  useEffect(() => {
    loadStats();
    checkReminder();
  }, []);

  async function loadStats() {
    setIsLoading(true);
    const breakStats = await getBreakStats();
    setStats(breakStats);
    setIsLoading(false);
  }

  async function checkReminder() {
    if (await shouldShowReminder()) {
      await showBreakReminder();
    }
  }

  function formatTime(timestamp?: number): string {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Health Breaks Tracker">
      <List.Section title="Quick Actions">
        <List.Item
          icon={Icon.Heart}
          title="Track a Break"
          subtitle="Log a health break activity"
          actions={
            <ActionPanel>
              <Action.Push
                title="Track Break"
                target={<TrackBreakView onBreakLogged={loadStats} />}
              />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.BarChart}
          title="View Statistics"
          subtitle="See your break activity over time"
          actions={
            <ActionPanel>
              <Action.Push title="View Stats" target={<StatsView />} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={Icon.Gear}
          title="Configure Settings"
          subtitle="Adjust reminder intervals and preferences"
          actions={
            <ActionPanel>
              <Action.Push title="Configure" target={<ConfigureView />} />
            </ActionPanel>
          }
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

      {stats && Object.keys(stats.breaksByType).length > 0 && (
        <List.Section title="Break Types">
          {Object.entries(stats.breaksByType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => (
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
          actions={
            <ActionPanel>
              <Action
                icon={Icon.AppWindow}
                title="Open Menubar Command"
                onAction={() => launchCommand({ name: "menubar", type: LaunchType.UserInitiated })}
              />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
