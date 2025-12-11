// @ts-nocheck
import { useState, useEffect } from "react";
import { MenuBarExtra, Icon, Color, launchCommand, LaunchType } from "@raycast/api";
import { getBreakStats, BreakStats, saveBreak, BreakRecord } from "./utils/storage";
import { showBreakReminder, shouldShowReminder, showBreakLogged } from "./utils/notifications";
import { getPreferences } from "./utils/preferences";

export default function Menubar() {
  const [stats, setStats] = useState<BreakStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const preferences = getPreferences();

  useEffect(() => {
    loadStats();
    checkReminder();
    // Refresh every minute
    const interval = setInterval(() => {
      loadStats();
      checkReminder();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    const breakStats = await getBreakStats();
    setStats(breakStats);
    setIsLoading(false);
  }

  async function checkReminder() {
    if (await shouldShowReminder()) {
      await showBreakReminder();
    }
  }

  async function quickLogBreak(type: string) {
    const breakRecord: BreakRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      timestamp: Date.now(),
    };
    await saveBreak(breakRecord);
    await showBreakLogged(type);
    await loadStats();
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

  // Determine icon and title based on stats
  const getMenubarIcon = () => {
    if (isLoading) return Icon.Heart;
    if (!stats || stats.breaksToday === 0) return { source: Icon.Heart, tintColor: Color.Red };
    if (stats.breaksToday < 3) return { source: Icon.Heart, tintColor: Color.Orange };
    return { source: Icon.Heart, tintColor: Color.Green };
  };

  const getMenubarTitle = () => {
    if (isLoading) return "";
    if (!stats) return "";
    // Show count if breaks today > 0, otherwise just show icon
    return stats.breaksToday > 0 ? `${stats.breaksToday}` : "";
  };

  return (
    <MenuBarExtra icon={getMenubarIcon()} title={getMenubarTitle()} tooltip="Health Breaks Tracker">
      {stats && (
        <>
          <MenuBarExtra.Section title="Today's Stats">
            <MenuBarExtra.Item
              icon={Icon.Calendar}
              title={`Breaks Today: ${stats.breaksToday}`}
              subtitle={stats.breaksToday > 0 ? "Keep it up! 💪" : "Time to take a break!"}
            />
            {stats.streakDays > 0 && (
              <MenuBarExtra.Item
                icon={Icon.Star}
                title={`Streak: ${stats.streakDays} day${stats.streakDays !== 1 ? "s" : ""}`}
                subtitle="🔥"
              />
            )}
            {stats.lastBreakTime && (
              <MenuBarExtra.Item
                icon={Icon.Clock}
                title={`Last Break: ${formatTime(stats.lastBreakTime)}`}
              />
            )}
          </MenuBarExtra.Section>

          <MenuBarExtra.Separator />

          <MenuBarExtra.Section title="Quick Log Break">
            {preferences.breakTypes.slice(0, 5).map((type) => (
              <MenuBarExtra.Item
                key={type}
                icon={Icon.Circle}
                title={type}
                onAction={() => quickLogBreak(type)}
              />
            ))}
          </MenuBarExtra.Section>

          <MenuBarExtra.Separator />

          <MenuBarExtra.Section title="Actions">
            <MenuBarExtra.Item
              icon={Icon.BarChart}
              title="View Statistics"
              onAction={() => launchCommand({ name: "view-stats", type: LaunchType.UserInitiated })}
            />
            <MenuBarExtra.Item
              icon={Icon.Gear}
              title="Configure"
              onAction={() => launchCommand({ name: "configure", type: LaunchType.UserInitiated })}
            />
          </MenuBarExtra.Section>
        </>
      )}

      {!stats && !isLoading && (
        <MenuBarExtra.Item icon={Icon.Info} title="No breaks recorded yet" />
      )}
    </MenuBarExtra>
  );
}
