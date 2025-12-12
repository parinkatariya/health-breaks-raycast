import { environment, LaunchType, showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { getLastReminderTime, setLastReminderTime } from "./storage";
import { getPreferences } from "./preferences";

const execAsync = promisify(exec);

// Cache for reminder check to avoid repeated storage reads
let reminderCheckCache: { result: boolean; timestamp: number } | null = null;
const REMINDER_CHECK_CACHE_TTL = 5000; // 5 seconds cache

/**
 * Triggers Raycast confetti animation
 */
async function showConfetti(): Promise<void> {
  try {
    await execAsync("open raycast://confetti");
  } catch (error) {
    // Silently fail if confetti can't be shown
    console.error("Failed to show confetti:", error);
  }
}

export async function shouldShowReminder(): Promise<boolean> {
  const now = Date.now();
  
  // Return cached result if still valid
  if (reminderCheckCache && (now - reminderCheckCache.timestamp) < REMINDER_CHECK_CACHE_TTL) {
    return reminderCheckCache.result;
  }

  const preferences = getPreferences();
  if (!preferences.enableNotifications) {
    reminderCheckCache = { result: false, timestamp: now };
    return false;
  }

  const intervalMs = preferences.reminderInterval * 60 * 1000;
  const lastReminder = await getLastReminderTime();

  let result: boolean;
  if (!lastReminder) {
    result = true;
  } else {
    result = now - lastReminder >= intervalMs;
  }

  // Cache the result
  reminderCheckCache = { result, timestamp: now };
  return result;
}

/**
 * Shows a macOS system notification using osascript
 * This is needed for menu bar/background commands where Toast/HUD APIs may be unavailable
 */
async function showMacOSNotification(title: string, message: string): Promise<void> {
  // Escape single quotes for AppleScript
  const escapeForAppleScript = (str: string): string => {
    return str.replace(/'/g, "\\'");
  };

  const escapedTitle = escapeForAppleScript(title);
  const escapedMessage = escapeForAppleScript(message);

  const script = `display notification "${escapedMessage}" with title "${escapedTitle}" sound name "Glass"`;

  try {
    await execAsync(`osascript -e '${script}'`);
  } catch (error) {
    // If system notification fails, only fall back to toast when a UI is available
    console.error("Failed to show macOS notification:", error);
    const canUseToast =
      environment.launchType !== LaunchType.Background && environment.commandMode !== "menu-bar";
    if (canUseToast) {
      try {
        await showToast({
          style: Toast.Style.Success,
          title,
          message,
        });
      } catch (toastError) {
        console.error("Failed to show Toast fallback:", toastError);
      }
    }
  }
}

export async function showBreakReminder(): Promise<void> {
  const preferences = getPreferences();
  if (!preferences.enableNotifications) {
    return;
  }

  const title = "Time for a Health Break! 💚";
  const message = "Take a moment to stand, stretch, or rest your eyes";

  const isBackground = environment.launchType === LaunchType.Background;
  const isMenuBar = environment.commandMode === "menu-bar";

  // In background/menu-bar, Toast isn't available. Use macOS system notification.
  if (isBackground || isMenuBar) {
    await showMacOSNotification(title, message);
  } else if (preferences.notificationType === "hud") {
    // HUD isn't reliable for menu-bar commands; for view commands, toast is generally preferred.
    await showMacOSNotification(title, message);
  } else {
    await showToast({
      style: Toast.Style.Success,
      title,
      message,
    });
  }

  // Show confetti to celebrate the break reminder (if enabled)
  if (preferences.enableConfetti) {
    await showConfetti();
  }

  await setLastReminderTime(Date.now());
}

export async function showBreakLogged(type: string): Promise<void> {
  const preferences = getPreferences();

  const title = "Break Logged! ✅";
  const message = `${type} break recorded`;

  const isBackground = environment.launchType === LaunchType.Background;
  const isMenuBar = environment.commandMode === "menu-bar";

  // Toast isn't available in background/menu-bar; use system notification instead.
  if (isBackground || isMenuBar) {
    await showMacOSNotification(title, message);
  } else {
    await showToast({
      style: Toast.Style.Success,
      title,
      message,
    });
  }

  // Show confetti to celebrate logging a break (if enabled)
  if (preferences.enableConfetti) {
    await showConfetti();
  }
}
