# bluesky-text-to-audio

Blueskyのタイムラインの投稿にplayボタンを表示するChrome拡張です。

## 機能

- Bluesky（bsky.app）のタイムラインの各投稿にplayボタンを表示
- playボタンを押すと、投稿内容を `console.log` に出力

## ユーザー向けインストール方法

1. このリポジトリをクローンまたはダウンロードする
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. ビルド成果物を生成する（後述の「開発者向け」参照）
3. Chromeで `chrome://extensions/` を開く
4. 「デベロッパーモード」を有効にする
5. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist` フォルダを選択する

## 使い方

1. [Bluesky](https://bsky.app/) を開く
2. タイムラインの各投稿に表示される「▶ play」ボタンをクリックする
3. ブラウザのDevToolsのコンソールに投稿内容が出力される

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
└── dist/                # ビルド成果物（gitignore済み）
```