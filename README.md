# bluesky-text-to-audio

A Chrome extension that displays a play button on Bluesky timeline posts.

## Features

- Displays a play button on each post in the Bluesky (bsky.app) timeline.
- When the play button is pressed, the post content is parsed as MML and played by mmlabc.

## Installation Guide for Users

1. Clone or download this repository
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable 'Developer mode'
4. Click 'Load unpacked' and select the `dist` folder

> **Note:** The pre-built `dist/` folder is included in the repository, so installing Bun or build tools is not necessary.

## Usage

1. Open [Bluesky](https://bsky.app/)
2. Click the '▶ Open textarea' button that appears on each timeline post to open the textarea.
3. Enter MML strings into the textarea.
4. Click the '🎵 Play with mmlabc' button to parse the MML, display the sheet music, and play it.
5. Click the '▶ Play' button to directly play the textarea content as ABC notation.

## Automatic Mode Detection per Post

If the first or last line of a post contains specific keywords, the initial mode of the button will be automatically determined.

| Keyword (Priority) | Automatically Selected Mode |
|---|---|
| `Chord` or `コード` | 🎸 Play with chord2mml |
| `YM2151` or `OPM` | 🎶 Play with YM2151 |
| `Tonejs` or `Tone.js` | 🎹 Play with Tone.js |
| `MML` | 🎵 Play with mmlabc |
| `abc` | ▶ Play with abcjs |
| (Otherwise) | 🔊 Read post aloud (Zundamon) |

The line used for detection (first or last line) will be automatically removed when the content is set in the textarea.

> **Priority Details**: The first line is scanned according to the order in the table above; if no match is found, the last line is scanned in the same order.

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

Build artifacts are output to the `dist/` directory.

#### 5. Load into Chrome

1. Open `chrome://extensions/` in Chrome
2. Enable 'Developer mode'
3. Click 'Load unpacked' and select the `dist` folder

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
└── dist/                # Build artifacts (CI auto-commits)
```

## Purpose: Why this feature exists

- Previous Challenges
  - Even if chord progressions or MML are written in a Bluesky post,
  - Turning them into actual sound often requires several steps.
  - For example, not everyone has a MIDI keyboard readily available,
  - nor does everyone have a virtual MIDI keyboard app constantly running that can be launched with a hotkey.
- What this app solves
  - Simply press a button on the post screen
  - This intuitively opens an 'editing area (textarea) to define the sound to be played'.
    - Automatically extracting sound from a post, no matter how intelligent the system or sophisticated the heuristics, carries a risk of error and would never be satisfactory from a UX perspective.
    - Hence, the textarea.
  - Then, simply press the play button intuitively.
  - Overall, the priority is to lower the user's cognitive load and reduce the barrier (make it easy) to playing sounds.

# PoC
This is primarily a PoC, so a playful mindset is required to use it. It will take time to reach a practical stage.
As destructive changes are frequent, expecting a polished UX at this stage will likely not meet expectations.

# Goals
Under development

# Deferred
- Tone.js offline rendering mode (already implemented in the library)
- Simultaneous playback of Tone.js / YM2151 using Tone.js offline rendering mode. Tentative specification: write Tone.js or YM2151 at the beginning of the track.
- Alternatively, even with the same format, a tentative specification where only YM2151 performs prerendering, and Tone.js uses that rendering result as a sampler WAV.
- Simultaneous playback of mmlabc with Tone.js / YM2151, using abcjs's 'get WAV only mode' for mmlabc rendering.
- Display sheet music for Tone.js / YM2151 using abcjs's sheet music rendering.
- Investigate if sheet music can be displayed without relying on abcjs.
- Simple piano-roll-style visualization already implemented in web-ym2151.

# Non-Goals (Out of Scope)
- Responsiveness. Addressing bug reports or requests from users, or concerns and suggestions from non-users.
- Visualization. Visualizers. Making visualizers even more elaborate than those in library demos. Developing opulent visualizers beyond what is necessary for debugging.
- Stability. Finalizing a common standard and maintaining compatibility so that music written on SNS will always play later.
- Conversion. Automatically identifying, converting, and perfectly playing all text-based music written on all SNS platforms.