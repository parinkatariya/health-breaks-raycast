import { showHUD, showToast, Toast } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { getLastReminderTime, setLastReminderTime } from "./storage";
import { getPreferences } from "./preferences";

const execAsync = promisify(exec);

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
  const preferences = getPreferences();
  if (!preferences.enableNotifications) {
    return false;
  }

  const intervalMs = preferences.reminderInterval * 60 * 1000;
  const lastReminder = await getLastReminderTime();
  const now = Date.now();

  if (!lastReminder) {
    return true;
  }

  return now - lastReminder >= intervalMs;
}

/**
 * Shows a macOS system notification using osascript
 * This is needed for menu bar commands where showHUD doesn't work
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
    // If system notification fails, fall back to toast
    console.error("Failed to show macOS notification:", error);
    await showToast({
      style: Toast.Style.Success,
      title,
      message,
    });
  }
}

export async function showBreakReminder(): Promise<void> {
  const preferences = getPreferences();
  if (!preferences.enableNotifications) {
    return;
  }

  const title = "Time for a Health Break! 💚";
  const message = "Take a moment to stand, stretch, or rest your eyes";

  // Show notification based on user preference
  if (preferences.notificationType === "hud") {
    // Use macOS system notification (works in both regular and menu bar commands)
    // showHUD doesn't work reliably in menu bar commands, so we use osascript
    await showMacOSNotification(title, message);
  } else {
    // Show Toast notification (in-app)
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

  // Show toast notification in Raycast UI
  await showToast({
    style: Toast.Style.Success,
    title: "Break Logged! ✅",
    message: `${type} break recorded`,
  });

  // Show confetti to celebrate logging a break (if enabled)
  if (preferences.enableConfetti) {
    await showConfetti();
  }
}
