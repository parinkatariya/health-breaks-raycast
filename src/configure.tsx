// @ts-nocheck
import { List, ActionPanel, Action, Icon, openExtensionPreferences } from "@raycast/api";
import { getPreferences } from "./utils/preferences";

export default function ConfigureView() {
  const preferences = getPreferences();

  return (
    <List searchBarPlaceholder="Configure Health Breaks Settings">
      <List.Section title="Current Settings">
        <List.Item
          icon={Icon.Clock}
          title="Reminder Interval"
          subtitle={`${preferences.reminderInterval} minutes`}
          accessories={[
            {
              text: "Change in Preferences",
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Gear}
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
        <List.Item
          icon={preferences.enableNotifications ? Icon.Bell : Icon.BellDisabled}
          title="Notifications"
          subtitle={preferences.enableNotifications ? "Enabled" : "Disabled"}
          accessories={[
            {
              text: "Change in Preferences",
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Gear}
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
        {preferences.enableNotifications && (
          <List.Item
            icon={preferences.notificationType === "hud" ? Icon.AppWindow : Icon.SpeechBubble}
            title="Notification Type"
            subtitle={
              preferences.notificationType === "hud"
                ? "HUD (macOS System Notification)"
                : "Toast (In-App Notification)"
            }
            accessories={[
              {
                text: "Change in Preferences",
              },
            ]}
            actions={
              <ActionPanel>
                <Action
                  icon={Icon.Gear}
                  title="Open Extension Preferences"
                  onAction={openExtensionPreferences}
                />
              </ActionPanel>
            }
          />
        )}
        <List.Item
          icon={Icon.List}
          title="Break Types"
          subtitle={preferences.breakTypes.join(", ")}
          accessories={[
            {
              text: "Change in Preferences",
            },
          ]}
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Gear}
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Actions">
        <List.Item
          icon={Icon.Gear}
          title="Open Extension Preferences"
          subtitle="Modify reminder intervals, notifications, and break types"
          actions={
            <ActionPanel>
              <Action
                icon={Icon.Gear}
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="About">
        <List.Item
          icon={Icon.Info}
          title="How It Works"
          subtitle="The extension reminds you to take breaks and tracks your activity"
        />
        <List.Item
          icon={Icon.Heart}
          title="Health Benefits"
          subtitle="Regular breaks reduce eye strain, improve posture, and boost productivity"
        />
      </List.Section>
    </List>
  );
}
