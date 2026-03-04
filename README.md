# bluesky-text-to-audio

Blueskyのタイムラインの投稿にplayボタンを表示するChrome拡張です。

## 機能

- Bluesky（bsky.app）のタイムラインの各投稿にplayボタンを表示
- playボタンを押すと、投稿内容を `console.log` に出力

## インストール方法

1. このリポジトリをクローンまたはダウンロードする
   ```
   git clone https://github.com/cat2151/bluesky-text-to-audio.git
   ```
2. Chromeで `chrome://extensions/` を開く
3. 「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、クローンしたフォルダを選択する

## 使い方

1. [Bluesky](https://bsky.app/) を開く
2. タイムラインの各投稿に表示される「▶ play」ボタンをクリックする
3. ブラウザのDevToolsのコンソールに投稿内容が出力される