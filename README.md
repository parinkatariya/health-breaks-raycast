# Health Breaks Reminder & Tracker

A Raycast extension for macOS that helps you maintain healthy work habits by reminding you to take regular breaks and tracking your break activities.

## Purpose

This extension is designed to promote better health and productivity by:

- **Reminding you to take breaks** at configurable intervals to reduce eye strain, improve posture, and prevent burnout
- **Tracking your break activities** so you can monitor your health habits over time
- **Providing statistics and insights** including daily/weekly break counts, streaks, and break type distribution
- **Offering quick access** via menu bar integration for easy break logging

Regular breaks are essential for maintaining focus, reducing physical strain, and improving overall well-being during long work sessions. This tool helps you build and maintain healthy work habits.

## Features

- ⏰ **Configurable Reminders**: Set custom reminder intervals (default: 60 minutes)
- 📊 **Break Tracking**: Log different types of breaks (Stand, Eye Rest, Water, Stretch, Walk, or custom types)
- 📈 **Statistics Dashboard**: View your break activity with metrics like:
  - Breaks today, this week, and all-time
  - Current streak (consecutive days with breaks)
  - Average breaks per day
  - Break type distribution
- 🔔 **Smart Notifications**: Choose between Toast (in-app) or HUD (macOS system) notifications
- 🎯 **Menu Bar Integration**: Quick access and break logging directly from your menu bar
- 💾 **Local Storage**: All data is stored locally on your device for privacy

## Installation

> **Note**: This extension is currently in development and not yet published to the Raycast Store. You'll need to install it manually using the development setup below.

### Prerequisites

- macOS (required for Raycast)
- [Raycast](https://www.raycast.com/) installed on your Mac
- Node.js 18+ and npm

### Installation Steps

1. **Clone or download this repository**:
   ```bash
   git clone <repository-url>
   cd health-breaks-raycast
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   
   This will:
   - Automatically load the extension in Raycast in development mode
   - Enable hot reload (changes will be reflected immediately)
   - Keep the extension active while the dev server is running
   
   **Important**: Keep the terminal running `npm run dev` open while you want to use the extension. Closing it will stop the extension from working.

4. **Optional: Build for production** (if you want to test the production build):
   ```bash
   npm run build
   ```

## Usage

### Getting Started

> **Note**: Make sure `npm run dev` is running in a terminal before using the extension.

1. **Open the extension**: Press `Cmd + Space` (or your Raycast shortcut), then type "Health Breaks"
2. **Configure settings**: Open "Configure Settings" to customize:
   - Reminder interval (how often you want to be reminded)
   - Notification preferences (enable/disable, choose Toast or HUD)
   - Break types (customize the types of breaks you want to track)

### Commands

The extension provides several commands accessible via Raycast:

- **Health Breaks** (`index`): Main dashboard showing today's summary and quick actions
- **Track Break** (`track-break`): Log a new break activity with type, duration, and notes
- **View Statistics** (`view-stats`): Detailed statistics and break history
- **Configure Settings** (`configure`): Adjust reminder intervals and preferences
- **Health Breaks Menubar** (`menubar`): Menu bar integration for quick access

### Menu Bar Integration

1. Search for "Health Breaks Menubar" in Raycast
2. Enable the menu bar command
3. Access quick break logging and stats directly from your menu bar
4. The menu bar icon changes color based on your break activity:
   - 🔴 Red: No breaks today
   - 🟠 Orange: 1-2 breaks today
   - 🟢 Green: 3+ breaks today

### Tracking a Break

1. Open "Track Break" command
2. Select a break type from the dropdown
3. Optionally add duration (in minutes) and notes
4. Submit to log your break

### Viewing Statistics

1. Open "View Statistics" command
2. Use the time range dropdown to filter:
   - Today
   - Last 7 Days
   - All Time
3. View overview metrics, break type distribution, and recent break history

## Configuration

### Extension Preferences

Access preferences via Raycast → Extensions → Health Breaks → Preferences, or use the "Configure Settings" command.

**Available Settings:**

- **Reminder Interval**: How often (in minutes) to remind you to take a break (default: 60)
- **Enable Notifications**: Toggle notifications on/off (default: enabled)
- **Notification Type**: Choose between:
  - **Toast**: In-app notification within Raycast
  - **HUD**: macOS system notification (works better for menu bar)
- **Break Types**: Comma-separated list of break types to track (default: 🧍‍♂️ Stand, 👀 Eye Rest, 💧 Water, 💪 Stretch, 🚶 Walk)
- **Enable Confetti**: Show confetti animation when notifications appear (default: enabled)

## Development

### Project Structure

```
health-breaks-raycast/
├── src/
│   ├── index.tsx          # Main dashboard view
│   ├── track-break.tsx    # Break logging form
│   ├── view-stats.tsx     # Statistics view
│   ├── configure.tsx      # Settings configuration view
│   ├── menubar.tsx        # Menu bar integration
│   └── utils/
│       ├── storage.ts      # Local storage utilities
│       ├── notifications.ts # Notification handling
│       └── preferences.ts  # Preference management
├── assets/                # Extension icons
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

### Available Scripts

- `npm run build`: Build the extension for production
- `npm run dev`: Start development mode with hot reload
- `npm run lint`: Run ESLint to check code quality
- `npm run fix-lint`: Automatically fix linting issues
- `npm run publish`: Publish the extension to Raycast Store

### Technologies Used

- **Raycast API**: Core framework for macOS extensions
- **React**: UI component library
- **TypeScript**: Type-safe JavaScript
- **LocalStorage**: Data persistence (via Raycast API)

## Privacy

All break data is stored locally on your device using Raycast's LocalStorage API. No data is sent to external servers or third-party services. Your privacy is fully protected.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Author

Created by parin.katariya

## Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Remember**: Taking regular breaks is essential for maintaining productivity and health. This tool is here to help you build better work habits! 💚

