# bluesky-text-to-audio

A Chrome extension that displays a play button on Bluesky timeline posts.

## Features

- Display a play button on each post in the Bluesky (bsky.app) timeline.
- When the play button is pressed, the post content is parsed as MML and played by mmlabc.

## User Installation Guide

1. Clone or download this repository
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist` folder

> **Note:** The pre-built `dist/` folder is included in the repository, so installing Bun or build tools is not required.

## Usage

1. Open [Bluesky](https://bsky.app/)
2. Click the "▶ Open textarea" button displayed on each timeline post to open the textarea.
3. Enter MML strings into the textarea.
4. Click the "🎵 Play with mmlabc" button to parse the MML, display the musical staff, and play.
5. Click the "▶ Play" button to directly play the textarea content as ABC notation.

## Automatic Mode Detection per Post

If specific keywords are present in the first or last line of each post, the initial button mode will be automatically determined.

| Keyword (priority order) | Automatically selected mode |
|---|---|
| `Chord` or `コード` | 🎸 Play with chord2mml |
| `YM2151` or `OPM` | 🎶 Play with YM2151 |
| `Tonejs` or `Tone.js` | 🎹 Play with Tone.js |
| `MML` | 🎵 Play with mmlabc |
| `abc` | ▶ Play with abcjs |
| (Otherwise) | 🔊 Read post aloud (Zundamon) |

The line used for detection (first or last line) will be automatically removed when the content is set in the textarea.

> **Priority details**: The first line is scanned first according to the order in the table above. If no match is found, the last line is scanned in the same order.

## For Developers

### Tech Stack

- [Bun](https://bun.sh/) — Package manager and runtime
- [Vite](https://vitejs.dev/) — Build tool
- [CRXJS Vite Plugin](https://crxjs.dev/) — Vite plugin for Chrome extensions
- [TypeScript](https://www.typescriptlang.org/) — Type-safe development

### Setup Steps

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

Build artifacts will be output to the `dist/` directory.

#### 5. Load into Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist` folder

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
├── manifest.json        # Chrome extension manifest (Manifest V3)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Package configuration and scripts
└── dist/                # Build artifacts (CI auto-committed)
```

## Purpose: Why This Feature Exists

- Past Challenges
  - Even if a chord progression or MML is written in a Bluesky post,
  - it often requires several steps to turn it into actual sound.
  - For example, not everyone has a MIDI keyboard readily available,
  - nor does everyone have a virtual MIDI keyboard app running that can be quickly launched with a hotkey.
- What This App Solves
  - Just press a button on the post screen.
  - This will intuitively open an "editing area (textarea) to define the sound to be played."
    - Automatically extracting sound from a post, no matter how intelligent the system or sophisticated the heuristics, carries a risk of error and would never be satisfying from a UX perspective.
    - Hence, the textarea.
  - Then, just intuitively press the play button.
  - Overall, the priority is to lower the user's cognitive load and reduce the barrier to playing (make it easy).

# PoC

- This is essentially a PoC, so it requires a playful spirit to use. It will take time to reach a practical stage.
- Since destructive changes will be frequent, expecting the desired UX at this stage is not advised.

# Goal

- PoC. To demonstrate that text-based music can be easily realized on SNS using existing library tech stacks through "vibe coding" (in a broad sense). (Currently, it's roughly demonstrated.)

# Postponed Features

- Save as WAV file, SMF, or intermediate representations supported by other libraries (for development).
- Tone.js offline rendering mode (already implemented in the library).
- Utilize Tone.js offline rendering mode to simultaneously play Tone.js / YM2151. Provisional specification: write Tone.js or YM2151 at the beginning of the track.
- Alternatively, even with the same format, a provisional specification: pre-render only with YM2151, and then Tone.js uses the rendering result as a WAV for its sampler.
- Render mmlabc using abcjs's "WAV-only mode" to simultaneously play with Tone.js / YM2151.
- Use abcjs's musical staff rendering to display musical staff for Tone.js / YM2151 as well.
- Investigate if musical staff display is possible without relying on abcjs.
- Simple piano roll-style visualization, already implemented in web-ym2151.

# Not Aiming For (Out of Scope)

- Responsiveness. Responding to bug reports and requests from users, or addressing concerns and suggestions from non-users.
- Visualization. Building even more elaborate visualizers than those in library demos. Developing opulent visualizers beyond what's needed for debugging.
- Stability. Establishing a common standard and maintaining compatibility so that music written on SNS will always play later.
- Conversion. Automatically detecting, converting, and perfectly playing all text-based music written on all SNS platforms.