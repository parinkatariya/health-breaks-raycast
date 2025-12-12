// @ts-nocheck
import { useState, useEffect, useCallback, useMemo } from "react";
import { MenuBarExtra, Icon, Color, launchCommand, LaunchType } from "@raycast/api";
import { getBreakStats, BreakStats, saveBreak, BreakRecord } from "./utils/storage";
import { showBreakReminder, shouldShowReminder, showBreakLogged } from "./utils/notifications";
import { getPreferences } from "./utils/preferences";

// Cache for time formatting
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
  if (timeFormatCache.size > 100) {
    timeFormatCache.clear();
  }

  return result;
}

export default function Menubar() {
  const [stats, setStats] = useState<BreakStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoize preferences
  const preferences = useMemo(() => getPreferences(), []);

  const loadStats = useCallback(async () => {
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
    // NOTE: This command is already configured with an `interval` in the manifest.
    // Avoid keeping our own timers alive, otherwise Raycast (and `ray develop`) may time out the command.
    void loadStats();
    void checkReminder();
  }, [loadStats, checkReminder]);

  const quickLogBreak = useCallback(async (type: string) => {
    const breakRecord: BreakRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      timestamp: Date.now(),
    };
    await saveBreak(breakRecord);
    await showBreakLogged(type);
    await loadStats();
  }, [loadStats]);

  // Memoize icon and title calculations
  // Always return an object format for consistency
  const menubarIcon = useMemo(() => {
    if (isLoading) return { source: Icon.Heart, tintColor: Color.Blue };
    if (!stats || stats.breaksToday === 0) return { source: Icon.Heart, tintColor: Color.Red };
    if (stats.breaksToday < 3) return { source: Icon.Heart, tintColor: Color.Orange };
    return { source: Icon.Heart, tintColor: Color.Green };
  }, [isLoading, stats?.breaksToday]);

  const menubarTitle = useMemo(() => {
    if (isLoading) return "";
    if (!stats) return "";
    return stats.breaksToday > 0 ? `${stats.breaksToday}` : "";
  }, [isLoading, stats?.breaksToday]);

  // Memoize break types slice
  const quickBreakTypes = useMemo(
    () => preferences.breakTypes.slice(0, 5),
    [preferences.breakTypes]
  );

  // Memoize action handlers
  const viewStatsAction = useCallback(
    () => launchCommand({ name: "view-stats", type: LaunchType.UserInitiated }),
    []
  );

  const configureAction = useCallback(
    () => launchCommand({ name: "configure", type: LaunchType.UserInitiated }),
    []
  );

  return (
    <MenuBarExtra icon={menubarIcon} title={menubarTitle} tooltip="Health Breaks Tracker">
      {stats && (
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
      )}

      {(!stats || isLoading) && (
        <MenuBarExtra.Section title="Status">
          <MenuBarExtra.Item
            icon={Icon.Info}
            title={isLoading ? "Loading..." : "No breaks recorded yet"}
          />
        </MenuBarExtra.Section>
      )}

      <MenuBarExtra.Separator />

      <MenuBarExtra.Section title="Quick Log Break">
        {quickBreakTypes.map((type) => (
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
          onAction={viewStatsAction}
        />
        <MenuBarExtra.Item
          icon={Icon.Gear}
          title="Configure"
          onAction={configureAction}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
