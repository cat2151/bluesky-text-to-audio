# bluesky-text-to-audio
A Chrome extension that displays a play button on Bluesky timeline posts.

## Features
- Displays a play button on each post in the Bluesky (bsky.app) timeline.
- When the play button is clicked, the post content is parsed as MML and played by mmlabc.

## User Installation Guide
1. Clone or download this repository:
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. Open `chrome://extensions/` in Chrome.
3. Enable "Developer mode".
4. Click "Load unpacked" and select the `dist` folder.

> **Note:** The pre-built `dist/` folder is included in the repository, so installing Bun or build tools is not required.

## How to Use
1. Open [Bluesky](https://bsky.app/).
2. Click the "▶ Open textarea" button that appears on each timeline post to open the textarea.
3. Enter MML strings into the textarea.
4. Click the "🎵 Play with mmlabc" button to parse the MML, display the musical staff, and play the music.
5. Click the "▶ Play" button to directly play the content of the textarea as ABC notation.

## For Developers

### Tech Stack
- [Bun](https://bun.sh/) — Package manager and runtime
- [Vite](https://vitejs.dev/) — Build tool
- [CRXJS Vite Plugin](https://crxjs.dev/) — Vite plugin for Chrome extensions
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development

### Setup Instructions

#### 1. Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
```

#### 2. Clone the Repository
```bash
git clone https://github.com/cat2151/bluesky-text-to-audio.git
cd bluesky-text-to-audio
```

#### 3. Install Dependencies
```bash
bun install
```

#### 4. Build
```bash
bun run build
```
The build artifacts will be output to the `dist/` directory.

#### 5. Load into Chrome
1. Open `chrome://extensions/` in Chrome.
2. Enable "Developer mode".
3. Click "Load unpacked" and select the `dist` folder.

### Development Commands
| Command | Description |
|---|---|
| `bun run dev` | Development mode (watch + HMR) |
| `bun run build` | Production build |
| `bun run type-check` | TypeScript type check |

### Directory Structure
```
bluesky-text-to-audio/
├── src/
│   └── content.ts      # Content script (TypeScript)
├── manifest.json        # Chrome extension manifest (Manifest V3)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Package configuration and scripts
└── dist/                # Build artifacts (automatically committed by CI)
```

## Purpose: Why This Feature Exists

- **Previous Challenges:**
  - If a Bluesky post contains chord progressions or MML,
  - Converting them into actual sound often requires several steps.
  - For example, not everyone has a MIDI keyboard readily available,
  - Nor does everyone have a virtual MIDI keyboard app running constantly, launchable via a hotkey.

- **What This App Solves:**
  - Just press a button on the post screen.
  - This intuitively opens an "editing area (textarea) to define the sound to be played."
     - Automatically extracting sound from a post, no matter how intelligent the system or sophisticated the heuristics, always carries a risk of error and would likely never result in a satisfactory UX.
     - Hence, the textarea.
  - After that, just intuitively press the play button.
  - Overall, the priority is to lower the user's cognitive load and reduce the barrier to playing sound (make it easy).

# PoC
- In actuality, this is a Proof of Concept (PoC), so it requires a playful spirit to use. It will take time to reach a practical stage.
- As breaking changes will be frequent, expecting a polished UX at this point will not yield the desired experience.