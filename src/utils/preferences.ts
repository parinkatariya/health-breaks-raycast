import { getPreferenceValues } from "@raycast/api";

export type NotificationType = "toast" | "hud";

export interface Preferences {
  reminderInterval: number;
  enableNotifications: boolean;
  notificationType: NotificationType;
  breakTypes: string[];
  enableConfetti: boolean;
}

const DEFAULT_BREAK_TYPES = ["🧍‍♂️ Stand", "👀 Eye Rest", "💧 Water", "💪 Stretch", "🚶 Walk"];

// Mapping of old break types (without emojis) to new ones (with emojis)
const BREAK_TYPE_MIGRATION_MAP: Record<string, string> = {
  Stand: "🧍‍♂️ Stand",
  "Eye Rest": "👀 Eye Rest",
  Water: "💧 Water",
  Stretch: "💪 Stretch",
  Walk: "🚶 Walk",
};

/**
 * Migrates old break types (without emojis) to new ones (with emojis)
 */
function migrateBreakTypes(breakTypes: string[]): string[] {
  return breakTypes.map((type) => {
    // Check if this is an old type that needs migration
    if (BREAK_TYPE_MIGRATION_MAP[type]) {
      return BREAK_TYPE_MIGRATION_MAP[type];
    }
    // If it already has emojis or is custom, keep it as is
    return type;
  });
}

export function getPreferences(): Preferences {
  const prefs = getPreferenceValues<{
    reminderInterval?: string;
    enableNotifications?: boolean;
    notificationType?: string;
    breakTypes?: string;
    enableConfetti?: boolean;
  }>();

  const interval = prefs.reminderInterval ? parseInt(prefs.reminderInterval, 10) : 60;

  let breakTypes: string[];
  if (prefs.breakTypes) {
    const parsedTypes = prefs.breakTypes
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    // Migrate old break types to new emoji versions
    breakTypes = migrateBreakTypes(parsedTypes);
  } else {
    // Use default emoji versions
    breakTypes = DEFAULT_BREAK_TYPES;
  }

  // Validate notification type, default to "toast"
  const notificationType =
    prefs.notificationType === "toast" || prefs.notificationType === "hud"
      ? (prefs.notificationType as NotificationType)
      : "toast";

  return {
    reminderInterval: interval > 0 ? interval : 60,
    enableNotifications: prefs.enableNotifications !== false,
    notificationType,
    breakTypes,
    enableConfetti: prefs.enableConfetti !== false,
  };
}
