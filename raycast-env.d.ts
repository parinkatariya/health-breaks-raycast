/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Reminder Interval (minutes) - How often to remind you to take a break (default: 60) */
  "reminderInterval": string,
  /** Enable Notifications - Show system notifications for break reminders */
  "enableNotifications": boolean,
  /** Notification Type - Choose between Toast (in-app) or HUD (macOS system notification) */
  "notificationType": "hud" | "toast",
  /** Break Types (comma-separated) - Types of breaks to track (default: 🧍‍♂️ Stand, 👀 Eye Rest, 💧 Water, 💪 Stretch, 🚶 Walk) */
  "breakTypes": string,
  /** Enable Confetti - Show confetti animation when notifications appear */
  "enableConfetti": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
  /** Preferences accessible in the `track-break` command */
  export type TrackBreak = ExtensionPreferences & {}
  /** Preferences accessible in the `view-stats` command */
  export type ViewStats = ExtensionPreferences & {}
  /** Preferences accessible in the `configure` command */
  export type Configure = ExtensionPreferences & {}
  /** Preferences accessible in the `menubar` command */
  export type Menubar = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
  /** Arguments passed to the `track-break` command */
  export type TrackBreak = {}
  /** Arguments passed to the `view-stats` command */
  export type ViewStats = {}
  /** Arguments passed to the `configure` command */
  export type Configure = {}
  /** Arguments passed to the `menubar` command */
  export type Menubar = {}
}

