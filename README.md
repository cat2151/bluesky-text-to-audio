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

> **Note:** The pre-built `dist/` folder is included in the repository, so installing Bun or build tools is not required.

## Usage

1. Open [Bluesky](https://bsky.app/)
2. Click the '▶ Open textarea' button that appears on each timeline post to open the textarea
3. Enter an MML string into the textarea
4. Click the '🎵 Play with mmlabc' button to parse the MML, display the sheet music, and play it
5. Click the '▶ Play' button to directly play the textarea content as ABC notation

## Automatic Mode Detection per Post

If a post's first or last line contains specific keywords, the initial button mode will be automatically determined.

| Keyword (Priority) | Automatically Selected Mode |
|---|---|
| `Chord` or `コード` | 🎸 Play with chord2mml |
| `YM2151` or `OPM` | 🎶 Play with YM2151 |
| `Tonejs` or `Tone.js` | 🎹 Play with Tone.js |
| `MML` | 🎵 Play with mmlabc |
| `abc` | ▶ Play with abcjs |
| (Otherwise) | 🔊 Read post aloud (Zundamon) |

The line used for detection (first or last) is automatically removed when setting the content in the textarea.

> **Priority Details**: The first line is scanned first according to the order in the table above. If no match is found, the last line is scanned in the same order.

## For Developers

### Tech Stack

- [Bun](https://bun.sh/) — Package Manager / Runtime
- [Vite](https://vitejs.dev/) — Build Tool
- [CRXJS Vite Plugin](https://crxjs.dev/) — Vite Plugin for Chrome Extensions
- [TypeScript](https://www.typescriptlang.org/) — Type-safe Development

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
├── manifest.json        # Chrome Extension Manifest (Manifest V3)
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Package configuration / scripts
└── dist/                # Build artifacts (CI auto-commits)
```

## Purpose: Why This Feature Exists?

- Previous Challenges
  - Even if chord progressions or MML were written in Bluesky posts,
  - It often required several steps to turn them into actual sound.
  - For example, not everyone has a MIDI keyboard readily available,
  - Nor does everyone have a virtual MIDI keyboard app running residently, ready to launch with a hotkey.
- What This App Solves
  - Just press a button on the post screen.
  - This intuitively opens an 'editing area (textarea) to define the sound to be played'.
    - Automatically extracting sound from posts, no matter how intelligent the system or well-crafted the heuristics, carries the risk of errors and would never provide a satisfactory UX.
    - Hence, the textarea.
  - Then, simply press the play button intuitively.
  - Overall, the priority is to lower the user's cognitive load and reduce the barrier to playing (make it easy).

# PoC

- In reality, it's a PoC, so it requires a playful spirit to use. It will take time to reach a practical stage.
- Destructive changes will be frequent, so expecting a perfect UX at this stage will likely lead to disappointment.

# Goals

- PoC. To demonstrate that text-based music can be easily realized on SNS using an existing library-based tech stack through vibecoding (in a broad sense) (currently roughly demonstrated).
- Playback. To enable 'Do-Re-Mi' (cde) to play in the textarea using this (if the environment or libraries change and it stops playing after initially working, the goal is to make it play easily if possible).

# Future Work

- Save as WAV file, SMF file, and other intermediate representations supported by each library (for development).
- Tone.js offline rendering mode (already implemented in the library).
- Utilize Tone.js offline rendering mode for simultaneous playback of Tone.js / YM2151. Provisional specification to write Tone.js or YM2151 at the beginning of a track.
  - Alternatively, even with the same format, a provisional specification where pre-rendering is done only with YM2151, and Tone.js uses that rendered result as a WAV for a sampler.
- Render mmlabc using abcjs's 'WAV-only mode' for simultaneous playback with Tone.js / YM2151.
- Utilize abcjs's sheet music rendering to display sheet music for Tone.js / YM2151 as well.
- Explore if sheet music can be displayed without relying on abcjs.
- Simple piano-roll-like visualization already implemented in web-ym2151.

# Out of Scope

- Responsiveness. Responding to bug reports or requests from users, or concerns and suggestions from non-users.
- Visualization. Visualizers. Making visualizers even more elaborate than those in each library's demo. Developing luxurious visualizers to a level unnecessary for debugging.
- Stability. Establishing common standards and maintaining compatibility so that text written on SNS will always play later.
- Conversion. Automatically detecting, converting, and perfectly playing all text-based music written on all SNS platforms.