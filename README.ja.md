# bluesky-text-to-audio

Blueskyのタイムラインの投稿にplayボタンを表示するChrome拡張です。

## 機能

- Bluesky（bsky.app）のタイムラインの各投稿にplayボタンを表示
- playボタンを押すと、投稿内容をMMLとして解析し、mmlabcで演奏

## ユーザー向けインストール方法

1. このリポジトリをクローンまたはダウンロードする
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. Chromeで `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist` フォルダを選択する

> **Note:** ビルド済みの `dist/` フォルダはリポジトリに含まれているため、Bunやビルドツールのインストールは不要です。

## 使い方

1. [Bluesky](https://bsky.app/) を開く
2. タイムラインの各投稿に表示される「▶ textareaを開く」ボタンをクリックしてtextareaを開く
3. textareaにMML文字列を入力する
4. 「🎵 mmlabcでplay」ボタンをクリックすると、MMLを解析して五線譜を表示し演奏する
5. 「▶ Play」ボタンをクリックすると、textareaの内容をABC記譜法として直接演奏する

## 投稿ごとの自動モード検出

各投稿の先頭行または末尾行に特定のキーワードが含まれている場合、ボタンの初期モードを自動的に決定します。

| キーワード（先着優先） | 自動選択されるモード |
|---|---|
| `Chord` または `コード` | 🎸 chord2mmlでplay |
| `YM2151` または `OPM` | 🎶 YM2151でplay |
| `Tonejs` または `Tone.js` | 🎹 Tone.jsでplay |
| `MML` | 🎵 mmlabcでplay |
| `abc` | ▶ abcjsでplay |
| （上記以外） | 🔊 投稿を読み上げる（ずんだもん） |

検出に使用された行（先頭行または末尾行）は、textareaに内容をセットするときに自動的に除去されます。

> **優先順位の詳細**: まず先頭行を上の表の順でスキャンし、マッチしなければ末尾行を同じ順でスキャンします。

## 開発者向け

### 技術スタック

- [Bun](https://bun.sh/) — パッケージマネージャー・ランタイム
- [Vite](https://vitejs.dev/) — ビルドツール
- [CRXJS Vite Plugin](https://crxjs.dev/) — Chrome拡張のViteプラグイン
- [TypeScript](https://www.typescriptlang.org/) — 型安全な開発

### セットアップ手順

#### 1. Bunのインストール

```bash
curl -fsSL https://bun.sh/install | bash
```

#### 2. リポジトリのクローン

```bash
git clone https://github.com/cat2151/bluesky-text-to-audio.git
cd bluesky-text-to-audio
```

#### 3. 依存パッケージのインストール

```bash
bun install
```

#### 4. ビルド

```bash
bun run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

#### 5. Chromeへの読み込み

1. Chromeで `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist` フォルダを選択する

### 開発コマンド

| コマンド | 説明 |
|---|---|
| `bun run dev` | 開発モード（ウォッチ + HMR） |
| `bun run build` | プロダクションビルド |
| `bun run type-check` | TypeScript型チェック |

### ディレクトリ構成

```
bluesky-text-to-audio/
├── src/
│   └── content.ts      # コンテンツスクリプト（TypeScript）
├── manifest.json        # Chrome拡張マニフェスト（Manifest V3）
├── vite.config.ts       # Vite設定
├── tsconfig.json        # TypeScript設定
├── package.json         # パッケージ設定・スクリプト
└── dist/                # ビルド成果物（CIが自動コミット）
```

## 用途、なぜこの機能があるの？
- これまでの課題
  - Bluesky投稿欄にもしコード進行やMMLが書いてあっても、
  - それを現実の音にするには、いくつかのステップが必要なことが多いです。
  - 例えば、誰もがMIDI鍵盤をその場に持っているわけではありませんし、
  - 誰もがホットキーですぐ起動する仮想MIDI鍵盤アプリを常駐しているわけでもありません。
- このアプリが解決すること
  - 投稿画面でボタンを押すだけ
  - そうすれば直感的に、「鳴らす音を決めるための編集エリア（textarea）」が開きます
     - 投稿から自動的に音を抽出するのは、どんなにインテリジェントなシステムや練り込まれたヒューリスティクスであっても間違いのリスクがあり、UXとして満足がいくことは決してないでしょう
     - そこでtextareaです
  - あとは直感的にplayボタンを押すだけ
  - 全体に、userの認知負荷を低く、鳴らすまでのハードルを低く（easyに）することを優先しています

# PoC
- 実際のところはPoCなため、使うには遊び心が必要です。実用的な段階に到達するまでには時間がかかるでしょう
- 破壊的変更を頻繁に行うため、今UXに期待しても、期待通りのUXが得られることは決してないでしょう

# 目指すこと
- 編集中

# 後回し
- Tone.jsのオフラインレンダリングモード（ライブラリにはもう実装済み）
- Tone.jsのオフラインレンダリングモードを利用し、Tone.js / YM2151 を同時演奏。track先頭に Tone.js や YM2151 を書く仮仕様
  - あるいは同じformatでも、prerenderはYM2151のみで行い、それを利用してTone.js側ではそのrender結果をsampler用wavとして利用する仮仕様
- mmlabcのrenderを、abcjsの「wavだけ得るmode」を利用し、Tone.js / YM2151 と同時演奏。
- abcjsの五線譜renderを利用し、Tone.js / YM2151 も五線譜を表示
- abcjsに依存しない五線譜の表示が可能か試す
- web-ym2151で実装済みの、簡易ピアノロール風の可視化

# 目指さないこと（スコープ外）
- 応答。使ってくださった人のバグレポートや要望、使っていない人の懸念や提案に応える
- 可視化。ビジュアライザー。各ライブラリのdemoでやっているようなビジュアライザーをさらに豪華に。デバッグに不要なレベルの豪華なビジュアライザーまで作り込み
- 安定性。共通規格を確定させ、SNSに書いたものが後から必ず鳴るよう互換性を維持する
- 変換。すべてのSNSに書いたテキスト音楽がすべて鳴るように自動判別し、自動変換し、完璧に演奏する
