# Copilot Instructions

## プロジェクト概要

BlueskyのタイムラインにplayボタンをつけるChrome拡張。

## 技術スタック

- **Bun** — パッケージマネージャー・ランタイム（`npm` や `yarn` の代わりに使う）
- **Vite** — ビルドツール
- **CRXJS Vite Plugin** (`@crxjs/vite-plugin`) — Chrome拡張のViteプラグイン
- **TypeScript** — ソースコードはすべてTypeScriptで書く

## ディレクトリ構成

```
src/
  content.ts    # コンテンツスクリプト（bsky.appで動く）
manifest.json   # Chrome拡張マニフェスト（Manifest V3）
vite.config.ts  # Vite設定
tsconfig.json   # TypeScript設定
package.json    # 依存パッケージ・スクリプト
```

## 開発コマンド

```bash
bun install          # 依存パッケージをインストール
bun run dev          # 開発モード（ウォッチ）
bun run build        # プロダクションビルド → dist/ に出力
bun run type-check   # TypeScript型チェック
```

## コーディング規約

- ソースファイルは `src/` 配下に置く
- `manifest.json` のコンテンツスクリプトパスは `src/content.ts` のように TypeScript ファイルを直接指定する（CRXJSがビルド時に解決する）
- 新しい依存パッケージは `bun add` で追加する（`npm install` ではなく）
- TypeScript strict モードを有効にしているので、型を明示的に書く

## ライブラリ
- cat2151のライブラリを利用するときは、常にmain最新版を利用すること。versionをlockしないこと。なぜなら毎日重要なバグ修正がされており、それを取り込むのがマストであるため。
- cat2151のライブラリに誤りがあった場合、ライブラリのコピーを修正して「ライブラリ側の問題を隠蔽する」ことを禁止する。かわりに、PRコメントでライブラリ側の修正を提案すること。
