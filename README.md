# bluesky-text-to-audio

A Chrome extension that displays a play button on posts in the Bluesky timeline.

## Features

- Displays a play button on each post in the Bluesky (bsky.app) timeline.
- When the play button is pressed, the post content is output to `console.log`.

## Installation for Users

1. Clone or download this repository
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder.

> **Note:** The pre-built `dist/` folder is included in the repository, so installing Bun or build tools is not necessary.

## Usage

1. Open [Bluesky](https://bsky.app/)
2. Click the "▶ play" button displayed on each post in the timeline.
3. The post content will be output to the browser's DevTools console.

## For Developers

### Tech Stack

- [Bun](https://bun.sh/) — Package Manager & Runtime
- [Vite](https://vitejs.dev/) — Build Tool
- [CRXJS Vite Plugin](https://crxjs.dev/) — Vite Plugin for Chrome Extensions
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development

### Setup Steps

#### 1. Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

#### 2. Clone the repository

```bash
git clone https://github.com/cat2151/bluesky-text-to-audio.git
cd bluesky-text-to-audio
```

#### 3. Install dependencies

```bash
bun install
```

#### 4. Build

```bash
bun run build
```

The build artifacts will be output to the `dist/` directory.

#### 5. Load into Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder.

### Development Commands

| Command | Description |
|---|---|
| `bun run dev` | Development mode (watch + HMR) |
| `bun run build` | Production build |
| `bun run type-check` | TypeScript type checking |

### Directory Structure

```
bluesky-text-to-audio/
├── src/
│   └── content.ts      # Content script (TypeScript)
├── manifest.json        # Chrome Extension Manifest (Manifest V3)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Package configuration & scripts
└── dist/                # Build artifacts (CI auto-commits)